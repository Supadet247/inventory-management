// resources/js/Pages/Admin/Categories/Edit.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function CategoriesEdit({ auth, category }) {
    const { data, setData, put, processing, errors } = useForm({
        name: category.name || '',
        categories_sku: category.categories_sku || '',
        description: category.description || '',
        is_active: category.is_active || false,
    });

    // Handle SKU input - auto convert to uppercase
    const handleSkuChange = (e) => {
        const value = e.target.value.toUpperCase();
        setData('categories_sku', value);
    };

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.categories.update', category.id));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`แก้ไขหมวดหมู่: ${category.name}`} />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">แก้ไขหมวดหมู่</h1>
                                <p className="text-gray-600 mt-2">ปรับปรุงหมวดหมู่: {category.name}</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <Link
                                    href={route('admin.categories.show', category.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    ดูรายละเอียดหมวดหมู่
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8">
                            <form onSubmit={submit} className="space-y-6">
                                {/* Category Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="กรอกชื่อหมวดหมู่"
                                        required
                                    />
                                    {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                                </div>

                                {/* Category SKU Prefix */}
                                <div>
                                    <label htmlFor="categories_sku" className="block text-sm font-medium text-gray-700 mb-2">
                                        รหัส SKU ประเภท <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="categories_sku"
                                        type="text"
                                        value={data.categories_sku}
                                        onChange={handleSkuChange}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 uppercase"
                                        placeholder="เช่น AG, TOOL, PART (พิมพ์เล็ก/ใหญ่ ระบบจะแปลงเป็นตัวพิมพ์ใหญ่)"
                                        required
                                        maxLength="10"
                                    />
                                    {errors.categories_sku && <div className="text-red-600 text-sm mt-1">{errors.categories_sku}</div>}
                                    <p className="text-sm text-gray-500 mt-1">จำเป็น: ใช้สำหรับกำหนดตัวอักษรนำหน้า SKU สินค้าในหมวดหมู่นี้</p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                        รายละเอียด
                                    </label>
                                    <textarea
                                        id="description"
                                        rows="4"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="กรอกรายละเอียดหมวดหมู่..."
                                    />
                                    {errors.description && <div className="text-red-600 text-sm mt-1">{errors.description}</div>}
                                    <p className="text-sm text-gray-500 mt-1">ไม่บังคับ: อธิบายว่าสินค้าใดอยู่ในหมวดหมู่นี้</p>
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
                                            <span className="font-medium">เปิดใช้งานหมวดหมู่นี้</span>
                                            <span className="block text-gray-500 text-xs">หมวดหมู่ที่เปิดใช้งานจะแสดงผลและสามารถนำไปใช้กับสินค้าได้</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Category Information */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-4">ข้อมูลหมวดหมู่</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">สร้างเมื่อ</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{formatDate(category.created_at)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">อัปเดตล่าสุด</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{formatDate(category.updated_at)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสหมวดหมู่</dt>
                                            <dd className="text-sm text-gray-900 mt-1 font-mono">{category.id}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนสินค้า</dt>
                                            <dd className="text-sm text-gray-900 mt-1">
                                                <span className="font-bold">{category.products_count || 0}</span> รายการ
                                            </dd>
                                        </div>
                                    </div>
                                </div>

                                {/* Warning if category has products */}
                                {category.products_count > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-yellow-800">หมวดหมู่นี้ถูกใช้งานอยู่</h3>
                                                <div className="mt-2 text-sm text-yellow-700">
                                                    <p>หมวดหมู่นี้มีสินค้า {category.products_count} รายการ การเปลี่ยนแปลงอาจมีผลต่อการจัดกลุ่มและการค้นหาสินค้า</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Buttons */}
                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                    <Link
                                        href={route('admin.categories.show', category.id)}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                                    >
                                        ยกเลิก
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {processing ? 'กำลังอัปเดต...' : 'บันทึกการเปลี่ยนแปลง'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Preview Card */}
                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">ตัวอย่างแสดงผล</h3>
                            <p className="text-sm text-gray-600 mt-1">ตัวอย่างการแสดงผลหมวดหมู่ที่แก้ไข</p>
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
                                        {data.name || 'ชื่อหมวดหมู่'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {data.description || 'ไม่มีรายละเอียด'}
                                    </div>
                                </div>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                    data.is_active 
                                        ? 'bg-green-100 text-green-800 border-green-200' 
                                        : 'bg-gray-100 text-gray-800 border-gray-200'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                        data.is_active ? 'bg-green-500' : 'bg-gray-500'
                                    }`}></div>
                                    {data.is_active ? 'เปิดใช้งาน' : 'ไม่เปิดใช้งาน'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}