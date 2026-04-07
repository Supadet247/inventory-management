<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RopCalculation extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'product_name',
        'sku',
        'annual_demand',
        'lead_time',
        'safety_stock',
        'daily_demand',
        'rop',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'annual_demand' => 'decimal:2',
        'lead_time' => 'decimal:2',
        'safety_stock' => 'decimal:2',
        'daily_demand' => 'decimal:2',
        'rop' => 'decimal:2',
    ];

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Relationship to EOQ calculation
    public function eoqCalculation()
    {
        return $this->hasOne(EoqCalculation::class, 'product_id', 'product_id');
    }
}
