<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReceiptItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'receipt_id',
        'product_id',
        'product_name',
        'product_sku',
        'quantity',
        'unit_price',
        'total_price',
        'unit',
        'returned_quantity',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
            'returned_quantity' => 'integer',
        ];
    }

    // Relationships
    public function receipt()
    {
        return $this->belongsTo(Receipt::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function returnItems()
    {
        return $this->hasMany(ReturnItem::class);
    }

    // Accessors
    public function getReturnableQuantityAttribute()
    {
        return $this->quantity - $this->returned_quantity;
    }

    public function getReturnableAmountAttribute()
    {
        return $this->returnable_quantity * $this->unit_price;
    }

    public function getCanReturnAttribute()
    {
        return $this->returnable_quantity > 0 && $this->receipt->can_return;
    }

    public function getFormattedUnitPriceAttribute()
    {
        return number_format($this->unit_price, 2);
    }

    public function getFormattedTotalPriceAttribute()
    {
        return number_format($this->total_price, 2);
    }

    public function getReturnPercentageAttribute()
    {
        if ($this->quantity == 0) return 0;
        return round(($this->returned_quantity / $this->quantity) * 100, 1);
    }

    public function getIsFullyReturnedAttribute()
    {
        return $this->returned_quantity >= $this->quantity;
    }

    // Methods
    public function canReturn($requestedQuantity = 1)
    {
        return $this->can_return && 
               $requestedQuantity <= $this->returnable_quantity &&
               $requestedQuantity > 0;
    }

    public function processReturn($quantity, $reason = null)
    {
        if (!$this->canReturn($quantity)) {
            throw new \Exception("Cannot return {$quantity} items. Only {$this->returnable_quantity} items available for return.");
        }

        $this->increment('returned_quantity', $quantity);
        
        if ($this->receipt->is_fully_returned) {
            $this->receipt->markAsReturned();
        }
        
        return $this;
    }

    public function getReturnHistory()
    {
        return $this->returnItems()
                   ->with(['return.user'])
                   ->orderBy('created_at', 'desc')
                   ->get();
    }

    // Scopes
    public function scopeReturnable($query)
    {
        return $query->whereColumn('returned_quantity', '<', 'quantity')
                    ->whereHas('receipt', function($q) {
                        $q->where('status', 'active');
                    });
    }

    public function scopeFullyReturned($query)
    {
        return $query->whereColumn('returned_quantity', '>=', 'quantity');
    }

    public function scopePartiallyReturned($query)
    {
        return $query->where('returned_quantity', '>', 0)
                    ->whereColumn('returned_quantity', '<', 'quantity');
    }

    // Static methods
    public static function createFromSaleItem($receiptId, $saleItem, $productSnapshot = null)
    {
        $product = $productSnapshot ?: $saleItem->product;
        
        return self::create([
            'receipt_id' => $receiptId,
            'product_id' => $saleItem->product_id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => $saleItem->quantity,
            'unit_price' => $saleItem->unit_price,
            'total_price' => $saleItem->total_price,
            'unit' => 'ชิ้น', // หรือจากข้อมูลสินค้า
            'returned_quantity' => 0,
        ]);
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($receiptItem) {
            // คำนวณ total_price อัตโนมัติ
            $receiptItem->total_price = $receiptItem->quantity * $receiptItem->unit_price;
        });

        static::updated(function ($receiptItem) {
            // ตรวจสอบว่าใบเสร็จควรเปลี่ยนสถานะหรือไม่
            if ($receiptItem->isDirty('returned_quantity')) {
                $receiptItem->receipt->refresh();
                if ($receiptItem->receipt->is_fully_returned) {
                    $receiptItem->receipt->markAsReturned();
                }
            }
        });
    }
}