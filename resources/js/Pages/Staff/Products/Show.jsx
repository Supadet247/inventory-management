import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function ProductsShow({ auth, product, recentMovements }) {
    const [showStockModal, setShowStockModal] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'in',
        quantity: '',
        notes: '',
    });

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
        if (product.quantity <= 0) return 'หมดสต็อก';
        if (product.quantity <= product.min_stock) return 'สต็อกต่ำ';
        return 'มีสต็อก';
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
        post(route('staff.products.stock', product.id), {
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
            case 'in': return 'Stock In';
            case 'out': return 'Stock Out';
            case 'adjustment': return 'Adjustment';
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
                                <p className="text-gray-600 mt-2">ดูและจัดการข้อมูลสินค้า - {product.name}</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <button
                                    onClick={() => setShowStockModal(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                    </svg>
                                    อัปเดตสต็อก
                                </button>
                                <Link
                                    href={route('staff.products.edit', product.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    แก้ไขสินค้า
                                </Link>
                                <Link
                                    href={route('staff.products.index')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    กลับไปหน้าสินค้า
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Product Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">ภาพรวมสินค้า</h3>
                            <p className="text-sm text-gray-600 mt-1">ข้อมูลละเอียดสินค้าและสถานะปัจจุบัน</p>
                        </div>
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
                                            <dt className="text-sm font-medium text-gray-500">รหัสสินค้า</dt>
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
                                            <dt className="text-sm font-medium text-gray-500">สถานะ</dt>
                                            <dd className="text-sm text-gray-900 mt-1">
                                                <div className="flex items-center space-x-2">
                                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStockStatusColor()}`}>
                                                        {getStockStatusIcon()}
                                                        <span className="ml-1">{getStockStatusText()}</span>
                                                    </div>
                                                    {!product.is_active && (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                            ไม่ใช้งาน
                                                        </span>
                                                    )}
                                                </div>
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

                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6">สต็อกและข้อมูลวิเคราะห์</h3>
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-800">สต็อกปัจจุบัน</p>
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
                                                    <p className="text-sm font-medium text-orange-800">สต็อกขั้นต่ำ</p>
                                                    <p className="text-2xl font-bold text-orange-900">{formatNumber(product.min_stock)}</p>
                                                </div>
                                                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-green-800">มูลค่ารวม</p>
                                                    <p className="text-2xl font-bold text-green-900">{formatCurrency(product.price * product.quantity)}</p>
                                                </div>
                                                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">สร้างเมื่อ:</span>
                                                    <span className="text-gray-900">{formatDate(product.created_at)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">อัปเดตล่าสุด:</span>
                                                    <span className="text-gray-900">{formatDate(product.updated_at)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">ความคืบหน้าสต็อก:</span>
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

                    {/* Recent Stock Movements */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">การเคลื่อนไหวสต็อกล่าสุด</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        พบ {recentMovements.length} รายการล่าสุด
                                    </p>
                                </div>
                                <span className="text-gray-400 text-sm">การเคลื่อนไหว 10 ครั้งล่าสุด</span>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {recentMovements.length > 0 ? (
                                <div className="overflow-x-auto">
                                    {/* Table content here */}
                                    <p className="text-gray-500">ตารางการเคลื่อนไหวสต็อกจะแสดงที่นี่</p>
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
                                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        เพิ่มการเคลื่อนไหวครั้งแรก
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">อัปเดตสต็อก</h4>
                                    <p className="text-sm text-gray-600">จัดการระดับสินค้าคงคลัง</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowStockModal(true)}
                                className="mt-4 block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                อัปเดตสต็อก
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">แก้ไขสินค้า</h4>
                                    <p className="text-sm text-gray-600">อัปเดตรายละเอียดสินค้า</p>
                                </div>
                            </div>
                            <Link 
                                href={route('staff.products.edit', product.id)}
                                className="mt-4 block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                แก้ไขสินค้า
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">ดูรายงาน</h4>
                                    <p className="text-sm text-gray-600">ข้อมูลวิเคราะห์สินค้า</p>
                                </div>
                            </div>
                            <button 
                                className="mt-4 block w-full bg-gray-400 text-white text-center py-3 rounded-lg font-medium cursor-not-allowed"
                                disabled
                            >
                                เร็วๆ นี้
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock Update Modal */}
            {showStockModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-2xl bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">อัปเดตสต็อก</h3>
                                <button
                                    onClick={() => {
                                        setShowStockModal(false);
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
                                        <option value="in">สต็อกเข้า (+)</option>
                                        <option value="out">สต็อกออก (-)</option>
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
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="กรอกจำนวน"
                                        required
                                    />
                                    {errors.quantity && <div className="text-red-600 text-sm mt-1">{errors.quantity}</div>}
                                    <p className="text-sm text-gray-500 mt-1">จำนวนปัจจุบัน: {formatNumber(product.quantity)}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
                                    <textarea
                                        rows="3"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับการเคลื่อนไหวสต็อกนี้..."
                                    />
                                    {errors.notes && <div className="text-red-600 text-sm mt-1">{errors.notes}</div>}
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowStockModal(false);
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
                                        {processing ? 'กำลังอัปเดต...' : 'อัปเดตสต็อก'}
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