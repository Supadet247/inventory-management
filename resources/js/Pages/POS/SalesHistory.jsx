import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Search,
    Calendar,
    DollarSign,
    User,
    CreditCard,
    Eye,
    Download,
    Filter,
    X,
    BarChart3,
    FileText,
    History as HistoryIcon
} from 'lucide-react';

export default function SalesHistory({ auth, sales, summary_stats, users, filters }) {
    const [showFilters, setShowFilters] = useState(false);
    const [searchForm, setSearchForm] = useState({
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        payment_method: filters.payment_method || '',
        user_id: filters.user_id || '',
        amount_min: filters.amount_min || '',
        amount_max: filters.amount_max || ''
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount || 0);
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

    const getPaymentMethodText = (method) => {
        const methods = {
            'cash': 'เงินสด',
            'transfer': 'โอนเงิน',
            'qrcode': 'QR Code',
            'mixed': 'ผสม',
            'installment': 'ผ่อนชำระ'
        };
        return methods[method] || method;
    };

    const getPaymentMethodColor = (method) => {
        const colors = {
            'cash': 'bg-green-100 text-green-800',
            'transfer': 'bg-blue-100 text-blue-800',
            'qrcode': 'bg-purple-100 text-purple-800',
            'mixed': 'bg-orange-100 text-orange-800',
            'installment': 'bg-yellow-100 text-yellow-800'
        };
        return colors[method] || 'bg-gray-100 text-gray-800';
    };

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('pos.sales.index'), searchForm, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleReset = () => {
        setSearchForm({
            date_from: '',
            date_to: '',
            payment_method: '',
            user_id: '',
            amount_min: '',
            amount_max: ''
        });
        router.get(route('pos.sales.index'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const menuItems = [
        { id: 'pos', name: 'ขายสินค้า', icon: BarChart3, href: route('pos.index') },
        { id: 'return', name: 'คืนสินค้า', icon: FileText, href: route('pos.index') },
        { id: 'history', name: 'ประวัติการขาย', icon: HistoryIcon, active: true }
    ];

    return (
        <>
            <Head title="ประวัติการขาย" />

            <div className="flex h-screen bg-gray-100">
                {/* Sidebar */}
                <div className="w-64 bg-slate-800 text-white flex flex-col flex-shrink-0">
                    <div className="p-6 bg-slate-700">
                        <a 
                            href={route('dashboard')}
                            className="block hover:text-blue-300 transition-colors"
                        >
                            <h1 className="text-xl font-bold">สมบัติเกษตรยนต์</h1>
                        </a>
                        <p className="text-sm text-gray-300 mt-1">ผู้ใช้งาน: {auth.user.name}</p>
                    </div>

                    <nav className="flex-1 p-2">
                        {menuItems.map((item) => {
                            const IconComponent = item.icon;
                            
                            if (item.href) {
                                return (
                                    <a
                                        key={item.id}
                                        href={item.href}
                                        className={`w-full flex items-center px-4 py-3 rounded mb-1 transition-colors ${
                                            item.active
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-300 hover:bg-slate-700'
                                        }`}
                                    >
                                        <IconComponent className="mr-3" size={20} />
                                        {item.name}
                                    </a>
                                );
                            }
                            
                            return null;
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-700">
                        <p className="text-xs text-gray-400 text-center">
                            POS System v1.0
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        <div className="max-w-7xl mx-auto">
                            {/* Header */}
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">ประวัติการขาย</h1>
                                    <p className="text-sm text-gray-600 mt-1">
                                        ทั้งหมด {sales.total || 0} รายการ
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <Filter size={20} />
                                    ตัวกรอง
                                </button>
                            </div>

                            {/* Summary Stats */}
                            {summary_stats && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-3 rounded-lg">
                                                <BarChart3 className="text-blue-600" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">ยอดขายรวม</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    {formatCurrency(summary_stats.total_amount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 p-3 rounded-lg">
                                                <FileText className="text-green-600" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">จำนวนบิล</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    {summary_stats.total_transactions || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-purple-100 p-3 rounded-lg">
                                                <DollarSign className="text-purple-600" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">ยอดเฉลี่ย</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    {formatCurrency(summary_stats.average_amount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-orange-100 p-3 rounded-lg">
                                                <Calendar className="text-orange-600" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">ภาษีรวม</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    {formatCurrency(summary_stats.total_tax)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Filters */}
                            {showFilters && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">ตัวกรองการค้นหา</h3>
                                        <button
                                            onClick={() => setShowFilters(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleFilter} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    วันที่เริ่มต้น
                                                </label>
                                                <input
                                                    type="date"
                                                    value={searchForm.date_from}
                                                    onChange={(e) => setSearchForm({...searchForm, date_from: e.target.value})}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    วันที่สิ้นสุด
                                                </label>
                                                <input
                                                    type="date"
                                                    value={searchForm.date_to}
                                                    onChange={(e) => setSearchForm({...searchForm, date_to: e.target.value})}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    ช่องทางชำระเงิน
                                                </label>
                                                <select
                                                    value={searchForm.payment_method}
                                                    onChange={(e) => setSearchForm({...searchForm, payment_method: e.target.value})}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                >
                                                    <option value="">ทั้งหมด</option>
                                                    <option value="cash">เงินสด</option>
                                                    <option value="transfer">โอนเงิน</option>
                                                    <option value="qrcode">QR Code</option>
                                                    <option value="mixed">ผสม</option>
                                                    <option value="installment">ผ่อนชำระ</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    ผู้ขาย
                                                </label>
                                                <select
                                                    value={searchForm.user_id}
                                                    onChange={(e) => setSearchForm({...searchForm, user_id: e.target.value})}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                >
                                                    <option value="">ทั้งหมด</option>
                                                    {users.map(user => (
                                                        <option key={user.id} value={user.id}>{user.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    ยอดขายขั้นต่ำ
                                                </label>
                                                <input
                                                    type="number"
                                                    value={searchForm.amount_min}
                                                    onChange={(e) => setSearchForm({...searchForm, amount_min: e.target.value})}
                                                    onWheel={(e) => e.target.blur()}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    ยอดขายสูงสุด
                                                </label>
                                                <input
                                                    type="number"
                                                    value={searchForm.amount_max}
                                                    onChange={(e) => setSearchForm({...searchForm, amount_max: e.target.value})}
                                                    onWheel={(e) => e.target.blur()}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                            >
                                                ค้นหา
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
                                            >
                                                ล้างตัวกรอง
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Sales Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    วันที่
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    เลขที่ใบเสร็จ
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    ผู้ขาย
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    ช่องทางชำระ
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    ยอดรวม
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    การดำเนินการ
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {sales.data && sales.data.length > 0 ? (
                                                sales.data.map((sale) => (
                                                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {formatDate(sale.sale_date)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm font-medium text-blue-600">
                                                                {sale.receipt?.receipt_number || `SALE-${sale.id}`}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {sale.user?.name || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(sale.payment_method)}`}>
                                                                {getPaymentMethodText(sale.payment_method)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                                            {formatCurrency(sale.grand_total)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <a
                                                                href={route('pos.sales.show', sale.id)}
                                                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                            >
                                                                <Eye size={16} />
                                                                ดูรายละเอียด
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <FileText className="w-12 h-12 text-gray-300 mb-3" />
                                                            <p className="text-gray-500">ไม่พบรายการขาย</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {sales.links && sales.links.length > 3 && (
                                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-700">
                                                แสดง {sales.from || 0} ถึง {sales.to || 0} จาก {sales.total || 0} รายการ
                                            </div>
                                            <div className="flex gap-2">
                                                {sales.links.map((link, index) => {
                                                    if (!link.url) {
                                                        return (
                                                            <span
                                                                key={index}
                                                                className="px-3 py-1 text-sm text-gray-400 cursor-not-allowed"
                                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                            />
                                                        );
                                                    }

                                                    return (
                                                        <a
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
                </div>
            </div>
        </>
    );
}
