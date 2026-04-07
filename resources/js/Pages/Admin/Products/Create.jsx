// resources/js/Pages/Admin/Products/Create.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function ProductsCreate({ auth, categories }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        sku: '',
        description: '',
        image: null,
        category_id: '',
        price: '',
        cost_price: '',
        profit_margin: '',
        quantity: '',
        min_stock: '',
        is_active: true,
        warranty: 0,
        warranty_days: 0,
        warranty_months: 0,
        warranty_years: 0,
        lot_number: '',
        expiry_date: '',
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [isGeneratingLot, setIsGeneratingLot] = useState(false);

    // Auto-generate lot number on mount if lot_number is empty
    useEffect(() => {
        if (!data.lot_number) {
            generateLotNumber();
        }
    }, []);

    const generateLotNumber = async () => {
        setIsGeneratingLot(true);
        try {
            // For new products, use 'new' as product_id to get per-product lot numbering
            const response = await fetch('/api/next-lot-number?product_id=new');
            const result = await response.json();
            if (result.lot_number) {
                setData('lot_number', result.lot_number);
            }
        } catch (error) {
            console.error('Failed to generate lot number:', error);
        } finally {
            setIsGeneratingLot(false);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.products.store'), {
            forceFormData: true,
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setData('image', file);
        
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '฿0.00';
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    };

    const calculateTotalValue = () => {
        const price = parseFloat(data.price) || 0;
        const quantity = parseInt(data.quantity) || 0;
        return price * quantity;
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="สร้างสินค้าใหม่" />

            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">สร้างสินค้าใหม่</h1>
                                <p className="text-gray-600 mt-2">เพิ่มรายการสินค้าใหม่เข้าสู่ระบบคลังสินค้า</p>
                            </div>
                            <Link
                                href={route('admin.products.index')}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                                ← กลับไปยังรายการสินค้า
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900">ข้อมูลสินค้า</h3>
                                    <p className="text-sm text-gray-600 mt-1">กรอกรายละเอียดสำหรับสินค้ารายการใหม่</p>
                                </div>
                                <div className="p-6">
                                    <form onSubmit={submit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Product Name */}
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                                    ชื่อสินค้า <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="กรอกชื่อสินค้า"
                                                    required
                                                />
                                                {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                                            </div>

                                            {/* SKU */}
                                            <div>
                                                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                                                    รหัสสินค้า (SKU) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="sku"
                                                    type="text"
                                                    value={data.sku}
                                                    onChange={(e) => setData('sku', e.target.value)}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="กรอกรหัสสินค้า (SKU)"
                                                    required
                                                />
                                                {errors.sku && <div className="text-red-600 text-sm mt-1">{errors.sku}</div>}
                                                <p className="text-sm text-gray-500 mt-1">รหัสเฉพาะสำหรับสินค้าแต่ละรายการ</p>
                                            </div>

                                            {/* Category */}
                                            <div>
                                                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                                                    หมวดหมู่สินค้า <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    id="category_id"
                                                    value={data.category_id}
                                                    onChange={async (e) => {
                                                        const categoryId = e.target.value;
                                                        setData('category_id', categoryId);
                                                        
                                                        // Auto-fill SKU with next available number
                                                        if (categoryId) {
                                                            const selectedCategory = categories.find(cat => cat.id == categoryId);
                                                            if (selectedCategory && selectedCategory.categories_sku) {
                                                                try {
                                                                    const response = await fetch(`/admin/products/next-sku?prefix=${encodeURIComponent(selectedCategory.categories_sku)}`);
                                                                    const result = await response.json();
                                                                    if (result.sku) {
                                                                        setData('sku', result.sku);
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error fetching next SKU:', error);
                                                                    // Fallback to prefix only
                                                                    setData('sku', selectedCategory.categories_sku);
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="">เลือกหมวดหมู่สินค้า</option>
                                                    {categories.map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name} {category.categories_sku && `(${category.categories_sku})`}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.category_id && <div className="text-red-600 text-sm mt-1">{errors.category_id}</div>}
                                            </div>

                                            {/* Cost Price */}
                                            <div>
                                                <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700 mb-2">
                                                    ราคาต้นทุน (บาท)
                                                </label>
                                                <input
                                                    id="cost_price"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.cost_price || ''}
                                                    onChange={(e) => setData('cost_price', e.target.value)}
                                                    onWheel={(e) => e.target.blur()}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                />
                                                {errors.cost_price && <div className="text-red-600 text-sm mt-1">{errors.cost_price}</div>}
                                            </div>

                                            {/* Price */}
                                            <div>
                                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                                                    ราคาขาย (บาท) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="price"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.price}
                                                    onChange={(e) => setData('price', e.target.value)}
                                                    onWheel={(e) => e.target.blur()}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                    required
                                                />
                                                {errors.price && <div className="text-red-600 text-sm mt-1">{errors.price}</div>}
                                            </div>

                                            {/* Profit Margin */}
                                            <div>
                                                <label htmlFor="profit_margin" className="block text-sm font-medium text-gray-700 mb-2">
                                                    กำไร (%)
                                                </label>
                                                <input
                                                    id="profit_margin"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.profit_margin || ''}
                                                    onChange={(e) => {
                                                        const margin = parseFloat(e.target.value) || 0;
                                                        const cost = parseFloat(data.cost_price) || 0;
                                                        setData('profit_margin', e.target.value);
                                                        if (cost > 0 && margin >= 0) {
                                                            const newPrice = cost * (1 + margin / 100);
                                                            setData('price', newPrice.toFixed(2));
                                                        }
                                                    }}
                                                    onWheel={(e) => e.target.blur()}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                />
                                                {errors.profit_margin && <div className="text-red-600 text-sm mt-1">{errors.profit_margin}</div>}
                                            </div>

                                            {/* Quantity */}
                                            <div>
                                                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                                                    จำนวนเริ่มต้น <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="quantity"
                                                    type="number"
                                                    min="0"
                                                    value={data.quantity}
                                                    onChange={(e) => setData('quantity', e.target.value)}
                                                    onWheel={(e) => e.target.blur()}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="0"
                                                    required
                                                />
                                                {errors.quantity && <div className="text-red-600 text-sm mt-1">{errors.quantity}</div>}
                                            </div>

                                            {/* Minimum Stock */}
                                            <div>
                                                <label htmlFor="min_stock" className="block text-sm font-medium text-gray-700 mb-2">
                                                    จำนวนขั้นต่ำในสต็อก <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="min_stock"
                                                    type="number"
                                                    min="0"
                                                    value={data.min_stock}
                                                    onChange={(e) => setData('min_stock', e.target.value)}
                                                    onWheel={(e) => e.target.blur()}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="0"
                                                    required
                                                />
                                                {errors.min_stock && <div className="text-red-600 text-sm mt-1">{errors.min_stock}</div>}
                                                <p className="text-sm text-gray-500 mt-1">แจ้งเตือนเมื่อสต็อกต่ำกว่าที่กำหนด</p>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                                คำอธิบาย
                                            </label>
                                            <textarea
                                                id="description"
                                                rows="4"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="กรอกรายละเอียดสินค้า..."
                                            />
                                            {errors.description && <div className="text-red-600 text-sm mt-1">{errors.description}</div>}
                                        </div>

                                        {/* Product Image */}
                                        <div>
                                            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                                                รูปภาพสินค้า
                                            </label>
                                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors duration-200">
                                                <div className="space-y-1 text-center">
                                                    {imagePreview ? (
                                                        <div className="mx-auto h-32 w-32 flex items-center justify-center">
                                                            <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg" />
                                                        </div>
                                                    ) : (
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    )}
                                                    <div className="flex text-sm text-gray-600">
                                                        <label htmlFor="image" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                            <span>อัปโหลดรูปภาพ</span>
                                                            <input
                                                                id="image"
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleImageChange}
                                                                className="sr-only"
                                                            />
                                                        </label>
                                                        <p className="pl-1">หรือลากมาวาง</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">PNG, JPG, GIF ขนาดไม่เกิน 5MB</p>
                                                </div>
                                            </div>
                                            {errors.image && <div className="text-red-600 text-sm mt-1">{errors.image}</div>}
                                        </div>

                                        {/* Lot Information Fields */}
                                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                            <h4 className="text-lg font-medium text-gray-900 mb-4">ข้อมูล Lot/Batch</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Lot Number */}
                                                <div>
                                                    <label htmlFor="lot_number" className="block text-sm font-medium text-gray-700 mb-2">
                                                        หมายเลข Lot/Batch
                                                    </label>
                                                    <input
                                                        id="lot_number"
                                                        type="text"
                                                        value={data.lot_number}
                                                        onChange={(e) => setData('lot_number', e.target.value)}
                                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                        placeholder="เช่น LOT001_250225"
                                                    />
                                                    {errors.lot_number && <div className="text-red-600 text-sm mt-1">{errors.lot_number}</div>}
                                                    <p className="text-xs text-gray-500 mt-1">รูปแบบ: LOT001_วันเดือนปี (สามารถแก้ไขได้)</p>
                                                </div>

                                                {/* Expiry Date */}
                                                <div>
                                                    <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-2">
                                                        วันหมดอายุ
                                                    </label>
                                                    <input
                                                        id="expiry_date"
                                                        type="date"
                                                        value={data.expiry_date}
                                                        onChange={(e) => setData('expiry_date', e.target.value)}
                                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                    {errors.expiry_date && <div className="text-red-600 text-sm mt-1">{errors.expiry_date}</div>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Active Status */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <input
                                                    id="is_active"
                                                    type="checkbox"
                                                    checked={data.is_active}
                                                    onChange={(e) => setData('is_active', e.target.checked)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="is_active" className="ml-3 block text-sm text-gray-900">
                                                    <span className="font-medium">เปิดใช้งานสินค้า</span>
                                                    <span className="block text-gray-500 text-xs">สินค้าที่เปิดใช้งานจะสามารถมองเห็นและใช้งานได้</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Warranty Section */}
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-medium text-yellow-900">การรับประกันสินค้า</h4>
                                                    <p className="text-sm text-yellow-700 mt-1">ระบุว่าสินค้านี้มีการรับประกันหรือไม่</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex space-x-4">
                                                <div className="flex items-center">
                                                    <input
                                                        id="warranty-no"
                                                        type="radio"
                                                        name="warranty"
                                                        value="0"
                                                        checked={data.warranty == 0}
                                                        onChange={(e) => setData('warranty', parseInt(e.target.value))}
                                                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                                                    />
                                                    <label htmlFor="warranty-no" className="ml-2 block text-sm text-gray-900">
                                                        ไม่มีการรับประกัน
                                                    </label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        id="warranty-yes"
                                                        type="radio"
                                                        name="warranty"
                                                        value="1"
                                                        checked={data.warranty == 1}
                                                        onChange={(e) => setData('warranty', parseInt(e.target.value))}
                                                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                                                    />
                                                    <label htmlFor="warranty-yes" className="ml-2 block text-sm text-gray-900">
                                                        มีการรับประกัน
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            {/* Warranty Duration Fields */}
                                            {data.warranty == 1 && (
                                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label htmlFor="warranty_days" className="block text-sm font-medium text-gray-700 mb-2">
                                                            วัน
                                                        </label>
                                                        <input
                                                            id="warranty_days"
                                                            type="number"
                                                            min="0"
                                                            value={data.warranty_days}
                                                            onChange={(e) => setData('warranty_days', parseInt(e.target.value) || 0)}
                                                            onWheel={(e) => e.target.blur()}
                                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            placeholder="0"
                                                        />
                                                        {errors.warranty_days && <div className="text-red-600 text-sm mt-1">{errors.warranty_days}</div>}
                                                    </div>
                                                    
                                                    <div>
                                                        <label htmlFor="warranty_months" className="block text-sm font-medium text-gray-700 mb-2">
                                                            เดือน
                                                        </label>
                                                        <input
                                                            id="warranty_months"
                                                            type="number"
                                                            min="0"
                                                            value={data.warranty_months}
                                                            onChange={(e) => setData('warranty_months', parseInt(e.target.value) || 0)}
                                                            onWheel={(e) => e.target.blur()}
                                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            placeholder="0"
                                                        />
                                                        {errors.warranty_months && <div className="text-red-600 text-sm mt-1">{errors.warranty_months}</div>}
                                                    </div>
                                                    
                                                    <div>
                                                        <label htmlFor="warranty_years" className="block text-sm font-medium text-gray-700 mb-2">
                                                            ปี
                                                        </label>
                                                        <input
                                                            id="warranty_years"
                                                            type="number"
                                                            min="0"
                                                            value={data.warranty_years}
                                                            onChange={(e) => setData('warranty_years', parseInt(e.target.value) || 0)}
                                                            onWheel={(e) => e.target.blur()}
                                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            placeholder="0"
                                                        />
                                                        {errors.warranty_years && <div className="text-red-600 text-sm mt-1">{errors.warranty_years}</div>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Submit Buttons */}
                                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                            <Link
                                                href={route('admin.products.index')}
                                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                                            >
                                                ยกเลิก
                                            </Link>
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                                            >
                                                {processing ? 'กำลังสร้าง...' : 'สร้างสินค้า'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Preview Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900">ตัวอย่างสินค้า</h3>
                                    <p className="text-sm text-gray-600 mt-1">ตัวอย่างการแสดงผล</p>
                                </div>
                                <div className="p-6">
                                    {/* Preview Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Product preview"
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        
                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                                data.is_active 
                                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                                    : 'bg-gray-100 text-gray-800 border-gray-200'
                                            }`}>
                                                {data.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Preview Details */}
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900">
                                                {data.name || 'ชื่อสินค้า'}
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                SKU: {data.sku || 'PRODUCT-SKU'}
                                            </p>
                                        </div>

                                        {data.category_id && (
                                            <div>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {categories.find(cat => cat.id == data.category_id)?.name || 'หมวดหมู่'}
                                                </span>
                                            </div>
                                        )}

                                        <div className="text-xl font-bold text-green-600">
                                            {formatCurrency(data.price)}
                                        </div>

                                        {/* Stock Information */}
                                        {(data.quantity || data.min_stock) && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">จำนวนเริ่มต้น:</span>
                                                    <span className="font-bold text-gray-900">{data.quantity || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">ขั้นต่ำ:</span>
                                                    <span className="text-gray-900">{data.min_stock || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">มูลค่ารวม:</span>
                                                    <span className="font-bold text-green-600">{formatCurrency(calculateTotalValue())}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Lot Information Preview */}
                                        {(data.lot_number || data.expiry_date) && (
                                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                <h5 className="text-sm font-medium text-blue-900 mb-2">ข้อมูล Lot/Batch</h5>
                                                <div className="space-y-1 text-xs">
                                                    {data.lot_number && (
                                                        <div className="flex justify-between">
                                                            <span className="text-blue-700">Lot:</span>
                                                            <span className="text-blue-900 font-medium">{data.lot_number}</span>
                                                        </div>
                                                    )}
                                                    {data.expiry_date && (
                                                        <div className="flex justify-between">
                                                            <span className="text-blue-700">หมดอายุ:</span>
                                                            <span className="text-blue-900 font-medium">
                                                                {new Date(data.expiry_date).toLocaleDateString('th-TH')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {data.description && (
                                            <div>
                                                <p className="text-sm text-gray-600">{data.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}