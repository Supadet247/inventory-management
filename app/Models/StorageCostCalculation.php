<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StorageCostCalculation extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'sku',
        'product_name',
        'width',                           // W - ความกว้าง (เมตร)
        'length',                          // L - ความยาว (เมตร)
        'product_area',                    // A = W × L (ตร.ม.)
        'warehouse_total_area',            // พื้นที่คลังสินค้ารวม (ตร.ม.)
        'total_storage_cost_per_year',     // ค่าใช้จ่ายรวมต่อปี
        'cost_per_sqm_per_year',           // ต้นทุน/ตร.ม./ปี
        'storage_cost_per_year',           // ต้นทุนพื้นที่จัดเก็บสินค้า/ปี
        'calculation_name',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'width' => 'decimal:2',
        'length' => 'decimal:2',
        'product_area' => 'decimal:4',
        'warehouse_total_area' => 'decimal:2',
        'total_storage_cost_per_year' => 'decimal:2',
        'cost_per_sqm_per_year' => 'decimal:2',
        'storage_cost_per_year' => 'decimal:2',
    ];

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
