<?php

namespace App\Http\Controllers;

use App\Models\Receipt;
use App\Models\ReceiptItem;
use App\Models\ReturnModel;
use App\Models\ReturnItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReturnsController extends Controller
{
    /**
     * Display returns management page
     */
    public function index(Request $request)
    {
        $query = ReturnModel::with(['originalReceipt', 'user', 'returnItems.product'])
            ->when($request->search, function ($query, $search) {
                $query->where('return_number', 'like', "%{$search}%")
                      ->orWhereHas('originalReceipt', function ($q) use ($search) {
                          $q->where('receipt_number', 'like', "%{$search}%");
                      });
            })
            ->when($request->has('status'), function ($query) use ($request) {
                // User explicitly selected a status filter
                if ($request->status) {
                    $query->where('status', $request->status);
                }
                // If status is empty string, show all (no filter applied)
            })
            ->when($request->date_from, function ($query, $date) {
                $query->whereDate('returned_at', '>=', $date);
            })
            ->when($request->date_to, function ($query, $date) {
                $query->whereDate('returned_at', '<=', $date);
            })
            ->when($request->user_id, function ($query, $userId) {
                $query->where('user_id', $userId);
            });

        $returns = $query->orderBy('returned_at', 'desc')
                        ->paginate(10)
                        ->withQueryString();

        // Summary statistics
        $todayReturns = ReturnModel::whereDate('returned_at', today())
                                  ->where('status', 'completed')
                                  ->sum('grand_return_total');

        $pendingReturns = ReturnModel::where('status', 'pending')->count();
        
        $completedReturns = ReturnModel::where('status', 'completed')->count();
        
        $thisMonthReturns = ReturnModel::whereMonth('returned_at', now()->month)
                                     ->whereYear('returned_at', now()->year)
                                     ->where('status', 'completed')
                                     ->sum('grand_return_total');
        
        $allTimeReturns = ReturnModel::where('status', 'completed')
                                    ->sum('grand_return_total');

        // Determine which view to render based on the request path
        $view = str_contains($request->path(), 'admin') ? 'Admin/Returns/index' : 'POS/Returns/Index';

        return Inertia::render($view, [
            'returns' => $returns,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to', 'user_id']),
            'stats' => [
                'today_returns' => $todayReturns,
                'pending_returns' => $pendingReturns,
                'completed_returns' => $completedReturns,
                'this_month_returns' => $thisMonthReturns,
                'all_time_returns' => $allTimeReturns,
            ]
        ]);
    }

    /**
     * Display returns management page for Staff
     */
    public function staffIndex(Request $request)
    {
        $query = ReturnModel::with(['originalReceipt', 'user', 'returnItems.product'])
            ->when($request->search, function ($query, $search) {
                $query->where('return_number', 'like', "%{$search}%")
                      ->orWhereHas('originalReceipt', function ($q) use ($search) {
                          $q->where('receipt_number', 'like', "%{$search}%");
                      });
            })
            ->when($request->has('status'), function ($query) use ($request) {
                if ($request->status) {
                    $query->where('status', $request->status);
                }
            })
            ->when($request->date_from, function ($query, $date) {
                $query->whereDate('returned_at', '>=', $date);
            })
            ->when($request->date_to, function ($query, $date) {
                $query->whereDate('returned_at', '<=', $date);
            });

        $returns = $query->orderBy('returned_at', 'desc')
                        ->paginate(20)
                        ->withQueryString();

        // Status statistics for cards
        $stats = [
            'pending' => ReturnModel::where('status', 'pending')->count(),
            'approved' => ReturnModel::where('status', 'approved')->count(),
            'completed' => ReturnModel::where('status', 'completed')->count(),
            'cancelled' => ReturnModel::where('status', 'cancelled')->count(),
        ];

        return Inertia::render('Staff/Returns/Index', [
            'returns' => $returns,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
            'stats' => $stats,
        ]);
    }

    /**
     * Search for receipt by receipt number
     */
    public function searchReceipt(Request $request)
    {
        $request->validate([
            'receipt_number' => 'required|string'
        ]);

        try {
            $search = $request->receipt_number;
            
            $query = Receipt::with(['receiptItems.product', 'user', 'returns']);
            
            // Allow searching by formatted ID (R000042) or raw receipt number
            if (preg_match('/^R(\d+)$/i', $search, $matches)) {
                $id = (int)$matches[1];
                $receipt = $query->find($id);
            } else {
                $receipt = $query->where('receipt_number', $search)->first();
            }

            if (!$receipt) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบใบเสร็จเลขที่: ' . $request->receipt_number,
                ], 404);
            }

            if (!$receipt->canBeReturned()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ใบเสร็จนี้ไม่สามารถคืนสินค้าได้ (เกินกำหนด หรือคืนครบแล้ว)',
                    'receipt' => $receipt
                ], 400);
            }

            // Get returnable items only
            $returnableItems = $receipt->receiptItems->filter(function ($item) {
                return $item->returnable_quantity > 0;
            })->values();

            return response()->json([
                'success' => true,
                'receipt' => [
                    'id' => $receipt->id,
                    'receipt_number' => $receipt->receipt_number,
                    'issued_at' => $receipt->issued_at->format('Y-m-d H:i:s'),
                    'customer_name' => $receipt->customer_name,
                    'total_amount' => $receipt->total_amount,
                    'tax_amount' => $receipt->tax_amount,
                    'grand_total' => $receipt->grand_total,
                    'payment_method' => $receipt->payment_method,
                    'cashier' => $receipt->user->name,
                    'can_return' => $receipt->can_return,
                    'total_returned_amount' => $receipt->total_returned_amount,
                    'remaining_returnable_amount' => $receipt->remaining_returnable_amount,
                    'returnable_items' => $returnableItems->map(function ($item) use ($receipt) {
                        $product = $item->product;
                        $issuedAt = $receipt->issued_at;
                        $now = now();
                        
                        // คำนวณระยะเวลารับประกันเป็นวัน
                        $warrantyDays = 0;
                        if ($product && $product->warranty > 0) {
                            $warrantyDays = ($product->warranty_days ?? 0) + 
                                          (($product->warranty_months ?? 0) * 30) + 
                                          (($product->warranty_years ?? 0) * 365);
                        }
                        
                        // วันที่หมดรับประกัน
                        $warrantyExpiresAt = $warrantyDays > 0 ? $issuedAt->copy()->addDays($warrantyDays) : null;
                        
                        // คำนวณวันที่เหลือ
                        $daysRemaining = $warrantyExpiresAt ? $now->diffInDays($warrantyExpiresAt, false) : -1;
                        $isWarrantyValid = $warrantyExpiresAt && $now->lessThanOrEqualTo($warrantyExpiresAt);
                        
                        return [
                            'id' => $item->id,
                            'product_id' => $item->product_id,
                            'product_name' => $item->product_name,
                            'product_sku' => $item->product_sku,
                            'quantity' => $item->quantity,
                            'returned_quantity' => $item->returned_quantity,
                            'returnable_quantity' => $item->returnable_quantity,
                            'unit_price' => $item->unit_price,
                            'total_price' => $item->total_price,
                            'unit' => $item->unit,
                            'returnable_amount' => $item->returnable_amount,
                            'has_warranty' => $product && $product->warranty > 0,
                            'warranty_days' => $warrantyDays,
                            'warranty_expires_at' => $warrantyExpiresAt?->format('Y-m-d H:i:s'),
                            'is_warranty_valid' => $isWarrantyValid,
                            'days_remaining' => max(0, ceil($daysRemaining)),
                        ];
                    })
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Receipt search error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการค้นหาใบเสร็จ',
            ], 500);
        }
    }

    /**
     * Process return request
     */
    public function processReturn(Request $request)
    {
        $request->validate([
            'receipt_id' => 'required|exists:receipts,id',
            'items' => 'required|array|min:1',
            'items.*.receipt_item_id' => 'required|exists:receipt_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.reason' => 'required|string|max:255',
            'items.*.condition_note' => 'nullable|string|max:500',
            'general_reason' => 'nullable|string|max:1000',
            'return_type' => 'required|in:full,partial',
        ]);

        try {
            DB::beginTransaction();

            $receipt = Receipt::findOrFail($request->receipt_id);

            if (!$receipt->canBeReturned()) {
                throw new \Exception('ใบเสร็จนี้ไม่สามารถคืนสินค้าได้');
            }

            $returnItems = [];
            foreach ($request->items as $itemData) {
                $receiptItem = ReceiptItem::findOrFail($itemData['receipt_item_id']);
                
                if ($receiptItem->receipt_id !== $receipt->id) {
                    throw new \Exception('รายการสินค้าไม่ตรงกับใบเสร็จ');
                }

                if (!$receiptItem->canReturn($itemData['quantity'])) {
                    throw new \Exception("ไม่สามารถคืนสินค้า {$receiptItem->product_name} จำนวน {$itemData['quantity']} ชิ้น (คงเหลือที่คืนได้: {$receiptItem->returnable_quantity})");
                }

                $returnItems[] = [
                    'receipt_item_id' => $receiptItem->id,
                    'product_id' => $receiptItem->product_id,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $receiptItem->unit_price,
                    'reason' => $itemData['reason'],
                    'condition_note' => $itemData['condition_note'] ?? null,
                ];
            }

            // Create return record
            $return = ReturnModel::createFromReceipt(
                $receipt, 
                $returnItems, 
                $request->general_reason,
                auth()->id()
            );

            // Auto-approve for staff/admin (can be configured)
            if (config('pos.returns.auto_approve', true)) {
                $return->approve('Auto-approved by system');
                $return->complete('Completed automatically');
            }

            DB::commit();

            Log::info('Return processed successfully', [
                'return_id' => $return->id,
                'return_number' => $return->return_number,
                'receipt_id' => $receipt->id,
                'user_id' => auth()->id(),
                'total_amount' => $return->grand_return_total,
            ]);

            return redirect()->back()->with([
                'return_success' => true,
                'return_data' => [
                    'return_id' => $return->id,
                    'return_number' => $return->return_number,
                    'total_amount' => $return->grand_return_total,
                    'status' => $return->status,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            
            Log::error('Return processing failed', [
                'error' => $e->getMessage(),
                'receipt_id' => $request->receipt_id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->back()->withErrors([
                'return_error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Show return details
     */
    public function show($id)
    {
        $return = ReturnModel::with([
                'originalReceipt.receiptItems', 
                'user', 
                'returnItems.receiptItem.product'
            ])
            ->findOrFail($id);

        // ตรวจสอบสต็อกเพียงพอสำหรับรายการเครมประกัน
        $stockWarnings = [];
        foreach ($return->returnItems as $item) {
            if ($item->reason === 'เครมประกันสินค้า') {
                $product = $item->product;
                if ($product && $product->quantity < $item->quantity) {
                    $stockWarnings[] = [
                        'product_name' => $product->name,
                        'required' => $item->quantity,
                        'available' => $product->quantity,
                    ];
                }
            }
        }

        return Inertia::render('POS/Returns/Show', [
            'return' => $return,
            'stockWarnings' => $stockWarnings,
        ]);
    }

    /**
     * Approve return (Admin/Manager only)
     */
    public function approve(Request $request, $id)
    {
        $request->validate([
            'notes' => 'nullable|string|max:500'
        ]);

        try {
            DB::beginTransaction();
            
            $return = ReturnModel::findOrFail($id);
            
            if (!$return->can_approve) {
                throw new \Exception('การคืนสินค้านี้ไม่สามารถอนุมัติได้');
            }

            // Approve and immediately complete the return
            $return->approve($request->notes);
            $return->complete('Auto-completed after approval');

            DB::commit();

            return redirect()->back()->with('success', 'อนุมัติและดำเนินการคืนสินค้าเสร็จสิ้นแล้ว');

        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Complete return (Process refund and stock return)
     */
    public function complete(Request $request, $id)
    {
        $request->validate([
            'notes' => 'nullable|string|max:500'
        ]);

        try {
            DB::beginTransaction();

            $return = ReturnModel::findOrFail($id);
            
            if (!$return->can_complete) {
                throw new \Exception('การคืนสินค้านี้ไม่สามารถดำเนินการให้เสร็จสิ้นได้');
            }

            $return->complete($request->notes);

            DB::commit();

            return redirect()->back()->with('success', 'ดำเนินการคืนสินค้าเสร็จสิ้นแล้ว');

        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel return
     */
    public function cancel(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        try {
            $return = ReturnModel::findOrFail($id);
            
            if (!$return->can_cancel) {
                throw new \Exception('การคืนสินค้านี้ไม่สามารถยกเลิกได้');
            }

            $return->cancel($request->reason);

            return redirect()->back()->with('success', 'ยกเลิกการคืนสินค้าเรียบร้อยแล้ว');

        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Confirm warranty claim received from dealer
     */
    public function confirmWarrantyClaim(Request $request, $id)
    {
        $request->validate([
            'notes' => 'nullable|string|max:500'
        ]);

        try {
            DB::beginTransaction();

            $return = ReturnModel::findOrFail($id);
            
            if (!$return->can_confirm_warranty_claim) {
                throw new \Exception('ไม่สามารถยืนยันการรับสินค้าจากดีลเลอร์ได้');
            }

            $return->confirmWarrantyClaim($request->notes);

            DB::commit();

            return redirect()->back()->with('success', 'ยืนยันการรับสินค้าจากดีลเลอร์เรียบร้อยแล้ว สินค้าได้เพิ่มกลับเข้าสต็อกแล้ว');

        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Print return receipt
     */
    public function printReceipt($id)
    {
        $return = ReturnModel::with([
                'originalReceipt', 
                'user', 
                'returnItems.receiptItem'
            ])
            ->findOrFail($id);

        return Inertia::render('POS/Returns/PrintReceipt', [
            'return' => $return,
            'store_info' => config('pos.store_info', [
                'name' => 'สมบัติเกษตรยนต์',
                'address' => '207 หมู่ 15 ต.เชียงดาว อ.เชียงดาว จ.เชียงใหม่',
                'phone' => '089-560-8118',
                'tax_id' => '1463315038'
            ]),
        ]);
    }

    /**
     * Get return statistics for POS dashboard
     */
    public function getStats(Request $request)
    {
        $period = $request->get('period', 30);
        $startDate = now()->subDays($period);
        
        // Calculate statistics with proper field names for frontend
        $stats = [
            'today_returns' => ReturnModel::whereDate('returned_at', today())
                                         ->where('status', 'completed')
                                         ->sum('grand_return_total'),
            'pending_returns' => ReturnModel::where('status', 'pending')->count(),
            'this_month_returns' => ReturnModel::whereMonth('returned_at', now()->month)
                                              ->whereYear('returned_at', now()->year)
                                              ->where('status', 'completed')
                                              ->sum('grand_return_total'),
            'total_returns' => ReturnModel::where('status', 'completed')->count(),
            
            // Additional stats for admin dashboard
            'total_returns_period' => ReturnModel::where('returned_at', '>=', $startDate)->count(),
            'completed_returns' => ReturnModel::where('returned_at', '>=', $startDate)
                                            ->where('status', 'completed')
                                            ->count(),
            'total_refund_amount' => ReturnModel::where('returned_at', '>=', $startDate)
                                               ->where('status', 'completed')
                                               ->sum('grand_return_total'),
            'top_return_reasons' => ReturnItem::select('reason', DB::raw('COUNT(*) as count'))
                                             ->whereHas('return', function($q) use ($startDate) {
                                                 $q->where('returned_at', '>=', $startDate);
                                             })
                                             ->groupBy('reason')
                                             ->orderBy('count', 'desc')
                                             ->take(5)
                                             ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Export returns data
     */
    public function export(Request $request)
    {
        $request->validate([
            'format' => 'required|in:csv,excel',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'status' => 'nullable|in:pending,approved,completed,cancelled'
        ]);

        try {
            $query = ReturnModel::with(['originalReceipt', 'user', 'returnItems.product'])
                ->whereBetween('returned_at', [$request->date_from, $request->date_to]);
                
            if ($request->status) {
                $query->where('status', $request->status);
            }
            
            $returns = $query->orderBy('returned_at', 'desc')->get();
            
            if ($request->format === 'csv') {
                return $this->exportToCsv($returns);
            } else {
                return $this->exportToExcel($returns);
            }
            
        } catch (\Exception $e) {
            Log::error('Error exporting returns data', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Export returns to CSV format
     */
    private function exportToCsv($returns)
    {
        $filename = 'returns_export_' . date('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];
        
        $callback = function() use ($returns) {
            $file = fopen('php://output', 'w');
            
            // Add UTF-8 BOM for proper Thai character display
            fwrite($file, "\xEF\xBB\xBF");
            
            // CSV headers
            fputcsv($file, [
                'เลขที่การคืน',
                'เลขที่ใบเสร็จต้นฉบับ',
                'วันที่คืน',
                'สถานะ',
                'ยอดคืนสุทธิ',
                'พนักงาน',
                'ลูกค้า',
                'จำนวนรายการ'
            ]);
            
            // Data rows
            foreach ($returns as $return) {
                fputcsv($file, [
                    $return->return_number,
                    $return->originalReceipt->receipt_number ?? '',
                    $return->returned_at->format('d/m/Y H:i'),
                    $this->getStatusText($return->status),
                    number_format($return->grand_return_total, 2),
                    $return->user->name ?? '',
                    $return->originalReceipt->customer_name ?? 'ลูกค้าทั่วไป',
                    $return->returnItems->count()
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }
    
    /**
     * Export returns to Excel format (basic CSV with .xlsx extension)
     */
    private function exportToExcel($returns)
    {
        // For now, we'll return the same CSV format but with .xlsx extension
        // In a real application, you might want to use a library like PhpSpreadsheet
        return $this->exportToCsv($returns);
    }
    
    /**
     * Get status text in Thai
     */
    private function getStatusText($status)
    {
        $statusMap = [
            'pending' => 'รอดำเนินการ',
            'approved' => 'อนุมัติแล้ว',
            'completed' => 'เสร็จสิ้น',
            'cancelled' => 'ยกเลิก'
        ];
        
        return $statusMap[$status] ?? $status;
    }

    /**
     * Get recent returns for POS dashboard
     */
    public function getRecentReturns(Request $request)
    {
        $limit = $request->get('limit', 5);
        
        try {
            // Debug: Log the request
            Log::info('Getting recent returns', ['limit' => $limit]);
            
            $recentReturns = ReturnModel::with([
                    'originalReceipt',
                    'user',
                    'returnItems.receiptItem.product'
                ])
                ->orderBy('returned_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function($return) {
                    return [
                        'id' => $return->id,
                        'return_number' => $return->return_number,
                        'status' => $return->status,
                        'return_type' => $return->return_type,
                        'reason' => $return->reason,
                        'notes' => $return->notes,
                        'total_return_amount' => $return->total_return_amount,
                        'tax_return_amount' => $return->tax_return_amount,
                        'grand_return_total' => $return->grand_return_total,
                        'returned_at' => $return->returned_at,
                        'original_receipt' => $return->originalReceipt ? [
                            'id' => $return->originalReceipt->id,
                            'receipt_number' => $return->originalReceipt->receipt_number,
                            'customer_name' => $return->originalReceipt->customer_name,
                            'issued_at' => $return->originalReceipt->issued_at,
                            'grand_total' => $return->originalReceipt->grand_total,
                        ] : null,
                        'user' => $return->user ? [
                            'id' => $return->user->id,
                            'name' => $return->user->name,
                        ] : null,
                        'return_items' => $return->returnItems->map(function($item) {
                            return [
                                'id' => $item->id,
                                'quantity' => $item->quantity,
                                'unit_price' => $item->unit_price,
                                'total_price' => $item->total_price,
                                'reason' => $item->reason,
                                'condition_note' => $item->condition_note,
                                'receipt_item' => $item->receiptItem ? [
                                    'id' => $item->receiptItem->id,
                                    'product_name' => $item->receiptItem->product_name,
                                    'product_sku' => $item->receiptItem->product_sku,
                                    'unit' => $item->receiptItem->unit,
                                ] : null,
                            ];
                        }),
                    ];
                });

            // Debug: Log the results
            Log::info('Recent returns found', [
                'count' => $recentReturns->count(),
                'data' => $recentReturns->toArray()
            ]);

            return response()->json([
                'success' => true,
                'data' => $recentReturns,
                'count' => $recentReturns->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error getting recent returns', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching recent returns: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Get returnable receipts for dropdown/search
     */
    public function getReturnableReceipts(Request $request)
    {
        $query = $request->get('query', '');
        $limit = $request->get('limit', 20);
        
        try {
            $receipts = Receipt::with(['user', 'receiptItems.product'])
                              ->returnable()
                              ->when($query, function($q) use ($query) {
                                  $q->where('receipt_number', 'like', "%{$query}%")
                                    ->orWhere('customer_name', 'like', "%{$query}%");
                              })
                              ->orderBy('issued_at', 'desc')
                              ->limit($limit)
                              ->get()
                              ->map(function($receipt) {
                                  // หาระยะรับประกันที่ยาวที่สุดจากสินค้าในใบเสร็จ
                                  $maxWarrantyDays = 7; // default 7 วัน
                                  
                                  foreach ($receipt->receiptItems as $item) {
                                      if ($item->product && $item->product->warranty > 0) {
                                          $productWarrantyDays = ($item->product->warranty_days ?? 0) + 
                                                               (($item->product->warranty_months ?? 0) * 30) + 
                                                               (($item->product->warranty_years ?? 0) * 365);
                                          
                                          if ($productWarrantyDays > $maxWarrantyDays) {
                                              $maxWarrantyDays = $productWarrantyDays;
                                          }
                                      }
                                  }
                                  
                                  return [
                                      'id' => $receipt->id,
                                      'receipt_number' => $receipt->receipt_number,
                                      'issued_at' => $receipt->issued_at->format('Y-m-d H:i:s'),
                                      'formatted_issued_date' => $receipt->issued_at->format('d/m/Y'),
                                      'customer_name' => $receipt->customer_name ?? 'ลูกค้าทั่วไป',
                                      'grand_total' => $receipt->grand_total,
                                      'cashier' => $receipt->user->name,
                                      'remaining_returnable_amount' => $receipt->remaining_returnable_amount,
                                      'can_return' => $receipt->canBeReturned(),
                                      'days_since_purchase' => $receipt->issued_at->diffInDays(now()),
                                      'max_warranty_days' => $maxWarrantyDays,
                                  ];
                              });

            return response()->json([
                'success' => true,
                'data' => $receipts,
                'count' => $receipts->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error getting returnable receipts', [
                'error' => $e->getMessage(),
                'query' => $query
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching returnable receipts: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Get products with returned stock for management
     */
    public function getReturnedStockProducts(Request $request)
    {
        try {
            $products = Product::with('category')
                              ->where('returned_quantity', '>', 0)
                              ->when($request->search, function($query, $search) {
                                  $query->where('name', 'like', "%{$search}%")
                                        ->orWhere('sku', 'like', "%{$search}%");
                              })
                              ->orderBy('returned_quantity', 'desc')
                              ->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $products,
                'summary' => [
                    'total_products' => Product::where('returned_quantity', '>', 0)->count(),
                    'total_returned_items' => Product::sum('returned_quantity'),
                    'total_returned_value' => Product::where('returned_quantity', '>', 0)
                                                   ->get()
                                                   ->sum(function($p) {
                                                       return $p->returned_quantity * $p->price;
                                                   })
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error getting returned stock products', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching returned stock products: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Restock from returned items
     */
    public function restockFromReturned(Request $request, $productId)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:500'
        ]);

        try {
            DB::beginTransaction();

            $product = Product::findOrFail($productId);
            $quantity = $request->quantity;
            $reason = $request->reason ?? 'ตรวจสอบสภาพแล้ว สามารถขายต่อได้';

            $availableReturned = $product->returned_quantity ?? 0;
            if ($quantity > $availableReturned) {
                throw new \Exception("จำนวนเกินของคืนที่มี (มีอยู่ {$availableReturned} ชิ้น)");
            }

            $actualMoved = $product->restockFromReturned($quantity);

            DB::commit();

            Log::info('Restocked from returned items', [
                'product_id' => $productId,
                'quantity' => $actualMoved,
                'reason' => $reason,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => "ย้ายสินค้าสำเร็จ {$actualMoved} ชิ้น จากสต็อกคืนเป็นสต็อกขาย",
                'data' => [
                    'moved_quantity' => $actualMoved,
                    'new_sellable_stock' => $product->fresh()->quantity,
                    'new_returned_stock' => $product->fresh()->returned_quantity ?? 0
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            
            Log::error('Error restocking from returned items', [
                'error' => $e->getMessage(),
                'product_id' => $productId,
                'quantity' => $request->quantity
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Discard returned stock
     */
    public function discardReturnedStock(Request $request, $productId)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|max:500'
        ]);

        try {
            DB::beginTransaction();

            $product = Product::findOrFail($productId);
            $quantity = $request->quantity;
            $reason = $request->reason;

            $availableReturned = $product->returned_quantity ?? 0;
            if ($quantity > $availableReturned) {
                throw new \Exception("จำนวนเกินของคืนที่มี (มีอยู่ {$availableReturned} ชิ้น)");
            }

            $actualDiscarded = $product->discardReturnedStock($quantity, $reason);

            DB::commit();

            Log::info('Discarded returned stock', [
                'product_id' => $productId,
                'quantity' => $actualDiscarded,
                'reason' => $reason,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => "ทิ้งสินค้าสำเร็จ {$actualDiscarded} ชิ้น จากสต็อกคืน",
                'data' => [
                    'discarded_quantity' => $actualDiscarded,
                    'new_returned_stock' => $product->fresh()->returned_quantity ?? 0
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            
            Log::error('Error discarding returned stock', [
                'error' => $e->getMessage(),
                'product_id' => $productId,
                'quantity' => $request->quantity
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}