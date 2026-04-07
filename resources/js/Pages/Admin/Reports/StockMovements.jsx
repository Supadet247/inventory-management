import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

export default function StockMovementsReport({ auth, movements, allMovements, users, summary, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [type, setType] = useState(filters.type || '');
    const [userId, setUserId] = useState(filters.user_id || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'desc');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'

    // Debug logging
    console.log('StockMovements Component Props:', {
        movements: movements,
        allMovements: allMovements,
        filters: filters,
        summary: summary
    });

    const handleSearch = (e) => {
        e.preventDefault();
        
        // Debug logging
        console.log('Search triggered:', {
            startDate, endDate, type, userId, sortBy, sortOrder
        });
        
        router.get(route('admin.reports.stock-movements'), {
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            type: type || undefined,
            user_id: userId || undefined,
            sort_by: sortBy,
            sort_order: sortOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSort = (sortValue) => {
        const [newSortBy, newSortOrder] = sortValue.split('-');
        
        // Debug logging
        console.log('Sorting changed:', {
            oldSort: { sortBy, sortOrder },
            newSort: { sortBy: newSortBy, sortOrder: newSortOrder },
            currentFilters: { startDate, endDate, type, userId }
        });
        
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        
        router.get(route('admin.reports.stock-movements'), {
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            type: type || undefined,
            user_id: userId || undefined,
            sort_by: newSortBy,
            sort_order: newSortOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setType('');
        setUserId('');
        setSortBy('created_at');
        setSortOrder('desc');
        router.get(route('admin.reports.stock-movements'));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('en-US').format(number);
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

    const exportMovements = () => {
        window.open(route('admin.reports.export', { 
            type: 'stock_movements',
            format: 'xlsx',
            start_date: startDate,
            end_date: endDate,
            movement_type: type,
            user_id: userId
        }), '_blank');
    };

    // Prepare chart data
    const prepareChartData = () => {
        // Convert allMovements to array if it's not already
        const movementsArray = Array.isArray(allMovements) ? allMovements : (allMovements?.data || []);
        
        // Use allMovements for chart data instead of paginated movements.data
        if (!movementsArray || movementsArray.length === 0) return { dailyData: [], typeData: [] };

        // Daily movement trends
        const dailyMovements = {};
        movementsArray.forEach(movement => {
            const date = new Date(movement.created_at).toLocaleDateString('en-CA'); // YYYY-MM-DD format
            if (!dailyMovements[date]) {
                dailyMovements[date] = { date, in: 0, out: 0, adjustment: 0, total: 0 };
            }
            
            const quantity = Math.abs(movement.quantity);
            dailyMovements[date][movement.type] += quantity;
            dailyMovements[date].total += quantity;
        });

        const dailyData = Object.values(dailyMovements)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
            // Remove the slice(-30) to show all data

        // Movement type distribution
        const typeDistribution = { in: 0, out: 0, adjustment: 0 };
        movementsArray.forEach(movement => {
            typeDistribution[movement.type] += Math.abs(movement.quantity);
        });

        const typeData = [
            { name: 'นำสินค้าเข้า', value: typeDistribution.in, fill: '#10b981' },
            { name: 'เบิกสินค้าออก', value: typeDistribution.out, fill: '#ef4444' },
            { name: 'ปรับปรุงยอด', value: typeDistribution.adjustment, fill: '#3b82f6' }
        ].filter(item => item.value > 0);

        console.log('Chart Data Prepared:', {
            totalMovements: movementsArray.length,
            dailyDataPoints: dailyData.length,
            typeDataPoints: typeData.length,
            dateRange: dailyData.length > 0 ? {
                from: dailyData[0]?.date,
                to: dailyData[dailyData.length - 1]?.date
            } : null
        });

        return { dailyData, typeData };
    };

    const { dailyData, typeData } = prepareChartData();

    // Stats Card Component
    const StatsCard = ({ title, value, icon, bgColor, textColor, subtitle }) => (
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <svg className={`w-7 h-7 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {icon}
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="รายงานการเคลื่อนไหวสินค้า" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">รายงานการเคลื่อนไหวสินค้า</h1>
                                <p className="text-gray-600 mt-2">ติดตามการเคลื่อนไหวและการเปลี่ยนแปลงสินค้าคงคลังทั้งหมด</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <button
                                    onClick={exportMovements}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                    </svg>
                                    ส่งออก Excel
                                </button>
                                <Link
                                    href={route('admin.reports.index')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    กลับไปหน้ารายงาน
                                </Link>
                            </div>
                        </div>
                    </div>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatsCard
                            title="จำนวนการเคลื่อนไหวทั้งหมด"
                            value={formatNumber(summary.total_movements)}
                            subtitle="ตลอดเวลา"
                            bgColor="bg-blue-100"
                            textColor="text-blue-600"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                        />

                        <StatsCard
                            title="นำสินค้าเข้า"
                            value={formatNumber(summary.stock_in)}
                            subtitle="รับเข้าสินค้า"
                            bgColor="bg-green-100"
                            textColor="text-green-600"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />}
                        />

                        <StatsCard
                            title="เบิกสินค้าออก"
                            value={formatNumber(summary.stock_out)}
                            subtitle="เบิกออกจากคลัง"
                            bgColor="bg-red-100"
                            textColor="text-red-600"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />}
                        />

                        <StatsCard
                            title="ปรับปรุงยอด"
                            value={formatNumber(summary.adjustments)}
                            subtitle="แก้ไขยอด"
                            bgColor="bg-purple-100"
                            textColor="text-purple-600"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
                        />
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">กรองการเคลื่อนไหว</h3>
                            <p className="text-sm text-gray-600 mt-1">กรองการเคลื่อนไหวตามวันที่ ประเภท และผู้ใช้</p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เริ่มต้น</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สิ้นสุด</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทการเคลื่อนไหว</label>
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="">ทุกประเภท</option>
                                            <option value="in">นำสินค้าเข้า</option>
                                            <option value="out">เบิกสินค้าออก</option>
                                            <option value="adjustment">ปรับปรุงยอด</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ผู้ใช้</label>
                                        <select
                                            value={userId}
                                            onChange={(e) => setUserId(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="">ผู้ใช้ทั้งหมด</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="flex flex-col space-y-2">
                                        <button
                                            type="submit"
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                                        >
                                            ใช้ตัวกรอง
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                                        >
                                            ล้างค่า
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Stock Movements Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">ประวัติการเคลื่อนไหว</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {movements && movements.data ? 
                                            `พบ ${formatNumber(movements.total)} รายการ` : 
                                            'กำลังโหลดข้อมูล...'
                                        }
                                        {/* Debug info */}
                                        <br />
                                        <span className="text-xs text-gray-400">
                                            เรียงตาม: {sortBy}-{sortOrder} | ข้อมูล: {movements?.data?.length || 0} รายการ
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setViewMode('table')}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                                viewMode === 'table'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-9-4h18" />
                                            </svg>
                                            ตาราง
                                        </button>
                                        <button
                                            onClick={() => setViewMode('chart')}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                                viewMode === 'chart'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            กราฟละเอียด
                                        </button>
                                    </div>
                                    {viewMode === 'table' && (
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-500">เรียงตาม:</span>
                                            <select 
                                                value={`${sortBy}-${sortOrder}`}
                                                onChange={(e) => handleSort(e.target.value)}
                                                className="text-sm border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="created_at-desc">วันที่ (ใหม่ล่าสุด)</option>
                                                <option value="created_at-asc">วันที่ (เก่าสุด)</option>
                                                <option value="product-asc">สินค้า (A-Z)</option>
                                                <option value="product-desc">สินค้า (Z-A)</option>
                                                <option value="user-asc">ผู้ใช้ (A-Z)</option>
                                                <option value="user-desc">ผู้ใช้ (Z-A)</option>
                                                <option value="type-asc">ประเภท (A-Z)</option>
                                                <option value="type-desc">ประเภท (Z-A)</option>
                                                <option value="quantity-desc">จำนวน (มาก-น้อย)</option>
                                                <option value="quantity-asc">จำนวน (น้อย-มาก)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {viewMode === 'table' ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 whitespace-nowrap">
                                                วันที่และเวลา
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                สินค้า
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                ประเภท
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 whitespace-nowrap">
                                                จำนวนที่เปลี่ยนแปลง
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 whitespace-nowrap">
                                                ระดับสต็อก
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                ผู้ใช้
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                หมายเหตุ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {movements.data && movements.data.map((movement) => (
                                            <tr key={movement.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">
                                                            {new Date(movement.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })} at {new Date(movement.created_at).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{movement.product.name}</div>
                                                        <div className="text-sm text-gray-500">รหัสสินค้า: {movement.product.sku}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getMovementTypeColor(movement.type)}`}>
                                                        {getMovementTypeIcon(movement.type)}
                                                        <span className="ml-1">{getMovementTypeText(movement.type)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm font-bold ${
                                                        movement.type === 'in' ? 'text-green-600' : 
                                                        movement.type === 'out' ? 'text-red-600' : 
                                                        'text-blue-600'
                                                    }`}>
                                                        {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}{formatNumber(movement.quantity)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2 text-sm">
                                                            <span className="text-gray-600">ก่อนหน้า:</span>
                                                            <span className="font-medium text-gray-900">{formatNumber(movement.previous_quantity)}</span>
                                                            <span className="text-gray-400">→</span>
                                                            <span className="text-gray-600">หลังจาก:</span>
                                                            <span className="font-medium text-gray-900">{formatNumber(movement.new_quantity)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                                            <span className="text-white font-bold text-xs">
                                                                {movement.user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{movement.user.name}</div>
                                                            <div className="text-xs text-gray-500">{movement.user.role || 'ผู้ใช้'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                                    {movement.notes ? (
                                                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                                                            <p className="truncate">{movement.notes}</p>
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
                            <div className="p-6">
                                {dailyData.length > 0 || typeData.length > 0 ? (
                                    <div className="space-y-8">
                                        {/* Daily Movement Trends */}
                                        {dailyData.length > 0 && (
                                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-4">แนวโน้มการเคลื่อนไหวรายวัน (ทั้งหมด {allMovements?.length || 0} รายการ)</h4>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart data={dailyData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis 
                                                            dataKey="date" 
                                                            stroke="#6b7280"
                                                            fontSize={12}
                                                            tickFormatter={(value) => new Date(value).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                                                        />
                                                        <YAxis stroke="#6b7280" fontSize={12} />
                                                        <Tooltip 
                                                            contentStyle={{
                                                                backgroundColor: '#fff',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                            }}
                                                            labelFormatter={(value) => `วันที่: ${new Date(value).toLocaleDateString('th-TH')}`}
                                                        />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="in" stroke="#10b981" strokeWidth={2} name="นำสินค้าเข้า" />
                                                        <Line type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={2} name="เบิกสินค้าออก" />
                                                        <Line type="monotone" dataKey="adjustment" stroke="#3b82f6" strokeWidth={2} name="ปรับปรุงยอด" />
                                                        <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="รวมทั้งหมด" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Movement Type Distribution */}
                                        {typeData.length > 0 && (
                                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-4">การกระจายตามประเภทการเคลื่อนไหว (ทั้งหมด)</h4>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <PieChart>
                                                        <Pie
                                                            data={typeData}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        >
                                                            {typeData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip 
                                                            contentStyle={{
                                                                backgroundColor: '#fff',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                            }}
                                                            formatter={(value) => [formatNumber(value), 'จำนวน']}
                                                        />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Cumulative Movement Chart */}
                                        {dailyData.length > 0 && (
                                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-4">การสะสมการเคลื่อนไหว (ทั้งหมด)</h4>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <AreaChart data={dailyData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis 
                                                            dataKey="date" 
                                                            stroke="#6b7280"
                                                            fontSize={12}
                                                            tickFormatter={(value) => new Date(value).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                                                        />
                                                        <YAxis stroke="#6b7280" fontSize={12} />
                                                        <Tooltip 
                                                            contentStyle={{
                                                                backgroundColor: '#fff',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                            }}
                                                            labelFormatter={(value) => `วันที่: ${new Date(value).toLocaleDateString('th-TH')}`}
                                                        />
                                                        <Legend />
                                                        <Area type="monotone" dataKey="total" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="รวมการเคลื่อนไหว" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่มีข้อมูลสำหรับสร้างกราฟ</h3>
                                        <p className="mt-2 text-gray-500">ต้องมีการเคลื่อนไหวสินค้าเพื่อแสดงกราฟวิเคราะห์</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {movements.links && (() => {
                            // Check if pagination is needed
                            const currentPage = movements.current_page || movements.currentPage || 1;
                            const lastPage = movements.last_page || movements.lastPage || 1;
                            
                            if (lastPage <= 1) return null;
                            
                            return (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-700">
                                            แสดง {movements.from} ถึง {movements.to} จาก {formatNumber(movements.total)} รายการ
                                        </div>
                                        <div className="flex space-x-1">
                                            {/* Previous Button */}
                                            <button
                                                onClick={() => {
                                                    const prevPage = currentPage - 1;
                                                    if (prevPage >= 1) {
                                                        router.get(route('admin.reports.stock-movements'), {
                                                            start_date: startDate || undefined,
                                                            end_date: endDate || undefined,
                                                            type: type || undefined,
                                                            user_id: userId || undefined,
                                                            sort_by: sortBy,
                                                            sort_order: sortOrder,
                                                            page: prevPage,
                                                        }, { preserveState: true, replace: true });
                                                    }
                                                }}
                                                disabled={currentPage === 1}
                                                className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                                                    currentPage === 1
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            
                                            {/* Page Numbers */}
                                            {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                                                let pageNum;
                                                if (lastPage <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= lastPage - 2) {
                                                    pageNum = lastPage - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => router.get(route('admin.reports.stock-movements'), {
                                                            start_date: startDate || undefined,
                                                            end_date: endDate || undefined,
                                                            type: type || undefined,
                                                            user_id: userId || undefined,
                                                            sort_by: sortBy,
                                                            sort_order: sortOrder,
                                                            page: pageNum,
                                                        }, { preserveState: true, replace: true })}
                                                        className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                                                            currentPage === pageNum
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            
                                            {/* Next Button */}
                                            <button
                                                onClick={() => {
                                                    const nextPage = currentPage + 1;
                                                    if (nextPage <= lastPage) {
                                                        router.get(route('admin.reports.stock-movements'), {
                                                            start_date: startDate || undefined,
                                                            end_date: endDate || undefined,
                                                            type: type || undefined,
                                                            user_id: userId || undefined,
                                                            sort_by: sortBy,
                                                            sort_order: sortOrder,
                                                            page: nextPage,
                                                        }, { preserveState: true, replace: true });
                                                    }
                                                }}
                                                disabled={currentPage === lastPage}
                                                className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                                                    currentPage === lastPage
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                        {movements.data && movements.data.length === 0 && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่พบการเคลื่อนไหว</h3>
                                <p className="mt-2 text-gray-500">ไม่มีการเคลื่อนไหวสินค้าตรงกับเงื่อนไขที่เลือก</p>
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                >
                                    ล้างตัวกรอง
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">เพิ่มสต็อก</h4>
                                    <p className="text-sm text-gray-600">เพิ่มจำนวนสินค้าคงคลัง</p>
                                </div>
                            </div>
                            <Link 
                                href={route('admin.products.index')}
                                className="mt-4 block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                จัดการสต็อก
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">รายงานสินค้าคงคลัง</h4>
                                    <p className="text-sm text-gray-600">ดูระดับสินค้าคงคลังปัจจุบัน</p>
                                </div>
                            </div>
                            <Link 
                                href={route('admin.reports.inventory')}
                                className="mt-4 block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                ดูสินค้าคงคลัง
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">ส่งออกขั้นสูง</h4>
                                    <p className="text-sm text-gray-600">ดาวน์โหลดรายงานแบบละเอียด</p>
                                </div>
                            </div>
                            <button 
                                onClick={exportMovements}
                                className="mt-4 block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                ส่งออกข้อมูล
                            </button>
                        </div>
                    </div>

                    {/* Movement Analytics */}
                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">วิเคราะห์การเคลื่อนไหว</h3>
                            <p className="text-sm text-gray-600 mt-1">ข้อมูลเชิงลึกเกี่ยวกับการเคลื่อนไหวสินค้า</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-green-800">จำนวนสินค้าที่นำเข้า</p>
                                            <p className="text-2xl font-bold text-green-900">{formatNumber(summary.stock_in)}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-red-800">จำนวนสินค้าที่เบิกออก</p>
                                            <p className="text-2xl font-bold text-red-900">{formatNumber(summary.stock_out)}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-800">การเปลี่ยนแปลงสุทธิ</p>
                                            <p className={`text-2xl font-bold ${
                                                (summary.stock_in - summary.stock_out) >= 0 ? 'text-green-900' : 'text-red-900'
                                            }`}>
                                                {(summary.stock_in - summary.stock_out) >= 0 ? '+' : ''}{formatNumber(summary.stock_in - summary.stock_out)}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
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