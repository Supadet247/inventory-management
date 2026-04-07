<?php
// app/Http/Controllers/DashboardController.php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\EoqCalculation;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->isAdmin()) {
            return $this->adminDashboard();
        } else {
            return $this->staffDashboard();
        }
    }

    private function adminDashboard()
    {
        // สถิติสำหรับ Admin
        $totalProducts = Product::where('is_active', true)->count();  // Only count active products
        $totalInactiveProducts = Product::where('is_active', false)->count();  // Count inactive products
        $totalCategories = Category::count();
        $lowStockProducts = Product::where('is_active', true)->lowStock()->count();
        $totalUsers = User::where('is_active', true)->count();
        
        // มูลค่ารวมของสินค้า
        $totalInventoryValue = Product::active()
            ->selectRaw('SUM(price * quantity) as total')
            ->value('total') ?? 0;

        // สินค้าที่หมดสต็อก
        $outOfStockProducts = Product::where('is_active', true)->where('quantity', 0)->count();

        // กิจกรรมล่าสุด (Stock Movements)
        $recentActivities = StockMovement::with(['product', 'user'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        // สินค้าที่ขายดีที่สุด (7 วันที่ผ่านมา)
        $topSellingProducts = SaleItem::with('product')
            ->whereHas('sale', function ($query) {
                $query->where('sale_date', '>=', Carbon::now()->subDays(7));
            })
            ->selectRaw('product_id, SUM(quantity) as total_sold')
            ->groupBy('product_id')
            ->orderBy('total_sold', 'desc')
            ->take(5)
            ->get();

        // ข้อมูลกราฟสำหรับ Stock Movement (7 วันที่ผ่านมา)
        $stockMovementData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dateStr = $date->format('Y-m-d');
            
            $inMovements = StockMovement::whereDate('created_at', $date)
                ->where('type', 'in')
                ->sum('quantity');
                
            $outMovements = StockMovement::whereDate('created_at', $date)
                ->where('type', 'out')
                ->sum(\DB::raw('ABS(quantity)'));
                
            $adjustmentMovements = StockMovement::whereDate('created_at', $date)
                ->whereIn('type', ['adjustment', 'return_in'])
                ->sum(\DB::raw('ABS(quantity)'));
                
            $stockMovementData[] = [
                'date' => $dateStr,
                'in' => (int) $inMovements,
                'out' => (int) $outMovements,
                'adjustment' => (int) $adjustmentMovements,
            ];
        }

        // ข้อมูลการกระจายตามหมวดหมู่
        $categoryDistribution = Category::withCount(['products' => function($query) {
            $query->where('is_active', true);
        }])
            ->having('products_count', '>', 0)
            ->get()
            ->map(function ($category) {
                $colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280', '#14b8a6', '#f97316'];
                static $colorIndex = 0;
                return [
                    'name' => $category->name,
                    'value' => $category->products_count,
                    'color' => $colors[$colorIndex++ % count($colors)]
                ];
            });

        // แนวโน้มยอดขาย (5 เดือนที่ผ่านมา)
        $inventoryTrend = [];
        for ($i = 4; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthStr = $month->locale('th')->translatedFormat('M');
            
            // ยอดขายรวมของเดือนนั้นๆ
            $totalSales = Sale::whereYear('sale_date', $month->year)
                ->whereMonth('sale_date', $month->month)
                ->sum('grand_total');
                
            // จำนวนบิลขาย
            $totalOrders = Sale::whereYear('sale_date', $month->year)
                ->whereMonth('sale_date', $month->month)
                ->count();
                
            $inventoryTrend[] = [
                'month' => $monthStr,
                'value' => (int) $totalSales,
                'orders' => (int) $totalOrders,
            ];
        }

        // ========== Quick Stats Data ==========
        // จำนวนการเคลื่อนไหวสินค้าวันนี้
        $todayMovements = StockMovement::whereDate('created_at', Carbon::today())
            ->sum(\DB::raw('ABS(quantity)'));

        // จำนวนสินค้าใหม่ที่เพิ่มในเดือนนี้
        $newProductsThisMonth = Product::where('created_at', '>=', Carbon::now()->startOfMonth())
            ->count();

        // จำนวน Users ที่ออนไลน์ (logged in ภายใน 15 นาที)
        $usersOnline = User::where('last_activity_at', '>=', Carbon::now()->subMinutes(15))
            ->where('is_active', true)
            ->count();

        // เวลาอัปเดตล่าสุดของ Stock Movement
        $lastUpdated = StockMovement::latest('created_at')->first();
        $lastUpdatedTime = $lastUpdated ? $lastUpdated->created_at : null;

        $latestEoq = EoqCalculation::latest()->first();

        // ========== Monthly Sales and Profit ==========
        $monthlySales = Sale::thisMonth()->sum('grand_total');
        
        $monthlyProfit = SaleItem::whereHas('sale', function($query) {
            $query->thisMonth();
        })
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->selectRaw('SUM(sale_items.quantity * (sale_items.unit_price - products.cost_price)) as profit')
        ->value('profit') ?? 0;

        // ========== Daily Sales and Profit ==========
        $todaySales = Sale::whereDate('sale_date', Carbon::today())->sum('grand_total');
        
        $todayProfit = SaleItem::whereHas('sale', function($query) {
            $query->whereDate('sale_date', Carbon::today());
        })
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->selectRaw('SUM(sale_items.quantity * (sale_items.unit_price - products.cost_price)) as profit')
        ->value('profit') ?? 0;

        // ========== Yearly Sales and Profit ==========
        $yearlySales = Sale::whereYear('sale_date', Carbon::now()->year)->sum('grand_total');
        
        $yearlyProfit = SaleItem::whereHas('sale', function($query) {
            $query->whereYear('sale_date', Carbon::now()->year);
        })
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->selectRaw('SUM(sale_items.quantity * (sale_items.unit_price - products.cost_price)) as profit')
        ->value('profit') ?? 0;

        // Debug: ตรวจสอบข้อมูลกราฟ
        \Log::info('Stock Movement Data:', ['data' => $stockMovementData]);
        \Log::info('Category Distribution:', ['data' => $categoryDistribution]);
        \Log::info('Inventory Trend:', ['data' => $inventoryTrend]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalProducts' => $totalProducts,
                'totalCategories' => $totalCategories,
                'lowStockProducts' => $lowStockProducts,
                'outOfStockProducts' => $outOfStockProducts,
                'totalUsers' => $totalUsers,
                'totalInventoryValue' => $totalInventoryValue,
                'todaySales' => $todaySales,
                'todayProfit' => $todayProfit,
                'yearlySales' => $yearlySales,
                'yearlyProfit' => $yearlyProfit,
            ],
            'quickStats' => [
                'todayMovements' => $todayMovements,
                'newProductsThisMonth' => $newProductsThisMonth,
                'usersOnline' => $usersOnline,
                'lastUpdated' => $lastUpdatedTime,
            ],
            'recentActivities' => $recentActivities,
            'topSellingProducts' => $topSellingProducts,
            'stockMovementData' => $stockMovementData,
            'categoryDistribution' => $categoryDistribution,
            'inventoryTrend' => $inventoryTrend,
            'latestEoq' => $latestEoq,
            'monthlySales' => $monthlySales,
            'monthlyProfit' => $monthlyProfit,
        ]);
    }

    private function staffDashboard()
    {
        // สถิติพื้นฐานสำหรับ Staff
        $totalProducts = Product::active()->count();
        $lowStockProducts = Product::lowStock()->count();
        $outOfStockProducts = Product::where('quantity', 0)->count();

        // กิจกรรมของ Staff คนนี้
        $myRecentActivities = StockMovement::with(['product'])
            ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        // สินค้าที่ต้องการความสนใจ (Low Stock)
        $alertProducts = Product::with('category')
            ->lowStock()
            ->active()
            ->orderBy('quantity')
            ->take(10)
            ->get();

        // สินค้าที่เพิ่งอัปเดต
        $recentlyUpdatedProducts = Product::with('category')
            ->active()
            ->orderBy('updated_at', 'desc')
            ->take(6)
            ->get();

        // ========== Quick Stats Data สำหรับ Staff ==========
        $todayMovements = StockMovement::whereDate('created_at', Carbon::today())
            ->sum(\DB::raw('ABS(quantity)'));

        $newProductsThisMonth = Product::where('created_at', '>=', Carbon::now()->startOfMonth())
            ->count();

        $usersOnline = User::where('last_activity_at', '>=', Carbon::now()->subMinutes(15))
            ->where('is_active', true)
            ->count();

        $lastUpdated = StockMovement::latest('created_at')->first();
        $lastUpdatedTime = $lastUpdated ? $lastUpdated->created_at : null;

        return Inertia::render('Staff/Dashboard', [
            'stats' => [
                'totalProducts' => $totalProducts,
                'lowStockProducts' => $lowStockProducts,
                'outOfStockProducts' => $outOfStockProducts,
            ],
            'quickStats' => [
                'todayMovements' => $todayMovements,
                'newProductsThisMonth' => $newProductsThisMonth,
                'usersOnline' => $usersOnline,
                'lastUpdated' => $lastUpdatedTime,
            ],
            'myRecentActivities' => $myRecentActivities,
            'alertProducts' => $alertProducts,
            'recentlyUpdatedProducts' => $recentlyUpdatedProducts,
        ]);
    }
}