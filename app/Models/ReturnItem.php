<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'return_id',
        'receipt_item_id',
        'product_id',
        'quantity',
        'unit_price',
        'total_price',
        'reason',
        'condition_note',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
        ];
    }

    // Relationships
    public function return()
    {
        return $this->belongsTo(ReturnModel::class, 'return_id');
    }

    public function receiptItem()
    {
        return $this->belongsTo(ReceiptItem::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Accessors
    public function getFormattedUnitPriceAttribute()
    {
        return number_format($this->unit_price, 2);
    }

    public function getFormattedTotalPriceAttribute()
    {
        return number_format($this->total_price, 2);
    }

    public function getProductNameAttribute()
    {
        return $this->receiptItem ? $this->receiptItem->product_name : $this->product->name;
    }

    public function getProductSkuAttribute()
    {
        return $this->receiptItem ? $this->receiptItem->product_sku : $this->product->sku;
    }

    public function getReturnPercentageAttribute()
    {
        if (!$this->receiptItem || $this->receiptItem->quantity == 0) return 0;
        return round(($this->quantity / $this->receiptItem->quantity) * 100, 1);
    }

    // Methods
    public function calculateTotal()
    {
        $this->total_price = $this->quantity * $this->unit_price;
        return $this;
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($returnItem) {
            // คำนวณ total_price อัตโนมัติ
            $returnItem->total_price = $returnItem->quantity * $returnItem->unit_price;
        });
    }
}