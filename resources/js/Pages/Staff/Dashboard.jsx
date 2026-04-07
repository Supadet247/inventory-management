// resources/js/Pages/Staff/Dashboard.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function StaffDashboard({ 
    auth, 
    stats, 
    myRecentActivities, 
    alertProducts, 
    recentlyUpdatedProducts 
}) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('th-TH').format(number);
    };

    const getStockStatusColor = (product) => {
        if (product.quantity <= 0) return 'bg-red-100 text-red-800';
        if (product.quantity <= product.min_stock) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    const getStockStatusText = (product) => {
        if (product.quantity <= 0) return 'หมดสต็อก';
        if (product.quantity <= product.min_stock) return 'สต็อกต่ำ';
        return 'มีสต็อก';
    };

    // Stats Card Component
    const StatsCard = ({ title, value, icon, bgColor, textColor, description }) => (
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group h-full">
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        {description && (
                            <p className="text-xs text-gray-500 mt-1">{description}</p>
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

    // Quick Action Card Component
    const QuickActionCard = ({ title, subtitle, href, bgColor, hoverColor, icon }) => (
        <Link
            href={href}
            className={`${bgColor} ${hoverColor} rounded-2xl p-6 text-white hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col`}
        >
            <div className="flex items-center justify-between flex-1">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{title}</h3>
                    <p className="text-white/80 text-sm">{subtitle}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300 ml-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon}
                    </svg>
                </div>
            </div>
        </Link>
    );

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="แดชบอร์ดพนักงาน" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดพนักงาน</h1>
                                <p className="text-gray-600 mt-2">ยินดีต้อนรับ, {auth.user.name}! ภาพรวมการจัดการสต็อกของคุณ</p>
                            </div>
                        </div>
                    </div>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatsCard
                            title="สินค้าทั้งหมดในระบบ"
                            value={formatNumber(stats.totalProducts)}
                            bgColor="bg-blue-100"
                            textColor="text-blue-600"
                            description="สินค้าที่สามารถดูได้"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
                        />
                        
                        <StatsCard
                            title="สินค้าสต็อกต่ำ"
                            value={formatNumber(stats.lowStockProducts)}
                            bgColor="bg-yellow-100"
                            textColor="text-yellow-600"
                            description="ต้องการการดูแล"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />}
                        />

                        <StatsCard
                            title="สินค้าหมดสต็อก"
                            value={formatNumber(stats.outOfStockProducts)}
                            bgColor="bg-red-100"
                            textColor="text-red-600"
                            description="จำเป็นต้องเติมด่วน"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />}
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">การดำเนินการด่วน</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <QuickActionCard
                                title="ดูสินค้าทั้งหมด"
                                subtitle="เรียกดูข้อมูลสินค้า"
                                href={route('staff.products.index')}
                                bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                                hoverColor="hover:from-blue-600 hover:to-blue-700"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
                            />
                            
                            <QuickActionCard
                                title="จัดการประเภทสินค้า"
                                subtitle="จัดหมวดหมู่สินค้า"
                                href={route('staff.categories.index')}
                                bgColor="bg-gradient-to-br from-green-500 to-green-600"
                                hoverColor="hover:from-green-600 hover:to-green-700"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />}
                            />
                            
                            <QuickActionCard
                                title="การเคลื่อนไหวสต็อก"
                                subtitle="ดูประวัติการเคลื่อนไหว"
                                href={route('staff.stock-movements.index')}
                                bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
                                hoverColor="hover:from-purple-600 hover:to-purple-700"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                            />
                            
                            <QuickActionCard
                                title="สินค้าต้องดูแล"
                                subtitle="รายการสต็อกต่ำ"
                                href="#alert-products"
                                bgColor="bg-gradient-to-br from-yellow-500 to-orange-500"
                                hoverColor="hover:from-yellow-600 hover:to-orange-600"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />}
                            />
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Alert Products - Takes 2 columns */}
                        <div className="lg:col-span-2">
                            <div id="alert-products" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">สินค้าที่ต้องการความสนใจ</h3>
                                            <p className="text-sm text-gray-600 mt-1">สินค้าที่มีสต็อกต่ำหรือหมดแล้ว</p>
                                        </div>
                                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {alertProducts.length} รายการ
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {alertProducts.length > 0 ? (
                                        <div className="space-y-4">
                                            {alertProducts.map((product) => (
                                                <Link
                                                    key={product.id}
                                                    href={route('staff.products.show', product.id)}
                                                    className="block border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-blue-200"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        {/* Product Image */}
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                                            {product.image ? (
                                                                <img
                                                                    src={`/storage/products/${product.image}`}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Product Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h4>
                                                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                                            <p className="text-xs text-gray-500">หมวดหมู่: {product.category.name}</p>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getStockStatusColor(product)}`}>
                                                                {getStockStatusText(product)}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Stock Info */}
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="text-sm">
                                                                <div className="font-bold text-gray-900">คงเหลือ: {product.quantity}</div>
                                                                <div className="text-gray-500">ขั้นต่ำ: {product.min_stock}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีสินค้าที่ต้องดูแล</h3>
                                            <p className="text-gray-500">สินค้าทั้งหมดมีสต็อกเพียงพอ</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* My Activities Sidebar */}
                        <div className="lg:col-span-1 space-y-8">
                            {/* My Recent Activities */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-xl font-semibold text-gray-900">กิจกรรมของฉัน</h3>
                                    <p className="text-sm text-gray-600 mt-1">การทำงานล่าสุด</p>
                                </div>
                                <div className="p-6">
                                    {myRecentActivities && myRecentActivities.length > 0 ? (
                                        <div className="space-y-4">
                                            {myRecentActivities.slice(0, 6).map((activity, index) => (
                                                <div key={activity.id} className="flex items-start space-x-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs ${
                                                        activity.type === 'in' ? 'bg-green-500' : 
                                                        activity.type === 'out' ? 'bg-red-500' : 'bg-yellow-500'
                                                    }`}>
                                                        {activity.type === 'in' ? '+' : activity.type === 'out' ? '-' : '~'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {activity.product.name}
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            <span className="font-medium">
                                                                {activity.type === 'in' ? 'เพิ่มสต็อก' : 
                                                                 activity.type === 'out' ? 'ลดสต็อก' : 'ปรับปรุงสต็อก'}
                                                            </span>
                                                            {' '}{activity.quantity} ชิ้น
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatDate(activity.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <p className="text-gray-500 text-sm">ยังไม่มีกิจกรรม</p>
                                        </div>
                                    )}
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* Recently Updated Products */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">สินค้าที่อัปเดตล่าสุด</h3>
                                <p className="text-sm text-gray-600 mt-1">สินค้าที่มีการเปลี่ยนแปลงข้อมูลล่าสุด</p>
                            </div>
                        </div>
                        
                        {recentlyUpdatedProducts && recentlyUpdatedProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                {recentlyUpdatedProducts.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={route('staff.products.show', product.id)}
                                        className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                                    >
                                        {/* Product Image */}
                                        <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                            {product.image ? (
                                                <img
                                                    src={`/storage/products/${product.image}`}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                            {/* Stock Status Badge */}
                                            <div className="absolute top-2 right-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                                    product.quantity <= 0 
                                                        ? 'bg-red-100 text-red-800 border-red-200' 
                                                        : product.quantity <= product.min_stock 
                                                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                                                            : 'bg-green-100 text-green-800 border-green-200'
                                                }`}>
                                                    {product.quantity <= 0 ? 'หมด' : product.quantity <= product.min_stock ? 'น้อย' : 'มี'}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Product Info */}
                                        <div className="p-3">
                                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                {product.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">{product.sku}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm font-semibold text-blue-600">
                                                    {formatCurrency(product.price)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {product.quantity} ชิ้น
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                อัปเดต: {(() => {
                                                    const diff = new Date() - new Date(product.updated_at);
                                                    const hours = Math.floor(diff / 3600000);
                                                    const minutes = Math.floor(diff / 60000);
                                                    if (minutes < 60) return `${minutes} นาที่แล้ว`;
                                                    if (hours < 24) return `${hours} ชม. ที่แล้ว`;
                                                    return formatDate(product.updated_at);
                                                })()}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีสินค้าที่อัปเดตล่าสุด</h3>
                                <p className="text-gray-500">ยังไม่มีการอัปเดตข้อมูลสินค้าในระยะนี้</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}