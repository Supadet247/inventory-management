// resources/js/Pages/Staff/Categories/Show.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function CategoriesShow({ auth, category }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStockStatusColor = (product) => {
        if (product.quantity <= 0) return 'bg-red-100 text-red-800';
        if (product.quantity <= product.min_stock) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    const getStockStatusText = (product) => {
        if (product.quantity <= 0) return 'หมดสต็อก';
        if (product.quantity <= product.min_stock) return 'สต็อกต่ำ';
        return 'มีสต็อก';
    };

    return (
        <AuthenticatedLayout>
            <Head title={`หมวดหมู่: ${category.name}`} />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">รายละเอียดหมวดหมู่</h1>
                                <p className="text-gray-600 mt-2">ดูและจัดการข้อมูลหมวดหมู่สินค้า</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <Link
                                    href={route('staff.categories.edit', category.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    แก้ไขหมวดหมู่
                                </Link>
                                <Link
                                    href={route('staff.categories.index')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    กลับไปยังหมวดหมู่
                                </Link>
                            </div>
                        </div>
                    </div>
                    {/* Category Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">ข้อมูลหมวดหมู่</h3>
                            <p className="text-sm text-gray-600 mt-1">รายละเอียดพื้นฐานและสถิติ</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลหมวดหมู่</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">ชื่อ</dt>
                                            <dd className="text-sm text-gray-900">{category.name}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">คำอธิบาย</dt>
                                            <dd className="text-sm text-gray-900">{category.description || 'ไม่มีคำอธิบาย'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">สถานะ</dt>
                                            <dd className="text-sm text-gray-900">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    category.is_active 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {category.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                                                </span>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">สร้างเมื่อ</dt>
                                            <dd className="text-sm text-gray-900">{formatDate(category.created_at)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">อัปเดตล่าสุด</dt>
                                            <dd className="text-sm text-gray-900">{formatDate(category.updated_at)}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">สถิติ</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">จำนวนสินค้าทั้งหมด</dt>
                                            <dd className="text-lg font-bold text-gray-900">{category.products.length}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">สต็อกรวม</dt>
                                            <dd className="text-sm text-gray-900">
                                                {category.products.reduce((sum, product) => sum + product.quantity, 0)} ชิ้น
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">มูลค่ารวม</dt>
                                            <dd className="text-sm text-gray-900">
                                                {formatCurrency(category.products.reduce((sum, product) => sum + (product.price * product.quantity), 0))}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products in Category */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">สินค้าในหมวดหมู่นี้</h3>
                                    <p className="text-sm text-gray-600 mt-1">พบ {category.products.length} สินค้า</p>
                                </div>
                                <Link
                                    href={route('staff.products.create', { category_id: category.id })}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    เพิ่มสินค้า
                                </Link>
                            </div>
                        </div>

                        <div className="p-6">

                            {category.products.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    สินค้า
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    ราคา
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    สต็อก
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    สถานะ
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    การดำเนินการ
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {category.products.map((product) => (
                                                <tr key={product.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                {product.image ? (
                                                                    <img 
                                                                        className="h-10 w-10 rounded-md object-cover" 
                                                                        src={`/storage/products/${product.image}`} 
                                                                        alt={product.name}
                                                                    />
                                                                ) : (
                                                                    <div className="h-10 w-10 rounded-md bg-gray-300 flex items-center justify-center">
                                                                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                                <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{formatCurrency(product.price)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {product.quantity} / {product.min_stock} ขั้นต่ำ
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(product)}`}>
                                                            {getStockStatusText(product)}
                                                        </span>
                                                        {!product.is_active && (
                                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                ไม่ใช้งาน
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                        <Link
                                                            href={route('staff.products.show', product.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            ดู
                                                        </Link>
                                                        <Link
                                                            href={route('staff.products.edit', product.id)}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            แก้ไข
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <h3 className="mt-4 text-lg font-medium text-gray-900">ยังไม่มีสินค้าในหมวดหมู่นี้</h3>
                                    <p className="mt-2 text-gray-500">เริ่มด้วยการเพิ่มสินค้าแรกในหมวดหมู่นี้</p>
                                    <Link
                                        href={route('staff.products.create', { category_id: category.id })}
                                        className="mt-4 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                    >
                                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        เพิ่มสินค้าแรก
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}