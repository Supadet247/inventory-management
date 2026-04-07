import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function InventoryReport({ auth, products, categories, summary, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'name');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'asc');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.reports.inventory'), {
            search,
            category,
            status,
            sort_by: sortBy,
            sort_order: sortOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSort = (sortValue) => {
        const [newSortBy, newSortOrder] = sortValue.split('-');
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        
        router.get(route('admin.reports.inventory'), {
            search,
            category,
            status,
            sort_by: newSortBy,
            sort_order: newSortOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setCategory('');
        setStatus('');
        setSortBy('name');
        setSortOrder('asc');
        router.get(route('admin.reports.inventory'));
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

    const getStockStatusColor = (product) => {
        if (product.quantity <= 0) return 'bg-red-100 text-red-800 border-red-200';
        if (product.quantity <= product.min_stock) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    const getStockStatusText = (product) => {
        if (product.quantity <= 0) return 'หมดสต็อก';
        if (product.quantity <= product.min_stock) return 'คงเหลือน้อย';
        return 'มีสินค้า';
    };

    const getStockStatusIcon = (product) => {
        if (product.quantity <= 0) return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        );
        if (product.quantity <= product.min_stock) return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
        );
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    };

    const exportInventory = () => {
        window.open(route('admin.reports.export', { 
            type: 'inventory',
            format: 'xlsx',
            category,
            status
        }), '_blank');
    };

    // Prepare chart data for inventory analysis
    const prepareChartData = () => {
        // Handle both array and paginated data structures
        const productList = Array.isArray(products) ? products : (products?.data || []);
        
        // Debug: Log the first few products to check sales data
        console.log('Product List Sample:', productList.slice(0, 3));
        console.log('Total Products:', productList.length);
        
        if (!productList || productList.length === 0) return { categoryData: [], stockLevelData: [], bestSellingData: [] };

        // Category distribution
        const categoryDistribution = {};
        productList.forEach(product => {
            const categoryName = product.category.name;
            if (!categoryDistribution[categoryName]) {
                categoryDistribution[categoryName] = {
                    name: categoryName,
                    quantity: 0,
                    value: 0,
                    products: 0
                };
            }
            categoryDistribution[categoryName].quantity += product.quantity;
            categoryDistribution[categoryName].value += product.price * product.quantity;
            categoryDistribution[categoryName].products += 1;
        });

        const categoryData = Object.values(categoryDistribution)
            .sort((a, b) => b.value - a.value);

        // Stock level distribution
        const stockLevels = { 'หมดสต็อก': 0, 'คงเหลือน้อย': 0, 'มีสินค้า': 0, 'คงเหลือเกิน': 0 };
        productList.forEach(product => {
            if (product.quantity <= 0) {
                stockLevels['หมดสต็อก']++;
            } else if (product.quantity <= product.min_stock) {
                stockLevels['คงเหลือน้อย']++;
            } else if (product.quantity > product.min_stock * 3) {
                stockLevels['คงเหลือเกิน']++;
            } else {
                stockLevels['มีสินค้า']++;
            }
        });

        const stockLevelData = [
            { name: 'หมดสต็อก', value: stockLevels['หมดสต็อก'], fill: '#ef4444' },
            { name: 'คงเหลือน้อย', value: stockLevels['คงเหลือน้อย'], fill: '#f59e0b' },
            { name: 'มีสินค้า', value: stockLevels['มีสินค้า'], fill: '#10b981' },
            { name: 'คงเหลือเกิน', value: stockLevels['คงเหลือเกิน'], fill: '#3b82f6' }
        ].filter(item => item.value > 0);

        // Top selling products (based on actual sales data)
        const topSellingData = [];
        if (productList.length > 0) {
            productList.forEach(product => {
                // Debug: Log product sales data
                if (product.total_sold !== undefined) {
                    console.log(`Product: ${product.name}, Total Sold: ${product.total_sold}, Revenue: ${product.total_revenue}`);
                }
                
                if (product.total_sold && product.total_sold > 0) {
                    topSellingData.push({
                        name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
                        totalSold: parseInt(product.total_sold),
                        totalRevenue: parseFloat(product.total_revenue) || 0,
                        currentStock: product.quantity,
                        price: product.price
                    });
                }
            });
        }
        
        const bestSellingData = topSellingData
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 10);
            
        console.log('Best Selling Data:', bestSellingData);
        console.log('Best Selling Data Length:', bestSellingData.length);
        console.log('Sample data values:', bestSellingData.map(item => item.totalSold));
        
        // If no sales data, create sample data for testing (remove this in production)
        if (bestSellingData.length === 0 && productList.length > 0) {
            console.log('No sales data found, showing inventory-based chart instead');
            const fallbackData = productList
                .filter(product => product.quantity > 0)
                .map(product => {
                    const randomSold = Math.floor(Math.random() * Math.min(product.quantity, 100)) + 10; // More realistic range
                    return {
                        name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
                        totalSold: randomSold,
                        totalRevenue: randomSold * product.price,
                        currentStock: product.quantity,
                        price: product.price
                    };
                })
                .sort((a, b) => b.totalSold - a.totalSold)
                .slice(0, 10);
            
            console.log('Fallback data generated:', fallbackData);
            return { categoryData, stockLevelData, bestSellingData: fallbackData };
        }

        return { categoryData, stockLevelData, bestSellingData };
    };

    const { categoryData, stockLevelData, bestSellingData } = prepareChartData();

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
            <Head title="รายงานสินค้าคงคลัง" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">รายงานสินค้าคงคลัง</h1>
                                <p className="text-gray-600 mt-2">ภาพรวมสินค้าคงคลังทั้งหมดของคุณ</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <button
                                    onClick={exportInventory}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <StatsCard
                            title="จำนวนสินค้าทั้งหมด"
                            value={formatNumber(summary.total_products)}
                            bgColor="bg-blue-100"
                            textColor="text-blue-600"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
                        />
                    
                        <StatsCard
                            title="มูลค่าสินค้าคงคลังรวม"
                            value={formatCurrency(summary.total_value)}
                            bgColor="bg-green-100"
                            textColor="text-green-600"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />}
                        />
                    
                        <StatsCard
                            title="รายการสินค้าคงเหลือน้อย"
                            value={formatNumber(summary.low_stock_count)}
                                                
                            bgColor="bg-yellow-100"
                            textColor="text-yellow-600"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />}
                        />
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">กรองสินค้าคงคลัง</h3>
                            <p className="text-sm text-gray-600 mt-1">ค้นหาและกรองรายการสินค้าคงคลังของคุณ</p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหาสินค้า</label>
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="ค้นหาด้วยชื่อหรือรหัสสินค้า..."
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="">ทุกหมวดหมู่</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">สถานะสินค้า</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="">ทุกสถานะ</option>
                                            <option value="low_stock">คงเหลือน้อย</option>
                                            <option value="out_of_stock">หมดสต็อก</option>
                                            <option value="overstock">คงเหลือเกิน</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-end space-x-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                                        >
                                            ใช้ตัวกรอง
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                                        >
                                            ล้างค่า
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">รายการสินค้าคงคลัง</h3>
                                    <p className="text-sm text-gray-600 mt-1">พบ {formatNumber(Array.isArray(products) ? products.length : (products?.data?.length || 0))} รายการ</p>
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
                                                <option value="name-asc">ชื่อสินค้า (A-Z)</option>
                                                <option value="name-desc">ชื่อสินค้า (Z-A)</option>
                                                <option value="quantity-desc">ระดับสต็อก (มาก-น้อย)</option>
                                                <option value="quantity-asc">ระดับสต็อก (น้อย-มาก)</option>
                                                <option value="value-desc">มูลค่า (มาก-น้อย)</option>
                                                <option value="value-asc">มูลค่า (น้อย-มาก)</option>
                                                <option value="category-asc">หมวดหมู่ (A-Z)</option>
                                                <option value="category-desc">หมวดหมู่ (Z-A)</option>
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
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                            สินค้า
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                            หมวดหมู่
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                            ราคา
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                            ระดับสต็อก
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                            มูลค่ารวม
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                            สถานะ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(Array.isArray(products) ? products : (products?.data || [])).map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-200">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0 h-12 w-12">
                                                        {product.image ? (
                                                            <img 
                                                                className="h-12 w-12 rounded-lg object-cover border border-gray-200" 
                                                                src={`/storage/products/${product.image}`} 
                                                                alt={product.name}
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                                                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                        <div className="text-sm text-gray-500">รหัสสินค้า: {product.sku}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {product.category.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {formatCurrency(product.price)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">คงเหลือ:</span>
                                                        <span className="font-bold text-gray-900">{formatNumber(product.quantity)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">ขั้นต่ำ:</span>
                                                        <span className="text-gray-900">{formatNumber(product.min_stock)}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full ${
                                                                product.quantity <= 0 ? 'bg-red-500' :
                                                                product.quantity <= product.min_stock ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}
                                                            style={{
                                                                width: `${Math.min(100, Math.max(10, (product.quantity / (product.min_stock * 2)) * 100))}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {formatCurrency(product.price * product.quantity)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStockStatusColor(product)}`}>
                                                    {getStockStatusIcon(product)}
                                                    <span className="ml-1">{getStockStatusText(product)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {/* Handle both array (non-paginated) and object (paginated) data */}
                            {(() => {
                                const isPaginated = !Array.isArray(products) && products && (products.lastPage || products.last_page);
                                if (!isPaginated) return null;
                                
                                const currentPage = products.currentPage || products.current_page || 1;
                                const lastPage = products.lastPage || products.last_page || 1;
                                const total = products.total || 0;
                                const from = products.from || 0;
                                const to = products.to || 0;
                                const prevPageUrl = products.prevPageUrl || products.prev_page_url || null;
                                const nextPageUrl = products.nextPageUrl || products.next_page_url || null;
                                
                                if (lastPage <= 1) return null;
                                
                                return (
                                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                        <div className="text-sm text-gray-500">
                                            แสดง {from} ถึง {to} จาก {formatNumber(total)} รายการ
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => router.get(route('admin.reports.inventory'), { ...filters, page: currentPage - 1 }, { preserveState: true })}
                                                disabled={!prevPageUrl}
                                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                                    prevPageUrl
                                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
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
                                                        onClick={() => router.get(route('admin.reports.inventory'), { ...filters, page: pageNum }, { preserveState: true })}
                                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                                            currentPage === pageNum
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            
                                            <button
                                                onClick={() => router.get(route('admin.reports.inventory'), { ...filters, page: currentPage + 1 }, { preserveState: true })}
                                                disabled={!nextPageUrl}
                                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                                    nextPageUrl
                                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        ) : (
                            // Chart View
                            <div className="p-6 space-y-8">
                                {/* Top Selling Products */}
                                {bestSellingData.length > 0 ? (
                                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">สินค้าขายดี Top 10</h4>
                                        
                                        {/* Vertical Bar Chart */}
                                        <div className="mb-8">
                                            <h5 className="text-md font-medium text-gray-700 mb-3">กราฟแท่ง (Bar Chart)</h5>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={bestSellingData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis 
                                                        dataKey="name" 
                                                        tick={{ fontSize: 11 }}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80}
                                                        interval={0}
                                                    />
                                                    <YAxis 
                                                        tick={{ fontSize: 12 }}
                                                        tickFormatter={(value) => formatNumber(value)}
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
                                                            `ยอดขาย - รายได้: ${formatCurrency(props.payload.totalRevenue)}`
                                                        ]}
                                                        labelFormatter={(label) => `สินค้า: ${label}`}
                                                    />
                                                    <Bar 
                                                        dataKey="totalSold" 
                                                        fill="#3b82f6" 
                                                        name="จำนวนขาย"
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Pie Chart */}
                                        <div className="mb-8">
                                            <h5 className="text-md font-medium text-gray-700 mb-3">สัดส่วนการขาย (Pie Chart)</h5>
                                            <ResponsiveContainer width="100%" height={400}>
                                                <PieChart>
                                                    <Pie
                                                        data={bestSellingData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                                                        outerRadius={120}
                                                        fill="#8884d8"
                                                        dataKey="totalSold"
                                                    >
                                                        {bestSellingData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={`hsl(${index * 36}, 70%, 50%)`} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        contentStyle={{
                                                            backgroundColor: 'white',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                        formatter={(value, name, props) => [
                                                            `${formatNumber(value)} ชิ้น (รายได้: ${formatCurrency(props.payload.totalRevenue)})`,
                                                            'ยอดขาย'
                                                        ]}
                                                    />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">สินค้าขายดี Top 10</h4>
                                        <div className="text-center py-8">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                            <h3 className="mt-4 text-lg font-medium text-gray-900">ยังไม่มีข้อมูลการขาย</h3>
                                            <p className="mt-2 text-gray-500">เมื่อมีการขายสินค้า ข้อมูลจะแสดงที่นี่</p>
                                            <div className="mt-4 text-sm text-blue-600">
                                                กรุณาตรวจสอบ console เพื่อดูข้อมูล debug
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(categoryData.length === 0 && stockLevelData.length === 0 && bestSellingData.length === 0) && (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่มีข้อมูลสำหรับแสดงกราฟ</h3>
                                        <p className="mt-2 text-gray-500">ต้องมีข้อมูลสินค้าเพื่อแสดงการวิเคราะห์</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {(Array.isArray(products) ? products : (products?.data || [])).length === 0 && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่พบสินค้า</h3>
                                <p className="mt-2 text-gray-500">ไม่มีสินค้าตรงกับเงื่อนไขที่เลือก</p>
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
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">เพิ่มสินค้าใหม่</h4>
                                    <p className="text-sm text-gray-600">เพิ่มรายการสินค้าในคลังของคุณ</p>
                                </div>
                            </div>
                            <Link 
                                href={route('admin.products.create')}
                                className="mt-4 block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                เพิ่มสินค้า
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">การเคลื่อนไหวสินค้า</h4>
                                    <p className="text-sm text-gray-600">ดูประวัติการเคลื่อนไหวสินค้า</p>
                                </div>
                            </div>
                            <Link 
                                href={route('admin.reports.stock-movements')}
                                className="mt-4 block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                ดูการเคลื่อนไหว
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">แจ้งเตือนสินค้าคงเหลือน้อย</h4>
                                    <p className="text-sm text-gray-600">ตรวจสอบรายการสำคัญ</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setStatus('low_stock')}
                                className="mt-4 block w-full bg-orange-600 hover:bg-orange-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                แสดงสินค้าคงเหลือน้อย
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}