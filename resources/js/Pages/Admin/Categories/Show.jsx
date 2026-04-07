// resources/js/Pages/Admin/Categories/Show.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function CategoriesShow({ auth, category }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('en-US').format(number);
    };

    const getStockStatusColor = (product) => {
        if (product.quantity <= 0) return 'bg-red-100 text-red-800 border-red-200';
        if (product.quantity <= product.min_stock) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    const getStockStatusText = (product) => {
        if (product.quantity <= 0) return 'สินค้าหมด';
        if (product.quantity <= product.min_stock) return 'สินค้าน้อย';
        return 'มีสินค้า';
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={null}
        >
            <Head title={`หมวดหมู่: ${category.name}`} />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section - Now matching Edit.jsx structure */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">รายละเอียดหมวดหมู่</h1>
                                <p className="text-gray-600 mt-2">ดูข้อมูลหมวดหมู่: {category.name}</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <Link
                                    href={route('admin.categories.edit', category.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    แก้ไขหมวดหมู่
                                </Link>
                                <Link
                                    href={route('admin.categories.index')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    กลับไปยังรายการหมวดหมู่
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Category Overview - Restructured to match Edit.jsx design */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column - Category Details */}
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลหมวดหมู่</h3>
                                    
                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mt-2 ${
                                                category.is_active 
                                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                                    : 'bg-red-100 text-red-800 border-red-200'
                                            }`}>
                                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                                    category.is_active ? 'bg-green-500' : 'bg-red-500'
                                                }`}></div>
                                                {category.is_active ? 'เปิดใช้งาน' : 'ไม่เปิดใช้งาน'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">รายละเอียด</dt>
                                            <dd className="text-sm text-gray-900 mt-1">
                                                {category.description || (
                                                    <span className="text-gray-400 italic">ไม่มีรายละเอียด</span>
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">รหัสหมวดหมู่</dt>
                                            <dd className="text-sm text-gray-900 mt-1 font-mono bg-gray-50 px-2 py-1 rounded">{category.id}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">สร้างเมื่อ</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{formatDate(category.created_at)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">อัปเดตล่าสุด</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{formatDate(category.updated_at)}</dd>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Statistics */}
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6">สถิติ</h3>
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-800">จำนวนสินค้าทั้งหมด</p>
                                                    <p className="text-3xl font-bold text-blue-900">{formatNumber(category.products?.length || 0)}</p>
                                                </div>
                                                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-green-800">สินค้าที่เปิดใช้งาน</p>
                                                    <p className="text-3xl font-bold text-green-900">
                                                        {formatNumber(category.products?.filter(p => p.is_active).length || 0)}
                                                    </p>
                                                </div>
                                                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-purple-800">มูลค่ารวม</p>
                                                    <p className="text-2xl font-bold text-purple-900">
                                                        {category.products ? formatCurrency(
                                                            category.products.reduce((sum, product) => 
                                                                sum + (product.price * product.quantity), 0
                                                            )
                                                        ) : formatCurrency(0)}
                                                    </p>
                                                </div>
                                                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products in this Category */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">สินค้าภายใต้หมวดหมู่นี้</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        พบ {category.products?.length || 0} รายการ
                                    </p>
                                </div>
                                <Link
                                    href={route('admin.products.create', { category: category.id })}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                >
                                    เพิ่มสินค้าในหมวดหมู่นี้
                                </Link>
                            </div>
                        </div>
                        
                        {category.products && category.products.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                สินค้า
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                ราคา
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                สต็อก
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
                                        {category.products.map((product) => (
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
                                                            <div className="text-sm text-gray-500">รหัสสินค้า: {product.sku}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{formatCurrency(product.price)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-600">คงเหลือ:</span>
                                                            <span className="font-bold text-gray-900">{formatNumber(product.quantity)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-600">ขั้นต่ำ:</span>
                                                            <span className="text-gray-900">{formatNumber(product.min_stock)}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
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
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStockStatusColor(product)}`}>
                                                            {getStockStatusText(product)}
                                                        </div>
                                                        {!product.is_active && (
                                                            <div className="block">
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                                    ไม่เปิดใช้งาน
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link
                                                        href={route('admin.products.show', product.id)}
                                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                    >
                                                        ดูรายละเอียด →
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">ยังไม่มีสินค้า</h3>
                                <p className="mt-2 text-gray-500">หมวดหมู่นี้ยังไม่มีสินค้า</p>
                                <Link
                                    href={route('admin.products.create', { category: category.id })}
                                    className="mt-4 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                >
                                    เพิ่มสินค้าชิ้นแรก
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Preview Card */}
                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">ตัวอย่างแสดงผล</h3>
                            <p className="text-sm text-gray-600 mt-1">ตัวอย่างการแสดงผลหมวดหมู่</p>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                        {category.name || 'ชื่อหมวดหมู่'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {category.description || 'ไม่มีรายละเอียด'}
                                    </div>
                                </div>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                    category.is_active 
                                        ? 'bg-green-100 text-green-800 border-green-200' 
                                        : 'bg-gray-100 text-gray-800 border-gray-200'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                        category.is_active ? 'bg-green-500' : 'bg-gray-500'
                                    }`}></div>
                                    {category.is_active ? 'เปิดใช้งาน' : 'ไม่เปิดใช้งาน'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}