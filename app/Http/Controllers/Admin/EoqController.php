<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AverageCostCalculation;
use App\Models\Category;
use App\Models\CogsCalculation;
use App\Models\CostPerAreaCalculation;
use App\Models\EoqCalculation;
use App\Models\Product;
use App\Models\RopCalculation;
use App\Models\StorageCostCalculation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class EoqController extends Controller
{
    public function saveEoq(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'product_name' => 'nullable|string|max:255',
            'annual_demand' => 'required|numeric|min:0',
            'ordering_cost' => 'required|numeric|min:0',
            'unit_cost' => 'required|numeric|min:0',
            'holding_rate' => 'required|numeric|min:0',
            'holding_cost' => 'required|numeric|min:0',
            'eoq' => 'required|integer|min:0',
            'number_of_orders' => 'required|numeric|min:0',
            'order_cycle_days' => 'required|numeric|min:0',
            'daily_demand' => 'required|numeric|min:0',
            'reorder_point' => 'required|numeric|min:0',
            'total_cost' => 'required|numeric|min:0',
        ]);

        // Upsert using updateOrCreate to ensure we overwrite existing data for the same product
        if (!empty($validated['product_id'])) {
            $eoqCalculation = EoqCalculation::updateOrCreate(
                ['product_id' => $validated['product_id']],  // Search criteria
                $validated  // Values to update or create
            );
            $message = $eoqCalculation->wasRecentlyCreated 
                ? 'EOQ calculation saved successfully for SKU: ' . $eoqCalculation->product->sku
                : 'EOQ calculation updated successfully for SKU: ' . $eoqCalculation->product->sku;
        } else {
            // No product_id provided, create new record without product link
            $eoqCalculation = EoqCalculation::create($validated);
            $message = 'EOQ calculation saved successfully';
        }

        return Redirect::back()->with('success', $message);
    }

    public function getLatestEoq()
    {
        $latestEoq = EoqCalculation::with('product')->latest()->first();

        return response()->json($latestEoq);
    }

    public function getProducts(Request $request)
    {
        $search = $request->get('search', '');
        $id = $request->get('id');
        
        $products = Product::query()
            ->with('eoqCalculation') // Include EOQ data
            ->when($id, function ($query, $id) {
                $query->where('id', $id);
            })
            ->when($search && !$id, function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
            })
            ->select('id', 'sku', 'name', 'image', 'price', 'cost_price')
            ->orderBy('name')
            ->limit(50)
            ->get();

        if ($id) {
            return response()->json($products->first());
        }

        return response()->json($products);
    }
    
    public function getAllProducts()
    {
        $products = Product::query()
            ->select('id', 'sku', 'name', 'image', 'price', 'cost_price')
            ->orderBy('name')
            ->get();
        
        return response()->json($products);
    }

    public function getEoqDashboard(Request $request)
    {
        $search = $request->get('search', '');
        $category = $request->get('category', '');
        
        $products = Product::with(['category', 'eoqCalculation'])
            ->withSum('saleItems', 'quantity')
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
            })
            ->when($category, function ($query, $category) {
                $query->where('category_id', $category);
            })
            ->orderBy('name')
            ->paginate(24)
            ->withQueryString();

        $categories = Category::all();
        
        $filters = [
            'search' => $search,
            'category' => $category,
        ];

        return Inertia::render('Admin/EOQ/Dashboard', [
            'productsWithEoq' => $products,
            'categories' => $categories,
            'filters' => $filters,
        ]);
    }

    /**
     * Calculate stock status data (current stock vs reorder point)
     */
    private function calculateStockStatusData($products)
    {
        $data = [];
        
        foreach ($products as $product) {
            if ($product->eoqCalculation) {
                $currentStock = (int)($product->quantity ?? 0);
                $reorderPoint = (float)($product->eoqCalculation->reorder_point ?? 0);
                
                // Safely encode product name to UTF-8
                $productName = $product->name ?? 'N/A';
                $productName = mb_convert_encoding($productName, 'UTF-8', 'UTF-8');
                $productSku = $product->sku ?? 'N/A';
                
                $data[] = [
                    'name' => mb_substr($productSku, 0, 10),
                    'fullName' => mb_substr($productName, 0, 20),
                    'current' => $currentStock,
                    'reorder' => (int)round($reorderPoint),
                    'status' => $currentStock > $reorderPoint ? 'safe' : 'low',
                ];
            }
        }
        
        // Sort by reorder point descending and take top 15 for readability
        usort($data, function($a, $b) {
            return $b['reorder'] <=> $a['reorder'];
        });
        
        return array_values(array_slice($data, 0, 15));
    }

    /**
     * Calculate top 5 EOQ values
     */
    private function calculateTop5EoqData($products)
    {
        $data = [];
        
        foreach ($products as $product) {
            if ($product->eoqCalculation) {
                $eoq = (float)($product->eoqCalculation->eoq ?? 0);
                $totalCost = (float)($product->eoqCalculation->total_cost ?? 0);
                
                // Safely encode product name to UTF-8
                $productName = $product->name ?? 'N/A';
                $productName = mb_convert_encoding($productName, 'UTF-8', 'UTF-8');
                $productSku = $product->sku ?? 'N/A';
                
                $data[] = [
                    'name' => mb_substr($productSku, 0, 10),
                    'fullName' => mb_substr($productName, 0, 20),
                    'value' => (int)round($totalCost),
                    'eoq' => (int)$eoq,
                ];
            }
        }
        
        // Sort by value descending and take top 5
        usort($data, function($a, $b) {
            return $b['value'] <=> $a['value'];
        });
        
        return array_values(array_slice($data, 0, 5));
    }

    /**
     * Calculate ABC analysis data for Pareto chart
     */
    private function calculateABCAnalysisData($products)
    {
        $data = [];
        $totalValue = 0;
        
        // Calculate values and total
        foreach ($products as $product) {
            if ($product->eoqCalculation) {
                $annualDemand = (float)($product->eoqCalculation->annual_demand ?? 0);
                $unitCost = (float)($product->eoqCalculation->unit_cost ?? 0);
                
                // Annual value = annual demand × unit cost
                $annualValue = $annualDemand * $unitCost;
                $totalValue += $annualValue;
                
                // Safely encode product name to UTF-8
                $productName = $product->name ?? 'N/A';
                $productName = mb_convert_encoding($productName, 'UTF-8', 'UTF-8');
                $productSku = $product->sku ?? 'N/A';
                
                $data[] = [
                    'name' => mb_substr($productSku, 0, 10),
                    'fullName' => mb_substr($productName, 0, 25),
                    'value' => round($annualValue),
                    'annualValue' => $annualValue,
                ];
            }
        }
        
        // Sort by value descending
        usort($data, function($a, $b) {
            return $b['annualValue'] <=> $a['annualValue'];
        });
        
        // Calculate percentages and cumulative
        $cumulative = 0;
        $processedData = [];
        $abcStats = [
            'A' => ['count' => 0, 'value' => 0],
            'B' => ['count' => 0, 'value' => 0],
            'C' => ['count' => 0, 'value' => 0],
        ];
        
        foreach ($data as $item) {
            $cumulative += $item['annualValue'];
            $cumulativePercent = $totalValue > 0 ? round(($cumulative / $totalValue) * 100, 2) : 0;
            $percentOfTotal = $totalValue > 0 ? round(($item['annualValue'] / $totalValue) * 100, 2) : 0;
            
            // Classify into ABC based on cumulative percentage
            if ($cumulativePercent <= 80) {
                $classification = 'A';
            } elseif ($cumulativePercent <= 95) {
                $classification = 'B';
            } else {
                $classification = 'C';
            }
            
            $abcStats[$classification]['count']++;
            $abcStats[$classification]['value'] += $percentOfTotal;
            
            $processedData[] = [
                'name' => $item['name'],
                'fullName' => $item['fullName'],
                'percentValue' => (float)$percentOfTotal,
                'cumulative' => (float)$cumulativePercent,
                'classification' => $classification,
            ];
        }
        
        // Return with stats
        return [
            'data' => array_values($processedData),
            'stats' => $abcStats,
            'total' => count($processedData),
        ];
    }

    /**
     * Save ROP calculation
     */
    public function saveRop(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'product_name' => 'nullable|string|max:255',
            'sku' => 'nullable|string|max:255',
            'annual_demand' => 'required|numeric|min:0',
            'lead_time' => 'required|numeric|min:0',
            'safety_stock' => 'nullable|numeric|min:0',
            'daily_demand' => 'required|numeric|min:0',
            'rop' => 'required|numeric|min:0',
        ]);

        // Set default safety_stock if not provided
        if (!isset($validated['safety_stock'])) {
            $validated['safety_stock'] = 0;
        }

        // Upsert using updateOrCreate to ensure we overwrite existing data for the same product
        if (!empty($validated['product_id'])) {
            $ropCalculation = RopCalculation::updateOrCreate(
                ['product_id' => $validated['product_id']],  // Search criteria
                $validated  // Values to update or create
            );
            $message = $ropCalculation->wasRecentlyCreated 
                ? 'ROP calculation saved successfully for SKU: ' . $ropCalculation->sku
                : 'ROP calculation updated successfully for SKU: ' . $ropCalculation->sku;
        } else {
            // No product_id provided, create new record without product link
            $ropCalculation = RopCalculation::create($validated);
            $message = 'ROP calculation saved successfully';
        }

        return Redirect::back()->with('success', $message);
    }

    /**
     * Get product with EOQ data by SKU for ROP calculation
     */
    public function getProductForRop(Request $request)
    {
        $sku = $request->get('sku');
        $id = $request->get('id');
        
        $product = Product::query()
            ->with(['eoqCalculation', 'ropCalculation'])
            ->when($id, function ($query, $id) {
                $query->where('id', $id);
            })
            ->when($sku && !$id, function ($query) use ($sku) {
                $query->where('sku', $sku);
            })
            ->select('id', 'sku', 'name', 'image', 'price', 'cost_price', 'quantity')
            ->first();

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        return response()->json($product);
    }

    /**
     * Get annual demand from EOQ by SKU
     */
    public function getAnnualDemandFromEoq(Request $request)
    {
        $sku = $request->get('sku');
        
        if (!$sku) {
            return response()->json(['error' => 'SKU is required'], 400);
        }

        // Find product by SKU
        $product = Product::where('sku', $sku)->first();

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        $eoqCalculation = EoqCalculation::where('product_id', $product->id)->first();

        if (!$eoqCalculation) {
            return response()->json([
                'error' => 'No EOQ calculation found for this product',
                'product_id' => $product->id,
                'product_name' => $product->name,
                'sku' => $product->sku,
            ], 404);
        }

        $ropCalculation = RopCalculation::where('product_id', $product->id)->first();

        return response()->json([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'image' => $product->image,
            'cost_price' => $product->cost_price,
            'annual_demand' => $eoqCalculation->annual_demand,
            'daily_demand' => $eoqCalculation->daily_demand,
            'eoq' => $eoqCalculation->eoq,
            'ordering_cost' => $eoqCalculation->ordering_cost,
            'unit_cost' => $eoqCalculation->unit_cost,
            'holding_rate' => $eoqCalculation->holding_rate,
            'lead_time' => $ropCalculation ? $ropCalculation->lead_time : null,
            'safety_stock_pct' => $ropCalculation ? $ropCalculation->safety_stock : null,
        ]);
    }

    /**
     * Save Cost Per Area calculation
     * Uses updateOrCreate to prevent duplicates based on calculation_name
     */
    public function saveCostPerArea(Request $request)
    {
        $validated = $request->validate([
            'calculation_name' => 'nullable|string|max:255',
            'monthly_data' => 'required|array',
            'monthly_data.*.electricity' => 'nullable|numeric|min:0',
            'monthly_data.*.water' => 'nullable|numeric|min:0',
            'monthly_data.*.labor' => 'nullable|numeric|min:0',
            'land_cost' => 'required|numeric|min:0',
            'usage_years' => 'required|integer|min:1',
            'store_size' => 'required|numeric|min:0.1',
            'total_monthly_cost' => 'required|numeric|min:0',
            'avg_annual_store_cost' => 'required|numeric|min:0',
            'total_storage_cost' => 'required|numeric|min:0',
            'avg_monthly_storage_cost' => 'required|numeric|min:0',
            'cost_per_square_meter' => 'required|numeric|min:0',
        ]);

        // Use calculation_name as unique key for upsert (or 'default' if not provided)
        $calculationName = $validated['calculation_name'] ?? 'default';

        $calculation = CostPerAreaCalculation::updateOrCreate(
            ['calculation_name' => $calculationName],
            $validated
        );

        $message = $calculation->wasRecentlyCreated 
            ? 'บันทึกผลการคำนวณต้นทุนต่อพื้นที่สำเร็จ' 
            : 'อัพเดตผลการคำนวณต้นทุนต่อพื้นที่สำเร็จ';

        return Redirect::back()->with('success', $message);
    }

    /**
     * Get all Cost Per Area calculations
     */
    public function getCostPerAreaCalculations()
    {
        $calculations = CostPerAreaCalculation::latest()->get();
        return response()->json($calculations);
    }

    /**
     * Get single Cost Per Area calculation
     */
    public function getCostPerAreaCalculation($id)
    {
        $calculation = CostPerAreaCalculation::find($id);
        
        if (!$calculation) {
            return response()->json(['error' => 'Calculation not found'], 404);
        }

        return response()->json($calculation);
    }

    /**
     * Get the latest Cost Per Area calculation for loading data
     */
    public function getLatestCostPerArea()
    {
        $latest = CostPerAreaCalculation::latest()->first();
        
        if (!$latest) {
            return response()->json(['error' => 'No data found'], 404);
        }

        return response()->json([
            'id' => $latest->id,
            'calculation_name' => $latest->calculation_name,
            'land_cost' => $latest->land_cost,
            'usage_years' => $latest->usage_years,
            'store_size' => $latest->store_size,
            'monthly_data' => $latest->monthly_data,
            'total_monthly_cost' => $latest->total_monthly_cost,
            'avg_annual_store_cost' => $latest->avg_annual_store_cost,
            'total_storage_cost' => $latest->total_storage_cost,
            'avg_monthly_storage_cost' => $latest->avg_monthly_storage_cost,
            'cost_per_square_meter' => $latest->cost_per_square_meter,
            'created_at' => $latest->created_at,
        ]);
    }

    /**
     * Get Cost Per Area calculation history
     */
    public function getCostPerAreaHistory()
    {
        $calculations = CostPerAreaCalculation::latest()
            ->select('id', 'calculation_name', 'land_cost', 'usage_years', 'store_size', 
                     'total_monthly_cost', 'avg_annual_store_cost', 'total_storage_cost', 
                     'avg_monthly_storage_cost', 'cost_per_square_meter', 'monthly_data', 'created_at')
            ->get();
        
        return response()->json($calculations);
    }

    /**
     * Save COGS calculation
     */
    public function saveCogs(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|integer',
            'sku' => 'nullable|string|max:255',
            'product_name' => 'nullable|string|max:255',
            'beginning_inventory_cost' => 'required|numeric|min:0',
            'beginning_inventory_quantity' => 'required|numeric|min:0',
            'net_purchases_cost' => 'required|numeric|min:0',
            'net_purchases_quantity' => 'required|numeric|min:0',
            'ending_inventory_cost' => 'required|numeric|min:0',
            'ending_inventory_quantity' => 'required|numeric|min:0',
            'total_cost' => 'required|numeric|min:0',
            'total_quantity' => 'required|numeric|min:0',
            'average_cost' => 'required|numeric|min:0',
            'cogs' => 'required|numeric|min:0',
            'cogs_per_unit' => 'nullable|numeric|min:0',
        ]);

        // If product_id is provided but doesn't exist in products table, set to null
        if (!empty($validated['product_id'])) {
            $productExists = \App\Models\Product::where('id', $validated['product_id'])->exists();
            if (!$productExists) {
                $validated['product_id'] = null;
            }
        }

        // If no product_id but have sku, try to find product
        if (empty($validated['product_id']) && !empty($validated['sku'])) {
            $product = \App\Models\Product::where('sku', $validated['sku'])->first();
            if ($product) {
                $validated['product_id'] = $product->id;
                if (empty($validated['product_name'])) {
                    $validated['product_name'] = $product->name;
                }
            }
        }

        // Upsert logic: Use SKU as primary key for matching
        // If SKU exists, update the existing record; otherwise create new
        if (!empty($validated['sku'])) {
            CogsCalculation::updateOrCreate(
                ['sku' => $validated['sku']],  // Search criteria
                $validated  // Values to update or create
            );
            $message = 'COGS calculation saved successfully';
        } else {
            // If no SKU, create new record (cannot match without SKU)
            CogsCalculation::create($validated);
            $message = 'COGS calculation saved successfully';
        }

        return Redirect::back()->with('success', $message);
    }

    /**
     * Get product with COGS data by SKU
     */
    public function getProductForCogs(Request $request)
    {
        $sku = $request->get('sku');
        $id = $request->get('id');
        
        $product = Product::query()
            ->with(['cogsCalculation'])
            ->when($id, function ($query, $id) {
                $query->where('id', $id);
            })
            ->when($sku && !$id, function ($query) use ($sku) {
                $query->where('sku', $sku);
            })
            ->select('id', 'sku', 'name', 'image', 'price', 'cost_price', 'quantity')
            ->first();

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        return response()->json($product);
    }

    /**
     * Get all COGS calculations
     */
    public function getCogsCalculations()
    {
        $calculations = CogsCalculation::with('product')->latest()->get();
        return response()->json($calculations);
    }

    /**
     * Save Average Cost calculation
     * Formula: AC = ((Qb × Cb) + (Qp × Cp)) / (Qb + Qp)
     * Where: Qb = beginning_value / Cb, Cp = purchase_value / Qp
     */
    public function saveAverageCost(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|integer',
            'sku' => 'nullable|string|max:255',
            'product_name' => 'nullable|string|max:255',
            'beginning_value' => 'required|numeric|min:0',          // มูลค่าสินค้าคงเหลือต้นงวด
            'beginning_unit_cost' => 'required|numeric|min:0',      // Cb - ราคาทุนต่อหน่วย
            'calculated_qb' => 'required|numeric|min:0',            // Qb = beginning_value / Cb
            'purchase_value' => 'required|numeric|min:0',           // มูลค่าสินค้าที่ซื้อเพิ่ม
            'purchase_quantity' => 'required|numeric|min:0',        // Qp - จำนวนที่ซื้อเพิ่ม
            'calculated_cp' => 'required|numeric|min:0',            // Cp = purchase_value / Qp
            'average_cost' => 'required|numeric|min:0',             // AC result
            'total_beginning_cost' => 'required|numeric|min:0',     // = beginning_value
            'total_purchase_cost' => 'required|numeric|min:0',      // = purchase_value
            'total_quantity' => 'required|numeric|min:0',           // Qtotal = Qb + Qp
            'calculation_name' => 'nullable|string|max:255',
        ]);

        // If product_id is provided but doesn't exist in products table, set to null
        if (!empty($validated['product_id'])) {
            $productExists = Product::where('id', $validated['product_id'])->exists();
            if (!$productExists) {
                $validated['product_id'] = null;
            }
        }

        // If no product_id but have sku, try to find product
        if (empty($validated['product_id']) && !empty($validated['sku'])) {
            $product = Product::where('sku', $validated['sku'])->first();
            if ($product) {
                $validated['product_id'] = $product->id;
                if (empty($validated['product_name'])) {
                    $validated['product_name'] = $product->name;
                }
            }
        }

        // Upsert logic: Use SKU as primary key for matching
        if (!empty($validated['sku'])) {
            AverageCostCalculation::updateOrCreate(
                ['sku' => $validated['sku']],  // Search criteria
                $validated  // Values to update or create
            );
            $message = 'Average Cost calculation saved successfully';
        } else {
            // If no SKU, create new record
            AverageCostCalculation::create($validated);
            $message = 'Average Cost calculation saved successfully';
        }

        return response()->json(['success' => true, 'message' => $message]);
    }

    /**
     * Get product with Average Cost data by SKU
     */
    public function getProductForAverageCost(Request $request)
    {
        $sku = $request->get('sku');
        $id = $request->get('id');
        
        $product = Product::query()
            ->with(['averageCostCalculation'])
            ->when($id, function ($query, $id) {
                $query->where('id', $id);
            })
            ->when($sku && !$id, function ($query) use ($sku) {
                $query->where('sku', $sku);
            })
            ->select('id', 'sku', 'name', 'image', 'price', 'cost_price', 'quantity')
            ->first();

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        return response()->json($product);
    }

    /**
     * Get all Average Cost calculations
     */
    public function getAverageCostCalculations()
    {
        $calculations = AverageCostCalculation::with('product')->latest()->get();
        return response()->json($calculations);
    }

    /**
     * Save Storage Cost calculation
     * Formula: 
     * - A = W × L (พื้นที่สินค้า ตร.ม.)
     * - Cost per sqm/year = totalStorageCost / warehouseTotalArea
     * - Storage Cost = A × Cost per sqm/year
     */
    public function saveStorageCost(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|integer',
            'sku' => 'nullable|string|max:255',
            'product_name' => 'nullable|string|max:255',
            'width' => 'required|numeric|min:0',                       // W - ความกว้าง (เมตร)
            'length' => 'required|numeric|min:0',                      // L - ความยาว (เมตร)
            'product_area' => 'required|numeric|min:0',                // A = W × L (ตร.ม.)
            'warehouse_total_area' => 'required|numeric|min:0',        // พื้นที่คลังสินค้ารวม (ตร.ม.)
            'total_storage_cost_per_year' => 'required|numeric|min:0', // ค่าใช้จ่ายรวมต่อปี
            'cost_per_sqm_per_year' => 'required|numeric|min:0',       // ต้นทุน/ตร.ม./ปี
            'storage_cost_per_year' => 'required|numeric|min:0',       // ต้นทุนพื้นที่จัดเก็บสินค้า/ปี
            'calculation_name' => 'nullable|string|max:255',
        ]);

        // If product_id is provided but doesn't exist, set to null
        if (!empty($validated['product_id'])) {
            $productExists = Product::where('id', $validated['product_id'])->exists();
            if (!$productExists) {
                $validated['product_id'] = null;
            }
        }

        // If no product_id but have sku, try to find product
        if (empty($validated['product_id']) && !empty($validated['sku'])) {
            $product = Product::where('sku', $validated['sku'])->first();
            if ($product) {
                $validated['product_id'] = $product->id;
                if (empty($validated['product_name'])) {
                    $validated['product_name'] = $product->name;
                }
            }
        }

        // Upsert logic: Use SKU as primary key for matching
        if (!empty($validated['sku'])) {
            StorageCostCalculation::updateOrCreate(
                ['sku' => $validated['sku']],
                $validated
            );
            $message = 'Storage Cost calculation saved successfully';
        } else {
            StorageCostCalculation::create($validated);
            $message = 'Storage Cost calculation saved successfully';
        }

        return response()->json(['success' => true, 'message' => $message]);
    }

    /**
     * Get product with Storage Cost data by SKU
     */
    public function getProductForStorageCost(Request $request)
    {
        $sku = $request->get('sku');
        
        if (!$sku) {
            return response()->json(['error' => 'SKU is required'], 400);
        }

        $product = Product::where('sku', $sku)->first();

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        // Load existing storage cost calculation if exists
        $storageCostCalculation = StorageCostCalculation::where('sku', $sku)->first();

        return response()->json([
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'cost_price' => $product->cost_price,
            'quantity' => $product->quantity,
            'image' => $product->image,
            'storage_cost_calculation' => $storageCostCalculation
        ]);
    }

    /**
     * Get all Storage Cost calculations
     */
    public function getStorageCostCalculations()
    {
        $calculations = StorageCostCalculation::with('product')->latest()->get();
        return response()->json($calculations);
    }

    /**
     * Get the latest total storage cost from cost_per_area_calculations
     */
    public function getLatestStorageCostData()
    {
        $latestCostPerArea = CostPerAreaCalculation::latest()->first();
        
        if (!$latestCostPerArea) {
            return response()->json([
                'total_storage_cost_per_year' => 0,
                'warehouse_total_area' => 0,
                'cost_per_sqm_per_year' => 0,
                'message' => 'No cost per area data found'
            ]);
        }

        $totalCost = $latestCostPerArea->total_storage_cost ?? 0;
        $warehouseArea = $latestCostPerArea->warehouse_area ?? 0;
        $costPerSqm = $warehouseArea > 0 ? $totalCost / $warehouseArea : 0;

        return response()->json([
            'total_storage_cost_per_year' => $totalCost,
            'warehouse_total_area' => $warehouseArea,
            'cost_per_sqm_per_year' => $costPerSqm,
            'source_calculation' => $latestCostPerArea->calculation_name
        ]);
    }
}