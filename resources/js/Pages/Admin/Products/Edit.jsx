
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function ProductsEdit({ auth, product, categories }) {
    const { data, setData, processing, errors } = useForm({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        image: null,
        category_id: product.category_id || '',
        price: product.price || '',
        cost_price: product.cost_price || '',
        profit_margin: product.profit_margin || '',
        quantity: product.quantity || '',
        min_stock: product.min_stock || '',
        is_active: product.is_active || false,
        warranty: product.warranty || 0,
        warranty_days: product.warranty_days || 0,
        warranty_months: product.warranty_months || 0,
        warranty_years: product.warranty_years || 0,
        lot_number: product.stock_lot_instances?.[0]?.lot_number || product.lot_number || '',
        expiry_date: product.stock_lot_instances?.[0]?.expiry_date || product.expiry_date || '',
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [isGeneratingLot, setIsGeneratingLot] = useState(false);

    // Auto-generate lot number only if product has NO existing lots at all
    useEffect(() => {
        const hasExistingLots = product.stock_lot_instances?.length > 0;
        if (!hasExistingLots && !data.lot_number) {
            generateLotNumber();
        }
    }, []);

    const generateLotNumber = async () => {
        setIsGeneratingLot(true);
        try {
            // Pass product_id for per-product lot numbering
            const response = await fetch(`/api/next-lot-number?product_id=${product.id}`);
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
    
    // Form data สำหรับ Stock Update พร้อม Lot Info
    const { 
        data: stockData, 
        setData: setStockData, 
        post: postStock, 
        processing: stockProcessing, 
        errors: stockErrors, 
        reset: resetStock 
    } = useForm({
        type: 'in',
        quantity: '',
        notes: '',
        lot_number: '',
        expiry_date: '',
    });

    // Function to generate auto lot number for stock modal
    const generateStockLotNumber = async () => {
        setIsGeneratingLot(true);
        try {
            const response = await fetch('/api/next-lot-number');
            const result = await response.json();
            if (result.lot_number) {
                setStockData('lot_number', result.lot_number);
            }
        } catch (error) {
            console.error('Failed to generate lot number:', error);
        } finally {
            setIsGeneratingLot(false);
        }
    };

    // Auto-generate lot number when stock modal opens with type 'in'
    // For 'out' and 'adjustment': use current FIFO lot (oldest with qty > 0)
    useEffect(() => {
        if (!showStockModal) return;

        if (stockData.type === 'in') {
            // Always generate a new lot number for stock-in
            generateStockLotNumber();
        } else {
            // For 'out' and 'adjustment': prefill with the current FIFO lot
            const fifoLot = product.stock_lot_instances?.[0];
            if (fifoLot) {
                setStockData('lot_number', fifoLot.lot_number);
                setStockData('expiry_date', fifoLot.expiry_date ?? '');
            } else {
                setStockData('lot_number', '');
                setStockData('expiry_date', '');
            }
        }
    }, [showStockModal, stockData.type]);

    const submit = (e) => {
        e.preventDefault();
        
        const hasNewImage = data.image !== null;
        
        router.post(route('admin.products.update', product.id), {
            ...data,
            _method: 'put'
        }, {
            forceFormData: hasNewImage,
            onSuccess: () => {
                console.log('Product updated successfully');
            },
            onError: (errors) => {
                console.error('Update failed:', errors);
            }
        });
    };

    const submitStockUpdate = (e) => {
        e.preventDefault();
        postStock(route('admin.products.stock', product.id), {
            onSuccess: () => {
                setShowStockModal(false);
                resetStock();
                // Refresh page หรือ update data
                window.location.reload();
            }
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('en-US').format(number);
    };

    const calculateTotalValue = () => {
        const price = parseFloat(data.price) || 0;
        const quantity = parseInt(data.quantity) || 0;
        return price * quantity;
    };

    const quantityChanged = parseInt(data.quantity) !== parseInt(product.quantity);

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title={`แก้ไขสินค้า: ${product.name}`} />

            <div className="py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">แก้ไขสินค้า</h1>
                                <p className="text-sm lg:text-base text-gray-600 mt-1 lg:mt-2">ปรับปรุงข้อมูลสินค้า: {product.name}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0 lg:ml-auto">
                                <button
                                    onClick={() => setShowStockModal(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                                >
                                    ปรับปรุงสต็อก
                                </button>
                                <Link
                                    href={route('admin.products.show', product.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                                >
                                    ดูสินค้า
                                </Link>
                                <Link
                                    href={route('admin.products.index')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                                >
                                    ← กลับไปยังรายการสินค้า
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900">ข้อมูลสินค้า</h3>
                                    <p className="text-sm text-gray-600 mt-1">ปรับปรุงรายละเอียดและการตั้งค่าสินค้า</p>
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
                                                    placeholder="กรอกรหัสสินค้า"
                                                    required
                                                />
                                                {errors.sku && <div className="text-red-600 text-sm mt-1">{errors.sku}</div>}
                                            </div>

                                            {/* Category */}
                                            <div>
                                                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                                                    หมวดหมู่ <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    id="category_id"
                                                    value={data.category_id}
                                                    onChange={(e) => {
                                                        const categoryId = e.target.value;
                                                        const oldCategoryId = data.category_id;
                                                        setData('category_id', categoryId);
                                                        
                                                        // Auto-fill SKU with category prefix only if SKU is empty or matches old category prefix
                                                        if (categoryId) {
                                                            const selectedCategory = categories.find(cat => cat.id == categoryId);
                                                            if (selectedCategory && selectedCategory.categories_sku) {
                                                                // Check if current SKU is empty or starts with old category prefix
                                                                const oldCategory = categories.find(cat => cat.id == oldCategoryId);
                                                                const currentSku = data.sku || '';
                                                                
                                                                // Only auto-fill if SKU is empty or matches the old category pattern
                                                                if (!currentSku || (oldCategory && currentSku.startsWith(oldCategory.categories_sku))) {
                                                                    setData('sku', selectedCategory.categories_sku);
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="">เลือกหมวดหมู่</option>
                                                    {categories && categories.map((category) => (
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
                                                    ราคา (บาท) <span className="text-red-500">*</span>
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
                                                    จำนวนปัจจุบัน <span className="text-red-500">*</span>
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
                                                <p className="text-sm text-gray-500 mt-1">
                                                    ปัจจุบัน: {formatNumber(product.quantity)} 
                                                    {quantityChanged && (
                                                        <span className="text-orange-600 font-medium"> → เปลี่ยนเป็น {formatNumber(data.quantity)}</span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Minimum Stock */}
                                            <div>
                                                <label htmlFor="min_stock" className="block text-sm font-medium text-gray-700 mb-2">
                                                    จำนวนขั้นต่ำ <span className="text-red-500">*</span>
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
                                            </div>
                                        </div>

                                        {/* Quantity Change Warning */}
                                        {quantityChanged && (
                                            <div className="bg-orange-5 border border-orange-200 rounded-lg p-4">
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <h3 className="text-sm font-medium text-orange-800">การเปลี่ยนแปลงจำนวนสต็อก</h3>
                                                        <div className="mt-2 text-sm text-orange-700">
                                                            <p>การเปลี่ยนจำนวนจาก {formatNumber(product.quantity)} เป็น {formatNumber(data.quantity)} จะสร้างบันทึกการเคลื่อนไหวสต็อก</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

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
                                                        value={data.lot_number || ''}
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
                                                        value={data.expiry_date || ''}
                                                        onChange={(e) => setData('expiry_date', e.target.value)}
                                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                    {errors.expiry_date && <div className="text-red-600 text-sm mt-1">{errors.expiry_date}</div>}
                                                </div>
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

                                        {/* Current Image */}
                                        {product.image && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพปัจจุบัน</label>
                                                <div className="mt-1">
                                                    <img 
                                                        src={`/storage/products/${product.image}`} 
                                                        alt={product.name}
                                                        className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Product Image Upload */}
                                        <div>
                                            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                                                {product.image ? 'เปลี่ยนรูปภาพ' : 'รูปภาพสินค้า'}
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
                                                            <span>{product.image ? 'อัปโหลดรูปใหม่' : 'อัปโหลดรูปภาพ'}</span>
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
                                                    <span className="block text-gray-500 text-xs">สินค้าที่เปิดใช้งานจะมองเห็นได้และสามารถใช้งานได้</span>
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
                                                href={route('admin.products.show', product.id)}
                                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                                            >
                                                ยกเลิก
                                            </Link>
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                                            >
                                                {processing ? 'กำลังอัปเดต...' : 'อัปเดตสินค้า'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Product Info Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900">ข้อมูลสินค้า</h3>
                                    <p className="text-sm text-gray-600 mt-1">รายละเอียดสินค้าปัจจุบัน</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">รหัสสินค้า</dt>
                                        <dd className="text-sm text-gray-900 mt-1 font-mono bg-gray-50 px-2 py-1 rounded">{product.id}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">หมวดหมู่ปัจจุบัน</dt>
                                        <dd className="text-sm text-gray-900 mt-1">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {product.category?.name || 'ไม่มีหมวดหมู่'}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">วันที่สร้าง</dt>
                                        <dd className="text-sm text-gray-900 mt-1">{formatDate(product.created_at)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">อัปเดตล่าสุด</dt>
                                        <dd className="text-sm text-gray-900 mt-1">{formatDate(product.updated_at)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">มูลค่ารวมปัจจุบัน</dt>
                                        <dd className="text-sm text-gray-900 mt-1 font-bold text-green-600">
                                            {formatCurrency(product.price * product.quantity)}
                                        </dd>
                                    </div>
                                    {calculateTotalValue() !== (product.price * product.quantity) && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">มูลค่ารวมใหม่</dt>
                                            <dd className="text-sm text-gray-900 mt-1 font-bold text-orange-600">
                                                {formatCurrency(calculateTotalValue())}
                                            </dd>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock Update Modal with Lot Info */}
            {showStockModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-2xl bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">ปรับปรุงสต็อกพร้อมข้อมูล Lot</h3>
                                <button
                                    onClick={() => {
                                        setShowStockModal(false);
                                        resetStock();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <form onSubmit={submitStockUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทการเคลื่อนไหว</label>
                                        <select
                                            value={stockData.type}
                                            onChange={(e) => setStockData('type', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="in">นำเข้า (+)</option>
                                            <option value="out">เบิกออก (-)</option>
                                            <option value="adjustment">ปรับปรุง</option>
                                        </select>
                                        {stockErrors.type && <div className="text-red-600 text-sm mt-1">{stockErrors.type}</div>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {stockData.type === 'adjustment' ? 'จำนวนใหม่' : 'จำนวน'}
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={stockData.quantity}
                                            onChange={(e) => setStockData('quantity', e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="กรอกจำนวน"
                                            required
                                        />
                                        {stockErrors.quantity && <div className="text-red-600 text-sm mt-1">{stockErrors.quantity}</div>}
                                        <p className="text-sm text-gray-500 mt-1">จำนวนปัจจุบัน: {formatNumber(product.quantity)}</p>
                                    </div>
                                </div>

                                {/* Lot Information Fields */}
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">ข้อมูล Lot/Batch</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Lot Number */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                หมายเลข Lot/Batch
                                            </label>
                                            <input
                                                type="text"
                                                value={stockData.lot_number}
                                                onChange={(e) => setStockData('lot_number', e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="เช่น LOT001_250225"
                                            />
                                            {stockErrors.lot_number && <div className="text-red-600 text-sm mt-1">{stockErrors.lot_number}</div>}
                                            <p className="text-xs text-gray-500 mt-1">รูปแบบ: LOT001_วันเดือนปี (สามารถแก้ไขได้)</p>
                                        </div>

                                        {/* Expiry Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                วันหมดอายุ
                                            </label>
                                            <input
                                                type="date"
                                                value={stockData.expiry_date}
                                                onChange={(e) => setStockData('expiry_date', e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            {stockErrors.expiry_date && <div className="text-red-600 text-sm mt-1">{stockErrors.expiry_date}</div>}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
                                    <textarea
                                        rows="3"
                                        value={stockData.notes}
                                        onChange={(e) => setStockData('notes', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับการเคลื่อนไหวนี้ (ไม่บังคับ)"
                                    />
                                    {stockErrors.notes && <div className="text-red-600 text-sm mt-1">{stockErrors.notes}</div>}
                                </div>

                                {/* Lot Information Preview */}
                                {(stockData.lot_number || stockData.expiry_date) && (
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <h5 className="text-sm font-medium text-blue-900 mb-3">ตัวอย่างข้อมูล Lot ที่จะบันทึก</h5>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {stockData.lot_number && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700">Lot:</span>
                                                    <span className="text-blue-900 font-medium">{stockData.lot_number}</span>
                                                </div>
                                            )}
                                            {stockData.expiry_date && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700">หมดอายุ:</span>
                                                    <span className="text-blue-900 font-medium">
                                                        {new Date(stockData.expiry_date).toLocaleDateString('th-TH')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowStockModal(false);
                                            resetStock();
                                        }}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={stockProcessing}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {stockProcessing ? 'กำลังปรับปรุง...' : 'ปรับปรุงสต็อก'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
