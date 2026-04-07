<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'sku',
        'description',
        'image',
        'category_id',
        'price',
        'cost_price',
        'profit_margin',
        'quantity',
        'returned_quantity',
        'min_stock',
        'is_active',
        'warranty',
        'warranty_days',
        'warranty_months',
        'warranty_years',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'profit_margin' => 'decimal:2',
            'quantity' => 'integer',
            'returned_quantity' => 'integer',
            'min_stock' => 'integer',
            'is_active' => 'boolean',
            'warranty' => 'integer',
            'warranty_days' => 'integer',
            'warranty_months' => 'integer',
            'warranty_years' => 'integer',
        ];
    }

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function receiptItems()
    {
        return $this->hasMany(ReceiptItem::class);
    }

    public function returnItems()
    {
        return $this->hasMany(ReturnItem::class);
    }

    public function eoqCalculation()
    {
        return $this->hasOne(EoqCalculation::class);
    }

    public function cogsCalculation()
    {
        return $this->hasOne(CogsCalculation::class);
    }

    public function averageCostCalculation()
    {
        return $this->hasOne(AverageCostCalculation::class);
    }

    public function stockLotInstances()
    {
        return $this->hasMany(StockLotInstance::class);
    }

    // Scopes - เดิม
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('quantity', '<=', 'min_stock');
    }

    // Scopes - ใหม่สำหรับของคืน
    public function scopeHasReturnedStock($query)
    {
        return $query->where('returned_quantity', '>', 0);
    }

    public function scopeNormalStockOnly($query)
    {
        return $query->where('quantity', '>', 0)->where('returned_quantity', 0);
    }

    public function scopeInStock($query)
    {
        return $query->where('quantity', '>', 0);
    }

    public function scopeOutOfStock($query)
    {
        return $query->where('quantity', '<=', 0);
    }

    public function isLowStock()
    {
        return $this->quantity <= $this->min_stock;
    }

    public function getStockStatusAttribute()
    {
        $sellableStock = $this->quantity;
        $returnedStock = $this->returned_quantity ?? 0;
        
        if ($sellableStock <= 0) {
            if ($returnedStock > 0) {
                return 'out_of_stock_with_returns'; // หมดสต็อกขาย แต่มีของคืน
            }
            return 'out_of_stock';
        } elseif ($sellableStock <= $this->min_stock) {
            return 'low_stock';
        } else {
            return 'in_stock';
        }
    }

    public function getImageUrlAttribute()
    {
        if ($this->image) {
            return asset('storage/products/' . $this->image);
        }
        return asset('images/default-product.png');
    }

    // Accessors - ใหม่สำหรับของคืน
    public function getTotalStockAttribute()
    {
        return $this->quantity + ($this->returned_quantity ?? 0);
    }

    public function getAvailableStockAttribute()
    {
        return $this->quantity; // เฉพาะสต็อกที่ขายได้
    }

    // เพิ่ม accessor ใหม่เพื่อความชัดเจน
    public function getSellableStockAttribute()
    {
        return $this->quantity; // สต็อกที่สามารถขายได้
    }

    public function getReturnedStockAttribute()
    {
        return $this->returned_quantity ?? 0; // สต็อกของคืน
    }

    public function hasReturnedStockAttribute()
    {
        return ($this->returned_quantity ?? 0) > 0;
    }

    public function getDetailedStockStatusAttribute()
    {
        $available = $this->quantity;
        $returned = $this->returned_quantity ?? 0;
        
        if ($returned > 0) {
            return "ขายได้: {$available} ชิ้น | ของคืน: {$returned} ชิ้น | รวม: " . ($available + $returned) . " ชิ้น";
        }
        
        return "ขายได้: {$available} ชิ้น";
    }

    // Sales Statistics Methods - เดิม
    public function getTotalSoldAttribute()
    {
        return $this->saleItems()->sum('quantity');
    }

    public function getTotalSalesValueAttribute()
    {
        return $this->saleItems()->sum('total_price');
    }

    public function getSalesThisMonthAttribute()
    {
        return $this->saleItems()
            ->whereHas('sale', function($query) {
                $query->whereYear('sale_date', now()->year)
                      ->whereMonth('sale_date', now()->month);
            })
            ->sum('quantity');
    }

    public function getSalesThisWeekAttribute()
    {
        return $this->saleItems()
            ->whereHas('sale', function($query) {
                $query->whereBetween('sale_date', [
                    now()->startOfWeek(),
                    now()->endOfWeek()
                ]);
            })
            ->sum('quantity');
    }

    public function getInitialStockAttribute()
    {
        // คำนวดจากการเคลื่อนไหวสต็อกครั้งแรก
        $firstMovement = $this->stockMovements()
            ->where('type', 'in')
            ->orderBy('created_at', 'asc')
            ->first();
        
        return $firstMovement ? $firstMovement->quantity : 0;
    }

    public function getTotalStockInAttribute()
    {
        return $this->stockMovements()
            ->where('type', 'in')
            ->sum('quantity');
    }

    public function getTotalStockOutAttribute()
    {
        return $this->stockMovements()
            ->where('type', 'out')
            ->sum('quantity');
    }

    public function getStockTurnoverRateAttribute()
    {
        $totalSold = $this->total_sold;
        $averageStock = ($this->total_stock_in + $this->quantity) / 2;
        
        return $averageStock > 0 ? round($totalSold / $averageStock, 2) : 0;
    }

    // คำนวดสินค้าที่เคยมีในคลัง
    public function getEverInStockAttribute()
    {
        return $this->total_stock_in;
    }

    // คำนวดสินค้าที่ขายไปแล้ว (รวมทั้งหมด)
    public function getTotalDispensedAttribute()
    {
        return $this->total_stock_out + $this->total_sold;
    }

    // คำนวดเปอร์เซ็นต์การขาย
    public function getSalesPercentageAttribute()
    {
        $everInStock = $this->ever_in_stock;
        return $everInStock > 0 ? round(($this->total_sold / $everInStock) * 100, 2) : 0;
    }

    // Methods - ใหม่สำหรับจัดการของคืน
    public function updateStock($quantity, $type = 'out')
    {
        if ($type === 'in') {
            $this->increment('quantity', $quantity);
        } else {
            $this->decrement('quantity', $quantity);
        }
        
        return $this;
    }

    public function addReturnedStock($quantity)
    {
        $this->increment('returned_quantity', $quantity);
        return $this;
    }

    public function removeReturnedStock($quantity)
    {
        $this->decrement('returned_quantity', max(0, $quantity));
        return $this;
    }

    // Method สำหรับย้ายของคืนกลับเป็นสต็อกปกติ (กรณีตรวจสอบแล้วว่าใช้ได้)
    public function restockFromReturned($quantity)
    {
        $actualQuantity = min($quantity, $this->returned_quantity ?? 0);
        
        if ($actualQuantity > 0) {
            $this->decrement('returned_quantity', $actualQuantity);
            $this->increment('quantity', $actualQuantity);
            
            // บันทึก stock movement
            StockMovement::create([
                'product_id' => $this->id,
                'user_id' => auth()->id() ?? 1, // ใช้ user_id = 1 ถ้าไม่มี auth
                'type' => 'restock_from_returned',
                'quantity' => $actualQuantity,
                'previous_quantity' => $this->quantity - $actualQuantity,
                'new_quantity' => $this->quantity,
                'notes' => "Restocked from returned items: {$actualQuantity} units moved from returned stock to sellable stock",
            ]);
        }
        
        return $actualQuantity;
    }

    // Method สำหรับทิ้งของคืน (กรณีสภาพไม่ดี)
    public function discardReturnedStock($quantity, $reason = null)
    {
        $actualQuantity = min($quantity, $this->returned_quantity ?? 0);
        
        if ($actualQuantity > 0) {
            $this->decrement('returned_quantity', $actualQuantity);
            
            // บันทึก stock movement
            StockMovement::create([
                'product_id' => $this->id,
                'user_id' => auth()->id() ?? 1, // ใช้ user_id = 1 ถ้าไม่มี auth
                'type' => 'discard_returned',
                'quantity' => $actualQuantity,
                'previous_quantity' => $this->quantity,
                'new_quantity' => $this->quantity, // ไม่เปลี่ยน
                'notes' => "Discarded returned items: {$actualQuantity} units" . ($reason ? " | Reason: {$reason}" : ""),
            ]);
        }
        
        return $actualQuantity;
    }
}