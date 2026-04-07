// resources/js/Pages/Admin/Reports/Index.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ReportsIndex({ 
    auth, 
    stats, 
    stockMovements, 
    dailyMovements, 
    topProducts, 
    categoryPerformance, 
    userActivity, 
    lowStockProducts, 
    recentActivities, 
    period 
}) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [chartView, setChartView] = useState('list'); // 'list' or 'chart'
    const [topProductsView, setTopProductsView] = useState('list'); // 'list' or 'chart'

    const handlePeriodChange = (newPeriod) => {
        setSelectedPeriod(newPeriod);
        router.get(route('admin.reports.index'), { period: newPeriod }, {
            preserveState: true,
            replace: true,
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('en-US').format(number);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMovementTypeColor = (type) => {
        switch (type) {
            case 'in': return 'bg-green-100 text-green-800';
            case 'out': return 'bg-red-100 text-red-800';
            case 'adjustment': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Prepare chart data
    const chartData = stockMovements ? stockMovements.map(movement => ({
        name: movement.type === 'in' ? 'นำสินค้าเข้า' : movement.type === 'out' ? 'เบิกสินค้าออก' : 'ปรับปรุงยอด',
        count: movement.count,
        quantity: movement.total_quantity,
        color: movement.type === 'in' ? '#10b981' : movement.type === 'out' ? '#ef4444' : '#3b82f6'
    })) : [];

    const pieData = stockMovements ? stockMovements.map(movement => ({
        name: movement.type === 'in' ? 'นำเข้า' : movement.type === 'out' ? 'เบิกออก' : 'ปรับปรุง',
        value: movement.count,
        fill: movement.type === 'in' ? '#10b981' : movement.type === 'out' ? '#ef4444' : '#3b82f6'
    })) : [];

    // Prepare top products chart data
    const topProductsChartData = topProducts ? topProducts.slice(0, 10).map((item, index) => ({
        name: item.product?.name?.substring(0, 15) + (item.product?.name?.length > 15 ? '...' : '') || 'Unknown Product',
        fullName: item.product?.name || 'Unknown Product',
        sku: item.product?.sku || 'N/A',
        value: item.total_sold || 0,
        rank: index + 1,
        color: `hsl(${220 + (index * 30) % 360}, 70%, ${60 - (index * 5)}%)`
    })) : [];

    const exportReport = (type, format = 'xlsx') => {
        window.open(route('admin.reports.export', { type, format }), '_blank');
    };

    // Stats Card Component
    const StatsCard = ({ title, value, icon, bgColor, textColor, trend, trendValue, subtitle }) => (
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                        )}
                        {trend && (
                            <div className={`flex items-center mt-2 text-sm ${
                                trend === 'up' ? 'text-green-600' : 
                                trend === 'down' ? 'text-red-600' : 'text-gray-500'
                            }`}>
                                {trend === 'up' && (
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17l9.2-9.2M17 8v9m-9-9h9" />
                                    </svg>
                                )}
                                {trend === 'down' && (
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17l-9.2-9.2M8 16V7m9 9H8" />
                                    </svg>
                                )}
                                <span className="font-medium">{trendValue}</span>
                            </div>
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

    // Report Action Card Component - แก้ไขให้ text align left
    const ReportActionCard = ({ title, subtitle, href, bgColor, hoverColor, icon, onClick }) => {
        const Component = href ? Link : 'button';
        const props = href ? { href } : { onClick };
        
        return (
            <Component
                {...props}
                className={`${bgColor} ${hoverColor} rounded-2xl p-6 text-white hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 group text-left`}
            >
                <div className="flex items-center justify-between">
                    <div className="text-left">
                        <h3 className="text-lg font-semibold mb-1 text-left">{title}</h3>
                        <p className="text-white/80 text-sm text-left">{subtitle}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {icon}
                        </svg>
                    </div>
                </div>
            </Component>
        );
    };

    return (
        <AuthenticatedLayout>
             <Head title="รายงานและการวิเคราะห์" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">รายงานและการวิเคราะห์</h1>
                                <p className="text-gray-600 mt-2">ข้อมูลเชิงลึกเกี่ยวกับสินค้าคงคลังและธุรกิจโดยรวม</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => handlePeriodChange(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="7">7 วันที่ผ่านมา</option>
                                    <option value="30">30 วันที่ผ่านมา</option>
                                    <option value="90">90 วันที่ผ่านมา</option>
                                    <option value="365">ปีที่ผ่านมา</option>
                                </select>
                                <div className="relative inline-block text-left">
                                    <button
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 inline-flex items-center gap-2"
                                        onClick={() => document.getElementById('export-menu').classList.toggle('hidden')}
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                        </svg>
                                        ส่งออกรายงาน
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <div id="export-menu" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-10 border border-gray-100">
                                        <button
                                            onClick={() => exportReport('inventory')}
                                            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left rounded-t-xl"
                                        >
                                            ส่งออกรายงานสินค้าคงคลัง
                                        </button>
                                        <button
                                            onClick={() => exportReport('stock_movements')}
                                            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                                        >
                                            ส่งออกรายงานการเคลื่อนไหวสินค้า
                                        </button>
                                        <button
                                            onClick={() => exportReport('low_stock')}
                                            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left rounded-b-xl"
                                        >
                                            ส่งออกรายงานสินค้าคงเหลือน้อย
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Overview Statistics - แก้ไขให้การ์ดมีความสูงเท่ากัน */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatsCard
                            title="จำนวนสินค้าทั้งหมด"
                            value={formatNumber(stats.total_products)}
                            
                            bgColor="bg-blue-100"
                            textColor="text-blue-600"
                            
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
                        />

                        <StatsCard
                            title="มูลค่าสินค้าคงคลัง"
                            value={formatCurrency(stats.total_inventory_value)}
                            bgColor="bg-green-100"
                            textColor="text-green-600"
                            
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />}
                        />

                        <StatsCard
                            title="รายการสินค้าคงเหลือน้อย"
                            value={formatNumber(stats.low_stock_products)}
                            
                            bgColor="bg-yellow-100"
                            textColor="text-yellow-600"
                            
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />}
                        />

                        <StatsCard
                            title="ผู้ใช้งานที่กำลังใช้งานอยู่"
                            value={formatNumber(stats.total_users)}
                            bgColor="bg-purple-100"
                            textColor="text-purple-600"
                          
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />}
                        />
                    </div>

                    {/* Report Action Cards */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">รายงานเชิงลึก</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ReportActionCard
                                title="รายงานสินค้าคงคลัง"
                                subtitle="ภาพรวมสินค้าคงคลังทั้งหมด"
                                href={route('admin.reports.inventory')}
                                bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                                hoverColor="hover:from-blue-600 hover:to-blue-700"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                            />
                            
                            <ReportActionCard
                                title="การเคลื่อนไหวสินค้า"
                                subtitle="ติดตามการเปลี่ยนแปลงสินค้าคงคลังทั้งหมด"
                                href={route('admin.reports.stock-movements')}
                                bgColor="bg-gradient-to-br from-green-500 to-green-600"
                                hoverColor="hover:from-green-600 hover:to-green-700"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                            />
                            
                            <ReportActionCard
                                title="แจ้งเตือนสินค้าคงเหลือน้อย"
                                subtitle="รายการที่ต้องให้ความสนใจ"
                                onClick={() => exportReport('low_stock')}
                                bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
                                hoverColor="hover:from-orange-600 hover:to-orange-700"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />}
                            />
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Stock Movement Summary - Takes 2 columns */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">สรุปการเคลื่อนไหวสินค้า</h3>
                                            <p className="text-sm text-gray-600 mt-1">กิจกรรมการเคลื่อนไหวสินค้าในช่วงเวลาที่เลือก</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex bg-gray-100 rounded-lg p-1">
                                                <button
                                                    onClick={() => setChartView('list')}
                                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                                        chartView === 'list'
                                                            ? 'bg-white text-gray-900 shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                    </svg>
                                                    รายการ
                                                </button>
                                                <button
                                                    onClick={() => setChartView('chart')}
                                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                                        chartView === 'chart'
                                                            ? 'bg-white text-gray-900 shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                    กราฟ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {chartView === 'list' ? (
                                        <div className="space-y-4">
                                            {stockMovements && stockMovements.length > 0 ? (
                                                stockMovements.map((movement) => (
                                                    <div key={movement.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                                movement.type === 'in' ? 'bg-green-500' : 
                                                                movement.type === 'out' ? 'bg-red-500' : 'bg-blue-500'
                                                            }`}>
                                                                <span className="text-white font-bold text-sm">
                                                                    {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '~'}
                                                                </span>
                                                            </div>
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMovementTypeColor(movement.type)}`}>
                                                                {movement.type === 'in' ? 'นำสินค้าเข้า' : movement.type === 'out' ? 'เบิกสินค้าออก' : 'ปรับปรุงยอด'}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-bold text-gray-900">{formatNumber(movement.count)}</div>
                                                            <div className="text-sm text-gray-500">{formatNumber(movement.total_quantity)} รายการ</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                    <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่พบการเคลื่อนไหว</h3>
                                                    <p className="mt-2 text-gray-500">ไม่มีการเคลื่อนไหวสินค้าในช่วงเวลานี้</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {stockMovements && stockMovements.length > 0 ? (
                                                <>
                                                    {/* Bar Chart */}
                                                    <div className="h-80">
                                                        <h4 className="text-lg font-medium text-gray-900 mb-4">จำนวนการเคลื่อนไหว</h4>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                                <XAxis 
                                                                    dataKey="name" 
                                                                    stroke="#6b7280" 
                                                                    fontSize={12}
                                                                    tick={{ fill: '#6b7280' }}
                                                                />
                                                                <YAxis 
                                                                    stroke="#6b7280" 
                                                                    fontSize={12}
                                                                    tick={{ fill: '#6b7280' }}
                                                                />
                                                                <Tooltip 
                                                                    contentStyle={{
                                                                        backgroundColor: 'white',
                                                                        border: '1px solid #e5e7eb',
                                                                        borderRadius: '8px',
                                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                                    }}
                                                                    formatter={(value, name) => [
                                                                        formatNumber(value),
                                                                        name === 'count' ? 'จำนวนครั้ง' : 'จำนวนรายการ'
                                                                    ]}
                                                                />
                                                                <Legend />
                                                                <Bar 
                                                                    dataKey="count" 
                                                                    name="จำนวนครั้ง" 
                                                                    fill={(entry) => entry.color}
                                                                    radius={[4, 4, 0, 0]}
                                                                >
                                                                    {chartData.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    
                                                    {/* Pie Chart */}
                                                    <div className="h-80">
                                                        <h4 className="text-lg font-medium text-gray-900 mb-4">สัดส่วนการเคลื่อนไหว</h4>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={pieData}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    outerRadius={100}
                                                                    innerRadius={40}
                                                                    dataKey="value"
                                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                                                                    labelLine={false}
                                                                >
                                                                    {pieData.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip 
                                                                    formatter={(value, name) => [
                                                                        `${formatNumber(value)} ครั้ง`,
                                                                        name
                                                                    ]}
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                    <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่มีข้อมูลสำหรับแสดงกราฟ</h3>
                                                    <p className="mt-2 text-gray-500">ไม่มีการเคลื่อนไหวสินค้าในช่วงเวลานี้</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Moving Products */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">สินค้าที่ขายดีที่สุด</h3>
                                            <p className="text-sm text-gray-600 mt-1">รายการที่มีการขายมากที่สุด</p>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <div className="flex bg-gray-100 rounded-lg p-1">
                                                <button
                                                    onClick={() => setTopProductsView('list')}
                                                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
                                                        topProductsView === 'list'
                                                            ? 'bg-white text-gray-900 shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                                >
                                                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                    </svg>
                                                    รายการ
                                                </button>
                                                <button
                                                    onClick={() => setTopProductsView('chart')}
                                                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
                                                        topProductsView === 'chart'
                                                            ? 'bg-white text-gray-900 shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                                >
                                                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                    กราฟ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {topProductsView === 'list' ? (
                                        <div className="space-y-4">
                                            {topProducts && topProducts.length > 0 ? (
                                                topProducts.slice(0, 5).map((item, index) => (
                                                    <div key={item.product_id} className="flex items-center space-x-4">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {item.product.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                รหัสสินค้า: {item.product.sku}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-gray-900">
                                                                {formatNumber(item.total_sold)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">ชิ้น</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                    <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่พบข้อมูลการขาย</h3>
                                                    <p className="mt-2 text-gray-500">ไม่มีข้อมูลการขายสินค้าในช่วงเวลานี้</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {topProducts && topProducts.length > 0 ? (
                                                <>
                                                    {/* Bar Chart */}
                                                    <div className="h-96">
                                                        <h4 className="text-lg font-medium text-gray-900 mb-4">สินค้าที่ขายดีที่สุด Top 10</h4>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={topProductsChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                                <XAxis 
                                                                    dataKey="name" 
                                                                    stroke="#6b7280" 
                                                                    fontSize={10}
                                                                    tick={{ fill: '#6b7280' }}
                                                                    angle={-45}
                                                                    textAnchor="end"
                                                                    height={60}
                                                                />
                                                                <YAxis 
                                                                    stroke="#6b7280" 
                                                                    fontSize={12}
                                                                    tick={{ fill: '#6b7280' }}
                                                                />
                                                                <Tooltip 
                                                                    contentStyle={{
                                                                        backgroundColor: 'white',
                                                                        border: '1px solid #e5e7eb',
                                                                        borderRadius: '8px',
                                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                                    }}
                                                                    formatter={(value, name, props) => [
                                                                        `${formatNumber(value)} ชิ้น`,
                                                                        'จำนวนที่ขายได้'
                                                                    ]}
                                                                    labelFormatter={(label, payload) => {
                                                                        const data = payload?.[0]?.payload;
                                                                        return data ? `${data.fullName} (${data.sku})` : label;
                                                                    }}
                                                                />
                                                                <Bar 
                                                                    dataKey="value" 
                                                                    name="จำนวนที่ขายได้" 
                                                                    radius={[4, 4, 0, 0]}
                                                                >
                                                                    {topProductsChartData.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                    <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่มีข้อมูลการขายสำหรับแสดงกราฟ</h3>
                                                    <p className="mt-2 text-gray-500">ไม่มีข้อมูลการขายของสินค้าในช่วงเวลานี้</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        {/* Category Performance */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-xl font-semibold text-gray-900">มูลค่ารวมสินค้าแต่ละประเภท</h3>
                                <p className="text-sm text-gray-600 mt-1">มูลค่าตามหมวดหมู่</p>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {categoryPerformance && categoryPerformance.length > 0 ? (
                                        categoryPerformance.slice(0, 5).map((category, index) => (
                                            <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                                        <div className="text-xs text-gray-500">{category.products_count} รายการ</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-gray-900">{formatCurrency(category.total_value)}</div>
                                                    <div className="text-xs text-gray-500">มูลค่ารวม</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <p className="mt-4 text-gray-500">ไม่มีหมวดหมู่</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* User Activity */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-xl font-semibold text-gray-900">กิจกรรมของผู้ใช้</h3>
                                <p className="text-sm text-gray-600 mt-1">ผู้ใช้ที่มีการเคลื่อนไหวมากที่สุด</p>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {userActivity && userActivity.length > 0 ? (
                                        userActivity.slice(0, 5).map((user, index) => (
                                            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-xs text-gray-500">{user.role}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-gray-900">{formatNumber(user.stock_movements_count)}</div>
                                                    <div className="text-xs text-gray-500">กิจกรรม</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <p className="mt-4 text-gray-500">ไม่มีการเคลื่อนไหวของผู้ใช้ในช่วงเวลานี้</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Low Stock Alert */}
                    {lowStockProducts && lowStockProducts.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">แจ้งเตือนสินค้าคงเหลือน้อย</h3>
                                        <p className="text-sm text-gray-600 mt-1">รายการที่ต้องให้ความสนใจทันที</p>
                                    </div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                        {lowStockProducts.length} รายการที่ต้องให้ความสนใจ
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">สินค้า</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">หมวดหมู่</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">คงเหลือ</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ขั้นต่ำ</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">สถานะ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {lowStockProducts.slice(0, 10).map((product) => (
                                                <tr key={product.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                            <div className="text-sm text-gray-500">รหัสสินค้า: {product.sku}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-900">
                                                        {product.category.name}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-bold text-gray-900">
                                                        {formatNumber(product.quantity)}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-900">
                                                        {formatNumber(product.min_stock)}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            product.quantity <= 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {product.quantity <= 0 ? 'หมดสต็อก' : 'คงเหลือน้อย'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {lowStockProducts.length > 10 && (
                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={() => exportReport('low_stock')}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            ดูทั้งหมด {lowStockProducts.length} รายการสินค้าคงเหลือน้อย →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recent Activities Timeline */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">กิจกรรมล่าสุด</h3>
                                    <p className="text-sm text-gray-600 mt-1">การเคลื่อนไหวสินค้าล่าสุด</p>
                                </div>
                                <Link
                                    href={route('admin.reports.stock-movements')}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                ดูทั้งหมด →
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flow-root">
                                <ul className="-mb-8">
                                    {recentActivities && recentActivities.length > 0 ? (
                                        recentActivities.slice(0, 8).map((activity, index) => (
                                            <li key={activity.id}>
                                                <div className="relative pb-8">
                                                    {index !== recentActivities.slice(0, 8).length - 1 && (
                                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                                    )}
                                                    <div className="relative flex space-x-3">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white text-white text-xs font-bold ${
                                                            activity.type === 'in' ? 'bg-green-500' : 
                                                            activity.type === 'out' ? 'bg-red-500' : 'bg-blue-500'
                                                        }`}>
                                                            {activity.type === 'in' ? '+' : activity.type === 'out' ? '-' : '~'}
                                                        </div>
                                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                            <div>
                                                                <p className="text-sm text-gray-500">
                                                                    <span className="font-medium text-gray-900">{activity.product.name}</span> 
                                                                    {' '}({activity.type === 'in' ? '+' : activity.type === 'out' ? '-' : ''}{formatNumber(activity.quantity)})
                                                                    {' '}by <span className="font-medium">{activity.user.name}</span>
                                                                </p>
                                                                {activity.notes && (
                                                                    <p className="text-xs text-gray-400 mt-1 bg-gray-50 rounded-lg px-3 py-2">
                                                                        {activity.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                                {formatDate(activity.created_at)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <li>
                                            <div className="text-center py-8">
                                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่มีกิจกรรมล่าสุด</h3>
                                                <p className="mt-2 text-gray-500">ไม่มีกิจกรรมล่าสุดที่จะแสดง</p>
                                            </div>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </AuthenticatedLayout>
    );
}