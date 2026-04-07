<?php
// app/Http/Controllers/Admin/CategoryController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::withCount('products')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->status, function ($query, $status) {
                if ($status === 'active') {
                    $query->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                }
            });

        $categories = $query->orderBy('created_at', 'desc')
                           ->paginate(15)
                           ->withQueryString();

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Categories/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'categories_sku' => 'required|string|max:10|unique:categories',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Convert to uppercase before saving
        if (isset($validated['categories_sku'])) {
            $validated['categories_sku'] = strtoupper($validated['categories_sku']);
        }

        Category::create($validated);

        return redirect()->route('admin.categories.index')
                        ->with('success', 'Category created successfully.');
    }

    public function show(Category $category)
    {
        $category->load(['products' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }]);

        return Inertia::render('Admin/Categories/Show', [
            'category' => $category,
        ]);
    }

    public function edit(Category $category)
    {
        return Inertia::render('Admin/Categories/Edit', [
            'category' => $category,
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'categories_sku' => 'required|string|max:10|unique:categories,categories_sku,' . $category->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Convert to uppercase before saving
        if (isset($validated['categories_sku'])) {
            $validated['categories_sku'] = strtoupper($validated['categories_sku']);
        }

        $category->update($validated);

        return redirect()->route('admin.categories.index')
                        ->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category)
    {
        if ($category->products()->count() > 0) {
            return redirect()->back()
                           ->with('error', 'Cannot delete category that has products.');
        }

        $category->delete();
        
        return redirect()->route('admin.categories.index')
                        ->with('success', 'Category deleted successfully.');
    }
}