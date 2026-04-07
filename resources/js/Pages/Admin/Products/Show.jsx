// resources/js/Pages/Admin/Products/Show.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

export default function ProductsShow({ auth, product, salesStats, recentMovements, recentSales }) {
    const [showStockModal, setShowStockModal] = useState(false);
    const [showLotInfo, setShowLotInfo] = useState(false);
    const [lotPage, setLotPage] = useState(1);
    const [isManualPageChange, setIsManualPageChange] = useState(false);
    const lotSectionRef = useRef(null);

    // Scroll to Lot section ONLY when user clicks pagination buttons
    useEffect(() => {
        if (isManualPageChange && lotSectionRef.current) {
            setTimeout(() => {
                lotSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            setIsManualPageChange(false);
        }
    }, [lotPage, isManualPageChange]);
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'in',
        quantity: '',
        notes: '',
        lot_number: '',
        expiry_date: '',
    });

    const [isGeneratingLot, setIsGeneratingLot] = useState(false);

    // Auto-generate lot number when opening modal for 'in' type
    useEffect(() => {
        if (showStockModal && data.type === 'in' && !data.lot_number) {
            generateLotNumber();
        }
    }, [showStockModal, data.type]);

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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('en-US').format(number);
    };

    const getStockStatusColor = () => {
        if (product.quantity <= 0) return 'bg-red-100 text-red-800 border-red-200';
        if (product.quantity <= product.min_stock) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    const getStockStatusText = () => {
        if (product.quantity <= 0) return 'สินค้าหมด';
        if (product.quantity <= product.min_stock) return 'สินค้าใกล้หมด';
        return 'มีสินค้า';
    };

    const getStockStatusIcon = () => {
        if (product.quantity <= 0) return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        );
        if (product.quantity <= product.min_stock) return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
        );
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    };

    const submitStockUpdate = (e) => {
        e.preventDefault();
        post(route('admin.products.stock', product.id), {
            onSuccess: () => {
                setShowStockModal(false);
                reset();
            }
        });
    };

    const getMovementTypeColor = (type) => {
        switch (type) {
            case 'in': return 'bg-green-100 text-green-800 border-green-200';
            case 'out': return 'bg-red-100 text-red-800 border-red-200';
            case 'adjustment': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getMovementTypeText = (type) => {
        switch (type) {
            case 'in': return 'นำเข้า';
            case 'out': return 'เบิกออก';
            case 'adjustment': return 'ปรับปรุง';
            default: return type;
        }
    };

    const getMovementTypeIcon = (type) => {
        switch (type) {
            case 'in': return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            );
            case 'out': return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                </svg>
            );
            case 'adjustment': return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            );
            default: return null;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`สินค้า: ${product.name}`} />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">รายละเอียดสินค้า</h1>
                                <p className="text-gray-600 mt-2">{product.name}</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <button
                                    onClick={() => setShowStockModal(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    ปรับปรุงสต็อก
                                </button>
                                <Link
                                    href={route('admin.products.edit', product.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    แก้ไขสินค้า
                                </Link>
                                <Link
                                    href={route('admin.products.index')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    กลับไปยังรายการสินค้า
                                </Link>
                            </div>
                        </div>
                    </div>
                    {/* Sales Statistics Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">เคยมีในคลังทั้งหมด</p>
                                    <p className="text-2xl font-bold">{formatNumber(salesStats.total_ever_in_stock)}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">ขายไปแล้ว</p>
                                    <p className="text-2xl font-bold">{formatNumber(salesStats.total_sold)}</p>
                                    <p className="text-green-100 text-xs">{salesStats.sales_percentage}% ของทั้งหมด</p>
                                </div>
                                <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm font-medium">คงเหลือในคลัง</p>
                                    <p className="text-2xl font-bold">{formatNumber(salesStats.current_stock)}</p>
                                    <p className="text-orange-100 text-xs">{salesStats.remaining_percentage}% ของทั้งหมด</p>
                                </div>
                                <div className="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">มูลค่าการขาย</p>
                                    <p className="text-xl font-bold">{formatCurrency(salesStats.total_sales_value)}</p>
                                    <p className="text-purple-100 text-xs">ราคาเฉลี่ย {formatCurrency(salesStats.average_sale_price)}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">สัดส่วนสินค้าในคลัง</h3>
                        <div className="space-y-4">
                            <div className="w-full bg-gray-200 rounded-full h-8">
                                <div className="flex h-8 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
                                        style={{ width: `${salesStats.sales_percentage}%` }}
                                    >
                                        {salesStats.sales_percentage > 10 ? `ขายแล้ว ${salesStats.sales_percentage}%` : ''}
                                    </div>
                                    <div 
                                        className="bg-orange-500 flex items-center justify-center text-white text-sm font-medium"
                                        style={{ width: `${salesStats.remaining_percentage}%` }}
                                    >
                                        {salesStats.remaining_percentage > 10 ? `คงเหลือ ${salesStats.remaining_percentage}%` : ''}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span>ขายไปแล้ว: {formatNumber(salesStats.total_sold)} ชิ้น</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                    <span>คงเหลือ: {formatNumber(salesStats.current_stock)} ชิ้น</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Overview & Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Product Details */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลสินค้า</h3>
                                            
                                            {/* Product Image */}
                                            <div className="mb-6">
                                                {product.image ? (
                                                    <img 
                                                        src={`/storage/products/${product.image}`} 
                                                        alt={product.name}
                                                        className="h-64 w-64 object-cover rounded-xl border border-gray-200 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="h-64 w-64 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border border-gray-200">
                                                        <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <dl className="space-y-4">
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">ชื่อสินค้า</dt>
                                                    <dd className="text-lg font-semibold text-gray-900 mt-1">{product.name}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">รหัสสินค้า (SKU)</dt>
                                                    <dd className="text-sm text-gray-900 mt-1 font-mono bg-gray-50 px-2 py-1 rounded">{product.sku}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">หมวดหมู่</dt>
                                                    <dd className="text-sm text-gray-900 mt-1">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                            {product.category.name}
                                                        </span>
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">ราคาขาย</dt>
                                                    <dd className="text-xl font-bold text-green-600 mt-1">{formatCurrency(product.price)}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">ราคาต้นทุน</dt>
                                                    <dd className="text-xl font-bold text-orange-600 mt-1">{product.cost_price && product.cost_price > 0 ? formatCurrency(product.cost_price) : '-'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">กำไร</dt>
                                                    <dd className="text-xl font-bold text-purple-600 mt-1">{product.profit_margin ? `${product.profit_margin}%` : '-'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">สถานะ</dt>
                                                    <dd className="text-sm text-gray-900 mt-1">
                                                        <div className="flex items-center space-x-2">
                                                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStockStatusColor()}`}>
                                                                {getStockStatusIcon()}
                                                                <span className="ml-1">{getStockStatusText()}</span>
                                                            </div>
                                                            {!product.is_active && (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                                    ปิดใช้งาน
                                                                </span>
                                                            )}
                                                        </div>
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">การรับประกัน</dt>
                                                    <dd className="text-sm text-gray-900 mt-1">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                                            product.warranty == 1 
                                                                ? 'bg-green-100 text-green-800 border-green-200' 
                                                                : 'bg-gray-100 text-gray-800 border-gray-200'
                                                        }`}>
                                                            {product.warranty == 1 ? 'มีการรับประกัน' : 'ไม่มีการรับประกัน'}
                                                            
                                                            {/* Show warranty duration on the same line if product has warranty */}
                                                            {product.warranty == 1 && (
                                                                <span>
                                                                    {product.warranty_years > 0 && ` ${product.warranty_years} ปี`}
                                                                    {product.warranty_months > 0 && ` ${product.warranty_months} เดือน`}
                                                                    {product.warranty_days > 0 && ` ${product.warranty_days} วัน`}
                                                                    {(product.warranty_years === 0 && product.warranty_months === 0 && product.warranty_days === 0) && ' ไม่ระบุ'}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </dd>
                                                </div>
                                                {product.description && (
                                                    <div>
                                                        <dt className="text-sm font-medium text-gray-500">คำอธิบาย</dt>
                                                        <dd className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">{product.description}</dd>
                                                    </div>
                                                )}
                                            </dl>
                                        </div>

                                        {/* Sales Performance */}
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 mb-6">ประสิทธิภาพการขาย</h3>
                                            <div className="space-y-6">
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-blue-800">ขายในเดือนนี้</p>
                                                            <p className="text-2xl font-bold text-blue-900">{formatNumber(salesStats.sales_this_month)}</p>
                                                        </div>
                                                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-green-800">ขายในสัปดาห์นี้</p>
                                                            <p className="text-2xl font-bold text-green-900">{formatNumber(salesStats.sales_this_week)}</p>
                                                        </div>
                                                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-purple-800">การขายล่าสุด</p>
                                                            <p className="text-sm font-bold text-purple-900">
                                                                {salesStats.last_sale_date ? formatDate(salesStats.last_sale_date) : 'ยังไม่มีการขาย'}
                                                            </p>
                                                        </div>
                                                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-600">วันที่สร้าง:</span>
                                                            <span className="text-gray-900">{formatDate(product.created_at)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-600">อัปเดตล่าสุด:</span>
                                                            <span className="text-gray-900">{formatDate(product.updated_at)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-600">มูลค่าคงเหลือ:</span>
                                                            <span className="text-gray-900 font-bold">{formatCurrency(product.price * product.quantity)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Current Stock Status */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-xl font-semibold text-gray-900">สถานะสต็อก</h3>
                                    <p className="text-sm text-gray-600 mt-1">ข้อมูลสต็อกปัจจุบัน</p>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-800">จำนวนคงเหลือปัจจุบัน</p>
                                                    <p className="text-3xl font-bold text-blue-900">{formatNumber(product.quantity)}</p>
                                                </div>
                                                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-orange-800">จำนวนขั้นต่ำ</p>
                                                    <p className="text-2xl font-bold text-orange-900">{formatNumber(product.min_stock)}</p>
                                                </div>
                                                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">ความคืบหน้าสต็อค:</span>
                                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full ${
                                                                product.quantity <= 0 ? 'bg-red-500' :
                                                                product.quantity <= product.min_stock ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}
                                                            style={{
                                                                width: `${Math.min(100, Math.max(10, (product.quantity / (product.min_stock * 2)) * 100))}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lot Information */}
                    {product.stock_lot_instances && product.stock_lot_instances.length > 0 && (
                        <div ref={lotSectionRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">ข้อมูล Lot</h3>
                                        <p className="text-sm text-gray-600 mt-1">รายละเอียด Lot สินค้า ({product.stock_lot_instances.length} รายการ)</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                {/* Calculate pagination */}
                                {(() => {
                                    const lotsPerPage = 4;
                                    const totalPages = Math.ceil(product.stock_lot_instances.length / lotsPerPage);
                                    const startIndex = (lotPage - 1) * lotsPerPage;
                                    const endIndex = startIndex + lotsPerPage;
                                    const paginatedLots = product.stock_lot_instances.slice(startIndex, endIndex);

                                    return (
                                        <>
                                            <div className="space-y-3">
                                                {paginatedLots.map((lot, index) => {
                                                    const isExpired = lot.expiry_date && new Date(lot.expiry_date) < new Date();
                                                    const daysUntilExpiry = lot.expiry_date 
                                                        ? Math.ceil((new Date(lot.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
                                                        : null;
                                                    const isExpiringSoon = daysUntilExpiry && daysUntilExpiry > 0 && daysUntilExpiry < 30;
                                                    const isOutOfStock = lot.quantity === 0;

                                                    let bgColor = 'bg-green-50 border-green-200';
                                                    let textColor = 'text-green-900';
                                                    let labelColor = 'text-green-700';
                                                    let badgeColor = 'bg-green-100 text-green-800';
                                                    let statusText = 'ปกติ';

                                                    if (isOutOfStock) {
                                                        bgColor = 'bg-red-50 border-red-200';
                                                        textColor = 'text-red-900';
                                                        labelColor = 'text-red-700';
                                                        badgeColor = 'bg-red-100 text-red-800';
                                                        statusText = 'หมดแล้ว';
                                                    } else if (isExpired) {
                                                        bgColor = 'bg-red-50 border-red-200';
                                                        textColor = 'text-red-900';
                                                        labelColor = 'text-red-700';
                                                        badgeColor = 'bg-red-100 text-red-800';
                                                        statusText = 'หมดอายุ';
                                                    } else if (isExpiringSoon) {
                                                        bgColor = 'bg-orange-50 border-orange-200';
                                                        textColor = 'text-orange-900';
                                                        labelColor = 'text-orange-700';
                                                        badgeColor = 'bg-orange-100 text-orange-800';
                                                        statusText = 'ใกล้หมดอายุ';
                                                    }

                                                    return (
                                                        <div key={lot.id} className={`${bgColor} border rounded-xl p-5 hover:shadow-sm transition-shadow duration-200`}>
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center space-x-3 mb-2">
                                                                        <span className={`text-lg font-bold ${textColor}`}>
                                                                            {lot.lot_number}
                                                                        </span>
                                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
                                                                            {statusText}
                                                                        </span>
                                                                    </div>
                                                                    <p className={`text-xs ${labelColor}`}>Lot #{startIndex + index + 1}</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-4">
                                                                <div className="bg-white bg-opacity-50 rounded-lg p-3">
                                                                    <p className={`text-xs font-medium ${labelColor} mb-1`}>จำนวน</p>
                                                                    <p className={`text-2xl font-bold ${textColor}`}>
                                                                        {formatNumber(lot.quantity)}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 mt-1">ชิ้น</p>
                                                                </div>

                                                                {lot.expiry_date && (
                                                                    <div className="bg-white bg-opacity-50 rounded-lg p-3">
                                                                        <p className={`text-xs font-medium ${labelColor} mb-1`}>หมดอายุ</p>
                                                                        <p className={`text-sm font-semibold ${textColor}`}>
                                                                            {formatDate(lot.expiry_date)}
                                                                        </p>
                                                                        {daysUntilExpiry && !isExpired && (
                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                {daysUntilExpiry} วันข้างหน้า
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <div className="bg-white bg-opacity-50 rounded-lg p-3">
                                                                    <p className={`text-xs font-medium ${labelColor} mb-1`}>สร้างวันที่</p>
                                                                    <p className={`text-sm font-semibold ${textColor}`}>
                                                                        {formatDate(lot.created_at)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Pagination Controls */}
                                            {totalPages > 1 && (
                                                <div className="mt-6 flex items-center justify-between">
                                                    <div className="text-sm text-gray-600">
                                                        แสดง {startIndex + 1} ถึง {Math.min(endIndex, product.stock_lot_instances.length)} จากทั้งหมด {product.stock_lot_instances.length} รายการ
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => { setIsManualPageChange(true); setLotPage(1); }}
                                                            disabled={lotPage === 1}
                                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                                lotPage === 1
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            }`}
                                                        >
                                                            «
                                                        </button>
                                                        <button
                                                            onClick={() => { setIsManualPageChange(true); setLotPage(Math.max(1, lotPage - 1)); }}
                                                            disabled={lotPage === 1}
                                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                                lotPage === 1
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            }`}
                                                        >
                                                            ‹
                                                        </button>
                                                        
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                            <button
                                                                key={page}
                                                                onClick={() => { setIsManualPageChange(true); setLotPage(page); }}
                                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                                    lotPage === page
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        ))}

                                                        <button
                                                            onClick={() => { setIsManualPageChange(true); setLotPage(Math.min(totalPages, lotPage + 1)); }}
                                                            disabled={lotPage === totalPages}
                                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                                lotPage === totalPages
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            }`}
                                                        >
                                                            ›
                                                        </button>
                                                        <button
                                                            onClick={() => { setIsManualPageChange(true); setLotPage(totalPages); }}
                                                            disabled={lotPage === totalPages}
                                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                                lotPage === totalPages
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            }`}
                                                        >
                                                            »
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Recent Sales History */}
                    {recentSales && recentSales.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">ประวัติการขายล่าสุด</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            พบ {recentSales.length} รายการ
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 whitespace-nowrap">
                                                วันที่ขาย
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                จำนวน
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                ราคาต่อหน่วย
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                รวม
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                พนักงานขาย
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentSales.map((saleItem) => (
                                            <tr key={saleItem.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">
                                                            {new Date(saleItem.sale.sale_date).toLocaleDateString('th-TH', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-gray-500">
                                                            {new Date(saleItem.sale.sale_date).toLocaleTimeString('th-TH', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-blue-600">
                                                        {formatNumber(saleItem.quantity)} ชิ้น
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-900">
                                                        {formatCurrency(saleItem.unit_price)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-green-600">
                                                        {formatCurrency(saleItem.total_price)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">
                                                                {saleItem.sale.user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-gray-900">{saleItem.sale.user.name}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Recent Stock Movements */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">การเคลื่อนไหวสต็อกล่าสุด</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        พบ {recentMovements.length} รายการ
                                    </p>
                                </div>
                                <Link
                                    href={route('admin.reports.stock-movements', { product_id: product.id })}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    ดูการเคลื่อนไหวทั้งหมด →
                                </Link>
                            </div>
                        </div>
                        
                        {recentMovements.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 whitespace-nowrap">
                                                วันที่และเวลา
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                ประเภท
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                จำนวน
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                ระดับสต็อก
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                ผู้ใช้งาน
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                หมายเหตุ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentMovements.map((movement) => (
                                            <tr key={movement.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">
                                                            {new Date(movement.created_at).toLocaleDateString('th-TH', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-gray-500">
                                                            {new Date(movement.created_at).toLocaleTimeString('th-TH', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getMovementTypeColor(movement.type)}`}>
                                                        {getMovementTypeIcon(movement.type)}
                                                        <span className="ml-1">{getMovementTypeText(movement.type)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm font-bold ${
                                                        movement.type === 'in' ? 'text-green-600' : 
                                                        movement.type === 'out' ? 'text-red-600' : 
                                                        'text-blue-600'
                                                    }`}>
                                                        {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}{formatNumber(movement.quantity)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2 text-sm">
                                                            <span className="text-gray-600">ก่อนหน้า:</span>
                                                            <span className="font-medium text-gray-900">{formatNumber(movement.previous_quantity)}</span>
                                                            <span className="text-gray-400">→</span>
                                                            <span className="text-gray-600">หลังจาก:</span>
                                                            <span className="font-medium text-gray-900">{formatNumber(movement.new_quantity)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">
                                                                {movement.user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-gray-900">{movement.user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                                    {movement.notes ? (
                                                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                                                            <p className="truncate">{movement.notes}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">ยังไม่มีการเคลื่อนไหว</h3>
                                <p className="mt-2 text-gray-500">ยังไม่มีการบันทึกการเคลื่อนไหวสต็อกสำหรับสินค้านี้</p>
                                <button
                                    onClick={() => setShowStockModal(true)}
                                    className="mt-4 inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                >
                                    เพิ่มการเคลื่อนไหวครั้งแรก
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                </div>
            </div>

            {/* Stock Update Modal with Lot Info */}
            {showStockModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-2xl bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">ปรับปรุงสต็อก</h3>
                                <button
                                    onClick={() => {
                                        setShowStockModal(false);
                                        setShowLotInfo(false);
                                        reset();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={submitStockUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทการเคลื่อนไหว</label>
                                    <select
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="in">นำเข้า (+)</option>
                                        <option value="out">เบิกออก (-)</option>
                                        <option value="adjustment">ปรับปรุง</option>
                                    </select>
                                    {errors.type && <div className="text-red-600 text-sm mt-1">{errors.type}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {data.type === 'adjustment' ? 'จำนวนใหม่' : 'จำนวน'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.quantity}
                                        onChange={(e) => setData('quantity', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="กรอกจำนวน"
                                        required
                                    />
                                    {errors.quantity && <div className="text-red-600 text-sm mt-1">{errors.quantity}</div>}
                                    <p className="text-sm text-gray-500 mt-1">จำนวนปัจจุบัน: {formatNumber(product.quantity)}</p>
                                </div>

                                {/* Lot Information Toggle */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-blue-900">เพิ่มข้อมูล Lot</span>
                                        <button
                                            type="button"
                                            onClick={() => setShowLotInfo(!showLotInfo)}
                                            className={`px-3 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                                                showLotInfo 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-white text-blue-600 border border-blue-300'
                                            }`}
                                        >
                                            {showLotInfo ? 'ซ่อน' : 'เพิ่ม'}
                                        </button>
                                    </div>
                                </div>

                                {/* Lot Information Fields */}
                                {showLotInfo && (
                                    <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเลข Lot</label>
                                            <input
                                                type="text"
                                                value={data.lot_number}
                                                onChange={(e) => setData('lot_number', e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="เช่น LOT001_250225"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">รูปแบบ: LOT001_วันเดือนปี (สามารถแก้ไขได้)</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">วันหมดอายุ</label>
                                            <input
                                                type="date"
                                                value={data.expiry_date}
                                                onChange={(e) => setData('expiry_date', e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>

                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
                                    <textarea
                                        rows="3"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับการเคลื่อนไหวนี้ (ไม่บังคับ)"
                                    />
                                    {errors.notes && <div className="text-red-600 text-sm mt-1">{errors.notes}</div>}
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowStockModal(false);
                                            setShowLotInfo(false);
                                            reset();
                                        }}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {processing ? 'กำลังปรับปรุง...' : 'ปรับปรุงสต็อก'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
};