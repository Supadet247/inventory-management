<?php
// app/Http/Controllers/Admin/ReportsController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\SaleItem;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ReportsController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->get('period', '30'); // Default 30 days
        $startDate = Carbon::now()->subDays($period);
        $endDate = Carbon::now();

        // Overview Statistics
        $stats = [
            'total_products' => Product::count(),
            'active_products' => Product::active()->count(),
            'total_categories' => Category::count(),
            'active_categories' => Category::active()->count(),
            'total_users' => User::where('is_active', true)->count(),
            'low_stock_products' => Product::lowStock()->count(),
            'out_of_stock_products' => Product::where('quantity', 0)->count(),
            'total_inventory_value' => Product::active()
                ->selectRaw('SUM(price * quantity) as total')
                ->value('total') ?? 0,
        ];

        // Stock Movement Analytics
        $stockMovements = StockMovement::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw("CASE 
                WHEN type = 'return_in' THEN 'adjustment'
                ELSE type
            END as type, COUNT(*) as count, SUM(ABS(quantity)) as total_quantity")
            ->groupBy(DB::raw("CASE 
                WHEN type = 'return_in' THEN 'adjustment'
                ELSE type
            END"))
            ->get();

        // Daily Stock Movements Chart Data
        $dailyMovements = StockMovement::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, type, SUM(ABS(quantity)) as quantity')
            ->groupBy('date', 'type')
            ->orderBy('date')
            ->get()
            ->groupBy('date');

        // Top Selling Products
        $topProducts = SaleItem::with('product')
            ->whereHas('sale', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('sale_date', [$startDate, $endDate]);
            })
            ->selectRaw('product_id, SUM(quantity) as total_sold')
            ->groupBy('product_id')
            ->orderBy('total_sold', 'desc')
            ->take(10)
            ->get();

        // Category Performance
        $categoryPerformance = Category::with(['products' => function ($query) {
                $query->where('is_active', true);
            }])
            ->get()
            ->map(function ($category) {
                $totalValue = $category->products->sum(function ($product) {
                    return $product->price * $product->quantity;
                });
                
                // Debug logging
                \Log::info('Category Performance Debug', [
                    'category_name' => $category->name,
                    'products_count' => $category->products->count(),
                    'total_value' => $totalValue,
                    'products_data' => $category->products->map(function($p) {
                        return ['name' => $p->name, 'price' => $p->price, 'quantity' => $p->quantity, 'calculated_value' => $p->price * $p->quantity];
                    })
                ]);
                
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'products_count' => $category->products->count(),
                    'total_value' => $totalValue,
                ];
            })
            ->filter(function ($category) {
                return $category['products_count'] > 0; // Only show categories with products
            })
            ->sortByDesc('total_value')
            ->values();

        // User Activity Report
        $userActivity = User::withCount(['stockMovements' => function ($query) use ($startDate, $endDate) {
                $query->whereBetween('created_at', [$startDate, $endDate]);
            }])
            ->where('is_active', true)
            ->orderBy('stock_movements_count', 'desc')
            ->get();

        // Low Stock Alert
        $lowStockProducts = Product::with('category')
            ->lowStock()
            ->active()
            ->orderBy('quantity')
            ->take(20)
            ->get();

        // Recent Activities
        $recentActivities = StockMovement::with(['product', 'user'])
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        return Inertia::render('Admin/Reports/Index', [
            'stats' => $stats,
            'stockMovements' => $stockMovements,
            'dailyMovements' => $dailyMovements,
            'topProducts' => $topProducts,
            'categoryPerformance' => $categoryPerformance,
            'userActivity' => $userActivity,
            'lowStockProducts' => $lowStockProducts,
            'recentActivities' => $recentActivities,
            'period' => $period,
        ]);
    }

    public function inventory(Request $request)
    {
        $categoryId = $request->get('category');
        $status = $request->get('status');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name'); // Default sort by name
        $sortOrder = $request->get('sort_order', 'asc'); // Default ascending


        $query = Product::with('category')
            ->leftJoin(DB::raw('(
                SELECT 
                    product_id,
                    COALESCE(SUM(quantity), 0) as total_sold,
                    COALESCE(SUM(total_price), 0) as total_revenue
                FROM sale_items 
                GROUP BY product_id
            ) as sales_data'), 'products.id', '=', 'sales_data.product_id')
            ->selectRaw('products.*, 
                COALESCE(sales_data.total_sold, 0) as total_sold,
                COALESCE(sales_data.total_revenue, 0) as total_revenue')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('products.name', 'like', "%{$search}%")
                      ->orWhere('products.sku', 'like', "%{$search}%");
                });
            })
            ->when($categoryId, function ($query, $categoryId) {
                $query->where('products.category_id', $categoryId);
            })
            ->when($status, function ($query, $status) {
                if ($status === 'low_stock') {
                    $query->whereColumn('products.quantity', '<=', 'products.min_stock');
                } elseif ($status === 'out_of_stock') {
                    $query->where('products.quantity', 0);
                } elseif ($status === 'overstock') {
                    $query->whereColumn('products.quantity', '>', DB::raw('products.min_stock * 5'));
                }
            });

        // Apply sorting
        switch ($sortBy) {
            case 'category':
                $query = $query->join('categories', 'products.category_id', '=', 'categories.id')
                              ->orderBy('categories.name', $sortOrder)
                              ->select('products.*', 
                                'COALESCE(sales_data.total_sold, 0) as total_sold',
                                'COALESCE(sales_data.total_revenue, 0) as total_revenue');
                break;
            case 'quantity':
                $query = $query->orderBy('products.quantity', $sortOrder);
                break;
            case 'value':
                $query = $query->orderBy(DB::raw('products.price * products.quantity'), $sortOrder);
                break;
            default: // name
                $query = $query->orderBy('products.name', $sortOrder);
                break;
        }

        $products = $query->paginate(10);
        $categories = Category::active()->get();

        // Summary Statistics - also get sales data for all products using subquery approach
        $allProducts = Product::with('category')
            ->leftJoin(DB::raw('(
                SELECT 
                    product_id,
                    COALESCE(SUM(quantity), 0) as total_sold,
                    COALESCE(SUM(total_price), 0) as total_revenue
                FROM sale_items 
                GROUP BY product_id
            ) as sales_data'), 'products.id', '=', 'sales_data.product_id')
            ->selectRaw('products.*, 
                COALESCE(sales_data.total_sold, 0) as total_sold,
                COALESCE(sales_data.total_revenue, 0) as total_revenue')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('products.name', 'like', "%{$search}%")
                      ->orWhere('products.sku', 'like', "%{$search}%");
                });
            })
            ->when($categoryId, function ($query, $categoryId) {
                $query->where('products.category_id', $categoryId);
            })
            ->when($status, function ($query, $status) {
                if ($status === 'low_stock') {
                    $query->whereColumn('products.quantity', '<=', 'products.min_stock');
                } elseif ($status === 'out_of_stock') {
                    $query->where('products.quantity', 0);
                } elseif ($status === 'overstock') {
                    $query->whereColumn('products.quantity', '>', DB::raw('products.min_stock * 5'));
                }
            })
            ->get();

        $summary = [
            'total_products' => $allProducts->count(),
            'total_value' => $allProducts->sum(function ($product) {
                return $product->price * $product->quantity;
            }),
            'average_stock' => $allProducts->avg('quantity'),
            'low_stock_count' => $allProducts->filter(function ($product) {
                return $product->quantity <= $product->min_stock;
            })->count(),
        ];

        return Inertia::render('Admin/Reports/Inventory', [
            'products' => $products,
            'categories' => $categories,
            'summary' => $summary,
            'filters' => $request->only(['search', 'category', 'status', 'sort_by', 'sort_order']),
        ]);
    }

    public function stockMovements(Request $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $type = $request->get('type');
        $userId = $request->get('user_id');
        $sortBy = $request->get('sort_by', 'created_at'); // Default sort by date
        $sortOrder = $request->get('sort_order', 'desc'); // Default descending

        // Debug logging
        \Log::info('Stock Movements Request Parameters', [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'type' => $type,
            'user_id' => $userId,
            'sort_by' => $sortBy,
            'sort_order' => $sortOrder
        ]);

        $query = StockMovement::with(['product', 'user']);

        // ถ้ามีการกรองวันที่ ให้ใช้ค่าดังกล่าว
        if ($startDate && $endDate) {
            $query->whereBetween('stock_movements.created_at', [$startDate, $endDate]);
        }
        elseif ($startDate) {
            $query->where('stock_movements.created_at', '>=', $startDate);
        }
        elseif ($endDate) {
            $query->where('stock_movements.created_at', '<=', $endDate);
        }
        // ถ้าไม่มีตัวกรอง ดึงทั้งหมด
        
        $query->when($type, function ($query, $type) {
                $query->where('stock_movements.type', $type);
            })
            ->when($userId, function ($query, $userId) {
                $query->where('stock_movements.user_id', $userId);
            });

        // Apply sorting based on parameters
        switch ($sortBy) {
            case 'product':
                $query = $query->join('products', 'stock_movements.product_id', '=', 'products.id')
                              ->orderBy('products.name', $sortOrder)
                              ->select('stock_movements.*');
                break;
            case 'user':
                $query = $query->join('users', 'stock_movements.user_id', '=', 'users.id')
                              ->orderBy('users.name', $sortOrder)
                              ->select('stock_movements.*');
                break;
            case 'type':
                $query = $query->orderBy('stock_movements.type', $sortOrder)
                              ->orderBy('stock_movements.created_at', 'desc');
                break;
            case 'quantity':
                $query = $query->orderBy('stock_movements.quantity', $sortOrder)
                              ->orderBy('stock_movements.created_at', 'desc');
                break;
            default: // created_at
                $query = $query->orderBy('stock_movements.created_at', $sortOrder)
                              ->orderBy('stock_movements.id', $sortOrder);
                break;
        }

        $movements = $query->paginate(10);
        
        $allMovementsQuery = StockMovement::with(['product', 'user']);
        
        if ($startDate && $endDate) {
            $allMovementsQuery->whereBetween('stock_movements.created_at', [$startDate, $endDate]);
        }
        elseif ($startDate) {
            $allMovementsQuery->where('stock_movements.created_at', '>=', $startDate);
        }
        elseif ($endDate) {
            $allMovementsQuery->where('stock_movements.created_at', '<=', $endDate);
        }
        
        $allMovementsQuery->when($type, function ($query, $type) {
                $query->where('stock_movements.type', $type);
            })
            ->when($userId, function ($query, $userId) {
                $query->where('stock_movements.user_id', $userId);
            })
            ->orderBy('stock_movements.created_at', 'desc');
        
        // Execute the query and get the collection
        $allMovements = $allMovementsQuery->get();
        
        // Debug the query
        \Log::info('Stock Movements Query Result', [
            'total_count' => $movements->total(),
            'current_page' => $movements->currentPage(),
            'per_page' => $movements->perPage(),
            'all_movements_count' => $allMovements->count()
        ]);
        
        $users = User::where('is_active', true)->get();

        // Summary for the period - use a fresh query to avoid sorting conflicts
        $summaryQuery = StockMovement::query();
        
        if ($startDate && $endDate) {
            $summaryQuery->whereBetween('stock_movements.created_at', [$startDate, $endDate]);
        }
        elseif ($startDate) {
            $summaryQuery->where('stock_movements.created_at', '>=', $startDate);
        }
        elseif ($endDate) {
            $summaryQuery->where('stock_movements.created_at', '<=', $endDate);
        }
        
        $summaryQuery->when($type, function ($query, $type) {
                $query->where('stock_movements.type', $type);
            })
            ->when($userId, function ($query, $userId) {
                $query->where('stock_movements.user_id', $userId);
            });

        $summary = [
            'total_movements' => $summaryQuery->count(),
            'stock_in' => (clone $summaryQuery)->where('stock_movements.type', 'in')->sum('stock_movements.quantity'),
            'stock_out' => (clone $summaryQuery)->where('stock_movements.type', 'out')->sum('stock_movements.quantity'),
            'adjustments' => (clone $summaryQuery)->where('stock_movements.type', 'adjustment')->sum('stock_movements.quantity'),
        ];

        return Inertia::render('Admin/Reports/StockMovements', [
            'movements' => $movements,
            'allMovements' => $allMovements, // All movements for chart data
            'users' => $users,
            'summary' => $summary,
            'filters' => $request->only(['start_date', 'end_date', 'type', 'user_id', 'sort_by', 'sort_order']),
        ]);
    }

    public function export(Request $request)
    {
        $type = $request->get('type', 'inventory');
        $format = $request->get('format', 'csv');

        switch ($type) {
            case 'inventory':
                return $this->exportInventory($format);
            case 'stock_movements':
                return $this->exportStockMovements($format, $request);
            case 'low_stock':
                return $this->exportLowStock($format);
            default:
                return redirect()->back()->with('error', 'Invalid export type.');
        }
    }

    private function exportInventory($format)
    {
        // Get products sorted by category and SKU
        $products = Product::with('category')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->where('products.is_active', 1)
            ->orderBy('categories.name', 'asc')
            ->orderBy('products.sku', 'asc')
            ->select('products.*')
            ->get();
        
        // Calculate summary statistics
        $totalValue = $products->sum(fn($p) => $p->price * $p->quantity);
        $totalItems = $products->count();
        $lowStockItems = $products->filter(fn($p) => $p->quantity > 0 && $p->quantity <= $p->min_stock)->count();
        $outOfStockItems = $products->filter(fn($p) => $p->quantity <= 0)->count();
        
        if ($format === 'csv') {
            $data = $products->map(function ($product) {
                return [
                    'รหัสสินค้า' => $product->sku,
                    'รายการสินค้า' => $product->name,
                    'ประเภทสินค้า' => $product->category->name,
                    'ราคา' => $product->price,
                    'ปริมาณ' => $product->quantity,
                    'สต็อกขั้นต่ำ' => $product->min_stock,
                    'มูลค่ารวม' => $product->price * $product->quantity,
                    'สถานะสินค้า' => $product->quantity <= 0 ? 'หมด' : 
                                  ($product->quantity <= $product->min_stock ? 'ใกล้หมด' : 'พร้อมส่ง'),
                ];
            });
            return $this->generateCSV($data, 'inventory-report-' . now()->format('Y-m-d'));
        }

        if ($format === 'xlsx' || $format === 'xls') {
            return $this->generateInventoryExcel($products, $totalValue, $totalItems, $lowStockItems, $outOfStockItems, 'inventory-report-' . now()->format('Y-m-d'));
        }

        return redirect()->back()->with('error', 'Format not supported yet.');
    }

    private function exportStockMovements($format, $request)
    {
        // ถ้าไม่ได้ส่ง start_date และ end_date มา ให้ส่งออกทั้งหมด
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $query = StockMovement::with(['product', 'user']);

        // ถ้ามีการกรองวันที่ ให้ใช้ค่าดังกล่าว
        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }
        // ถ้ามีเพียง start_date
        elseif ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        // ถ้ามีเพียง end_date
        elseif ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }
        // ถ้าไม่มีตัวกรอง ดึงทั้งหมด

        $movements = $query->orderBy('created_at', 'desc')->get();

        $data = $movements->map(function ($movement) {
            return [
                'วันที่/เวลา' => $movement->created_at->format('Y-m-d H:i:s'),
                'รหัสสินค้า' => $movement->product->sku,
                'รายการสินค้า' => $movement->product->name,
                'ประเภท' => $movement->type,
                'ปริมาณ' => $movement->quantity,
                'สินค้าคงเหลือเดิม' => $movement->previous_quantity,
                'สินค้าคงเหลือล่าสุด' => $movement->new_quantity,
                'ผู้ใช้' => $movement->user->name,
                'โน๊ต' => $movement->notes ?? '',
            ];
        });

        if ($format === 'csv') {
            return $this->generateCSV($data, 'stock-movements-' . now()->format('Y-m-d'));
        }

        if ($format === 'xlsx' || $format === 'xls') {
            return $this->generateStockMovementsExcel($data, $movements, 'stock-movements-' . now()->format('Y-m-d'));
        }

        return redirect()->back()->with('error', 'Format not supported yet.');
    }

    private function exportLowStock($format)
    {
        $products = Product::with('category')->lowStock()->active()->get();
        
        $data = $products->map(function ($product) {
            return [
                'Name' => $product->name,
                'SKU' => $product->sku,
                'Category' => $product->category->name,
                'Current Stock' => $product->quantity,
                'Min Stock' => $product->min_stock,
                'Difference' => $product->min_stock - $product->quantity,
                'Price' => $product->price,
            ];
        });

        if ($format === 'csv') {
            return $this->generateCSV($data, 'low-stock-report-' . now()->format('Y-m-d'));
        }

        if ($format === 'xlsx' || $format === 'xls') {
            return $this->generateExcel($data, 'low-stock-report-' . now()->format('Y-m-d'));
        }

        return redirect()->back()->with('error', 'Format not supported yet.');
    }

    private function generateCSV($data, $filename)
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}.csv\"",
        ];

        $callback = function () use ($data) {
            $file = fopen('php://output', 'w');
            
            if ($data->isNotEmpty()) {
                // Add BOM for UTF-8
                fwrite($file, "\xEF\xBB\xBF");
                
                // Add headers
                fputcsv($file, array_keys($data->first()));
                
                // Add data
                foreach ($data as $row) {
                    fputcsv($file, $row);
                }
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function generateExcel($data, $filename)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        if ($data->isNotEmpty()) {
            $headers = array_keys($data->first());
            
            // Add headers
            $sheet->fromArray($headers, null, 'A1');
            
            // Style headers
            $headerStyle = [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4']
                ],
                'alignment' => ['horizontal' => 'center'],
            ];
            $lastColumn = $sheet->getHighestColumn();
            $sheet->getStyle('A1:' . $lastColumn . '1')->applyFromArray($headerStyle);
            
            // Add data rows
            $row = 2;
            foreach ($data as $record) {
                $col = 'A';
                foreach ($record as $value) {
                    $sheet->setCellValue($col . $row, $value);
                    $col++;
                }
                $row++;
            }
            
            // Auto-size columns
            foreach (range('A', $sheet->getHighestColumn()) as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
        }
        
        $writer = new Xlsx($spreadsheet);
        
        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}.xlsx\"",
            'Cache-Control' => 'max-age=0',
        ];
        
        return response()->stream(function() use ($writer) {
            $writer->save('php://output');
        }, 200, $headers);
    }

    private function generateStockMovementsExcel($data, $movements, $filename)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Set Thai column headers
        $headers = ['วันที่/เวลา', 'รหัสสินค้า', 'รายการสินค้า', 'ประเภท', 'ปริมาณ', 'สินค้าคงเหลือเดิม', 'สินค้าคงเหลือล่าสุด', 'ผู้ใช้', 'โน๊ต'];
        $sheet->fromArray($headers, null, 'A1');

        // Set font to Angsana New, size 16 for entire sheet
        $sheet->getStyle('A1:I100')->getFont()->setName('Angsana New')->setSize(16);

        // Style headers - bold with dark blue background
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'name' => 'Angsana New', 'size' => 16],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E3A8A']
            ],
            'alignment' => ['horizontal' => 'center', 'vertical' => 'center', 'wrapText' => true],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ];
        $lastColumn = $sheet->getHighestColumn();
        $sheet->getStyle('A1:' . $lastColumn . '1')->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(30);

        // Set column widths
        $columnWidths = [
            'A' => 18, // วันที่/เวลา
            'B' => 15, // รหัสสินค้า
            'C' => 30, // รายการสินค้า
            'D' => 12, // ประเภท
            'E' => 10, // ปริมาณ
            'F' => 18, // สินค้าคงเหลือเดิม
            'G' => 18, // สินค้าคงเหลือล่าสุด
            'H' => 18, // ผู้ใช้
            'I' => 50, // โน๊ต (extended width for wrapping)
        ];
        foreach ($columnWidths as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        // Row color definitions
        $colors = [
            'in' => 'DCFCE7',        // เขียวอ่อน
            'out' => 'FEE2E2',       // แดงอ่อน
            'adjustment' => 'FEF9C3', // เหลืองอ่อน
            'return_in' => 'DBEAFE',  // ฟ้าอ่อน
        ];

        // Border style for data cells
        $cellBorders = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ];

        // Add data rows with colors
        $row = 2;
        foreach ($movements as $index => $movement) {
            $col = 'A';
            
            // Set values
            $sheet->setCellValue($col . $row, $movement->created_at->format('Y-m-d H:i:s')); $col++;
            $sheet->setCellValue($col . $row, $movement->product->sku); $col++;
            $sheet->setCellValue($col . $row, $movement->product->name); $col++;
            
            // Get type display text
            $typeText = '';
            switch ($movement->type) {
                case 'in': $typeText = 'รับเข้า'; break;
                case 'out': $typeText = 'จ่ายออก'; break;
                case 'adjustment': $typeText = 'ปรับปรุง'; break;
                case 'return_in': $typeText = 'รับคืน'; break;
                default: $typeText = ucfirst($movement->type);
            }
            $sheet->setCellValue($col . $row, $typeText); $col++;
            
            $sheet->setCellValue($col . $row, $movement->quantity); $col++;
            $sheet->setCellValue($col . $row, $movement->previous_quantity); $col++;
            $sheet->setCellValue($col . $row, $movement->new_quantity); $col++;
            $sheet->setCellValue($col . $row, $movement->user->name); $col++;
            $sheet->setCellValue($col . $row, $movement->notes ?? '');

            // Apply row color based on type and borders
            $typeKey = $movement->type;
            if (isset($colors[$typeKey])) {
                $rowColor = $colors[$typeKey];
                $rowStyle = [
                    'fill' => [
                        'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                        'startColor' => ['rgb' => $rowColor]
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                            'color' => ['rgb' => '000000']
                        ]
                    ]
                ];
                $sheet->getStyle('A' . $row . ':' . $lastColumn . $row)->applyFromArray($rowStyle);
            } else {
                // Apply borders even if no color
                $sheet->getStyle('A' . $row . ':' . $lastColumn . $row)->applyFromArray($cellBorders);
            }

            // Center align specific columns
            $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal('center');
            $sheet->getStyle('D' . $row . ':' . 'F' . $row)->getAlignment()->setHorizontal('center');
            
            // Wrap text for notes column
            $sheet->getStyle('I' . $row)->getAlignment()->setWrapText(true);

            $row++;
        }

        $writer = new Xlsx($spreadsheet);

        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}.xlsx\"",
            'Cache-Control' => 'max-age=0',
        ];

        return response()->stream(function() use ($writer) {
            $writer->save('php://output');
        }, 200, $headers);
    }

    private function generateInventoryExcel($products, $totalValue, $totalItems, $lowStockItems, $outOfStockItems, $filename)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Set Thai column headers
        $headers = ['รหัสสินค้า', 'รายการสินค้า', 'ประเภทสินค้า', 'ราคา', 'ปริมาณ', 'สต็อกขั้นต่ำ', 'มูลค่ารวม', 'สถานะสินค้า'];
        $sheet->fromArray($headers, null, 'A1');

        // Set font to Angsana New, size 16 for entire sheet
        $sheet->getStyle('A1:H1000')->getFont()->setName('Angsana New')->setSize(16);

        // Style headers - bold with dark blue background
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'name' => 'Angsana New', 'size' => 16],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E3A8A']
            ],
            'alignment' => ['horizontal' => 'center', 'vertical' => 'center', 'wrapText' => true],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ];
        $sheet->getStyle('A1:H1')->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(30);

        // Set column widths
        $columnWidths = [
            'A' => 15, // รหัสสินค้า
            'B' => 35, // รายการสินค้า
            'C' => 25, // ประเภทสินค้า
            'D' => 12, // ราคา
            'E' => 10, // ปริมาณ
            'F' => 15, // สต็อกขั้นต่ำ
            'G' => 15, // มูลค่ารวม
            'H' => 15, // สถานะสินค้า
        ];
        foreach ($columnWidths as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        // Row color definitions for status
        $statusColors = [
            'พร้อมส่ง' => 'DCFCE7',  // เขียวอ่อน
            'ใกล้หมด' => 'FEF9C3',   // เหลืองอ่อน
            'หมด' => 'FEE2E2',       // แดงอ่อน
        ];

        // Border style for data cells
        $cellBorders = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ];

        // Group products by category
        $groupedProducts = $products->groupBy(function($product) {
            return $product->category->name;
        });

        // Add data rows with category merged cells
        $row = 2;
        foreach ($groupedProducts as $categoryName => $categoryProducts) {
            $categoryStartRow = $row;
            $categoryProductCount = count($categoryProducts);

            foreach ($categoryProducts as $product) {
                $status = $product->quantity <= 0 ? 'หมด' : 
                         ($product->quantity <= $product->min_stock ? 'ใกล้หมด' : 'พร้อมส่ง');

                // Set values
                $sheet->setCellValue('A' . $row, $product->sku);
                $sheet->setCellValue('B' . $row, $product->name);
                $sheet->setCellValue('C' . $row, $categoryName);
                $sheet->setCellValue('D' . $row, $product->price);
                $sheet->setCellValue('E' . $row, $product->quantity);
                $sheet->setCellValue('F' . $row, $product->min_stock);
                $sheet->setCellValue('G' . $row, $product->price * $product->quantity);
                $sheet->setCellValue('H' . $row, $status);

                // Apply borders
                $sheet->getStyle('A' . $row . ':H' . $row)->applyFromArray($cellBorders);

                // Apply status color
                if (isset($statusColors[$status])) {
                    $rowColor = $statusColors[$status];
                    $rowStyle = [
                        'fill' => [
                            'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                            'startColor' => ['rgb' => $rowColor]
                        ],
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                                'color' => ['rgb' => '000000']
                            ]
                        ]
                    ];
                    $sheet->getStyle('A' . $row . ':H' . $row)->applyFromArray($rowStyle);
                }

                // Center align numeric columns
                $sheet->getStyle('D' . $row . ':H' . $row)->getAlignment()->setHorizontal('center');

                $row++;
            }

            // Merge category column cells and center align
            if ($categoryProductCount > 1) {
                $sheet->mergeCells('C' . $categoryStartRow . ':C' . ($categoryStartRow + $categoryProductCount - 1));
            }
            // Center align category cell for all products
            $mergedCellStyle = [
                'alignment' => [
                    'horizontal' => 'center',
                    'vertical' => 'center',
                    'wrapText' => true
                ]
            ];
            $sheet->getStyle('C' . $categoryStartRow . ':C' . ($categoryStartRow + $categoryProductCount - 1))->applyFromArray($mergedCellStyle);
        }

        // Add summary section
        $summaryStartRow = $row + 2;
        $summaryRow = $summaryStartRow;

        $summaryStyle = [
            'font' => ['name' => 'Angsana New', 'size' => 14],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ];

        $summaryHeaderStyle = array_merge($summaryStyle, [
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E3A8A']
            ],
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'name' => 'Angsana New', 'size' => 14],
            'alignment' => ['horizontal' => 'center']
        ]);

        // Add summary header
        $sheet->setCellValue('A' . $summaryRow, 'สรุป');
        $sheet->setCellValue('B' . $summaryRow, 'ผลรวม');
        $sheet->getStyle('A' . $summaryRow . ':B' . $summaryRow)->applyFromArray($summaryHeaderStyle);
        $summaryRow++;

        // Add summary data
        $sheet->setCellValue('A' . $summaryRow, 'มูลค่ารวมทั้งหมด');
        $sheet->setCellValue('B' . $summaryRow, $totalValue);
        $sheet->getStyle('A' . $summaryRow . ':B' . $summaryRow)->applyFromArray($summaryStyle);
        $summaryRow++;

        $sheet->setCellValue('A' . $summaryRow, 'จำนวนรายการสินค้า');
        $sheet->setCellValue('B' . $summaryRow, $totalItems);
        $sheet->getStyle('A' . $summaryRow . ':B' . $summaryRow)->applyFromArray($summaryStyle);
        $summaryRow++;

        $sheet->setCellValue('A' . $summaryRow, 'จำนวนสินค้าใกล้หมด');
        $sheet->setCellValue('B' . $summaryRow, $lowStockItems);
        $sheet->getStyle('A' . $summaryRow . ':B' . $summaryRow)->applyFromArray($summaryStyle);

        $writer = new Xlsx($spreadsheet);

        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}.xlsx\"",
            'Cache-Control' => 'max-age=0',
        ];

        return response()->stream(function() use ($writer) {
            $writer->save('php://output');
        }, 200, $headers);
    }
}