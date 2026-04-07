<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\ReturnsController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Staff\ProductController as StaffProductController;
use App\Http\Controllers\Staff\CategoryController as StaffCategoryController;
use App\Http\Controllers\Staff\StockMovementController;
use App\Http\Controllers\Admin\EoqController;
use App\Http\Controllers\BarcodeController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Welcome Page
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

/*
|--------------------------------------------------------------------------
| Dashboard Routes
|--------------------------------------------------------------------------
*/
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

/*
|--------------------------------------------------------------------------
| API Routes for Lot Number Generation
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    // Get next auto-generated lot number
    // Optional product_id parameter for per-product lot numbering
    Route::get('/api/next-lot-number', function (\Illuminate\Http\Request $request) {
        $lotService = new \App\Services\InventoryLotService();
        $productId = $request->get('product_id');
        return response()->json([
            'lot_number' => $lotService->getNextLotNumber($productId ? (int) $productId : null)
        ]);
    })->name('api.next-lot-number');
});

/*
|--------------------------------------------------------------------------
| Profile Management Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

/*
|--------------------------------------------------------------------------
| POS Routes
|--------------------------------------------------------------------------
| Point of Sale system routes for staff and admin
*/
Route::middleware(['auth', 'verified', 'role:staff,admin'])->prefix('pos')->name('pos.')->group(function () {
    // POS Main Interface
    Route::get('/', [POSController::class, 'index'])->name('index');
    
    // POS Sales Management
    Route::post('/sales', [POSController::class, 'storeSale'])->name('sales.store');
    Route::get('/sales', [POSController::class, 'salesHistory'])->name('sales.index');
    Route::get('/sales/{id}', [POSController::class, 'showSale'])->name('sales.show');
    
    // Returns/Refunds Management
    Route::prefix('returns')->name('returns.')->group(function () {
        Route::get('/', [ReturnsController::class, 'index'])->name('index');
        Route::post('/search', [ReturnsController::class, 'searchReceipt'])->name('search');
        Route::post('/process', [ReturnsController::class, 'processReturn'])->name('process');
        Route::get('/{id}', [ReturnsController::class, 'show'])->name('show');
        Route::patch('/{id}/approve', [ReturnsController::class, 'approve'])->name('approve');
        Route::patch('/{id}/complete', [ReturnsController::class, 'complete'])->name('complete');
        Route::patch('/{id}/cancel', [ReturnsController::class, 'cancel'])->name('cancel');
        Route::get('/{id}/print', [ReturnsController::class, 'printReceipt'])->name('print');
        
        // API Endpoints for Returns
        Route::prefix('api')->name('api.')->group(function () {
            Route::get('/stats', [ReturnsController::class, 'getStats'])->name('stats');
            Route::get('/recent', [ReturnsController::class, 'getRecentReturns'])->name('recent');
            Route::get('/returnable-receipts', [ReturnsController::class, 'getReturnableReceipts'])->name('returnable-receipts');
            Route::post('/export', [ReturnsController::class, 'export'])->name('export');
            
            // Returned Stock Management API
            Route::prefix('returned-stock')->name('returned-stock.')->group(function () {
                Route::get('/products', [ReturnsController::class, 'getReturnedStockProducts'])->name('products');
                Route::post('/restock/{product}', [ReturnsController::class, 'restockFromReturned'])->name('restock');
                Route::post('/discard/{product}', [ReturnsController::class, 'discardReturnedStock'])->name('discard');
            });
        });
    });
    
    // POS Reports
    Route::get('/reports/daily', [POSController::class, 'dailyReport'])->name('reports.daily');
    Route::get('/reports/summary', [POSController::class, 'summaryReport'])->name('reports.summary');
    
    // POS API Endpoints (for AJAX calls)
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('/products', [POSController::class, 'getProducts'])->name('products');
        Route::get('/products/search', [POSController::class, 'searchProducts'])->name('products.search');
        Route::get('/products/barcode/{barcode}', [POSController::class, 'getProductByBarcode'])->name('products.barcode');
        Route::get('/dashboard-stats', [POSController::class, 'getDashboardStats'])->name('dashboard.stats');
    });
    
    // POS Export/Print Routes
    Route::post('/export/sales', [POSController::class, 'exportSales'])->name('export.sales');
    Route::get('/print/receipt/{saleId}', [POSController::class, 'printReceipt'])->name('print.receipt');
});



/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
| These routes require admin privileges and include full system management
*/
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    
    // Products Management
    Route::get('products/next-sku', [AdminProductController::class, 'getNextSku'])->name('products.next-sku');
    Route::resource('products', AdminProductController::class);
    Route::post('products/{product}/stock', [AdminProductController::class, 'updateStock'])->name('products.stock');
    
    // Categories Management  
    Route::resource('categories', AdminCategoryController::class);
    
    // Users Management
    Route::resource('users', AdminUserController::class);
    Route::patch('users/{user}/toggle-status', [AdminUserController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::post('users/{user}/send-verification-email', [AdminUserController::class, 'sendVerificationEmail'])->name('users.send-verification-email');
    
    // Reports & Analytics
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [App\Http\Controllers\Admin\ReportsController::class, 'index'])->name('index');
        Route::get('/inventory', [App\Http\Controllers\Admin\ReportsController::class, 'inventory'])->name('inventory');
        Route::get('/products', [App\Http\Controllers\Admin\ReportsController::class, 'products'])->name('products');
        Route::get('/stock-movements', [App\Http\Controllers\Admin\ReportsController::class, 'stockMovements'])->name('stock-movements');
        Route::get('/pos-sales', [App\Http\Controllers\Admin\ReportsController::class, 'posSales'])->name('pos-sales');
        Route::get('/export', [App\Http\Controllers\Admin\ReportsController::class, 'export'])->name('export');
    });
    
    // Calculator Helper
    Route::prefix('calculator')->name('calculator.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Calculator/Index');
        })->name('index');
        
        // EOQ Calculation Routes
        Route::post('/save-eoq', [EoqController::class, 'saveEoq'])->name('save-eoq');
        Route::get('/latest-eoq', [EoqController::class, 'getLatestEoq'])->name('latest-eoq');
        Route::get('/products', [EoqController::class, 'getProducts'])->name('products');
        Route::get('/all-products', [EoqController::class, 'getAllProducts'])->name('all-products');
        
        // ROP Calculation Routes
        Route::post('/save-rop', [EoqController::class, 'saveRop'])->name('save-rop');
        Route::get('/product-for-rop', [EoqController::class, 'getProductForRop'])->name('product-for-rop');
        Route::get('/annual-demand-from-eoq', [EoqController::class, 'getAnnualDemandFromEoq'])->name('annual-demand-from-eoq');
        
        // Cost Per Area Calculation Routes
        Route::post('/save-cost-per-area', [EoqController::class, 'saveCostPerArea'])->name('save-cost-per-area');
        Route::get('/cost-per-area-calculations', [EoqController::class, 'getCostPerAreaCalculations'])->name('cost-per-area-calculations');
        Route::get('/cost-per-area-calculation/{id}', [EoqController::class, 'getCostPerAreaCalculation'])->name('cost-per-area-calculation');
        Route::get('/latest-cost-per-area', [EoqController::class, 'getLatestCostPerArea'])->name('latest-cost-per-area');
        Route::get('/cost-per-area-history', [EoqController::class, 'getCostPerAreaHistory'])->name('cost-per-area-history');
        
        // COGS Calculation Routes
        Route::post('/save-cogs', [EoqController::class, 'saveCogs'])->name('save-cogs');
        Route::get('/product-for-cogs', [EoqController::class, 'getProductForCogs'])->name('product-for-cogs');
        Route::get('/cogs-calculations', [EoqController::class, 'getCogsCalculations'])->name('cogs-calculations');
        
        // Average Cost Calculation Routes
        Route::post('/save-average-cost', [EoqController::class, 'saveAverageCost'])->name('save-average-cost');
        Route::get('/product-for-average-cost', [EoqController::class, 'getProductForAverageCost'])->name('product-for-average-cost');
        Route::get('/average-cost-calculations', [EoqController::class, 'getAverageCostCalculations'])->name('average-cost-calculations');
        
        // Storage Cost Calculation Routes
        Route::post('/save-storage-cost', [EoqController::class, 'saveStorageCost'])->name('save-storage-cost');
        Route::get('/product-for-storage-cost', [EoqController::class, 'getProductForStorageCost'])->name('product-for-storage-cost');
        Route::get('/storage-cost-calculations', [EoqController::class, 'getStorageCostCalculations'])->name('storage-cost-calculations');
        Route::get('/latest-storage-cost-data', [EoqController::class, 'getLatestStorageCostData'])->name('latest-storage-cost-data');
    });
    
    // EOQ Dashboard
    Route::get('/eoq-dashboard', [EoqController::class, 'getEoqDashboard'])->name('eoq.dashboard');
    
    // POS Management (Admin only)
    Route::prefix('pos')->name('pos.')->group(function () {
        Route::get('/settings', [POSController::class, 'settings'])->name('settings');
        Route::patch('/settings', [POSController::class, 'updateSettings'])->name('settings.update');
        Route::get('/transactions', [POSController::class, 'allTransactions'])->name('transactions');
        Route::delete('/transactions/{id}', [POSController::class, 'deleteTransaction'])->name('transactions.delete');
    });
    
    // Admin Returns Management (Additional controls for admin)
    Route::prefix('returns')->name('returns.')->group(function () {
        Route::get('/', [ReturnsController::class, 'index'])->name('index');
        Route::post('/search', [ReturnsController::class, 'searchReceipt'])->name('search');
        Route::post('/process', [ReturnsController::class, 'processReturn'])->name('process');
        Route::get('/{id}', [ReturnsController::class, 'show'])->name('show');
        Route::patch('/{id}/approve', [ReturnsController::class, 'approve'])->name('approve');
        Route::patch('/{id}/complete', [ReturnsController::class, 'complete'])->name('complete');
        Route::patch('/{id}/cancel', [ReturnsController::class, 'cancel'])->name('cancel');
        Route::get('/{id}/print', [ReturnsController::class, 'printReceipt'])->name('print');
        Route::patch('/{id}/confirm-warranty-claim', [ReturnsController::class, 'confirmWarrantyClaim'])->name('confirm-warranty-claim');
        Route::get('/pending', function () {
            return app(ReturnsController::class)->index(request()->merge(['status' => 'pending']));
        })->name('pending');
        Route::get('/analytics', function () {
            return Inertia::render('Admin/Returns/Analytics');
        })->name('analytics');
        Route::post('/bulk-approve', function () {
            // Bulk approve logic here
            return response()->json(['success' => true]);
        })->name('bulk-approve');
        
        // Returned Stock Management for Admin
        Route::prefix('returned-stock')->name('returned-stock.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Returns/ReturnedStockManagement');
            })->name('index');
            Route::get('/api/products', [ReturnsController::class, 'getReturnedStockProducts'])->name('api.products');
            Route::post('/api/restock/{product}', [ReturnsController::class, 'restockFromReturned'])->name('api.restock');
            Route::post('/api/discard/{product}', [ReturnsController::class, 'discardReturnedStock'])->name('api.discard');
        });
    });
    
    // Accounts Receivable Management
    Route::prefix('accounts-receivable')->name('accounts-receivable.')->group(function () {
        Route::get('/', [App\Http\Controllers\AccountsReceivableController::class, 'index'])->name('index');
        Route::get('/api/credits', [App\Http\Controllers\AccountsReceivableController::class, 'getCredits'])->name('api.credits');
        Route::get('/api/summary', [App\Http\Controllers\AccountsReceivableController::class, 'getSummary'])->name('api.summary');
        Route::post('/api/credit', [App\Http\Controllers\AccountsReceivableController::class, 'createCredit'])->name('api.credit');
        Route::post('/api/installment', [App\Http\Controllers\AccountsReceivableController::class, 'recordInstallment'])->name('api.installment');
    });
});

/*
|--------------------------------------------------------------------------
| Staff Routes  
|--------------------------------------------------------------------------
| These routes are for staff members with limited but comprehensive access
| to products and inventory management
*/
Route::middleware(['auth', 'verified', 'role:staff,admin'])->prefix('staff')->name('staff.')->group(function () {
    
    // Products Management (Full CRUD)
    Route::resource('products', StaffProductController::class);
    Route::post('products/{product}/stock', [StaffProductController::class, 'updateStock'])->name('products.stock');
    
    // Categories Management (Full CRUD)
    Route::resource('categories', StaffCategoryController::class);
    
    // Stock Movements Management
    Route::resource('stock-movements', StockMovementController::class)->only(['index', 'create', 'store']);
    
    // Barcode Printing
    Route::get('/barcode', [BarcodeController::class, 'index'])->name('barcode.index');
    Route::get('/barcode/api/products', [BarcodeController::class, 'getProducts'])->name('barcode.api.products');
    Route::get('/barcode/api/product/{sku}', [BarcodeController::class, 'getProduct'])->name('barcode.api.product');
    
    // Staff Returns Management (View and process returns)
    Route::prefix('returns')->name('returns.')->group(function () {
        Route::get('/', [ReturnsController::class, 'staffIndex'])->name('index');
        Route::get('/{id}', [ReturnsController::class, 'show'])->name('show');
        Route::patch('/{id}/approve', [ReturnsController::class, 'approve'])->name('approve');
        Route::patch('/{id}/complete', [ReturnsController::class, 'complete'])->name('complete');
        Route::get('/{id}/print', [ReturnsController::class, 'printReceipt'])->name('print');
        Route::patch('/{id}/confirm-warranty-claim', [ReturnsController::class, 'confirmWarrantyClaim'])->name('confirm-warranty-claim');
        
        // Staff can also manage returned stock
        Route::prefix('returned-stock')->name('returned-stock.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Staff/Returns/ReturnedStockManagement');
            })->name('index');
            Route::get('/api/products', [ReturnsController::class, 'getReturnedStockProducts'])->name('api.products');
            Route::post('/api/restock/{product}', [ReturnsController::class, 'restockFromReturned'])->name('api.restock');
            Route::post('/api/discard/{product}', [ReturnsController::class, 'discardReturnedStock'])->name('api.discard');
        });
    });
    
    // Accounts Receivable Management
    Route::prefix('accounts-receivable')->name('accounts-receivable.')->group(function () {
        Route::get('/', [App\Http\Controllers\AccountsReceivableController::class, 'index'])->name('index');
        Route::get('/api/credits', [App\Http\Controllers\AccountsReceivableController::class, 'getCredits'])->name('api.credits');
        Route::get('/api/summary', [App\Http\Controllers\AccountsReceivableController::class, 'getSummary'])->name('api.summary');
        Route::post('/api/credit', [App\Http\Controllers\AccountsReceivableController::class, 'createCredit'])->name('api.credit');
        Route::post('/api/installment', [App\Http\Controllers\AccountsReceivableController::class, 'recordInstallment'])->name('api.installment');
    });
    
    // Calculator Helper (Staff)
    Route::prefix('calculator')->name('calculator.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Staff/Calculator/Index');
        })->name('index');
        
        // EOQ Calculation Routes
        Route::post('/save-eoq', [EoqController::class, 'saveEoq'])->name('save-eoq');
        Route::get('/latest-eoq', [EoqController::class, 'getLatestEoq'])->name('latest-eoq');
        Route::get('/products', [EoqController::class, 'getProducts'])->name('products');
        Route::get('/all-products', [EoqController::class, 'getAllProducts'])->name('all-products');
        
        // ROP Calculation Routes
        Route::post('/save-rop', [EoqController::class, 'saveRop'])->name('save-rop');
        Route::get('/product-for-rop', [EoqController::class, 'getProductForRop'])->name('product-for-rop');
        Route::get('/annual-demand-from-eoq', [EoqController::class, 'getAnnualDemandFromEoq'])->name('annual-demand-from-eoq');
        
        // Cost Per Area Calculation Routes
        Route::post('/save-cost-per-area', [EoqController::class, 'saveCostPerArea'])->name('save-cost-per-area');
        Route::get('/cost-per-area-calculations', [EoqController::class, 'getCostPerAreaCalculations'])->name('cost-per-area-calculations');
        Route::get('/cost-per-area-calculation/{id}', [EoqController::class, 'getCostPerAreaCalculation'])->name('cost-per-area-calculation');
        Route::get('/latest-cost-per-area', [EoqController::class, 'getLatestCostPerArea'])->name('latest-cost-per-area');
        Route::get('/cost-per-area-history', [EoqController::class, 'getCostPerAreaHistory'])->name('cost-per-area-history');
        
        // COGS Calculation Routes
        Route::post('/save-cogs', [EoqController::class, 'saveCogs'])->name('save-cogs');
        Route::get('/product-for-cogs', [EoqController::class, 'getProductForCogs'])->name('product-for-cogs');
        Route::get('/cogs-calculations', [EoqController::class, 'getCogsCalculations'])->name('cogs-calculations');
        
        // Average Cost Calculation Routes
        Route::post('/save-average-cost', [EoqController::class, 'saveAverageCost'])->name('save-average-cost');
        Route::get('/product-for-average-cost', [EoqController::class, 'getProductForAverageCost'])->name('product-for-average-cost');
        Route::get('/average-cost-calculations', [EoqController::class, 'getAverageCostCalculations'])->name('average-cost-calculations');
        
        // Storage Cost Calculation Routes
        Route::post('/save-storage-cost', [EoqController::class, 'saveStorageCost'])->name('save-storage-cost');
        Route::get('/product-for-storage-cost', [EoqController::class, 'getProductForStorageCost'])->name('product-for-storage-cost');
        Route::get('/storage-cost-calculations', [EoqController::class, 'getStorageCostCalculations'])->name('storage-cost-calculations');
        Route::get('/latest-storage-cost-data', [EoqController::class, 'getLatestStorageCostData'])->name('latest-storage-cost-data');
    });
});

/*
|--------------------------------------------------------------------------
| API Routes (for mobile app or external integration)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:staff,admin'])->prefix('api/v1')->name('api.v1.')->group(function () {
    
    // POS API
    Route::prefix('pos')->name('pos.')->group(function () {
        Route::get('/products', [POSController::class, 'getProducts']);
        Route::get('/products/search', [POSController::class, 'searchProducts']);
        Route::get('/products/barcode/{barcode}', [POSController::class, 'getProductByBarcode']);
        Route::post('/sales', [POSController::class, 'storeSale']);
        Route::get('/dashboard-stats', [POSController::class, 'getDashboardStats']);
    });
    
    // Returns API
    Route::prefix('returns')->name('returns.')->group(function () {
        Route::get('/', [ReturnsController::class, 'index']);
        Route::post('/search', [ReturnsController::class, 'searchReceipt']);
        Route::post('/process', [ReturnsController::class, 'processReturn']);
        Route::get('/stats', [ReturnsController::class, 'getStats']);
        Route::get('/returnable-receipts', [ReturnsController::class, 'getReturnableReceipts']);
    });
});

/*
|--------------------------------------------------------------------------
| Public API Routes (no authentication required)
|--------------------------------------------------------------------------
*/
Route::prefix('api/public')->name('api.public.')->group(function () {
    Route::get('/store-info', function () {
        return response()->json([
            'name' => config('pos.store_info.name', 'สมบัติเกษตรยนต์'),
            'address' => config('pos.store_info.address', '207 หมู่ 15 ต.เชียงดาว อ.เชียงดาว จ.เชียงใหม่'),
            'phone' => config('pos.store_info.phone', '089-560-8118'),
            'business_hours' => config('pos.store_info.business_hours', '08:00 - 18:00'),
        ]);
    })->name('store-info');
    
    Route::get('/categories', function () {
        return response()->json(
            \App\Models\Category::active()
                ->select('id', 'name', 'description')
                ->get()
        );
    })->name('categories');
});

/*
|--------------------------------------------------------------------------
| Webhook Routes (for payment integrations, etc.)
|--------------------------------------------------------------------------
*/
Route::prefix('webhooks')->name('webhooks.')->group(function () {
    Route::post('/payment/promptpay', function (Request $request) {
        // Handle PromptPay payment webhook
        Log::info('PromptPay Webhook', $request->all());
        return response()->json(['status' => 'received']);
    })->name('payment.promptpay');
    
    Route::post('/payment/card', function (Request $request) {
        // Handle credit card payment webhook
        Log::info('Card Payment Webhook', $request->all());
        return response()->json(['status' => 'received']);
    })->name('payment.card');
});

/*
|--------------------------------------------------------------------------
| Development Routes (only in local environment)
|--------------------------------------------------------------------------
*/
if (app()->environment('local')) {
    Route::prefix('dev')->name('dev.')->group(function () {
        // Generate test data
        Route::get('/generate-test-sales', function () {
            // Generate test sales data for development
            return response()->json(['message' => 'Test data generated']);
        })->name('generate-test-sales');
        
        // Clear all caches
        Route::get('/clear-cache', function () {
            Cache::flush();
            return response()->json(['message' => 'Cache cleared']);
        })->name('clear-cache');
        
        // View all routes
        Route::get('/routes', function () {
            $routes = collect(Route::getRoutes())->map(function ($route) {
                return [
                    'method' => implode('|', $route->methods()),
                    'uri' => $route->uri(),
                    'name' => $route->getName(),
                    'action' => $route->getActionName(),
                ];
            });
            
            return response()->json($routes);
        })->name('routes');
    });
}

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
require __DIR__.'/auth.php';

/*
|--------------------------------------------------------------------------
| CSRF Token Route
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->get('/csrf-token', function () {
    return response()->json([
        'csrf_token' => csrf_token()
    ]);
})->name('get-csrf-token');