<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'categories_sku',
        'description',
        'is_active',
    ];

    // Auto-convert categories_sku to uppercase
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($category) {
            if ($category->categories_sku) {
                $category->categories_sku = strtoupper($category->categories_sku);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}