<?php
// app/Http/Controllers/Staff/ProductController.php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\StockMovement;
use App\Services\InventoryLotService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $viewMode = $request->get('view', 'table');
        $perPage = $viewMode === 'grid' ? 16 : 15;
        
        $query = Product::with([
                'category',
                'saleItems.sale',
                'stockMovements' => function($query) {
                    // เอาเฉพาะ stock movements ล่าสุดที่มีข้อมูล Lot
                    $query->whereNotNull('notes')
                          ->where(function($q) {
                              $q->where('notes', 'like', '%Lot:%')
                                ->orWhere('notes', 'like', '%Supplier:%')
                                ->orWhere('notes', 'like', '%Expiry:%');
                          })
                          ->orderBy('created_at', 'desc')
                          ->limit(1);
                }
            ])
            ->withCount(['saleItems as total_sold' => function($query) {
                $query->select(\DB::raw('SUM(quantity)'));
            }])
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
            })
            ->when($request->category, function ($query, $category) {
                $query->where('category_id', $category);
            })
            ->when($request->status, function ($query, $status) {
                if ($status === 'low_stock') {
                    $query->whereColumn('quantity', '<=', 'min_stock');
                } elseif ($status === 'out_of_stock') {
                    $query->where('quantity', 0);
                } elseif ($status === 'active') {
                    $query->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                }
            });

        $products = $query->orderBy('created_at', 'desc')
                         ->paginate($perPage)
                         ->withQueryString();

        // เพิ่มข้อมูลสถิติการขายให้กับแต่ละสินค้า
        $products->getCollection()->transform(function ($product) {
            // คำนวณข้อมูลเพิ่มเติม
            $totalStockIn = $product->stockMovements()->where('type', 'in')->sum('quantity');
            $totalSold = $product->saleItems()->sum('quantity');
            $totalSalesValue = $product->saleItems()->sum('total_price');
            
            $product->total_stock_in = $totalStockIn;
            $product->total_sold_quantity = $totalSold;
            $product->total_sales_value = $totalSalesValue;
            $product->remaining_stock = $product->quantity;
            $product->stock_sold_percentage = $totalStockIn > 0 ? round(($totalSold / $totalStockIn) * 100, 1) : 0;
            
            return $product;
        });

        $categories = Category::active()->get();

        // Calculate total stats for all products (not just paginated)
        $totalStats = [
            'active' => Product::where('is_active', true)->count(),
            'lowStock' => Product::whereColumn('quantity', '<=', 'min_stock')->where('quantity', '>', 0)->count(),
            'withLot' => Product::whereHas('stockMovements', function($q) {
                $q->whereNotNull('notes')
                  ->where(function($sub) {
                      $sub->where('notes', 'like', '%Lot:%');
                  });
            })->count(),
        ];

        return Inertia::render('Staff/Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'status', 'view']),
            'totalStats' => $totalStats,
        ]);
    }

    public function create()
    {
        $categories = Category::active()->get();
        
        return Inertia::render('Staff/Products/Create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:255|unique:products',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'category_id' => 'required|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'profit_margin' => 'nullable|numeric|min:0|max:100',
            'quantity' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'warranty' => 'nullable|integer|min:0',
            'warranty_days' => 'nullable|integer|min:0',
            'warranty_months' => 'nullable|integer|min:0',
            'warranty_years' => 'nullable|integer|min:0',
            // เพิ่มฟิลด์สำหรับ lot information
            'lot_number' => 'nullable|string|max:255',
            'expiry_date' => 'nullable|date',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = time() . '_' . Str::slug($validated['name']) . '.' . $image->getClientOriginalExtension();
            $image->storeAs('products', $imageName, 'public');
            $validated['image'] = $imageName;
        }

        $product = Product::create($validated);

        // Record initial stock movement with lot information
        if ($validated['quantity'] > 0) {
            if (!empty($validated['lot_number'])) {
                // Use lot service to create lot instance
                $lotService = new InventoryLotService();
                // Reset product quantity first (it was set by create above)
                $product->update(['quantity' => 0]);
                $lotService->receiveLot(
                    $product,
                    $validated['lot_number'],
                    $validated['quantity'],
                    $validated['expiry_date'] ?? null,
                    'Initial stock entry'
                );
            } else {
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => auth()->id(),
                    'type' => 'in',
                    'quantity' => $validated['quantity'],
                    'previous_quantity' => 0,
                    'new_quantity' => $validated['quantity'],
                    'notes' => 'Initial stock entry',
                ]);
            }
        }

        return redirect()->route('staff.products.index')
                        ->with('success', 'Product created successfully.');
    }

    public function show(Product $product)
    {
        $product->load(['category', 'stockMovements.user', 'saleItems.sale.user']);
        
        // คำนวณสถิติการขายโดยละเอียด
        $salesStats = [
            'total_ever_in_stock' => $product->stockMovements()->where('type', 'in')->sum('quantity'),
            'total_sold' => $product->saleItems()->sum('quantity'),
            'total_sales_value' => $product->saleItems()->sum('total_price'),
            'current_stock' => $product->quantity,
            'sales_this_month' => $product->saleItems()
                ->whereHas('sale', function($query) {
                    $query->whereYear('sale_date', now()->year)
                          ->whereMonth('sale_date', now()->month);
                })
                ->sum('quantity'),
            'sales_this_week' => $product->saleItems()
                ->whereHas('sale', function($query) {
                    $query->whereBetween('sale_date', [
                        now()->startOfWeek(),
                        now()->endOfWeek()
                    ]);
                })
                ->sum('quantity'),
            'average_sale_price' => $product->saleItems()->avg('unit_price') ?? 0,
            'last_sale_date' => $product->saleItems()
                ->whereHas('sale')
                ->latest()
                ->first()?->sale?->sale_date,
        ];

        // คำนวณเปอร์เซ็นต์การขาย
        if ($salesStats['total_ever_in_stock'] > 0) {
            $salesStats['sales_percentage'] = round(($salesStats['total_sold'] / $salesStats['total_ever_in_stock']) * 100, 1);
            $salesStats['remaining_percentage'] = round(($salesStats['current_stock'] / $salesStats['total_ever_in_stock']) * 100, 1);
        } else {
            $salesStats['sales_percentage'] = 0;
            $salesStats['remaining_percentage'] = 0;
        }

        $recentMovements = $product->stockMovements()
                                  ->with('user')
                                  ->orderBy('created_at', 'desc')
                                  ->take(20)
                                  ->get();

        // ประวัติการขายล่าสุด
        $recentSales = $product->saleItems()
                              ->with(['sale.user'])
                              ->orderBy('created_at', 'desc')
                              ->take(10)
                              ->get();

        return Inertia::render('Staff/Products/Show', [
            'product' => $product,
            'salesStats' => $salesStats,
            'recentMovements' => $recentMovements,
            'recentSales' => $recentSales,
        ]);
    }

    public function edit(Product $product)
    {
        $categories = Category::active()->select('id', 'name', 'categories_sku')->get();
        
        // Load lots sorted by FIFO (oldest first, quantity > 0)
        $product->load([
            'stockLotInstances' => function ($q) {
                $q->where('quantity', '>', 0)->orderBy('created_at', 'asc');
            }
        ]);
        
        return Inertia::render('Staff/Products/Edit', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => ['required', 'string', 'max:255', Rule::unique('products')->ignore($product->id)],
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'category_id' => 'required|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'profit_margin' => 'nullable|numeric|min:0|max:100',
            'quantity' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'warranty' => 'nullable|integer|min:0',
            'warranty_days' => 'nullable|integer|min:0',
            'warranty_months' => 'nullable|integer|min:0',
            'warranty_years' => 'nullable|integer|min:0',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete('products/' . $product->image);
            }
            
            $image = $request->file('image');
            $imageName = time() . '_' . Str::slug($validated['name']) . '.' . $image->getClientOriginalExtension();
            $image->storeAs('products', $imageName, 'public');
            $validated['image'] = $imageName;
        } else {
            unset($validated['image']);
        }

        // Track quantity changes
        $oldQuantity = $product->quantity;
        $newQuantity = $validated['quantity'];

        $product->update($validated);

        // Record stock movement if quantity changed
        if ($oldQuantity !== $newQuantity) {
            $quantity = abs($newQuantity - $oldQuantity);

            StockMovement::create([
                'product_id' => $product->id,
                'user_id' => auth()->id(),
                'type' => 'adjustment',
                'quantity' => $quantity,
                'previous_quantity' => $oldQuantity,
                'new_quantity' => $newQuantity,
                'notes' => "Quantity adjusted from {$oldQuantity} to {$newQuantity}",
            ]);
        }

        return redirect()->route('staff.products.show', $product)
                        ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        // Delete related records first to handle foreign key constraints
        // This handles the cascade deletion manually
        
        // Delete related return items first (via receipt_item_id -> product_id)
        \App\Models\ReturnItem::whereIn('receipt_item_id', function($query) use ($product) {
            $query->select('id')
                  ->from('receipt_items')
                  ->where('product_id', $product->id);
        })->delete();
        
        // Delete related receipt items
        \App\Models\ReceiptItem::where('product_id', $product->id)->delete();
        
        // Delete related sale items
        \App\Models\SaleItem::where('product_id', $product->id)->delete();
        
        // Delete related stock movements
        \App\Models\StockMovement::where('product_id', $product->id)->delete();
        
        if ($product->image) {
            Storage::disk('public')->delete('products/' . $product->image);
        }
        
        $product->delete();
        
        return redirect()->route('staff.products.index')
                        ->with('success', 'Product deleted successfully.');
    }

    public function updateStock(Request $request, Product $product)
    {
        $validated = $request->validate([
            'type' => 'required|in:in,out,adjustment',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:500',
            'lot_number' => 'nullable|string|max:255',
            'expiry_date' => 'nullable|date',
        ]);

        $lotService = new InventoryLotService();
        $lotNumber = $validated['lot_number'] ?? null;
        $hasLot = !empty($lotNumber);

        if ($hasLot) {
            // Use lot service for lot-based operations
            if ($validated['type'] === 'in') {
                $lotService->receiveLot(
                    $product,
                    $lotNumber,
                    $validated['quantity'],
                    $validated['expiry_date'] ?? null,
                    $validated['notes'] ?? null
                );
            } elseif ($validated['type'] === 'out') {
                $lotService->issueLot(
                    $product,
                    $validated['quantity'],
                    $lotNumber,
                    $validated['notes'] ?? null
                );
            } else {
                $lotService->adjustLot(
                    $product,
                    $validated['quantity'],
                    $lotNumber,
                    $validated['notes'] ?? null
                );
            }
        } else {
            // Original logic without lot
            $oldQuantity = $product->quantity;
            
            if ($validated['type'] === 'in') {
                $newQuantity = $oldQuantity + $validated['quantity'];
            } elseif ($validated['type'] === 'out') {
                $newQuantity = max(0, $oldQuantity - $validated['quantity']);
            } else {
                $newQuantity = $validated['quantity'];
                $validated['quantity'] = abs($newQuantity - $oldQuantity);
            }

            $product->update(['quantity' => $newQuantity]);

            StockMovement::create([
                'product_id' => $product->id,
                'user_id' => auth()->id(),
                'type' => $validated['type'],
                'quantity' => $validated['quantity'],
                'previous_quantity' => $oldQuantity,
                'new_quantity' => $newQuantity,
                'notes' => $validated['notes'] ?? '',
            ]);
        }

        return redirect()->back()
                        ->with('success', 'Stock updated successfully.');
    }
}