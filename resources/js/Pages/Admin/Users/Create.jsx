// resources/js/Pages/Admin/Users/Create.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function UsersCreate({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'staff',
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.users.store'));
    };

    const getRoleDescription = (role) => {
        if (role === 'admin') {
            return 'Admin users have full access to all features including user management, reports, and system settings.';
        }
        return 'Staff users can manage products, categories, and stock movements but cannot access user management.';
    };

    const getRoleIcon = (role) => {
        if (role === 'admin') {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            );
        }
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="สร้างผู้ใช้งาน" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">สร้างผู้ใช้งาน</h1>
                                <p className="text-gray-600 mt-2">เพิ่มผู้ใช้งานใหม่เข้าสู่ระบบ</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <Link
                                    href={route('admin.users.index')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    กลับไปยังรายการผู้ใช้งาน
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8">
                            <form onSubmit={submit} className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        ชื่อ-นามสกุล <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="กรอกชื่อ-นามสกุล"
                                        required
                                    />
                                    {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        อีเมล <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="กรอกอีเมล"
                                        required
                                    />
                                    {errors.email && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
                                    <p className="text-sm text-gray-500 mt-1">ผู้ใช้งานจะได้รับข้อมูลเข้าสู่ระบบทางอีเมล</p>
                                </div>

                                {/* Role */}
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                        บทบาทผู้ใช้งาน <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div 
                                            onClick={() => setData('role', 'staff')}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                                data.role === 'staff' 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    data.role === 'staff' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {getRoleIcon('staff')}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">เจ้าหน้าที่</div>
                                                    <div className="text-sm text-gray-500">สิทธิ์จำกัด</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div 
                                            onClick={() => setData('role', 'admin')}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                                data.role === 'admin' 
                                                    ? 'border-purple-500 bg-purple-50' 
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    data.role === 'admin' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {getRoleIcon('admin')}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">ผู้ดูแลระบบ</div>
                                                    <div className="text-sm text-gray-500">สิทธิ์ทั้งหมด</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {errors.role && <div className="text-red-600 text-sm mt-1">{errors.role}</div>}
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-700">{data.role === 'admin' ? 'ผู้ดูแลระบบสามารถเข้าถึงทุกฟีเจอร์ รวมถึงการจัดการผู้ใช้งาน รายงาน และตั้งค่าระบบ' : 'เจ้าหน้าที่สามารถจัดการสินค้า หมวดหมู่ และการเคลื่อนไหวสต็อก แต่ไม่สามารถเข้าถึงการจัดการผู้ใช้งาน'}</p>
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        รหัสผ่าน <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="กรอกรหัสผ่าน"
                                        required
                                        minLength="8"
                                    />
                                    {errors.password && <div className="text-red-600 text-sm mt-1">{errors.password}</div>}
                                    <p className="text-sm text-gray-500 mt-1">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                                        ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="ยืนยันรหัสผ่าน"
                                        required
                                    />
                                    {errors.password_confirmation && <div className="text-red-600 text-sm mt-1">{errors.password_confirmation}</div>}
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
                                            <span className="font-medium">เปิดใช้งานผู้ใช้งาน</span>
                                            <span className="block text-gray-500 text-xs">ผู้ใช้งานที่เปิดใช้งานจะสามารถเข้าสู่ระบบได้</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Security Notice */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">แนวทางความปลอดภัย</h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>ใช้รหัสผ่านที่รัดกุมและมีตัวอักษรหลากหลาย</li>
                                                    <li>กำหนดสิทธิ์ผู้ดูแลระบบเฉพาะผู้ที่เชื่อถือได้เท่านั้น</li>
                                                    <li>ผู้ใช้งานจะต้องยืนยันอีเมลก่อนใช้งาน</li>
                                                    <li>ควรเปลี่ยนรหัสผ่านเป็นประจำ</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                    <Link
                                        href={route('admin.users.index')}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                                    >
                                        ยกเลิก
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {processing ? 'กำลังสร้าง...' : 'สร้างผู้ใช้งาน'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Preview Card */}
                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">ตัวอย่างผู้ใช้งาน</h3>
                            <p className="text-sm text-gray-600 mt-1">แสดงตัวอย่างข้อมูลผู้ใช้งานใหม่ในระบบ</p>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 h-12 w-12">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">
                                            {data.name ? data.name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                        {data.name || 'ชื่อผู้ใช้งาน'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {data.email || 'user@example.com'}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                        data.role === 'admin' 
                                            ? 'bg-purple-100 text-purple-800 border-purple-200' 
                                            : 'bg-blue-100 text-blue-800 border-blue-200'
                                    }`}>
                                        {getRoleIcon(data.role)}
                                        <span className="ml-1">{data.role === 'admin' ? 'ผู้ดูแลระบบ' : data.role === 'staff' ? 'เจ้าหน้าที่' : data.role}</span>
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
            </div>
        </AuthenticatedLayout>
    );
}