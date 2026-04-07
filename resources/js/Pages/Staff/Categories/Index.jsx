// resources/js/Pages/Staff/Categories/Index.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function CategoriesIndex({ auth, categories, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('staff.categories.index'), {
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
        router.get(route('staff.categories.index'));
    };

    const deleteCategory = (category) => {
        if (confirm(`คุณแน่ใจหรือไม่ที่จะลบ "${category.name}"?`)) {
            router.delete(route('staff.categories.destroy', category.id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="จัดการหมวดหมู่สินค้า" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">จัดการหมวดหมู่สินค้า</h1>
                                <p className="text-gray-600 mt-2">จัดการและจัดระเบียบหมวดหมู่สินค้า</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <Link
                                    href={route('staff.categories.create')}
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
                    {/* Search and Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">กรองข้อมูลหมวดหมู่</h3>
                            <p className="text-sm text-gray-600 mt-1">ค้นหาและกรองรายการหมวดหมู่</p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">ค้นหา</label>
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="ค้นหาตามชื่อ..."
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">ทุกสถานะ</option>
                                            <option value="active">ใช้งาน</option>
                                            <option value="inactive">ไม่ใช้งาน</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-end space-x-2">
                                        <button
                                            type="submit"
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                                        >
                                            ค้นหา
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                                        >
                                            ล้างการค้นหา
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
                                    <p className="text-sm text-gray-600 mt-1">พบ {categories.data.length} หมวดหมู่</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ชื่อ
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                คำอธิบาย
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                จำนวนสินค้า
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
                                        {categories.data.map((category) => (
                                            <tr key={category.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {category.description || 'ไม่มีคำอธิบาย'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{category.products_count}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        category.is_active 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {category.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <Link
                                                        href={route('staff.categories.show', category.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        ดู
                                                    </Link>
                                                    <Link
                                                        href={route('staff.categories.edit', category.id)}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        แก้ไข
                                                    </Link>
                                                    <button
                                                        onClick={() => deleteCategory(category)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        ลบ
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* No Categories Message */}
                            {categories.data.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">ไม่พบหมวดหมู่ที่ตรงกับเงื่อนไขที่ค้นหา</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {categories.links && categories.data.length > 0 && (
                                <div className="mt-6 flex justify-between items-center">
                                    <div className="text-sm text-gray-700">
                                        แสดง {categories.from} ถึง {categories.to} จาก {categories.total} รายการ
                                    </div>
                                    <div className="flex space-x-1">
                                        {categories.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-2 text-sm rounded ${
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
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}