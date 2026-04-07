// resources/js/Pages/Staff/StockMovements/Create.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function StockMovementsCreate({ auth, products }) {
    const [selectedProduct, setSelectedProduct] = useState(null);
    
    const { data, setData, post, processing, errors } = useForm({
        product_id: '',
        type: 'in',
        quantity: '',
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('staff.stock-movements.store'));
    };

    useEffect(() => {
        if (data.product_id) {
            const product = products.find(p => p.id == data.product_id);
            setSelectedProduct(product);
        } else {
            setSelectedProduct(null);
        }
    }, [data.product_id, products]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    };

    const getStockStatusColor = (product) => {
        if (!product) return '';
        if (product.quantity <= 0) return 'text-red-600';
        if (product.quantity <= product.min_stock) return 'text-yellow-600';
        return 'text-green-600';
    };

    const getStockStatusText = (product) => {
        if (!product) return '';
        if (product.quantity <= 0) return 'Out of Stock';
        if (product.quantity <= product.min_stock) return 'Low Stock';
        return 'In Stock';
    };

    const getNewQuantity = () => {
        if (!selectedProduct || !data.quantity) return selectedProduct?.quantity || 0;
        
        const currentQty = selectedProduct.quantity;
        const moveQty = parseInt(data.quantity) || 0;
        
        if (data.type === 'in') {
            return currentQty + moveQty;
        } else {
            return Math.max(0, currentQty - moveQty);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Record Stock Movement</h2>
                    <Link
                        href={route('staff.stock-movements.index')}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Back to Stock Movements
                    </Link>
                </div>
            }
        >
            <Head title="Record Stock Movement" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Form */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-6">Movement Details</h3>
                                
                                <form onSubmit={submit} className="space-y-6">
                                    {/* Product Selection */}
                                    <div>
                                        <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
                                            Product <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="product_id"
                                            value={data.product_id}
                                            onChange={(e) => setData('product_id', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="">Select Product</option>
                                            {products.map((product) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name} (SKU: {product.sku}) - Stock: {product.quantity}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.product_id && <div className="text-red-600 text-sm mt-1">{errors.product_id}</div>}
                                    </div>

                                    {/* Movement Type */}
                                    <div>
                                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                            Movement Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="type"
                                            value={data.type}
                                            onChange={(e) => setData('type', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="in">Stock In (+)</option>
                                            <option value="out">Stock Out (-)</option>
                                        </select>
                                        {errors.type && <div className="text-red-600 text-sm mt-1">{errors.type}</div>}
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                                            Quantity <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="quantity"
                                            type="number"
                                            min="1"
                                            value={data.quantity}
                                            onChange={(e) => setData('quantity', e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        {errors.quantity && <div className="text-red-600 text-sm mt-1">{errors.quantity}</div>}
                                        {selectedProduct && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                Current stock: {selectedProduct.quantity}
                                                {data.type === 'out' && data.quantity && selectedProduct.quantity < parseInt(data.quantity) && (
                                                    <span className="text-red-600 font-medium"> - Insufficient stock!</span>
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                            Notes
                                        </label>
                                        <textarea
                                            id="notes"
                                            rows="4"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="Optional notes about this stock movement..."
                                        />
                                        {errors.notes && <div className="text-red-600 text-sm mt-1">{errors.notes}</div>}
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="flex justify-end space-x-3">
                                        <Link
                                            href={route('staff.stock-movements.index')}
                                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                        >
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={processing || (selectedProduct && data.type === 'out' && data.quantity && selectedProduct.quantity < parseInt(data.quantity))}
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                        >
                                            {processing ? 'Recording...' : 'Record Movement'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Product Preview */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-6">Product Preview</h3>
                                
                                {selectedProduct ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-900">{selectedProduct.name}</h4>
                                            <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Category</dt>
                                                <dd className="text-sm text-gray-900">{selectedProduct.category.name}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Price</dt>
                                                <dd className="text-sm text-gray-900">{formatCurrency(selectedProduct.price)}</dd>
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <h5 className="text-sm font-medium text-gray-900 mb-3">Stock Information</h5>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">Current Quantity:</span>
                                                    <span className="text-sm font-medium text-gray-900">{selectedProduct.quantity}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">Minimum Stock:</span>
                                                    <span className="text-sm text-gray-900">{selectedProduct.min_stock}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">Status:</span>
                                                    <span className={`text-sm font-medium ${getStockStatusColor(selectedProduct)}`}>
                                                        {getStockStatusText(selectedProduct)}
                                                    </span>
                                                </div>
                                                {data.quantity && (
                                                    <>
                                                        <div className="border-t pt-2 mt-2">
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-gray-500">After Movement:</span>
                                                                <span className="text-sm font-bold text-blue-600">{getNewQuantity()}</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {selectedProduct.description && (
                                            <div className="border-t pt-4">
                                                <dt className="text-sm font-medium text-gray-500">Description</dt>
                                                <dd className="text-sm text-gray-900 mt-1">{selectedProduct.description}</dd>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No Product Selected</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Select a product to see its details and stock information.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}