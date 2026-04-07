<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'stock_lot_instance_id',
        'user_id',
        'type',
        'quantity',
        'previous_quantity',
        'new_quantity',
        'notes',
    ];

    // Valid stock movement types
    public static $validTypes = [
        'in',
        'out', 
        'adjustment',
        'return_in',
        'restock_from_returned',
        'discard_returned',
        'warranty_claim_out',
    ];

    // Boot method to validate type before saving
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($stockMovement) {
            if (!in_array($stockMovement->type, self::$validTypes)) {
                \Log::error('Invalid stock movement type attempted', [
                    'type' => $stockMovement->type,
                    'product_id' => $stockMovement->product_id,
                    'user_id' => $stockMovement->user_id,
                    'notes' => $stockMovement->notes
                ]);
                
                // Default to 'in' for return operations, 'adjustment' for others
                if (strpos($stockMovement->notes, 'Return') !== false) {
                    $stockMovement->type = 'in';
                } else {
                    $stockMovement->type = 'adjustment';
                }
            }
        });
    }

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'previous_quantity' => 'integer',
            'new_quantity' => 'integer',
        ];
    }

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function stockLotInstance()
    {
        return $this->belongsTo(StockLotInstance::class);
    }

    // Scopes
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeOrderByNewest($query)
    {
        return $query->orderBy('created_at', 'desc')->orderBy('id', 'desc');
    }

    public function scopeOrderByOldest($query)
    {
        return $query->orderBy('created_at', 'asc')->orderBy('id', 'asc');
    }

    public function scopeOrderByProduct($query)
    {
        return $query->join('products', 'stock_movements.product_id', '=', 'products.id')
                    ->orderBy('products.name', 'asc')
                    ->select('stock_movements.*');
    }

    public function scopeOrderByUser($query)
    {
        return $query->join('users', 'stock_movements.user_id', '=', 'users.id')
                    ->orderBy('users.name', 'asc')
                    ->select('stock_movements.*');
    }
}