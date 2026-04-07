<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EoqCalculation extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'product_name',
        'annual_demand',
        'ordering_cost',
        'unit_cost',
        'holding_rate',
        'holding_cost',
        'eoq',
        'number_of_orders',
        'order_cycle_days',
        'daily_demand',
        'reorder_point',
        'total_cost',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'annual_demand' => 'decimal:2',
        'ordering_cost' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'holding_rate' => 'decimal:4',
        'holding_cost' => 'decimal:2',
        'eoq' => 'integer',
        'number_of_orders' => 'decimal:2',
        'order_cycle_days' => 'decimal:2',
        'daily_demand' => 'decimal:2',
        'reorder_point' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}