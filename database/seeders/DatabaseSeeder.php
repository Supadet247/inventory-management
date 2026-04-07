<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // สร้าง Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        // สร้าง Staff User
        User::create([
            'name' => 'Staff User',
            'email' => 'staff@example.com',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'is_active' => true,
        ]);

        // สร้าง Categories
        $categories = [
            ['name' => 'Electronics', 'description' => 'Electronic devices and accessories'],
            ['name' => 'Clothing', 'description' => 'Apparel and fashion items'],
            ['name' => 'Books', 'description' => 'Books and publications'],
            ['name' => 'Home & Garden', 'description' => 'Home improvement and garden items'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        // สร้าง Products
        $products = [
            [
                'name' => 'Laptop Dell XPS 13',
                'sku' => 'DELL-XPS-13-001',
                'description' => '13-inch laptop with Intel Core i7',
                'category_id' => 1,
                'price' => 35000.00,
                'quantity' => 25,
                'min_stock' => 5,
            ],
            [
                'name' => 'iPhone 15 Pro',
                'sku' => 'APPLE-IP15-PRO-001',
                'description' => 'Latest iPhone with Pro features',
                'category_id' => 1,
                'price' => 45000.00,
                'quantity' => 15,
                'min_stock' => 3,
            ],
            [
                'name' => 'Cotton T-Shirt',
                'sku' => 'CLOTH-TSHIRT-001',
                'description' => '100% cotton comfortable t-shirt',
                'category_id' => 2,
                'price' => 299.00,
                'quantity' => 100,
                'min_stock' => 20,
            ],
            [
                'name' => 'Programming Book',
                'sku' => 'BOOK-PROG-001',
                'description' => 'Learn programming fundamentals',
                'category_id' => 3,
                'price' => 890.00,
                'quantity' => 50,
                'min_stock' => 10,
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}