// resources/js/Pages/Admin/EOQ/Dashboard.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import DashboardCharts from '@/Components/EOQ/DashboardCharts';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

export default function EoqDashboard({ auth, productsWithEoq, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    
    const [viewMode, setViewMode] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlView = urlParams.get('view');
        if (urlView === 'grid' || urlView === 'table') {
            return urlView;
        }
        return localStorage.getItem('eoq_view_mode') || 'grid';
    });

    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    };

    const formatNumber = (number) => {
        if (number === null || number === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US').format(number);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'ยังไม่คำนวณ';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getEoqStatusColor = (product) => {
        if (!product.eoq_calculation) return 'bg-gray-100 text-gray-800 border-gray-200';
        return 'bg-blue-100 text-blue-800 border-blue-200';
    };

    const getEoqStatusText = (product) => {
        if (!product.eoq_calculation) return 'ยังไม่คำนวณ';
        return 'คำนวณแล้ว';
    };

    const getEoqStatusIcon = (product) => {
        if (!product.eoq_calculation) return (
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

    const changeViewMode = (newMode) => {
        setViewMode(newMode);
        localStorage.setItem('eoq_view_mode', newMode);
        
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.set('view', newMode);
        
        const newUrl = window.location.pathname + '?' + currentParams.toString();
        window.history.replaceState({}, '', newUrl);
    };

    // Component สำหรับแสดงกราฟ EOQ Top 10
    const EoqTop10Tables = ({ productsWithEoq, formatCurrency, formatNumber }) => {
        // Filter products that have EOQ calculations
        const productsWithEoqData = productsWithEoq.data.filter(p => p.eoq_calculation);

        // Sort by actual sales quantity (high to low) for top selling
        const topSelling = [...productsWithEoqData]
            .sort((a, b) => (b.sale_items_sum_quantity || 0) - (a.sale_items_sum_quantity || 0))
            .slice(0, 10)
            .map(p => ({
                name: p.sku?.substring(0, 10) || p.name?.substring(0, 10) || 'N/A',
                fullName: p.name,
                sku: p.sku,
                image: p.image,
                sales: parseFloat(p.sale_items_sum_quantity || 0),
                demand: parseFloat(p.eoq_calculation.annual_demand || 0),
                eoq: parseFloat(p.eoq_calculation.eoq || 0),
                orders: parseFloat(p.eoq_calculation.number_of_orders || 0),
            }));

        // Sort by actual sales quantity (low to high) for focus products
        const focusProducts = [...productsWithEoqData]
            .sort((a, b) => (a.sale_items_sum_quantity || 0) - (b.sale_items_sum_quantity || 0))
            .slice(0, 10)
            .map(p => ({
                name: p.sku?.substring(0, 10) || p.name?.substring(0, 10) || 'N/A',
                fullName: p.name,
                sku: p.sku,
                image: p.image,
                sales: parseFloat(p.sale_items_sum_quantity || 0),
                demand: parseFloat(p.eoq_calculation.annual_demand || 0),
                eoq: parseFloat(p.eoq_calculation.eoq || 0),
                orders: parseFloat(p.eoq_calculation.number_of_orders || 0),
            }));

        // Custom tooltip with product image
        const CustomTooltip = ({ active, payload, label }) => {
            if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                    <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-200 min-w-[260px]">
                        {/* Product Image */}
                        <div className="flex justify-center mb-3">
                            {data.image ? (
                                <img 
                                    src={`/storage/products/${data.image}`} 
                                    alt={data.fullName}
                                    className="h-20 w-20 rounded-xl object-cover border-2 border-gray-100 shadow-md"
                                />
                            ) : (
                                <div className="h-20 w-20 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-gray-100">
                                    <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="text-center mb-3">
                            <p className="font-bold text-gray-900 text-sm">{data.fullName}</p>
                            <p className="text-xs text-gray-500 mt-1">SKU: {data.sku}</p>
                        </div>
                        
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-center mb-2">
                            <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                                <p className="text-xs text-purple-600">ยอดขายจริง</p>
                                <p className="text-sm font-bold text-purple-700">{formatNumber(data.sales)}</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-600">ต้องการ/ปี</p>
                                <p className="text-sm font-bold text-blue-700">{formatNumber(data.demand)}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                                <p className="text-xs text-green-600">EOQ</p>
                                <p className="text-sm font-bold text-green-700">{formatNumber(data.eoq)}</p>
                            </div>
                            <div className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                                <p className="text-xs text-orange-600">สั่งซื้อ</p>
                                <p className="text-sm font-bold text-orange-700">{data.orders.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>
                );
            }
            return null;
        };

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top 10 Best Selling Products - Bar Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">EOQ 10 สินค้าขายดีที่สุด</h3>
                                <p className="text-sm text-gray-600">สินค้าที่มีความต้องการสูงสุด</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {topSelling.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={topSelling} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(value) => formatNumber(value)} />
                                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="demand" name="ความต้องการ/ปี" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p>ไม่มีข้อมูล EOQ</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top 10 Focus Products - Bar Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">EOQ 10 สินค้าที่ควรโฟกัส</h3>
                                <p className="text-sm text-gray-600">สินค้าที่มีความต้องการต่ำ (ขายไม่ดี)</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {focusProducts.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={focusProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(value) => formatNumber(value)} />
                                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="demand" name="ความต้องการ/ปี" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p>ไม่มีข้อมูล EOQ</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Component สำหรับ EOQ Card View
    const EoqCard = ({ product }) => {
        const eoqData = product.eoq_calculation;

        return (
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
                    {product.image ? (
                        <img
                            src={`/storage/products/${product.image}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                    
                    {/* EOQ Status Badge */}
                    <div className="absolute top-3 right-3">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEoqStatusColor(product)}`}>
                            {getEoqStatusIcon(product)}
                            <span className="ml-1">{getEoqStatusText(product)}</span>
                        </div>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            {product.category.name}
                        </span>
                    </div>

                    {/* Inactive Badge */}
                    {!product.is_active && (
                        <div className="absolute bottom-3 left-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                ไม่เปิดใช้งาน
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">รหัสสินค้า: {product.sku}</p>

                    {/* Price */}
                    <div className="text-xl font-bold text-green-600 mb-4">
                        {formatCurrency(product.price)}
                    </div>

                    {/* EOQ Information */}
                    <div className="space-y-3 mb-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">ข้อมูล EOQ</h4>
                            
                            {eoqData ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700">EOQ:</span>
                                        <span className="text-lg font-bold text-blue-600">{formatNumber(eoqData.eoq)} หน่วย</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700">ต้นทุนรวม/ปี:</span>
                                        <span className="font-medium text-blue-600">{formatCurrency(eoqData.total_cost)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700">คำนวณเมื่อ:</span>
                                        <span className="text-sm text-blue-600">{formatDate(eoqData.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700">จำนวนครั้งสั่งซื้อ:</span>
                                        <span className="text-sm text-blue-600">{parseFloat(eoqData.number_of_orders).toFixed(2)} ครั้ง/ปี</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <p className="mt-2 text-sm text-gray-500">ยังไม่มีการคำนวณ EOQ</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stock Info */}
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">คงเหลือ:</span>
                            <span className="font-bold text-gray-900">{formatNumber(product.quantity)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">ขั้นต่ำ:</span>
                            <span className="text-gray-900">{formatNumber(product.min_stock)}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                        {eoqData ? (
                            <>
                                <Link
                                    href={route('admin.calculator.index')}
                                    data={{ 
                                        product_id: product.id,
                                        action: 'view'
                                    }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg text-center transition-colors duration-200"
                                >
                                    ดูรายละเอียด
                                </Link>
                                <Link
                                    href={route('admin.calculator.index')}
                                    data={{ 
                                        product_id: product.id,
                                        action: 'edit'
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg text-center transition-colors duration-200"
                                >
                                    แก้ไข EOQ
                                </Link>
                            </>
                        ) : (
                            <Link
                                href={route('admin.calculator.index')}
                                data={{ 
                                    product_id: product.id
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg text-center transition-colors duration-200"
                            >
                                คำนวณ EOQ
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="EOQ Dashboard" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">EOQ Dashboard</h1>
                                <p className="text-gray-600 mt-2">สรุปข้อมูล EOQ ของสินค้าทั้งหมดในระบบ</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                {/* View Toggle Buttons */}
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => changeViewMode('table')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                            viewMode === 'table'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                        title="มุมมองตาราง"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 6h18m-9 8h9m-9 4h9m-9-8h9m-9 4h9" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => changeViewMode('grid')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                            viewMode === 'grid'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                        title="มุมมองกริด"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <Link
                                    href={route('admin.calculator.index')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    คำนวณ EOQ
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-1">สินค้าทั้งหมด</p>
                                        <p className="text-2xl font-bold text-gray-900">{formatNumber(productsWithEoq.total)}</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-1">คำนวณ EOQ แล้ว</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatNumber(productsWithEoq.data.filter(p => p.eoq_calculation).length)}
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-green-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-1">ยังไม่คำนวณ</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatNumber(productsWithEoq.data.filter(p => !p.eoq_calculation).length)}
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-yellow-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* EOQ Top 10 Tables */}
                    <EoqTop10Tables 
                        productsWithEoq={productsWithEoq} 
                        formatCurrency={formatCurrency} 
                        formatNumber={formatNumber}
                    />

                    {/* Products Display */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">รายการสินค้า EOQ</h3>
                                    <p className="text-sm text-gray-600 mt-1">พบ {formatNumber(productsWithEoq.data.length)} รายการ</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">แสดงผลแบบ:</span>
                                    <span className="text-sm font-medium text-gray-900">{viewMode === 'grid' ? 'กริด' : 'ตาราง'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {viewMode === 'table' ? (
                                /* Table View */
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                    สินค้า
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                    หมวดหมู่
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                    ราคา
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                    EOQ
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                    ต้นทุนรวม/ปี
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                    สถานะ
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                    การดำเนินการ
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {productsWithEoq.data.map((product) => {
                                                const eoqData = product.eoq_calculation;
                                                
                                                return (
                                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="flex-shrink-0 h-12 w-12">
                                                                    {product.image ? (
                                                                        <img 
                                                                            className="h-12 w-12 rounded-lg object-cover border border-gray-200" 
                                                                            src={`/storage/products/${product.image}`} 
                                                                            alt={product.name}
                                                                        />
                                                                    ) : (
                                                                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                                                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                                    <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {product.category.name}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900">{formatCurrency(product.price)}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {eoqData ? (
                                                                <div className="text-sm font-bold text-blue-600">
                                                                    {formatNumber(eoqData.eoq)} หน่วย
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">ยังไม่คำนวณ</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {eoqData ? (
                                                                <div className="text-sm font-medium text-blue-600">
                                                                    {formatCurrency(eoqData.total_cost)}
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEoqStatusColor(product)}`}>
                                                                {getEoqStatusIcon(product)}
                                                                <span className="ml-1">{getEoqStatusText(product)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex space-x-2">
                                                                {eoqData ? (
                                                                    <>
                                                                        <Link
                                                                            href={route('admin.calculator.index')}
                                                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                                        >
                                                                            ดูรายละเอียด
                                                                        </Link>
                                                                        <Link
                                                                            href={route('admin.calculator.index')}
                                                                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                                        >
                                                                            แก้ไข
                                                                        </Link>
                                                                    </>
                                                                ) : (
                                                                    <Link
                                                                        href={route('admin.calculator.index')}
                                                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                                    >
                                                                        คำนวณ EOQ
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                /* Grid View */
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {productsWithEoq.data.map((product) => (
                                        <EoqCard key={product.id} product={product} />
                                    ))}
                                </div>
                            )}

                            {/* No Products Message */}
                            {productsWithEoq.data.length === 0 && (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่พบสินค้า</h3>
                                    <p className="mt-2 text-gray-500">ไม่มีสินค้าในระบบในขณะนี้</p>
                                    <Link
                                        href={route('admin.products.index')}
                                        className="mt-4 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                    >
                                        จัดการสินค้า
                                    </Link>
                                </div>
                            )}

                            {/* Pagination */}
                            {productsWithEoq.links && productsWithEoq.data.length > 0 && (
                                <div className="mt-8 flex justify-between items-center">
                                    <div className="text-sm text-gray-700">
                                        แสดง {productsWithEoq.from} ถึง {productsWithEoq.to} จากทั้งหมด {formatNumber(productsWithEoq.total)} รายการ
                                    </div>
                                    <div className="flex space-x-1">
                                        {productsWithEoq.links.map((link, index) => {
                                            let linkUrl = link.url;
                                            if (linkUrl) {
                                                const url = new URL(linkUrl, window.location.origin);
                                                url.searchParams.set('view', viewMode);
                                                linkUrl = url.pathname + url.search;
                                            }
                                            
                                            return (
                                                <Link
                                                    key={index}
                                                    href={linkUrl || '#'}
                                                    className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                                                        link.active
                                                            ? 'bg-blue-500 text-white'
                                                            : link.url
                                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
