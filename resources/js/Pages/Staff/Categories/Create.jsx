// resources/js/Pages/Staff/Categories/Create.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function CategoriesCreate({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('staff.categories.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="สร้างหมวดหมู่สินค้า" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">สร้างหมวดหมู่สินค้า</h1>
                                <p className="text-gray-600 mt-2">เพิ่มหมวดหมู่สินค้าใหม่เข้าสู่ระบบคลังสินค้า</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
                                        placeholder="กรอกชื่อหมวดหมู่สินค้า"
                                        required
                                    />
                                    {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
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
                                        placeholder="กรอกรายละเอียดหมวดหมู่สินค้า..."
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
                                            <span className="block text-gray-500 text-xs">หมวดหมู่ที่เปิดใช้งานจะสามารถเลือกใช้กับสินค้าได้</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">แนวทางการตั้งค่าหมวดหมู่</h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>เลือกชื่อหมวดหมู่ที่ชัดเจนและสื่อความหมาย</li>
                                                    <li>เพิ่มคำอธิบายเพื่อให้ทีมงานเข้าใจตรงกัน</li>
                                                    <li>หมวดหมู่ช่วยจัดระเบียบและค้นหาสินค้าได้ง่ายขึ้น</li>
                                                    <li>สามารถแก้ไขรายละเอียดเหล่านี้ได้ภายหลัง</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                    <Link
                                        href={route('staff.categories.index')}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                                    >
                                        ยกเลิก
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {processing ? 'กำลังสร้าง...' : 'สร้างหมวดหมู่'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Preview Card */}
                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">ตัวอย่างแสดงผล</h3>
                            <p className="text-sm text-gray-600 mt-1">ตัวอย่างการแสดงผลหมวดหมู่สินค้า</p>
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
                                        {data.description || 'คำอธิบายหมวดหมู่จะแสดงที่นี่'}
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
                                    {data.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}