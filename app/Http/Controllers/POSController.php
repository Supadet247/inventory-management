<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\StockMovement;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use App\Models\CustomerCredit;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class POSController extends Controller
{
    /**
     * Display the POS interface
     */
    public function index(Request $request)
    {
        $todaysSales = Sale::whereDate('sale_date', today())
            ->sum('grand_total');
            
        $todaysTransactions = Sale::whereDate('sale_date', today())
            ->count();
        $productsQuery = Product::with('category')
            ->where('is_active', true)
            ->select([
                'id', 
                'name', 
                'sku', 
                'price', 
                'quantity', 
                'image',
                'category_id',
                'min_stock'
            ]);


        if ($request->category_filter) {
            $productsQuery->where('category_id', $request->category_filter);
        }


        if ($request->search) {
            $productsQuery->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%");
            });
        }


        if ($request->stock_filter === 'low') {
            $productsQuery->whereColumn('quantity', '<=', 'min_stock');
        } elseif ($request->stock_filter === 'out') {
            $productsQuery->where('quantity', 0);
        } elseif ($request->stock_filter === 'available') {
            $productsQuery->where('quantity', '>', 0);
        }

        $products = $productsQuery->get()->map(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'price' => (float) $product->price,
                'quantity' => $product->quantity,
                'min_stock' => $product->min_stock,
                'image_url' => $product->image_url,
                'category' => $product->category->name ?? 'ไม่ระบุ',
                'category_id' => $product->category_id,
                'unit' => 'ชิ้น',
                'stock_status' => $product->stock_status,
                'is_low_stock' => $product->isLowStock(),
            ];
        });

        // ดึงหมวดหมู่ทั้งหมด
        $categories = Category::active()->get();

        // ดึงสินค้าที่ขายดี (Top 10)
        $topSellingProducts = $this->getTopSellingProducts(10);

        // ดึงสต็อกต่ำ
        $lowStockProducts = Product::whereColumn('quantity', '<=', 'min_stock')
            ->where('quantity', '>', 0)
            ->take(5)
            ->get();

        // ดึงรายการคืนสินค้าล่าสุด (50 รายการสำหรับ pagination)
        $recentReturns = \App\Models\ReturnModel::with([
                'originalReceipt',
                'user',
                'returnItems.receiptItem.product'
            ])
            ->orderBy('returned_at', 'desc')
            ->limit(50)
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

        return Inertia::render('POS/Index', [
            'products' => $products,
            'categories' => $categories,
            'dashboard_stats' => [
                'todays_sales' => $todaysSales,
                'todays_transactions' => $todaysTransactions,
                'total_products' => $products->count(),
                'low_stock_count' => $lowStockProducts->count(),
            ],
            'top_selling_products' => $topSellingProducts,
            'low_stock_products' => $lowStockProducts,
            'recent_returns' => $recentReturns,
            'filters' => $request->only(['category_filter', 'search', 'stock_filter']),
            'pos_settings' => $this->getPosSettings(),
        ]);
    }

    /**
     * Store a new sale and create receipt
     * ✅ อัปเดตให้สร้าง Receipt พร้อมกับ Sale
     */
    public function storeSale(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:cash,creditcard,promptpay,mixed,installment',
            'received_amount' => 'nullable',
            'customer_info' => 'nullable|array',
            'customer_info.name' => 'nullable|string|max:255',
            'customer_info.phone' => 'nullable|string|max:20',
            'customer_info.tax_id' => 'nullable|string|max:20',
            'customer_info.email' => 'nullable|email|max:255',
            'notes' => 'nullable|string|max:1000',
            // Installment fields
            'installment_data' => 'nullable|array',
            'installment_data.customerName' => 'nullable|string|max:100',
            'installment_data.customerPhone' => 'nullable|string|size:10',
            'installment_data.idCardNumber' => 'nullable|string|max:20',
            'installment_data.downPaymentPercent' => 'nullable|numeric|min:30|max:50',
            'installment_data.installmentCount' => 'nullable|integer|min:1|max:5',
            'installment_data.installmentAmount' => 'nullable|numeric|min:0',
            'installment_data.installmentStartDate' => 'nullable|date',
        ]);

        try {
            DB::beginTransaction();

            // คำนวณภาษี
            $taxRate = config('pos.tax_rate', 7) / 100;
            $fullTotal = $request->total;
            $fullTax = $request->total * $taxRate;
            $fullGrandTotal = $fullTotal + $fullTax;

            // กำหนดค่าเริ่มต้นสำหรับ Sale record
            $saleTotalAmount = $request->total;
            $saleTaxAmount = $fullTax;
            $saleGrandTotal = $fullGrandTotal;
            $receivedAmountForStorage = $request->received_amount;
            $changeAmount = 0;

            // ปรับยอดขายตามประเภทการชำระเงิน (กรณีผ่อนชำระ)
            if ($request->payment_method === 'installment' && $request->installment_data) {
                $downPaymentPercent = $request->installment_data['downPaymentPercent'] ?? 30;
                $saleGrandTotal = $fullGrandTotal * ($downPaymentPercent / 100);
                $saleTotalAmount = $saleGrandTotal / (1 + $taxRate);
                $saleTaxAmount = $saleGrandTotal - $saleTotalAmount;
                $receivedAmountForStorage = $saleGrandTotal;
            } else {
                // คำนวณเงินทอนสำหรับกรณีทั่วไป
                if ($request->payment_method === 'cash' && $request->received_amount) {
                    $changeAmount = $request->received_amount - $fullGrandTotal;
                } elseif ($request->payment_method === 'mixed' && isset($request->received_amount['total'])) {
                    $changeAmount = $request->received_amount['total'] - $fullGrandTotal;
                }
            }

            // สร้างรายการขาย (Sale) - จะบันทึกเฉพาะยอดที่ได้รับจริง
            $sale = Sale::create([
                'user_id' => auth()->id(),
                'total_amount' => $saleTotalAmount,
                'tax_amount' => $saleTaxAmount,
                'grand_total' => $saleGrandTotal,
                'payment_method' => $request->payment_method,
                'received_amount' => $receivedAmountForStorage,
                'change_amount' => $changeAmount,
                'sale_date' => now(),
                'notes' => $request->payment_method === 'installment' ? 'เงินดาวน์สินค้า (ผ่อนชำระ)' : ($request->notes ?? 'POS Sale'),
            ]);

            // สร้างใบเสร็จ (Receipt) - ระบบจะสร้าง receipt_number อัตโนมัติ
            $receipt = Receipt::create([
                'sale_id' => $sale->id,
                'user_id' => auth()->id(),
                'customer_name' => $request->customer_info['name'] ?? null,
                'customer_phone' => $request->customer_info['phone'] ?? null,
                'customer_tax_id' => $request->customer_info['tax_id'] ?? null,
                'total_amount' => $saleTotalAmount,
                'tax_amount' => $saleTaxAmount,
                'grand_total' => $saleGrandTotal,
                'payment_method' => $request->payment_method,
                'received_amount' => $receivedAmountForStorage,
                'change_amount' => $changeAmount,
                'receipt_type' => 'sale',
                'status' => 'active',
                'issued_at' => now(),
                'notes' => $sale->notes,
            ]);

            // จัดการการผ่อนชำระ (CustomerCredit)
            if ($request->payment_method === 'installment' && $request->installment_data) {
                $downPaymentPercent = $request->installment_data['downPaymentPercent'] ?? 30;
                $installmentCount = $request->installment_data['installmentCount'] ?? 3;
                $downPaymentAmount = $saleGrandTotal;
                $remainingAmount = $fullGrandTotal - $downPaymentAmount;
                
                // คำนวณดอกเบี้ยตามอัตราที่กำหนด
                $interestRate = 0;
                $totalInterestPercent = 0;
                
                // 50% = 0% interest always
                if ($downPaymentPercent >= 50) {
                    $interestRate = 0;
                    $totalInterestPercent = 0;
                }
                // 45% = 0% for 1-2 installments, 1% for months 3-5
                elseif ($downPaymentPercent == 45) {
                    if ($installmentCount <= 2) {
                        $interestRate = 0;
                        $totalInterestPercent = 0;
                    } else {
                        $interestMonths = $installmentCount - 2;
                        $interestRate = 1;
                        $totalInterestPercent = $interestRate * $interestMonths;
                    }
                }
                // 40% = 0% for 1 installment, 1.5% for months 2-5
                elseif ($downPaymentPercent == 40) {
                    if ($installmentCount == 1) {
                        $interestRate = 0;
                        $totalInterestPercent = 0;
                    } else {
                        $interestMonths = $installmentCount - 1;
                        $interestRate = 1.5;
                        $totalInterestPercent = $interestRate * $interestMonths;
                    }
                }
                // 35% = 0% for 1 installment, 1.75% for months 2-5
                elseif ($downPaymentPercent == 35) {
                    if ($installmentCount == 1) {
                        $interestRate = 0;
                        $totalInterestPercent = 0;
                    } else {
                        $interestMonths = $installmentCount - 1;
                        $interestRate = 1.75;
                        $totalInterestPercent = $interestRate * $interestMonths;
                    }
                }
                // 30% = 0% for 1 installment, 2% for months 2-5
                elseif ($downPaymentPercent == 30) {
                    if ($installmentCount == 1) {
                        $interestRate = 0;
                        $totalInterestPercent = 0;
                    } else {
                        $interestMonths = $installmentCount - 1;
                        $interestRate = 2;
                        $totalInterestPercent = $interestRate * $interestMonths;
                    }
                }
                
                // คำนวณยอดรวมดอกเบี้ยและงวดละ
                $totalWithInterest = $remainingAmount * (1 + $totalInterestPercent / 100);
                $interestAmount = $totalWithInterest - $remainingAmount;
                $installmentAmount = $totalWithInterest / $installmentCount;
                
                // สร้าง CustomerCredit สำหรับการผ่อนชำระ
                // total_amount ควรเป็นยอดรวมทั้งหมด (ดาวน์ + ยอดผ่อนรวมดอกเบี้ย)
                $finalTotalWithInterest = $totalWithInterest + $downPaymentAmount;

                $installmentCredit = CustomerCredit::create([
                    'receipt_id' => $receipt->id,
                    'customer_name' => $request->installment_data['customerName'],
                    'customer_phone' => $request->installment_data['customerPhone'],
                    'id_card_number' => $request->installment_data['idCardNumber'] ?? null,
                    'total_amount' => round($finalTotalWithInterest, 2),
                    'down_payment_percent' => $downPaymentPercent,
                    'installment_count' => $installmentCount,
                    'installment_amount' => round($installmentAmount, 2),
                    'installment_start_date' => $request->installment_data['installmentStartDate'],
                    'paid_amount' => round($downPaymentAmount, 2),
                    'paid_installments' => 0,
                    'status' => 'active',
                    'note' => "POS Sale #{$sale->id} - Receipt: {$receipt->receipt_number}",
                ]);
                
                // อัปเดต receipt เพื่อเก็บ credit_id
                $receipt->update(['customer_name' => $request->installment_data['customerName']]);
                
                Log::info('Installment Credit Created', [
                    'credit_id' => $installmentCredit->id,
                    'customer_name' => $installmentCredit->customer_name,
                    'total_amount' => round($finalTotalWithInterest, 2),
                    'down_payment' => $downPaymentAmount,
                    'installment_amount' => $installmentAmount,
                    'interest_rate' => $interestRate,
                    'total_interest_percent' => $totalInterestPercent,
                    'interest_amount' => $interestAmount,
                ]);
            }

            $totalItemsProcessed = 0;

            // ตรวจสอบสต็อกและอัปเดต
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);
                
                // ตรวจสอบสต็อกเพียงพอ
                if ($product->quantity < $item['quantity']) {
                    throw new \Exception("สินค้า {$product->name} มีสต็อกไม่เพียงพอ (คงเหลือ: {$product->quantity})");
                }

                // สร้างรายการสินค้าในใบขาย
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'],
                    'total_price' => $item['quantity'] * $item['price'],
                ]);

                // สร้างรายการสินค้าในใบเสร็จ
                ReceiptItem::create([
                    'receipt_id' => $receipt->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'],
                    'total_price' => $item['quantity'] * $item['price'],
                    'unit' => 'ชิ้น',
                    'returned_quantity' => 0,
                ]);

                // อัปเดตสต็อก
                $oldQuantity = $product->quantity;
                $newQuantity = $oldQuantity - $item['quantity'];
                
                $product->update(['quantity' => $newQuantity]);

                // อัปเดต stock_lot_instances (FIFO - ลดจาก lot เก่าที่สุด)
                $remainingQtyToDeduct = $item['quantity'];
                $activeLots = $product->stockLotInstances()
                    ->where('quantity', '>', 0)
                    ->orderBy('created_at', 'asc')
                    ->get();

                foreach ($activeLots as $lot) {
                    if ($remainingQtyToDeduct <= 0) break;
                    
                    $deductFromThisLot = min($lot->quantity, $remainingQtyToDeduct);
                    $lot->update([
                        'quantity' => $lot->quantity - $deductFromThisLot
                    ]);
                    $remainingQtyToDeduct -= $deductFromThisLot;
                }

                // บันทึก Stock Movement
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => auth()->id(),
                    'type' => 'out',
                    'quantity' => $item['quantity'],
                    'previous_quantity' => $oldQuantity,
                    'new_quantity' => $newQuantity,
                    'notes' => "POS Sale #{$sale->id} - Receipt: {$receipt->receipt_number}",
                ]);

                $totalItemsProcessed += $item['quantity'];
            }

            // Log การขาย
            Log::info('POS Sale Completed', [
                'sale_id' => $sale->id,
                'receipt_id' => $receipt->id,
                'receipt_number' => $receipt->receipt_number,
                'user_id' => auth()->id(),
                'total_amount' => $saleGrandTotal,
                'items_count' => count($request->items),
                'total_items' => $totalItemsProcessed,
                'payment_method' => $request->payment_method,
            ]);

            // Clear product cache
            Cache::tags(['products'])->flush();

            DB::commit();

            // ส่งข้อมูลใบเสร็จกลับไป
            return redirect()->back()->with([
                'sale_success' => true,
                'sale_data' => [
                    'sale_id' => $sale->id,
                    'receipt_id' => $receipt->id,
                    'receipt_number' => $receipt->receipt_number,
                    'transaction_number' => $sale->transaction_number,
                    'grand_total' => $saleGrandTotal,
                    'change_amount' => $changeAmount,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            
            Log::error('POS Sale Failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'items' => $request->items,
            ]);
            
            return redirect()->back()->withErrors([
                'sale_error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get products for API calls (with caching)
     */
    public function getProducts(Request $request)
    {
        $cacheKey = 'pos_products_' . md5(serialize($request->all()));
        
        $products = Cache::tags(['products'])->remember($cacheKey, 300, function () use ($request) {
            $query = Product::with('category')
                ->where('is_active', true);

            // Only show products with stock if required
            if ($request->in_stock_only !== 'false') {
                $query->where('quantity', '>', 0);
            }

            return $query->select([
                'id', 
                'name', 
                'sku', 
                'price', 
                'quantity', 
                'image',
                'category_id',
                'min_stock'
            ])
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'price' => (float) $product->price,
                    'quantity' => $product->quantity,
                    'image_url' => $product->image_url,
                    'category' => $product->category->name ?? 'ไม่ระบุ',
                    'unit' => 'ชิ้น',
                    'is_low_stock' => $product->isLowStock(),
                ];
            });
        });

        return response()->json($products);
    }

    /**
     * Search products with advanced filtering
     */
    public function searchProducts(Request $request)
    {
        $query = $request->get('q', '');
        $category = $request->get('category');
        $priceMin = $request->get('price_min');
        $priceMax = $request->get('price_max');
        
        $productsQuery = Product::with('category')
            ->where('is_active', true)
            ->where('quantity', '>', 0);

        // Search by name or SKU
        if ($query) {
            $productsQuery->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('sku', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            });
        }

        if ($category) {
            $productsQuery->where('category_id', $category);
        }

        if ($priceMin) {
            $productsQuery->where('price', '>=', $priceMin);
        }
        if ($priceMax) {
            $productsQuery->where('price', '<=', $priceMax);
        }

        $products = $productsQuery
            ->limit(50)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'price' => (float) $product->price,
                    'quantity' => $product->quantity,
                    'image_url' => $product->image_url,
                    'category' => $product->category->name ?? 'ไม่ระบุ',
                    'unit' => 'ชิ้น',
                    'description' => $product->description,
                ];
            });

        return response()->json([
            'success' => true,
            'products' => $products,
            'total' => $products->count(),
        ]);
    }

    /**
     * Get product by barcode with enhanced error handling
     */
    public function getProductByBarcode($barcode)
    {
        try {
            $product = Product::with('category')
                ->where('is_active', true)
                ->where('sku', $barcode)
                ->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบสินค้าที่มีรหัส: ' . $barcode,
                    'suggestions' => $this->getSimilarProducts($barcode),
                ], 404);
            }

            if ($product->quantity <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => "สินค้า {$product->name} หมดสต็อก",
                    'product' => [
                        'id' => $product->id,
                        'name' => $product->name,
                        'quantity' => $product->quantity,
                    ],
                ], 400);
            }

            // Log barcode scan
            Log::info('Barcode Scanned', [
                'barcode' => $barcode,
                'product_id' => $product->id,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'price' => (float) $product->price,
                    'quantity' => $product->quantity,
                    'image_url' => $product->image_url,
                    'category' => $product->category->name ?? 'ไม่ระบุ',
                    'unit' => 'ชิ้น',
                    'is_low_stock' => $product->isLowStock(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Barcode Scan Error', [
                'barcode' => $barcode,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการค้นหาสินค้า',
            ], 500);
        }
    }

    /**
     * Sales history with advanced filtering
     */
    public function salesHistory(Request $request)
    {
        $query = Sale::with(['user', 'saleItems.product', 'receipt'])
            ->orderBy('created_at', 'desc');

        // Date range filter
        if ($request->date_from) {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }
        
        if ($request->date_to) {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        // Payment method filter
        if ($request->payment_method) {
            $query->where('payment_method', $request->payment_method);
        }

        // User filter
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Amount range filter
        if ($request->amount_min) {
            $query->where('grand_total', '>=', $request->amount_min);
        }
        if ($request->amount_max) {
            $query->where('grand_total', '<=', $request->amount_max);
        }

        // Receipt number search
        if ($request->receipt_number) {
            $query->whereHas('receipt', function($q) use ($request) {
                $q->where('receipt_number', 'like', '%' . $request->receipt_number . '%');
            });
        }

        $sales = $query->paginate(20);

        // Calculate summary stats - สร้าง query ใหม่โดยไม่มี orderBy และ pagination
        $summaryQuery = Sale::query();
        
        // ใช้เงื่อนไขเดียวกับ $query
        if ($request->date_from) {
            $summaryQuery->whereDate('sale_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $summaryQuery->whereDate('sale_date', '<=', $request->date_to);
        }
        if ($request->payment_method) {
            $summaryQuery->where('payment_method', $request->payment_method);
        }
        if ($request->user_id) {
            $summaryQuery->where('user_id', $request->user_id);
        }
        if ($request->amount_min) {
            $summaryQuery->where('grand_total', '>=', $request->amount_min);
        }
        if ($request->amount_max) {
            $summaryQuery->where('grand_total', '<=', $request->amount_max);
        }
        
        $summaryStats = $summaryQuery->selectRaw('
            COUNT(*) as total_transactions,
            SUM(grand_total) as total_amount,
            AVG(grand_total) as average_amount,
            SUM(tax_amount) as total_tax
        ')->first();

        // ถ้าเป็น API call (เช่น fetch จาก POS) ให้คืน JSON
        if ($request->wantsJson() || $request->expectsJson()) {
            return response()->json([
                'sales' => $sales,
                'summary_stats' => $summaryStats,
                'users' => User::select('id', 'name')->get(),
                'filters' => $request->only([
                    'date_from', 'date_to', 'payment_method', 
                    'user_id', 'amount_min', 'amount_max'
                ])
            ]);
        }

        return Inertia::render('POS/SalesHistory', [
            'sales' => $sales,
            'summary_stats' => $summaryStats,
            'users' => User::select('id', 'name')->get(),
            'filters' => $request->only([
                'date_from', 'date_to', 'payment_method', 
                'user_id', 'amount_min', 'amount_max'
            ])
        ]);
    }

    /**
     * Show specific sale with full details
     */
    public function showSale($id)
    {
        $sale = Sale::with(['user', 'saleItems.product.category', 'receipt'])->findOrFail($id);

        // Add customer info if exists
        $customerInfo = null;
        if ($sale->customer_info) {
            $customerInfo = json_decode($sale->customer_info, true);
        }

        return Inertia::render('POS/SaleDetail', [
            'sale' => $sale,
            'customer_info' => $customerInfo,
            'can_return' => $this->canReturnSale($sale),
        ]);
    }

    /**
     * Daily report with detailed breakdown
     */
    public function dailyReport(Request $request)
    {
        $date = $request->get('date', today()->format('Y-m-d'));
        
        $sales = Sale::whereDate('sale_date', $date)
            ->with(['saleItems.product', 'user', 'receipt'])
            ->get();

        // Hourly breakdown
        $hourlyBreakdown = $sales->groupBy(function($sale) {
            return $sale->created_at->format('H');
        })->map(function($hourlySales, $hour) {
            return [
                'hour' => $hour . ':00',
                'sales_count' => $hourlySales->count(),
                'total_amount' => $hourlySales->sum('grand_total'),
            ];
        })->sortBy('hour');

        // Top products for the day
        $topProducts = $sales->flatMap->saleItems
            ->groupBy('product_id')
            ->map(function($items) {
                $product = $items->first()->product;
                return [
                    'product_name' => $product->name,
                    'quantity_sold' => $items->sum('quantity'),
                    'total_revenue' => $items->sum('total_price'),
                ];
            })
            ->sortByDesc('quantity_sold')
            ->take(10);

        // Payment method breakdown
        $paymentBreakdown = $sales->groupBy('payment_method')
            ->map(function($methodSales, $method) {
                return [
                    'method' => $method,
                    'count' => $methodSales->count(),
                    'total' => $methodSales->sum('grand_total'),
                ];
            });

        $summary = [
            'total_sales' => $sales->count(),
            'total_amount' => $sales->sum('total_amount'),
            'total_tax' => $sales->sum('tax_amount'),
            'grand_total' => $sales->sum('grand_total'),
            'average_sale' => $sales->count() > 0 ? $sales->sum('grand_total') / $sales->count() : 0,
            'cash_sales' => $sales->where('payment_method', 'cash')->sum('grand_total'),
            'card_sales' => $sales->where('payment_method', 'creditcard')->sum('grand_total'),
            'promptpay_sales' => $sales->where('payment_method', 'promptpay')->sum('grand_total'),
        ];

        return Inertia::render('POS/DailyReport', [
            'date' => $date,
            'sales' => $sales,
            'summary' => $summary,
            'hourly_breakdown' => $hourlyBreakdown,
            'top_products' => $topProducts,
            'payment_breakdown' => $paymentBreakdown,
        ]);
    }

    /**
     * Summary report with trends and analytics
     */
    public function summaryReport(Request $request)
    {
        $dateFrom = $request->get('date_from', today()->subDays(30)->format('Y-m-d'));
        $dateTo = $request->get('date_to', today()->format('Y-m-d'));

        $sales = Sale::whereBetween('sale_date', [$dateFrom, $dateTo])
            ->with(['saleItems.product', 'receipt'])
            ->get();

        // Daily breakdown with trends
        $dailyBreakdown = $sales->groupBy(function($sale) {
            return $sale->sale_date->format('Y-m-d');
        })->map(function($daySales, $date) {
            return [
                'date' => $date,
                'total_sales' => $daySales->count(),
                'total_amount' => $daySales->sum('grand_total'),
                'average_sale' => $daySales->count() > 0 ? $daySales->sum('grand_total') / $daySales->count() : 0,
            ];
        })->sortBy('date');

        // Top selling products with trends
        $topProducts = $sales->flatMap->saleItems
            ->groupBy('product_id')
            ->map(function($items) {
                $product = $items->first()->product;
                return [
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity_sold' => $items->sum('quantity'),
                    'total_revenue' => $items->sum('total_price'),
                    'average_price' => $items->avg('unit_price'),
                    'profit_margin' => 0, // Can be calculated if cost price is available
                ];
            })
            ->sortByDesc('total_revenue')
            ->take(20);

        // Category performance
        $categoryPerformance = $sales->flatMap->saleItems
            ->groupBy('product.category.name')
            ->map(function($items, $categoryName) {
                return [
                    'category' => $categoryName ?? 'ไม่ระบุ',
                    'quantity_sold' => $items->sum('quantity'),
                    'total_revenue' => $items->sum('total_price'),
                    'unique_products' => $items->groupBy('product_id')->count(),
                ];
            })
            ->sortByDesc('total_revenue');

        $summary = [
            'total_sales' => $sales->count(),
            'total_amount' => $sales->sum('total_amount'),
            'total_tax' => $sales->sum('tax_amount'),
            'grand_total' => $sales->sum('grand_total'),
            'average_sale' => $sales->count() > 0 ? $sales->sum('grand_total') / $sales->count() : 0,
            'total_items_sold' => $sales->flatMap->saleItems->sum('quantity'),
            'unique_customers' => $sales->where('customer_info', '!=', null)->count(),
        ];

        // Compare with previous period
        $previousPeriodStart = Carbon::parse($dateFrom)->subDays(
            Carbon::parse($dateTo)->diffInDays(Carbon::parse($dateFrom))
        );
        $previousSales = Sale::whereBetween('sale_date', [$previousPeriodStart, $dateFrom])
            ->get();

        $comparison = [
            'sales_growth' => $this->calculateGrowth(
                $previousSales->sum('grand_total'), 
                $sales->sum('grand_total')
            ),
            'transaction_growth' => $this->calculateGrowth(
                $previousSales->count(), 
                $sales->count()
            ),
        ];

        return Inertia::render('POS/SummaryReport', [
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => $summary,
            'comparison' => $comparison,
            'daily_breakdown' => $dailyBreakdown,
            'top_products' => $topProducts,
            'category_performance' => $categoryPerformance,
        ]);
    }

    /**
     * Get dashboard statistics
     */
    public function getDashboardStats()
    {
        $today = today();
        $thisWeek = [now()->startOfWeek(), now()->endOfWeek()];
        $thisMonth = [now()->startOfMonth(), now()->endOfMonth()];

        $stats = [
            'today' => [
                'sales' => Sale::whereDate('sale_date', $today)->sum('grand_total'),
                'transactions' => Sale::whereDate('sale_date', $today)->count(),
                'items_sold' => Sale::whereDate('sale_date', $today)
                    ->with('saleItems')
                    ->get()
                    ->flatMap->saleItems
                    ->sum('quantity'),
            ],
            'this_week' => [
                'sales' => Sale::whereBetween('sale_date', $thisWeek)->sum('grand_total'),
                'transactions' => Sale::whereBetween('sale_date', $thisWeek)->count(),
            ],
            'this_month' => [
                'sales' => Sale::whereBetween('sale_date', $thisMonth)->sum('grand_total'),
                'transactions' => Sale::whereBetween('sale_date', $thisMonth)->count(),
            ],
        ];

        return response()->json($stats);
    }

    /**
     * Print receipt
     */
    public function printReceipt($saleId)
    {
        $sale = Sale::with(['saleItems.product', 'user', 'receipt'])->findOrFail($saleId);
        
        return Inertia::render('POS/PrintReceipt', [
            'sale' => $sale,
            'receipt' => $sale->receipt,
            'store_info' => config('pos.store_info'),
        ]);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Get POS settings
     */
    private function getPosSettings()
    {
        return Cache::tags(['pos_settings'])->remember('pos_settings', 3600, function () {
            return [
                'tax_rate' => config('pos.tax_rate', 7),
                'receipt_footer' => config('pos.receipt_footer', 'ขอบคุณที่ใช้บริการ'),
                'auto_print' => config('pos.auto_print', false),
                'default_payment_method' => config('pos.default_payment_method', 'cash'),
                'store_info' => config('pos.store_info'),
                'payment_methods' => config('pos.payment_methods'),
                'security' => config('pos.security'),
                'display' => config('pos.display'),
                'returns' => config('pos.returns', [
                    'max_days' => 7,
                    'auto_approve' => true,
                ]),
            ];
        });
    }

    /**
     * Get top selling products
     */
    private function getTopSellingProducts($limit = 10)
    {
        $dateFrom = now()->subDays(30); // Last 30 days
        
        return Sale::join('sale_items', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.sale_date', '>=', $dateFrom)
            ->selectRaw('
                products.id,
                products.name,
                products.sku,
                products.price,
                SUM(sale_items.quantity) as total_sold,
                SUM(sale_items.total_price) as total_revenue
            ')
            ->groupBy('products.id', 'products.name', 'products.sku', 'products.price')
            ->orderByDesc('total_sold')
            ->limit($limit)
            ->get();
    }

    /**
     * Get similar products for barcode suggestions
     */
    private function getSimilarProducts($barcode, $limit = 5)
    {
        return Product::where('is_active', true)
            ->where('quantity', '>', 0)
            ->where('sku', 'like', "%{$barcode}%")
            ->limit($limit)
            ->get(['id', 'name', 'sku', 'price']);
    }

    /**
     * Check if a sale can be returned
     */
    private function canReturnSale($sale)
    {
        if (!$sale->receipt) {
            return false;
        }
        
        return $sale->receipt->canBeReturned();
    }

    /**
     * Calculate growth percentage
     */
    private function calculateGrowth($previous, $current)
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }
        
        return round((($current - $previous) / $previous) * 100, 2);
    }

    /**
     * Export sales data
     */
    public function exportSales(Request $request)
    {
        $request->validate([
            'format' => 'required|in:csv,excel,pdf',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        try {
            $sales = Sale::with(['user', 'saleItems.product', 'receipt'])
                ->whereBetween('sale_date', [$request->date_from, $request->date_to])
                ->get();

            // Export logic would go here
            // For now, just return success
            
            return response()->json([
                'success' => true,
                'message' => 'กำลังเตรียมไฟล์ส่งออก...',
                'download_url' => '#', // URL to download file
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ==================== ADMIN ROUTES ====================

    /**
     * POS Settings (Admin only)
     */
    public function settings()
    {
        $settings = $this->getPosSettings();

        return Inertia::render('Admin/POS/Settings', [
            'settings' => $settings,
            'categories' => Category::active()->get(),
            'users' => User::select('id', 'name', 'role')->get(),
        ]);
    }

    /**
     * Update POS Settings (Admin only)
     */
    public function updateSettings(Request $request)
    {
        $request->validate([
            'tax_rate' => 'required|numeric|min:0|max:100',
            'receipt_footer' => 'nullable|string|max:255',
            'auto_print' => 'boolean',
            'default_payment_method' => 'required|in:cash,creditcard,promptpay',
            'allow_negative_stock' => 'boolean',
            'require_customer_info' => 'boolean',
            'max_discount_percent' => 'required|numeric|min:0|max:100',
            'session_timeout' => 'required|integer|min:300|max:86400',
            'returns.max_days' => 'required|integer|min:1|max:365',
            'returns.auto_approve' => 'boolean',
        ]);

        // Update config values (in a real app, you might save to database)
        // For now, we'll just return success
        
        Log::info('POS Settings Updated', [
            'user_id' => auth()->id(),
            'settings' => $request->only([
                'tax_rate', 'receipt_footer', 'auto_print', 
                'default_payment_method', 'allow_negative_stock'
            ]),
        ]);

        // Clear cache
        Cache::tags(['pos_settings'])->flush();

        return redirect()->back()->with('success', 'อัปเดตการตั้งค่าเรียบร้อยแล้ว');
    }

    /**
     * All transactions (Admin only)
     */
    public function allTransactions(Request $request)
    {
        $query = Sale::with(['user', 'saleItems.product', 'receipt'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->payment_method) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->min_amount) {
            $query->where('grand_total', '>=', $request->min_amount);
        }

        if ($request->max_amount) {
            $query->where('grand_total', '<=', $request->max_amount);
        }

        $sales = $query->paginate(25);

        // Summary statistics
        $totalQuery = clone $query;
        $summary = [
            'total_transactions' => $totalQuery->count(),
            'total_amount' => $totalQuery->sum('grand_total'),
            'average_transaction' => $totalQuery->avg('grand_total') ?? 0,
            'total_tax_collected' => $totalQuery->sum('tax_amount'),
        ];

        return Inertia::render('Admin/POS/Transactions', [
            'sales' => $sales,
            'summary' => $summary,
            'users' => User::select('id', 'name')->get(),
            'filters' => $request->only([
                'user_id', 'date_from', 'date_to', 'payment_method', 
                'min_amount', 'max_amount'
            ])
        ]);
    }

    /**
     * Delete transaction (Admin only)
     */
    public function deleteTransaction($id)
    {
        try {
            DB::beginTransaction();

            $sale = Sale::with('saleItems')->findOrFail($id);

            // Security check
            if (auth()->user()->role !== 'admin') {
                throw new \Exception('ไม่มีสิทธิ์ลบรายการขาย');
            }

            // Log before deletion
            Log::warning('Sale Deletion Attempted', [
                'sale_id' => $sale->id,
                'user_id' => auth()->id(),
                'original_total' => $sale->grand_total,
                'items_count' => $sale->saleItems->count(),
            ]);

            // Restore stock quantities
            foreach ($sale->saleItems as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $oldQuantity = $product->quantity;
                    $newQuantity = $oldQuantity + $item->quantity;
                    $product->update(['quantity' => $newQuantity]);

                    // Create reverse stock movement
                    StockMovement::create([
                        'product_id' => $product->id,
                        'user_id' => auth()->id(),
                        'type' => 'in',
                        'quantity' => $item->quantity,
                        'previous_quantity' => $oldQuantity,
                        'new_quantity' => $newQuantity,
                        'notes' => "Sale cancellation - Sale #{$sale->id} (Deleted by: " . auth()->user()->name . ")",
                    ]);
                }
            }

            // Mark receipt as voided if exists
            if ($sale->receipt) {
                $sale->receipt->markAsVoided('Sale deleted by admin');
            }

            // Delete sale items and sale
            $sale->saleItems()->delete();
            $sale->delete();

            // Clear caches
            Cache::tags(['products', 'pos_stats'])->flush();

            DB::commit();

            Log::info('Sale Deleted Successfully', [
                'deleted_sale_id' => $id,
                'deleted_by' => auth()->id(),
            ]);

            return redirect()->back()->with('success', 'ลบรายการขายเรียบร้อยแล้ว');

        } catch (\Exception $e) {
            DB::rollback();
            
            Log::error('Sale Deletion Failed', [
                'sale_id' => $id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
            ]);
            
            return redirect()->back()->with('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
        }
    }
}