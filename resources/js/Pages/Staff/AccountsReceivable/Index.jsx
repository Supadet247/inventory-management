import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function AccountsReceivable({ auth, credits, summary, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [showModal, setShowModal] = useState(false);
    const [selectedCredit, setSelectedCredit] = useState(null);
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        total_amount: '',
        down_payment_percent: '30',
        installment_count: '3',
        installment_start_date: '',
        note: ''
    });
    const [errors, setErrors] = useState({});

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('staff.accounts-receivable.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        router.get(route('staff.accounts-receivable.index'));
    };

    const openPaymentModal = (credit) => {
        setSelectedCredit(credit);
        setFormData({
            customer_name: credit.customer_name,
            customer_phone: credit.customer_phone,
            total_amount: credit.total_amount,
            down_payment_percent: credit.down_payment_percent,
            installment_count: credit.installment_count,
            installment_start_date: credit.installment_start_date,
            note: '' // Clear note field for new payment entry
        });
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCredit(null);
        setErrors({});
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (selectedCredit) {
            // Record installment payment
            router.post(route('staff.accounts-receivable.api.installment'), {
                credit_id: selectedCredit.id,
                note: formData.note || undefined,
            }, {
                onSuccess: () => {
                    closeModal();
                    router.reload();
                },
                onError: (err) => {
                    if (err.error) {
                        alert(err.error);
                    } else if (err.errors) {
                        setErrors(err.errors);
                    } else {
                        alert('เกิดข้อผิดพลาดในการบันทึกการผ่อนชำระ');
                    }
                },
            });
            return;
        }

        const newErrors = {};
        if (!formData.customer_name.trim()) newErrors.customer_name = 'กรุณากรอกชื่อลูกค้า';
        if (!formData.customer_phone.trim()) newErrors.customer_phone = 'กรุณากรอกเบอร์โทรศัพท์';
        else if (formData.customer_phone.replace(/\D/g, '').length !== 10) newErrors.customer_phone = 'เบอร์โทรศัพท์ต้องเป็น 10 ตัว';
        if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) newErrors.total_amount = 'กรุณากรอกยอดผ่อนชำระ';
        
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        const installmentAmount = (parseFloat(formData.total_amount) * (1 - parseFloat(formData.down_payment_percent) / 100)) / parseInt(formData.installment_count);

        router.post(route('staff.accounts-receivable.api.credit'), {
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            total_amount: parseFloat(formData.total_amount),
            down_payment_percent: parseFloat(formData.down_payment_percent),
            installment_count: parseInt(formData.installment_count),
            installment_amount: installmentAmount,
            installment_start_date: formData.installment_start_date,
            note: formData.note || undefined,
        }, {
            onSuccess: () => {
                closeModal();
                router.reload();
            },
            onError: (err) => {
                if (err.error) {
                    alert(err.error);
                } else if (err.errors) {
                    setErrors(err.errors);
                } else {
                    alert('เกิดข้อผิดพลาดในการสร้างสินเชื่อ');
                }
            },
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'กำลังผ่อน';
            case 'completed': return 'ผ่อนครบ';
            //case 'cancelled': return 'ยกเลิก';
            default: return status;
        }
    };

    const getPaymentProgress = (credit) => {
        if (!credit.total_amount || credit.total_amount === 0) return 0;
        return Math.min(100, Math.round((credit.paid_amount / credit.total_amount) * 100));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="บัญชีสินเชื่อ" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">บัญชีสินเชื่อลูกค้า</h1>
                        <p className="text-gray-600 mt-2">ติดตามและจัดการการผ่อนชำระของลูกค้า</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">ยอดสินเชื่อทั้งหมด</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {formatCurrency(summary?.total_credit || 0)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">ยอดค้างรับ</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">
                                        {formatCurrency(summary?.total_remaining || 0)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">รับชำระวันนี้</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        {formatCurrency(summary?.today_collections || 0)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">รายการกำลังผ่อน</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {formatNumber(summary?.active_count || 0)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">ค้นหาและกรองข้อมูล</h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="ชื่อลูกค้า, เบอร์โทร, เลขบัตรประชาชน..."
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
                                            <option value="active">กำลังผ่อน</option>
                                            <option value="completed">ผ่อนครบ</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-end">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                        >
                                            ค้นหา
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                                        >
                                            ล้าง
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Credit Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="-b border-gray-p-6 border100">
                            <h3 className="text-lg font-semibold text-gray-900">รายการสินเชื่อลูกค้า</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                พบ {credits?.data?.length || 0} รายการ
                            </p>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">ลูกค้า</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">ยอดผ่อน</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">เงินดาวน์</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">งวดละ</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">จำนวนงวด</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">ความคืบหน้า</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">สถานะ</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">วันเริ่มผ่อน</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {credits?.data && credits.data.length > 0 ? (
                                        credits.data.map((credit) => (
                                            <tr key={credit.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{credit.customer_name}</div>
                                                    <div className="text-xs text-gray-500">{credit.customer_phone}</div>
                                                    {credit.id_card_number && (
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            เลขบัตร: {credit.id_card_number}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {formatCurrency(credit.total_amount)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {credit.down_payment_percent}%
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-blue-600">
                                                    {formatCurrency(credit.installment_amount)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {credit.paid_installments}/{credit.installment_count} งวด
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div 
                                                            className="bg-blue-600 h-2.5 rounded-full" 
                                                            style={{ width: `${getPaymentProgress(credit)}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {formatCurrency(credit.paid_amount)} / {formatCurrency(credit.total_amount)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(credit.status)}`}>
                                                        {getStatusText(credit.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(credit.installment_start_date).toLocaleDateString('th-TH')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {credit.status === 'active' && (
                                                        <button
                                                            onClick={() => openPaymentModal(credit)}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            บันทึกงวด
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                                                ไม่พบรายการสินเชื่อ
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {credits?.links && (
                            <div className="px-6                        {/* Pagination */}
 py-4 border-t border-gray-100">
                                <div className="flex justify-center gap-2">
                                    {credits.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.get(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-3 py-1 rounded ${
                                                link.active 
                                                    ? 'bg-blue-600 text-white' 
                                                    : link.url 
                                                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                            disabled={!link.url}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showModal && selectedCredit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">บันทึกการผ่อนชำระ</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-sm text-gray-500">ลูกค้า</div>
                                <div className="text-lg font-semibold text-gray-900">{selectedCredit.customer_name}</div>
                                <div className="text-sm text-gray-500 mt-2">เบอร์โทร</div>
                                <div className="text-gray-900">{selectedCredit.customer_phone}</div>
                                
                                <div className="text-sm text-gray-500 mt-2">เงินดาวน์</div>
                                <div className="text-gray-900 font-medium">{selectedCredit.down_payment_percent}%</div>
                                
                                <div className="text-sm text-gray-500 mt-2">วันที่เริ่มผ่อน</div>
                                <div className="text-gray-900">{new Date(selectedCredit.installment_start_date).toLocaleDateString('th-TH')}</div>
                                
                                <div className="text-sm text-gray-500 mt-2">ยอดค้างผ่อน (ต่องวด)</div>
                                <div className="text-xl font-bold text-blue-600">
                                    {formatCurrency(selectedCredit.installment_amount)}
                                </div>
                                <div className="text-sm text-gray-500 mt-2">งวดที่ต้องชำระ</div>
                                <div className="text-gray-900 font-semibold">
                                    งวดที่ {selectedCredit.paid_installments + 1} จาก {selectedCredit.installment_count} งวด
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
                                <textarea
                                    value={formData.note}
                                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                                    rows="3"
                                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                >
                                    บันทึก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
