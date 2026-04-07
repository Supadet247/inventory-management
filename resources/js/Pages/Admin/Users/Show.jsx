// resources/js/Pages/Admin/Users/Show.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function UsersShow({ auth, user, recentActivities }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('en-US').format(number);
    };

    const toggleStatus = () => {
        const action = user.is_active ? 'deactivate' : 'activate';
        if (confirm(`Are you sure you want to ${action} "${user.name}"?`)) {
            router.patch(route('admin.users.toggle-status', user.id));
        }
    };

    const deleteUser = () => {
        if (confirm(`Are you sure you want to delete "${user.name}"? This action cannot be undone.`)) {
            router.delete(route('admin.users.destroy', user.id));
        }
    };

    const handleSendVerificationEmail = (userId) => {
        if (confirm('ส่งลิงค์ยืนยันอีเมลไปยังผู้ใช้งานนี้?')) {
            router.post(route('admin.users.send-verification-email', userId), {}, {
                onSuccess: () => alert('ลิงค์ยืนยันอีเมลถูกส่งแล้ว'),
                onError: () => alert('เกิดข้อผิดพลาดในการส่งอีเมล')
            });
        }
    };

    const getRoleBadgeColor = (role) => {
        return role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200';
    };

    const getRoleIcon = (role) => {
        if (role === 'admin') {
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            );
        }
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        );
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

    const isCurrentUser = user.id === auth.user.id;

    return (
        <AuthenticatedLayout>
            <Head title={`ผู้ใช้งาน: ${user.name}`} />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">รายละเอียดผู้ใช้งาน</h1>
                                <p className="text-gray-600 mt-2">{user.name}</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <Link
                                    href={route('admin.users.edit', user.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    แก้ไขผู้ใช้งาน
                                </Link>
                                {!isCurrentUser && (
                                    <>
                                        <button
                                            onClick={toggleStatus}
                                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
                                                user.is_active 
                                                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={user.is_active ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636A9 9 0 005.636 18.364" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                                            </svg>
                                            {user.is_active ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                                        </button>
                                        <button
                                            onClick={deleteUser}
                                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            ลบผู้ใช้งาน
                                        </button>
                                    </>
                                )}
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
                    {/* User Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลผู้ใช้งาน</h3>
                                    
                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                            <span className="text-2xl font-bold text-white">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                                            <p className="text-gray-600">{user.email}</p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(user.role)}`}>
                                                    {getRoleIcon(user.role)}
                                                    <span className="ml-1">{user.role === 'admin' ? 'ผู้ดูแลระบบ' : user.role === 'staff' ? 'เจ้าหน้าที่' : user.role}</span>
                                                </div>
                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                                                    user.is_active 
                                                        ? 'bg-green-100 text-green-800 border-green-200' 
                                                        : 'bg-red-100 text-red-800 border-red-200'
                                                }`}>
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                                        user.is_active ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></div>
                                                    {user.is_active ? 'เปิดใช้งาน' : 'ไม่เปิดใช้งาน'}
                                                </div>
                                                {isCurrentUser && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                        บัญชีของคุณ
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <dl className="space-y-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">ยืนยันอีเมล</dt>
                                            <dd className="text-sm text-gray-900 mt-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        {user.email_verified_at ? (
                                                            <span className="text-green-600 flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                ยืนยันเมื่อ {formatDate(user.email_verified_at)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-600 flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                                ยังไม่ยืนยัน
                                                            </span>
                                                        )}
                                                    </div>
                                                    {!user.email_verified_at && (
                                                        <div className="flex flex-col items-end gap-2">
                                                            <button
                                                                onClick={() => handleSendVerificationEmail(user.id)}
                                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 shadow-sm hover:shadow-md"
                                                            >
                                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                                ส่งลิงค์ยืนยัน
                                                            </button>
                                                            <span className="text-xs text-gray-500 italic">
                                                                ผู้ใช้ต้อง logout ก่อนจึงจะยืนยันได้
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">รหัสผู้ใช้งาน</dt>
                                            <dd className="text-sm text-gray-900 mt-1 font-mono bg-gray-50 px-2 py-1 rounded">{user.id}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">เป็นสมาชิกตั้งแต่</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{formatDate(user.created_at)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">อัปเดตล่าสุด</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{formatDate(user.updated_at)}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6">สถิติกิจกรรม</h3>
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-800">จำนวนกิจกรรมทั้งหมด</p>
                                                    <p className="text-3xl font-bold text-blue-900">{formatNumber(recentActivities.length)}</p>
                                                </div>
                                                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-green-800">นำสินค้าเข้า</p>
                                                        <p className="text-xl font-bold text-green-900">
                                                            {formatNumber(recentActivities.filter(activity => activity.type === 'in').length)}
                                                        </p>
                                                    </div>
                                                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-red-800">เบิกสินค้าออก</p>
                                                        <p className="text-xl font-bold text-red-900">
                                                            {formatNumber(recentActivities.filter(activity => activity.type === 'out').length)}
                                                        </p>
                                                    </div>
                                                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-purple-800">ปรับปรุงสต็อก</p>
                                                        <p className="text-xl font-bold text-purple-900">
                                                            {formatNumber(recentActivities.filter(activity => activity.type === 'adjustment').length)}
                                                        </p>
                                                    </div>
                                                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-gray-600">กิจกรรมล่าสุด</p>
                                                <p className="text-sm text-gray-900 mt-1">
                                                    {recentActivities.length > 0 
                                                        ? formatDate(recentActivities[0].created_at)
                                                        : 'ยังไม่มีกิจกรรม'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">กิจกรรมสต็อกล่าสุด</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        พบ {recentActivities.length} กิจกรรม
                                    </p>
                                </div>
                                <Link
                                    href={route('admin.reports.stock-movements', { user_id: user.id })}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    ดูกิจกรรมทั้งหมด →
                                </Link>
                            </div>
                        </div>
                        
                        {recentActivities.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 whitespace-nowrap">
                                                วันและเวลา
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                สินค้า
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                ประเภท
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                จำนวน
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                สต็อก
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                หมายเหตุ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentActivities.map((activity) => (
                                            <tr key={activity.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">
                                                            {new Date(activity.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })} at {new Date(activity.created_at).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{activity.product.name}</div>
                                                        <div className="text-sm text-gray-500">รหัสสินค้า: {activity.product.sku}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getMovementTypeColor(activity.type)}`}>
                                                        {getMovementTypeIcon(activity.type)}
                                                        <span className="ml-1">{
                                                            activity.type === 'in' ? 'นำเข้า' :
                                                            activity.type === 'out' ? 'เบิกออก' :
                                                            activity.type === 'adjustment' ? 'ปรับปรุง' :
                                                            activity.type
                                                        }</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm font-bold ${
                                                        activity.type === 'in' ? 'text-green-600' : 
                                                        activity.type === 'out' ? 'text-red-600' : 
                                                        'text-blue-600'
                                                    }`}>
                                                        {activity.type === 'in' ? '+' : activity.type === 'out' ? '-' : '±'}{formatNumber(activity.quantity)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2 text-sm">
                                                            <span className="text-gray-600">ก่อน:</span>
                                                            <span className="font-medium text-gray-900">{formatNumber(activity.previous_quantity)}</span>
                                                            <span className="text-gray-400">→</span>
                                                            <span className="text-gray-600">หลัง:</span>
                                                            <span className="font-medium text-gray-900">{formatNumber(activity.new_quantity)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                                    {activity.notes ? (
                                                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                                                            <p className="truncate">{activity.notes}</p>
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
                                <h3 className="mt-4 text-lg font-medium text-gray-900">ยังไม่มีกิจกรรม</h3>
                                <p className="mt-2 text-gray-500">ผู้ใช้งานนี้ยังไม่ได้ดำเนินการเคลื่อนไหวสต็อก</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">แก้ไขผู้ใช้งาน</h4>
                                    <p className="text-sm text-gray-600">ปรับปรุงข้อมูลผู้ใช้งาน</p>
                                </div>
                            </div>
                            <Link 
                                href={route('admin.users.edit', user.id)}
                                className="mt-4 block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                แก้ไขผู้ใช้งาน
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">รายงานกิจกรรม</h4>
                                    <p className="text-sm text-gray-600">ดูบันทึกกิจกรรมโดยละเอียด</p>
                                </div>
                            </div>
                            <Link 
                                href={route('admin.reports.stock-movements', { user_id: user.id })}
                                className="mt-4 block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                ดูรายงาน
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">ผู้ใช้งานทั้งหมด</h4>
                                    <p className="text-sm text-gray-600">จัดการผู้ใช้งานอื่น ๆ</p>
                                </div>
                            </div>
                            <Link 
                                href={route('admin.users.index')}
                                className="mt-4 block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                ดูผู้ใช้งาน
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}