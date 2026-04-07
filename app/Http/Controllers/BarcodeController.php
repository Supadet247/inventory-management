<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BarcodeController extends Controller
{
    /**
     * Display the barcode printing page
     */
    public function index(Request $request)
    {
        $query = Product::with('category')
            ->where('is_active', true)
            ->select(['id', 'name', 'sku', 'price', 'quantity', 'image', 'category_id']);

        // Search by SKU or name
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('sku', 'like', "%{$request->search}%")
                  ->orWhere('name', 'like', "%{$request->search}%");
            });
        }

        if ($request->category_filter) {
            $query->where('category_id', $request->category_filter);
        }

        $products = $query->orderBy('name')->paginate(20)->withQueryString();

        $categories = \App\Models\Category::active()->get(['id', 'name']);

        return Inertia::render('Staff/Barcode/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_filter']),
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    }

    /**
     * Get products for barcode printing (API)
     */
    public function getProducts(Request $request)
    {
        $query = Product::with('category')
            ->where('is_active', true)
            ->select(['id', 'name', 'sku', 'price', 'quantity', 'category_id']);

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('sku', 'like', "%{$request->search}%")
                  ->orWhere('name', 'like', "%{$request->search}%");
            });
        }

        $products = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Get single product for barcode (API)
     */
    public function getProduct($sku)
    {
        $product = Product::with('category')
            ->where('sku', $sku)
            ->where('is_active', true)
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่พบสินค้าที่มีรหัส: ' . $sku,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }
}
