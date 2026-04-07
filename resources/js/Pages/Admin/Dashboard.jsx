// resources/js/Pages/Admin/Dashboard.jsx
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';

export default function AdminDashboard({ 
    auth, 
    stats, 
    quickStats, 
    recentActivities, 
    topSellingProducts, 
    stockMovementData, 
    categoryDistribution, 
    inventoryTrend,
    monthlySales,
    monthlyProfit
}) {
    const [selectedPeriod, setSelectedPeriod] = useState('7days');

    // Debug: ตรวจสอบข้อมูลที่ได้รับจาก backend
    console.log('Dashboard Props:', {
        stats,
        quickStats,
        recentActivities,
        topSellingProducts,
        stockMovementData,
        categoryDistribution,
        inventoryTrend
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

    const getTimeAgo = (dateString) => {
        if (!dateString) return 'ไม่มีการอัปเดตล่าสุด';
        
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now - past) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds} วินาทีที่แล้ว`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
        return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
    };

    // Filter stock movement data based on selected period
    const getFilteredStockMovementData = () => {
        if (!stockMovementData || stockMovementData.length === 0) return [];
        
        console.log('selectedPeriod:', selectedPeriod);
        console.log('stockMovementData length:', stockMovementData.length);
        console.log('stockMovementData:', stockMovementData);
        
        const daysMap = {
            'today': 1,
            '3days': 3,
            '5days': 5,
            '7days': 7
        };
        
        const days = daysMap[selectedPeriod] || 7;
        console.log('days to show:', days);
        
        const filtered = stockMovementData.slice(-days);
        console.log('filtered data:', filtered);
        
        return filtered;
    };

    const filteredStockMovementData = getFilteredStockMovementData();

    const StatsCard = ({ title, value, icon, bgColor, textColor, trend, trendValue }) => (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
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

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">{`วันที่: ${label}`}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value} รายการ`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Quick Action Card Component
    const QuickActionCard = ({ title, subtitle, href, bgColor, hoverColor, icon }) => (
        <Link
            href={href}
            className={`${bgColor} ${hoverColor} rounded-xl p-6 text-white hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 group`}
        >
            <div className="flex items-start justify-between h-full">
                <div className="flex-1 pr-4">
                    <h3 className="text-lg font-semibold mb-2 leading-tight">{title}</h3>
                    <p className="text-white/80 text-sm leading-relaxed">{subtitle}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300 flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon}
                    </svg>
                </div>
            </div>
        </Link>
    );

    // EOQ Result Card Component - Removed as requested
    
    return (
        <AuthenticatedLayout>
            <Head title="แดชบอร์ดผู้ดูแลระบบ" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <StatsCard
                            title="สินค้า ทั้งหมด"
                            value={formatNumber(stats?.totalProducts || 0)}
                            bgColor="bg-blue-100"
                            textColor="text-blue-600"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
                        />
                        
                        <StatsCard
                            title="หมวดหมู่ทั้งหมด"
                            value={formatNumber(stats?.totalCategories || 0)}
                            bgColor="bg-green-100"
                            textColor="text-green-600"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />}
                        />

                        <StatsCard
                            title="สินค้าคงเหลือน้อย"
                            value={formatNumber(stats?.lowStockProducts || 0)}
                            bgColor="bg-yellow-100"
                            textColor="text-yellow-600"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />}
                        />
                    </div>

                    {/* Bottom Row - 2 Cards + 1 Wide Card */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <StatsCard
                            title="สินค้าหมด"
                            value={formatNumber(stats?.outOfStockProducts || 0)}
                            bgColor="bg-red-100"
                            textColor="text-red-600"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />}
                        />

                        <StatsCard
                            title="ผู้ใช้ทั้งหมด"
                            value={formatNumber(stats?.totalUsers || 0)}
                            bgColor="bg-purple-100"
                            textColor="text-purple-600"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />}
                        />

                        {/* Wide Card for Total Inventory Value */}
                        <div className="md:col-span-2">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white/80 mb-1">มูลค่าสินค้าคงคลังทั้งหมด</p>
                                            <p className="text-3xl font-bold text-white">{formatCurrency(stats?.totalInventoryValue || 0)}</p>
                                        </div>
                                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section - Rearranged */}
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
                        {/* Stock Movement Chart */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">การเคลื่อนไหวสต็อก</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {selectedPeriod === 'today' && 'วันนี้'}
                                        {selectedPeriod === '3days' && '3 วันที่ผ่านมา'}
                                        {selectedPeriod === '5days' && '5 วันที่ผ่านมา'}
                                        {selectedPeriod === '7days' && '7 วันที่ผ่านมา'}
                                    </p>
                                </div>
                                <select 
                                    value={selectedPeriod} 
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="today">วันนี้</option>
                                    <option value="3days">3 วันล่าสุด</option>
                                    <option value="5days">5 วันล่าสุด</option>
                                    <option value="7days">7 วันล่าสุด</option>
                                </select>
                            </div>
                            <div className="h-80">
                                {filteredStockMovementData && filteredStockMovementData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={filteredStockMovementData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="date" 
                                                stroke="#6b7280"
                                                fontSize={12}
                                                tickFormatter={(value) => {
                                                    try {
                                                        return new Date(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                                                    } catch (e) {
                                                        return value;
                                                    }
                                                }}
                                            />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Line 
                                                type="monotone" 
                                                dataKey="in" 
                                                stroke="#10b981" 
                                                strokeWidth={3}
                                                name="นำเข้า"
                                                dot={{ fill: '#10b981', r: 6 }}
                                                activeDot={{ r: 8 }}
                                                connectNulls={false}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="out" 
                                                stroke="#ef4444" 
                                                strokeWidth={3}
                                                name="เบิกออก"
                                                dot={{ fill: '#ef4444', r: 6 }}
                                                activeDot={{ r: 8 }}
                                                connectNulls={false}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="adjustment" 
                                                stroke="#f59e0b" 
                                                strokeWidth={2}
                                                name="ปรับปรุง"
                                                dot={{ fill: '#f59e0b', r: 4 }}
                                                connectNulls={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <p className="text-gray-500 text-sm">ยังไม่มีข้อมูลการเคลื่อนไหวสต็อก</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Performance Section - ผลประกอบการ */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">ผลประกอบการ</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Daily Sales */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">ยอดขายวันนี้</p>
                                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.todaySales || 0)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Monthly Sales */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">ยอดขายเดือนนี้</p>
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlySales || 0)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Yearly Sales */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">ยอดขายปีนี้</p>
                                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats?.yearlySales || 0)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profit Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            {/* Daily Profit */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">กำไรวันนี้</p>
                                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.todayProfit || 0)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Monthly Profit */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">กำไรเดือนนี้</p>
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyProfit || 0)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Yearly Profit */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">กำไรปีนี้</p>
                                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats?.yearlyProfit || 0)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* New Row - Category Distribution and Inventory Trend */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Category Distribution */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">การกระจายตัวตามหมวดหมู่</h3>
                                <p className="text-sm text-gray-600 mt-1">จำนวนสินค้าในแต่ละหมวดหมู่</p>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryDistribution || []}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={40}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {(categoryDistribution || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value, name) => [
                                                `${formatNumber(value)} รายการ`,
                                                name
                                            ]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Sales Trend */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="mb-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">แนวโน้มยอดขาย</h3>
                                        <p className="text-sm text-gray-600 mt-1">ยอดขายเพิ่มขึ้น = ขายดี | ยอดขายลดลง = ขายไม่ดี</p>
                                    </div>
                                    {inventoryTrend && inventoryTrend.length > 1 && (
                                        <div className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                                            inventoryTrend[inventoryTrend.length - 1].value > inventoryTrend[inventoryTrend.length - 2].value
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {inventoryTrend[inventoryTrend.length - 1].value > inventoryTrend[inventoryTrend.length - 2].value ? (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                    </svg>
                                                    <span>ขายดี 👍</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                                    </svg>
                                                    <span>ขายไม่ดี 📉</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={inventoryTrend || []}>
                                        <defs>
                                            <linearGradient id="colorValueTrend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                                        <YAxis 
                                            stroke="#6b7280" 
                                            fontSize={12}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                                        />
                                        <Tooltip 
                                            formatter={(value, name) => [
                                                name === 'value' ? formatCurrency(value) : formatNumber(value),
                                                name === 'value' ? 'ยอดขาย' : 'จำนวนบิล'
                                            ]}
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                            }}
                                            labelFormatter={(label) => `${label}`}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#3b82f6" 
                                            fillOpacity={1} 
                                            fill="url(#colorValueTrend)"
                                            strokeWidth={3}
                                            dot={{ fill: '#3b82f6', r: 5 }}
                                            activeDot={{ r: 7 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Summary Stats - Removed */}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">การดำเนินการด่วน</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <QuickActionCard
                                title="จัดการสินค้า"
                                subtitle="เพิ่ม แก้ไข ลบสินค้า"
                                href={route('admin.products.index')}
                                bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                                hoverColor="hover:from-blue-600 hover:to-blue-700"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
                            />
                            
                            <QuickActionCard
                                title="จัดการหมวดหมู่"
                                subtitle="จัดการหมวดหมู่สินค้า"
                                href={route('admin.categories.index')}
                                bgColor="bg-gradient-to-br from-green-500 to-green-600"
                                hoverColor="hover:from-green-600 hover:to-green-700"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />}
                            />
                            
                            <QuickActionCard
                                title="จัดการผู้ใช้"
                                subtitle="เพิ่ม แก้ไข สิทธิ์ผู้ใช้"
                                href={route('admin.users.index')}
                                bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
                                hoverColor="hover:from-purple-600 hover:to-purple-700"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />}
                            />
                            
                            <QuickActionCard
                                title="รายงานและวิเคราะห์"
                                subtitle="ดูรายงานเชิงลึก"
                                href={route('admin.reports.index')}
                                bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
                                hoverColor="hover:from-orange-600 hover:to-orange-700"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Activities - Takes 2 columns */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-semibold text-gray-900">กิจกรรมล่าสุด</h3>
                                        <Link href={route('admin.reports.stock-movements')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                            ดูทั้งหมด
                                        </Link>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-6">
                                        {recentActivities && recentActivities.length > 0 ? (
                                            recentActivities.map((activity) => (
                                                <div key={activity.id} className="flex items-start space-x-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                                        activity.type === 'in' ? 'bg-green-500' : 
                                                        activity.type === 'out' ? 'bg-red-500' : 'bg-yellow-500'
                                                    }`}>
                                                        {activity.type === 'in' ? '+' : activity.type === 'out' ? '-' : '~'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {activity.product?.name || 'ไม่ระบุสินค้า'}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {formatDate(activity.created_at)}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            <span className="font-medium">
                                                                {activity.type === 'in' ? 'นำเข้า' : 
                                                                 activity.type === 'out' ? 'เบิกออก' : 'ปรับปรุงสต็อก'}
                                                            </span>
                                                            {' '}{activity.quantity} หน่วย โดย {activity.user?.name || 'ไม่ระบุผู้ใช้'}
                                                        </p>
                                                        {activity.notes && (
                                                            <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-lg px-3 py-2">
                                                                {activity.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-500 text-sm">ยังไม่มีกิจกรรมล่าสุด</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Selling Products */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-xl font-semibold text-gray-900">สินค้าที่ขายดีที่สุด</h3>
                                    <p className="text-sm text-gray-600 mt-1">7 วันที่ผ่านมา</p>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {topSellingProducts && topSellingProducts.length > 0 ? (
                                            topSellingProducts.map((item, index) => (
                                                <div key={item.product_id} className="flex items-center space-x-4">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {item.product?.name || 'ไม่ระบุสินค้า'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            รหัสสินค้า: {item.product?.sku || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {formatNumber(item.total_sold || 0)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">ชิ้น</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-500 text-sm">ยังไม่มีข้อมูลการขาย</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">สถิติย่อ</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">การเคลื่อนไหววันนี้</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatNumber(quickStats?.todayMovements || 0)} รายการ
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">สินค้าใหม่เดือนนี้</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatNumber(quickStats?.newProductsThisMonth || 0)} รายการ
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">ผู้ใช้งานออนไลน์</span>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {formatNumber(quickStats?.usersOnline || 0)} คน
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">อัปเดตล่าสุด</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {getTimeAgo(quickStats?.lastUpdated)}
                                        </span>
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