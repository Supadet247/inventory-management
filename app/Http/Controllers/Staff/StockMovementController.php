<?php
// app/Http/Controllers/Staff/StockMovementController.php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        $query = StockMovement::with(['product', 'user'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('product', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($request->type, function ($query, $type) {
                $query->where('type', $type);
            })
            ->when($request->user_id, function ($query, $userId) {
                $query->where('user_id', $userId);
            })
            ->when($request->date_from, function ($query, $dateFrom) {
                $query->whereDate('created_at', '>=', $dateFrom);
            })
            ->when($request->date_to, function ($query, $dateTo) {
                $query->whereDate('created_at', '<=', $dateTo);
            });

        $movements = $query->orderBy('created_at', 'desc')
                          ->paginate(20)
                          ->withQueryString();

        // Calculate summary statistics
        $summary = [
            'stock_in' => (clone $query)->where('type', 'in')->sum('quantity'),
            'stock_out' => (clone $query)->where('type', 'out')->sum('quantity'),
            'adjustments' => (clone $query)->where('type', 'adjustment')->sum('quantity'),
        ];

        return Inertia::render('Staff/StockMovements/Index', [
            'movements' => $movements,
            'filters' => $request->only(['search', 'type', 'user_id', 'date_from', 'date_to']),
            'summary' => $summary,
        ]);
    }

    public function create()
    {
        $products = Product::active()->orderBy('name')->get();
        
        return Inertia::render('Staff/StockMovements/Create', [
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:in,out',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:500',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $oldQuantity = $product->quantity;
        
        if ($validated['type'] === 'in') {
            $newQuantity = $oldQuantity + $validated['quantity'];
        } else { // out
            $newQuantity = max(0, $oldQuantity - $validated['quantity']);
            if ($oldQuantity < $validated['quantity']) {
                return redirect()->back()
                               ->with('error', 'Insufficient stock quantity.')
                               ->withInput();
            }
        }

        $product->update(['quantity' => $newQuantity]);

        StockMovement::create([
            'product_id' => $validated['product_id'],
            'user_id' => auth()->id(),
            'type' => $validated['type'],
            'quantity' => $validated['quantity'],
            'previous_quantity' => $oldQuantity,
            'new_quantity' => $newQuantity,
            'notes' => $validated['notes'],
        ]);

        return redirect()->route('staff.stock-movements.index')
                        ->with('success', 'Stock movement recorded successfully.');
    }
}