// resources/js/Pages/Staff/Returns/Index.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function ReturnsIndex({ auth, returns, filters, stats }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('staff.returns.index'), {
            search,
            status,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setDateFrom('');
        setDateTo('');
        router.get(route('staff.returns.index'));
    };

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

    const formatNumber = (number) => {
        return new Intl.NumberFormat('th-TH').format(number);
    };

    const getReturnStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getReturnStatusText = (status) => {
        switch (status) {
            case 'pending': return 'รอดำเนินการ';
            case 'approved': return 'อนุมัติแล้ว';
            case 'completed': return 'เสร็จสิ้น';
            case 'cancelled': return 'ยกเลิก';
            default: return status;
        }
    };

    const getReturnStatusIcon = (status) => {
        switch (status) {
            case 'pending': return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
            case 'approved': return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
            case 'completed': return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            );
            case 'cancelled': return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
            default: return null;
        }
    };

    const handleApprove = (id) => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการอนุมัติการคืนสินค้านี้?')) {
            router.patch(route('staff.returns.approve', id), {}, {
                onSuccess: () => {
                    router.reload({ only: ['returns', 'stats'] });
                },
            });
        }
    };

    const handleComplete = (id) => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการดำเนินการคืนสินค้านี้ให้เสร็จสิ้น?')) {
            router.patch(route('staff.returns.complete', id), {}, {
                onSuccess: () => {
                    router.reload({ only: ['returns', 'stats'] });
                },
            });
        }
    };

    const handleConfirmWarrantyClaim = (id) => {
        if (confirm('ยืนยันว่าได้รับสินค้าจากดีลเลอร์แล้วใช่ไหม? สินค้าจะถูกเพิ่มกลับเข้าสต็อก')) {
            router.patch(route('staff.returns.confirm-warranty-claim', id), {}, {
                onSuccess: () => {
                    router.reload({ only: ['returns', 'stats'] });
                },
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="จัดการการคืนสินค้า" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">จัดการการคืนสินค้า</h1>
                                <p className="text-gray-600 mt-2">ดูและอนุมัติการคืนสินค้า</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-1">รอดำเนินการ</p>
                                        <p className="text-2xl font-bold text-yellow-600">{formatNumber(stats?.pending || 0)}</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-yellow-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-1">อนุมัติแล้ว</p>
                                        <p className="text-2xl font-bold text-blue-600">{formatNumber(stats?.approved || 0)}</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        <p className="text-sm font-medium text-gray-600 mb-1">เสร็จสิ้น</p>
                                        <p className="text-2xl font-bold text-green-600">{formatNumber(stats?.completed || 0)}</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-green-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-1">ยกเลิก</p>
                                        <p className="text-2xl font-bold text-red-600">{formatNumber(stats?.cancelled || 0)}</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-red-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">ตัวกรองการคืนสินค้า</h3>
                            <p className="text-sm text-gray-600 mt-1">ค้นหาและกรองรายการการคืนสินค้า</p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="เลขที่การคืน หรือ เลขที่ใบเสร็จ..."
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
                                            <option value="pending">รอดำเนินการ</option>
                                            <option value="approved">อนุมัติแล้ว</option>
                                            <option value="completed">เสร็จสิ้น</option>
                                            <option value="cancelled">ยกเลิก</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">วันที่ตั้งแต่</label>
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สิ้นสุด</label>
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                                    >
                                        ใช้ตัวกรอง
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                                    >
                                        ล้างค่า
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Returns Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">รายการการคืนสินค้า</h3>
                                    <p className="text-sm text-gray-600 mt-1">พบ {formatNumber(returns.data.length)} รายการ</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                เลขที่การคืน
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                ใบเสร็จต้นฉบับ
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                วันที่คืน
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                จำนวนรายการ
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                ยอดรวม
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
                                        {returns.data.map((returnItem) => (
                                            <tr key={returnItem.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {returnItem.return_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {returnItem.original_receipt?.receipt_number || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(returnItem.returned_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {returnItem.return_items_count || returnItem.return_items?.length || 0} รายการ
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {formatCurrency(returnItem.grand_return_total)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getReturnStatusColor(returnItem.status)}`}>
                                                        {getReturnStatusIcon(returnItem.status)}
                                                        <span className="ml-1">{getReturnStatusText(returnItem.status)}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Link
                                                            href={route('staff.returns.show', returnItem.id)}
                                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                        >
                                                            ดูรายละเอียด
                                                        </Link>
                                                        
                                                        {returnItem.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleApprove(returnItem.id)}
                                                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                            >
                                                                อนุมัติ
                                                            </button>
                                                        )}
                                                        
                                                        {returnItem.status === 'approved' && (
                                                            <button
                                                                onClick={() => handleComplete(returnItem.id)}
                                                                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                                                            >
                                                                เสร็จสิ้น
                                                            </button>
                                                        )}
                                                        
                                                        {returnItem.status === 'completed' && returnItem.can_confirm_warranty_claim && (
                                                            <button
                                                                onClick={() => handleConfirmWarrantyClaim(returnItem.id)}
                                                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                                                title="ได้รับสินค้าจากดีลเลอร์"
                                                            >
                                                                รับจากดีลเลอร์
                                                            </button>
                                                        )}
                                                        
                                                        {returnItem.status === 'completed' && returnItem.warranty_claim_received && (
                                                            <span className="text-xs text-green-600 font-medium">
                                                                รับสินค้าแล้ว
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {returns.links && (
                                <div className="mt-8 flex justify-between items-center">
                                    <div className="text-sm text-gray-700">
                                        แสดง {returns.from} ถึง {returns.to} จากทั้งหมด {formatNumber(returns.total)} รายการ
                                    </div>
                                    <div className="flex space-x-1">
                                        {returns.links.map((link, index) => (
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
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
