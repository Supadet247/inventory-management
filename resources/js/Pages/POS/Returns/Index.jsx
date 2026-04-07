import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function ReturnsIndex({ auth, returns, filters, stats }) {
    const isAdmin = () => auth.user.role === 'admin';
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showReceiptSearch, setShowReceiptSearch] = useState(false);
    const [searchedReceipt, setSearchedReceipt] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        receipt_number: '',
        receipt_id: '',
        items: [],
        general_reason: '',
        return_type: 'partial'
    });

    const searchForm = useForm({
        receipt_number: ''
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
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

    const getReturnTypeBadge = (type) => {
        return (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                type === 'full' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-orange-100 text-orange-800'
            }`}>
                {type === 'full' ? 'คืนทั้งหมด' : 'คืนบางส่วน'}
            </span>
        );
    };

    const searchReceipt = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch(route('returns.search'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({
                    receipt_number: searchForm.data.receipt_number
                })
            });

            const result = await response.json();

            if (result.success) {
                setSearchedReceipt(result.receipt);
                setSelectedItems([]);
                setData('receipt_id', result.receipt.id);
                setShowReceiptSearch(false);
                setShowReturnModal(true);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('เกิดข้อผิดพลาดในการค้นหาใบเสร็จ');
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
                                <p className="text-gray-600 mt-2">ระบบจัดการการคืนสินค้าและการขอเงินคืน</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <button
                                    onClick={() => setShowReceiptSearch(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    เพิ่มการคืนสินค้า
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Return Statistics Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-100 text-sm font-medium">รอดำเนินการ</p>
                                    <p className="text-2xl font-bold">{formatNumber(stats?.pending_returns || 0)}</p>
                                    <p className="text-yellow-100 text-xs">รายการ</p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">เสร็จสิ้นแล้ว</p>
                                    <p className="text-2xl font-bold">{formatNumber(stats?.completed_returns || 0)}</p>
                                    <p className="text-green-100 text-xs">รายการ</p>
                                </div>
                                <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">ยอดคืนวันนี้</p>
                                    <p className="text-xl font-bold">{formatCurrency(stats?.today_returns || 0)}</p>
                                    <p className="text-blue-100 text-xs">บาท</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">ยอดคืนเดือนนี้</p>
                                    <p className="text-xl font-bold">{formatCurrency(stats?.this_month_returns || 0)}</p>
                                    <p className="text-purple-100 text-xs">บาท</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Returns List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">รายการคืนสินค้าที่ต้องดำเนินการ</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        พบ {returns?.total || 0} รายการ {returns?.total > 0 && '(รอการตรวจสอบและยืนยัน)'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {returns.data && returns.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">รหัสการคืน</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">ใบเสร็จต้นฉบับ</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">วันที่คืน</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">ประเภท</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">ยอดคืน</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">สถานะ</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">พนักงาน</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">การดำเนินการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {returns.data.map((returnItem) => (
                                            <tr key={returnItem.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-mono font-medium text-blue-600">
                                                        {returnItem.return_number}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">
                                                            {returnItem.originalReceipt?.receipt_number || 'ไม่ระบุ'}
                                                        </div>
                                                        <div className="text-gray-500">
                                                            {returnItem.originalReceipt?.customer_name || 'ลูกค้าทั่วไป'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">
                                                            {new Date(returnItem.returned_at).toLocaleDateString('th-TH')}
                                                        </div>
                                                        <div className="text-gray-500">
                                                            {new Date(returnItem.returned_at).toLocaleTimeString('th-TH', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getReturnTypeBadge(returnItem.return_type)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-green-600">
                                                        {formatCurrency(returnItem.grand_return_total)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getReturnStatusColor(returnItem.status)}`}>
                                                        {getReturnStatusIcon(returnItem.status)}
                                                        <span className="ml-1">{getReturnStatusText(returnItem.status)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">
                                                                {(returnItem.user?.name || 'U').charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-gray-900">{returnItem.user?.name || 'ไม่ระบุ'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Link
                                                            href={isAdmin() ? route('admin.returns.show', returnItem.id) : route('pos.returns.show', returnItem.id)}
                                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                        >
                                                            ดูรายละเอียด
                                                        </Link>
                                                        {returnItem.status === 'completed' && (
                                                            <Link
                                                                href={isAdmin() ? route('admin.returns.print', returnItem.id) : route('pos.returns.print', returnItem.id)}
                                                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                            >
                                                                พิมพ์
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">ยังไม่มีการคืนสินค้า</h3>
                                <p className="mt-2 text-gray-500">เริ่มต้นโดยการเพิ่มรายการคืนสินค้าใหม่</p>
                                <button
                                    onClick={() => setShowReceiptSearch(true)}
                                    className="mt-4 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                >
                                    เพิ่มการคืนสินค้า
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Receipt Search Modal (simplified) */}
            {showReceiptSearch && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-2xl bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">ค้นหาใบเสร็จ</h3>
                                <button
                                    onClick={() => {
                                        setShowReceiptSearch(false);
                                        searchForm.reset();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={searchReceipt} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        เลขที่ใบเสร็จ
                                    </label>
                                    <input
                                        type="text"
                                        value={searchForm.data.receipt_number}
                                        onChange={(e) => searchForm.setData('receipt_number', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="กรอกเลขที่ใบเสร็จ"
                                        required
                                        autoFocus
                                    />
                                    {searchForm.errors.receipt_number && (
                                        <div className="text-red-600 text-sm mt-1">{searchForm.errors.receipt_number}</div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReceiptSearch(false);
                                            searchForm.reset();
                                        }}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={searchForm.processing}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {searchForm.processing ? 'กำลังค้นหา...' : 'ค้นหา'}
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