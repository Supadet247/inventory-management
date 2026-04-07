// resources/js/Pages/Admin/Returns/Index.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function ReturnsIndex({ auth, returns, filters, stats }) {
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
            const response = await fetch(route('admin.returns.search'), {
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

    const toggleItemSelection = (item) => {
        const existingIndex = selectedItems.findIndex(selected => selected.id === item.id);
        
        if (existingIndex >= 0) {
            setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, {
                ...item,
                return_quantity: 1,
                reason: '',
                condition_note: ''
            }]);
        }
    };

    const updateSelectedItem = (itemId, field, value) => {
        setSelectedItems(selectedItems.map(item => 
            item.id === itemId 
                ? { ...item, [field]: value }
                : item
        ));
    };

    const submitReturn = (e) => {
        e.preventDefault();
        
        const returnItems = selectedItems.map(item => ({
            receipt_item_id: item.id,
            quantity: item.return_quantity,
            reason: item.reason,
            condition_note: item.condition_note
        }));

        const totalReturnQuantity = selectedItems.reduce((sum, item) => sum + item.return_quantity, 0);
        const totalReceiptQuantity = searchedReceipt.returnable_items.reduce((sum, item) => sum + item.quantity, 0);
        
        post(route('admin.returns.process'), {
            data: {
                receipt_id: data.receipt_id,
                items: returnItems,
                general_reason: data.general_reason,
                return_type: totalReturnQuantity >= totalReceiptQuantity ? 'full' : 'partial'
            },
            onSuccess: () => {
                setShowReturnModal(false);
                setSearchedReceipt(null);
                setSelectedItems([]);
                reset();
                searchForm.reset();
            },
            onError: (errors) => {
                console.error('Return submission errors:', errors);
            }
        });
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
                            

                        </div>
                    </div>

                    {/* Return Statistics Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-indigo-100 text-sm font-medium">ยอดคืนทั้งหมด</p>
                                    <p className="text-xl font-bold">{formatCurrency(stats?.all_time_returns || 0)}</p>
                                    <p className="text-indigo-100 text-xs">บาท (ตลอดเวลา)</p>
                                </div>
                                <div className="w-12 h-12 bg-indigo-400 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">ตัวกรองข้อมูล</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            router.get(route('admin.returns.index'), {
                                search: formData.get('search') || '',
                                status: formData.get('status') || '',
                                date_from: formData.get('date_from') || '',
                                date_to: formData.get('date_to') || ''
                            }, { preserveState: true });
                        }}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหา</label>
                                    <input
                                        type="text"
                                        name="search"
                                        defaultValue={filters.search || ''}
                                        placeholder="เลขที่การคืน หรือ เลขที่ใบเสร็จ"
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                                    <select
                                        name="status"
                                        defaultValue={filters.status !== undefined ? filters.status : ''}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">ทั้งหมด</option>
                                        <option value="pending">รอดำเนินการ</option>
                                        <option value="approved">อนุมัติแล้ว</option>
                                        <option value="completed">เสร็จสิ้น</option>
                                        <option value="cancelled">ยกเลิก</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่ม</label>
                                    <input
                                        type="date"
                                        name="date_from"
                                        defaultValue={filters.date_from || ''}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
                                    <input
                                        type="date"
                                        name="date_to"
                                        defaultValue={filters.date_to || ''}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                                >
                                    ค้นหา
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.get(route('admin.returns.index'))}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                                >
                                    ล้าง
                                </button>
                            </div>
                        </form>
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
                                                    <div className="flex items-center gap-2">
                                                        {returnItem.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => router.patch(route('admin.returns.approve', returnItem.id), {}, {
                                                                        onSuccess: () => {
                                                                            router.reload({ only: ['returns', 'stats'] });
                                                                        },
                                                                        preserveScroll: true
                                                                    })}
                                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                                                    title="อนุมัติและดำเนินการเสร็จสิ้น"
                                                                >
                                                                    อนุมัติ
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm('คุณต้องการปฏิเสธการคืนสินค้านี้หรือไม่?')) {
                                                                            router.patch(route('admin.returns.cancel', returnItem.id), { reason: 'ปฏิเสธโดย Admin' }, {
                                                                                onSuccess: () => {
                                                                                    router.reload({ only: ['returns', 'stats'] });
                                                                                },
                                                                                preserveScroll: true
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                                                    title="ปฏิเสธ"
                                                                >
                                                                    ปฏิเสธ
                                                                </button>
                                                            </>
                                                        )}
                                                        {returnItem.status === 'completed' && (
                                                            <>
                                                                {returnItem.can_confirm_warranty_claim && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (confirm('ยืนยันว่าได้รับสินค้าจากดีลเลอร์แล้วใช่ไหม? สินค้าจะถูกเพิ่มกลับเข้าสต็อก')) {
                                                                                router.patch(route('admin.returns.confirm-warranty-claim', returnItem.id), {}, {
                                                                                    onSuccess: () => {
                                                                                        router.reload({ only: ['returns', 'stats'] });
                                                                                    },
                                                                                    preserveScroll: true
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                                                        title="ได้รับสินค้าจากดีลเลอร์"
                                                                    >
                                                                        รับจากดีลเลอร์
                                                                    </button>
                                                                )}
                                                                {returnItem.warranty_claim_received && (
                                                                    <span className="text-xs text-green-600 font-medium">
                                                                        รับสินค้าแล้ว
                                                                    </span>
                                                                )}
                                                                <Link
                                                                    href={route('admin.returns.print', returnItem.id)}
                                                                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                                                >
                                                                    พิมพ์
                                                                </Link>
                                                            </>
                                                        )}
                                                        {(returnItem.status === 'approved' || returnItem.status === 'cancelled') && (
                                                            <span className="text-xs text-gray-500">
                                                                -
                                                            </span>
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

                        {/* Pagination */}
                        {returns.links && returns.links.length > 3 && (
                            <div className="bg-gray-50 border-t px-6 py-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        แสดง {returns.from} ถึง {returns.to} จาก {returns.total} รายการ
                                    </div>
                                    <div className="flex gap-2">
                                        {returns.links.map((link, index) => {
                                            if (!link.url) {
                                                return (
                                                    <span key={index} className="px-3 py-1 text-sm text-gray-400 cursor-not-allowed">
                                                        {link.label.replace(/&laquo;|&raquo;/g, '')}
                                                    </span>
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={index}
                                                    href={link.url}
                                                    className={`px-3 py-1 text-sm rounded ${
                                                        link.active
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Receipt Search Modal */}
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

            {/* Return Processing Modal */}
            {showReturnModal && searchedReceipt && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-2xl bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">สร้างการคืนสินค้า</h3>
                                <button
                                    onClick={() => {
                                        setShowReturnModal(false);
                                        setSearchedReceipt(null);
                                        setSelectedItems([]);
                                        reset();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Receipt Information */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <h4 className="text-sm font-medium text-blue-900 mb-3">ข้อมูลใบเสร็จต้นฉบับ</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-600">เลขที่ใบเสร็จ:</span>
                                        <p className="font-semibold">{searchedReceipt.receipt_number}</p>
                                    </div>
                                    <div>
                                        <span className="text-blue-600">วันที่ออกใบเสร็จ:</span>
                                        <p className="font-semibold">
                                            {new Date(searchedReceipt.issued_at).toLocaleDateString('th-TH')}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-blue-600">ลูกค้า:</span>
                                        <p className="font-semibold">{searchedReceipt.customer_name}</p>
                                    </div>
                                    <div>
                                        <span className="text-blue-600">ยอดรวม:</span>
                                        <p className="font-semibold">{formatCurrency(searchedReceipt.grand_total)}</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={submitReturn} className="space-y-6">
                                {/* Returnable Items */}
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">เลือกสินค้าที่ต้องการคืน</h4>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        <input
                                                            type="checkbox"
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedItems(searchedReceipt.returnable_items.map(item => ({
                                                                        ...item,
                                                                        return_quantity: item.returnable_quantity,
                                                                        reason: '',
                                                                        condition_note: ''
                                                                    })));
                                                                } else {
                                                                    setSelectedItems([]);
                                                                }
                                                            }}
                                                            checked={selectedItems.length === searchedReceipt.returnable_items.length}
                                                        />
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สินค้า</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">จำนวนคืนได้</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">จำนวนที่คืน</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">เหตุผล</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {searchedReceipt.returnable_items.map((item) => {
                                                    const selectedItem = selectedItems.find(selected => selected.id === item.id);
                                                    const isSelected = !!selectedItem;
                                                    
                                                    return (
                                                        <tr key={item.id} className={isSelected ? 'bg-blue-50' : ''}>
                                                            <td className="px-4 py-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleItemSelection(item)}
                                                                />
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="text-sm">
                                                                    <div className="font-medium text-gray-900">{item.product_name}</div>
                                                                    <div className="text-gray-500">SKU: {item.product_sku}</div>
                                                                    <div className="text-gray-500">
                                                                        ราคา: {formatCurrency(item.unit_price)} / {item.unit}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className="text-sm font-medium">
                                                                    {item.returnable_quantity} {item.unit}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                {isSelected ? (
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max={item.returnable_quantity}
                                                                        value={selectedItem.return_quantity}
                                                                        onChange={(e) => updateSelectedItem(item.id, 'return_quantity', parseInt(e.target.value))}
                                                                        className="w-20 text-center rounded-md border-gray-300"
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                {isSelected ? (
                                                                    <select
                                                                        value={selectedItem.reason}
                                                                        onChange={(e) => updateSelectedItem(item.id, 'reason', e.target.value)}
                                                                        className="w-full rounded-md border-gray-300 text-sm"
                                                                        required
                                                                    >
                                                                        <option value="">เลือกเหตุผล</option>
                                                                        <option value="สินค้าเสียหาย">สินค้าเสียหาย</option>
                                                                        <option value="สินค้าผิดรุ่น">สินค้าผิดรุ่น</option>
                                                                        <option value="สินค้าหมดอายุ">สินค้าหมดอายุ</option>
                                                                        <option value="ลูกค้าเปลี่ยนใจ">ลูกค้าเปลี่ยนใจ</option>
                                                                        <option value="สินค้าไม่ตรงตามคำอธิบาย">สินค้าไม่ตรงตามคำอธิบาย</option>
                                                                        <option value="อื่นๆ">อื่นๆ</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* General Reason */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        เหตุผลการคืนโดยรวม (ไม่บังคับ)
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={data.general_reason}
                                        onChange={(e) => setData('general_reason', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับการคืนสินค้า"
                                    />
                                </div>

                                {/* Summary */}
                                {selectedItems.length > 0 && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">สรุปการคืน</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>จำนวนรายการที่คืน:</span>
                                                <span className="font-medium">{selectedItems.length} รายการ</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>จำนวนสินค้าทั้งหมด:</span>
                                                <span className="font-medium">
                                                    {selectedItems.reduce((sum, item) => sum + item.return_quantity, 0)} ชิ้น
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2">
                                                <span>ยอดเงินที่คาดว่าจะคืน:</span>
                                                <span className="font-bold text-green-600">
                                                    {formatCurrency(
                                                        selectedItems.reduce((sum, item) => 
                                                            sum + (item.return_quantity * item.unit_price), 0
                                                        )
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReturnModal(false);
                                            setSearchedReceipt(null);
                                            setSelectedItems([]);
                                            reset();
                                        }}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || selectedItems.length === 0 || selectedItems.some(item => !item.reason)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {processing ? 'กำลังสร้าง...' : 'สร้างการคืนสินค้า'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
};