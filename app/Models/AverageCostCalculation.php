<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AverageCostCalculation extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'sku',
        'product_name',
        'beginning_value',           // มูลค่าสินค้าคงเหลือต้นงวด (THB)
        'beginning_unit_cost',       // Cb - ราคาทุนต่อหน่วยต้นงวด
        'calculated_qb',             // Qb = beginning_value / Cb
        'purchase_value',            // มูลค่าสินค้าที่ซื้อเพิ่ม (THB)
        'purchase_quantity',         // Qp - จำนวนที่ซื้อเพิ่ม
        'calculated_cp',             // Cp = purchase_value / Qp
        'average_cost',              // AC - ต้นทุนต่อหน่วยเฉลี่ย
        'total_beginning_cost',      // = beginning_value
        'total_purchase_cost',       // = purchase_value
        'total_quantity',            // Qtotal = Qb + Qp
        'calculation_name',          // ชื่อการคำนวณ (สำหรับ upsert)
    ];

    protected $casts = [
        'product_id' => 'integer',
        'beginning_value' => 'decimal:2',
        'beginning_unit_cost' => 'decimal:2',
        'calculated_qb' => 'decimal:4',
        'purchase_value' => 'decimal:2',
        'purchase_quantity' => 'decimal:2',
        'calculated_cp' => 'decimal:2',
        'average_cost' => 'decimal:2',
        'total_beginning_cost' => 'decimal:2',
        'total_purchase_cost' => 'decimal:2',
        'total_quantity' => 'decimal:4',
    ];

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
