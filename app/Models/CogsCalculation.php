<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CogsCalculation extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'sku',
        'product_name',
        'beginning_inventory_cost',
        'beginning_inventory_quantity',
        'net_purchases_cost',
        'net_purchases_quantity',
        'ending_inventory_cost',
        'ending_inventory_quantity',
        'total_cost',
        'total_quantity',
        'average_cost',
        'cogs',
        'cogs_per_unit',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'beginning_inventory_cost' => 'decimal:2',
        'beginning_inventory_quantity' => 'decimal:2',
        'net_purchases_cost' => 'decimal:2',
        'net_purchases_quantity' => 'decimal:2',
        'ending_inventory_cost' => 'decimal:2',
        'ending_inventory_quantity' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'total_quantity' => 'decimal:2',
        'average_cost' => 'decimal:2',
        'cogs' => 'decimal:2',
        'cogs_per_unit' => 'decimal:2',
    ];

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
