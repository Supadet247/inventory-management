<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CostPerAreaCalculation extends Model
{
    use HasFactory;

    protected $fillable = [
        'calculation_name',
        'monthly_data',
        'land_cost',
        'usage_years',
        'store_size',
        'total_monthly_cost',
        'avg_annual_store_cost',
        'total_storage_cost',
        'avg_monthly_storage_cost',
        'cost_per_square_meter',
    ];

    protected $casts = [
        'monthly_data' => 'array',
        'land_cost' => 'decimal:2',
        'usage_years' => 'integer',
        'store_size' => 'decimal:2',
        'total_monthly_cost' => 'decimal:2',
        'avg_annual_store_cost' => 'decimal:2',
        'total_storage_cost' => 'decimal:2',
        'avg_monthly_storage_cost' => 'decimal:2',
        'cost_per_square_meter' => 'decimal:2',
    ];
}
