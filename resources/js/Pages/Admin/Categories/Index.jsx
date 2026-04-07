// resources/js/Pages/Admin/Categories/Index.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function CategoriesIndex({ auth, categories, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.categories.index'), {
            search,
            status,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        router.get(route('admin.categories.index'));
    };

    const deleteCategory = (category) => {
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            router.delete(route('admin.categories.destroy', category.id));
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('en-US').format(number);
    };

    return (
        <AuthenticatedLayout>
            <Head title="การจัดการหมวดหมู่สินค้า" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">การจัดการหมวดหมู่สินค้า</h1>
                                <p className="text-gray-600 mt-2">จัดระเบียบและบริหารหมวดหมู่สินค้า</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <Link
                                    href={route('admin.categories.create')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    เพิ่มหมวดหมู่
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
                                        <p className="text-sm font-medium text-gray-600 mb-1">จำนวนหมวดหมู่ทั้งหมด</p>
                                        <p className="text-2xl font-bold text-gray-900">{formatNumber(categories.total)}</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-1">หมวดหมู่ที่เปิดใช้งาน</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatNumber(categories.data.filter(cat => cat.is_active).length)}
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
                                        <p className="text-sm font-medium text-gray-600 mb-1">จำนวนสินค้าทั้งหมด</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatNumber(categories.data.reduce((sum, cat) => sum + cat.products_count, 0))}
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-purple-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">ตัวกรองหมวดหมู่</h3>
                            <p className="text-sm text-gray-600 mt-1">ค้นหาและกรองหมวดหมู่ของคุณ</p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหาหมวดหมู่</label>
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="ค้นหาหมวดหมู่..."
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="">ทุกสถานะ</option>
                                            <option value="active">เปิดใช้งาน</option>
                                            <option value="inactive">ไม่เปิดใช้งาน</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex flex-col space-y-2">
                                        <button
                                            type="submit"
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                                        >
                                            ใช้ตัวกรอง
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                                        >
                                            ล้างค่า
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Categories Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">รายการหมวดหมู่</h3>
                                    <p className="text-sm text-gray-600 mt-1">พบ {formatNumber(categories.data.length)} หมวดหมู่</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">เรียงตาม:</span>
                                    <select className="text-sm border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500">
                                        <option>ชื่อ</option>
                                        <option>จำนวนสินค้า</option>
                                        <option>วันที่สร้าง</option>
                                        <option>สถานะ</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                            ชื่อหมวดหมู่
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                            รายละเอียด
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 whitespace-nowrap">
                                            จำนวนสินค้า
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                            สถานะ
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                            วันที่สร้าง
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                            การดำเนินการ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {categories.data.map((category) => (
                                        <tr key={category.id} className="hover:bg-gray-50 transition-colors duration-200">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                                        <div className="text-xs text-gray-500">รหัสหมวดหมู่: {category.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs">
                                                    {category.description ? (
                                                        <span className="truncate block">{category.description}</span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">No description</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-lg font-bold text-gray-900">{formatNumber(category.products_count)}</span>
                                                    <span className="text-xs text-gray-500">รายการ</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                                    category.is_active 
                                                        ? 'bg-green-100 text-green-800 border-green-200' 
                                                        : 'bg-red-100 text-red-800 border-red-200'
                                                }`}>
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                                        category.is_active ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></div>
                                                    {category.is_active ? 'เปิดใช้งาน' : 'ไม่เปิดใช้งาน'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{formatDate(category.created_at)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-2">
                                                    <Link
                                                        href={route('admin.categories.show', category.id)}
                                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                    >
                                                        ดูรายละเอียด
                                                    </Link>
                                                    <Link
                                                        href={route('admin.categories.edit', category.id)}
                                                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                    >
                                                        แก้ไข
                                                    </Link>
                                                    <button
                                                        onClick={() => deleteCategory(category)}
                                                        className={`text-sm font-medium ${
                                                            category.products_count > 0 
                                                                ? 'text-gray-400 cursor-not-allowed' 
                                                                : 'text-red-600 hover:text-red-700'
                                                        }`}
                                                        disabled={category.products_count > 0}
                                                        title={category.products_count > 0 ? 'ไม่สามารถลบหมวดหมู่ที่มีสินค้าได้' : 'ลบหมวดหมู่'}
                                                    >
                                                        ลบ
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {categories.links && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-700">
                                        แสดง {categories.from} ถึง {categories.to} จากทั้งหมด {formatNumber(categories.total)} รายการ
                                    </div>
                                    <div className="flex space-x-1">
                                        {categories.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                                                    link.active
                                                        ? 'bg-blue-500 text-white'
                                                        : link.url
                                                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {categories.data.length === 0 && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่พบหมวดหมู่</h3>
                                <p className="mt-2 text-gray-500">ไม่มีหมวดหมู่ที่ตรงกับเงื่อนไขการค้นหานี้</p>
                                <Link
                                    href={route('admin.categories.create')}
                                    className="mt-4 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                >
                                    สร้างหมวดหมู่ใหม่
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">เพิ่มหมวดหมู่ใหม่</h4>
                                    <p className="text-sm text-gray-600">สร้างหมวดหมู่สินค้าใหม่</p>
                                </div>
                            </div>
                            <Link 
                                href={route('admin.categories.create')}
                                className="mt-4 block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                สร้างหมวดหมู่ใหม่
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">จัดการสินค้า</h4>
                                    <p className="text-sm text-gray-600">ดูและจัดการสินค้าทั้งหมด</p>
                                </div>
                            </div>
                            <Link 
                                href={route('admin.products.index')}
                                className="mt-4 block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                ดูสินค้า
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
                                    <p className="text-sm text-gray-600">วิเคราะห์ประสิทธิภาพหมวดหมู่</p>
                                </div>
                            </div>
                            <Link 
                                href={route('admin.reports.index')}
                                className="mt-4 block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                ดูรายงาน
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}