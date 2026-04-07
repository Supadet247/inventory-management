import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function ProductsIndex({ auth, products, categories, filters, totalStats }) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');
    
    // เก็บ viewMode ใน localStorage และ URL
    const [viewMode, setViewMode] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlView = urlParams.get('view');
        if (urlView === 'grid' || urlView === 'table') {
            return urlView;
        }
        return localStorage.getItem('products_view_mode') || 'grid';
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('staff.products.index'), {
            search,
            category,
            status,
            view: viewMode,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setCategory('');
        setStatus('');
        router.get(route('staff.products.index'), {
            view: viewMode
        });
    };

    const changeViewMode = (newMode) => {
        setViewMode(newMode);
        localStorage.setItem('products_view_mode', newMode);
        
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.set('view', newMode);
        
        const newUrl = window.location.pathname + '?' + currentParams.toString();
        window.history.replaceState({}, '', newUrl);
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
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    const getStockStatusColor = (product) => {
        if (product.quantity <= 0) return 'bg-red-100 text-red-800 border-red-200';
        if (product.quantity <= product.min_stock) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    const getStockStatusText = (product) => {
        if (product.quantity <= 0) return 'สินค้าหมด';
        if (product.quantity <= product.min_stock) return 'สินค้าน้อย';
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

    const deleteProduct = (product) => {
        if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${product.name}"?`)) {
            router.delete(route('staff.products.destroy', product.id));
        }
    };

    // ฟังก์ชันสำหรับแยกข้อมูล Lot จาก notes
    const extractLotInfo = (notes) => {
        if (!notes) return null;
        
        const lotMatch = notes.match(/Lot:\s*([^|]+)/);
        const expiryMatch = notes.match(/Expiry:\s*([^|]+)/);
        
        if (!lotMatch && !expiryMatch) return null;
        
        return {
            lot_number: lotMatch ? lotMatch[1].trim() : null,
            expiry_date: expiryMatch ? expiryMatch[1].trim() : null
        };
    };

    // Component สำหรับ Card View
    const ProductCard = ({ product }) => {
        const latestMovement = product.stock_movements && product.stock_movements.length > 0 
            ? product.stock_movements[0] 
            : null;
        const lotInfo = latestMovement ? extractLotInfo(latestMovement.notes) : null;

        return (
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
                    {product.image ? (
                        <img
                            src={`/storage/products/${product.image}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStockStatusColor(product)}`}>
                            {getStockStatusIcon(product)}
                            <span className="ml-1">{getStockStatusText(product)}</span>
                        </div>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            {product.category.name}
                        </span>
                    </div>

                    {/* Inactive Badge */}
                    {!product.is_active && (
                        <div className="absolute bottom-3 left-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                ไม่เปิดใช้งาน
                            </span>
                        </div>
                    )}

                    {/* Lot Badge */}
                    {lotInfo && lotInfo.lot_number && (
                        <div className="absolute bottom-3 right-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {lotInfo.lot_number}
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">รหัสสินค้า: {product.sku}</p>

                    {/* Price */}
                    <div className="text-xl font-bold text-green-600 mb-3">
                        {formatCurrency(product.price)}
                    </div>

                    {/* Stock Info */}
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">คงเหลือ:</span>
                            <span className="font-bold text-gray-900">{formatNumber(product.quantity)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
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

                    {/* Lot Information */}
                    {lotInfo && (
                        <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-200">
                            <h4 className="text-xs font-medium text-purple-900 mb-2">ข้อมูล Lot ล่าสุด</h4>
                            <div className="space-y-1">
                                {lotInfo.lot_number && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-purple-700">Lot:</span>
                                        <span className="text-purple-900 font-medium">{lotInfo.lot_number}</span>
                                    </div>
                                )}
                                {lotInfo.expiry_date && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-purple-700">หมดอายุ:</span>
                                        <span className="text-purple-900 font-medium">{formatDate(lotInfo.expiry_date)}</span>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}
                    
                    {/* Warranty Information */}
                    <div className="mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            product.warranty == 1 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                            <>
                            <span>
                            <>
                            {product.warranty == 1 ? 'มีการรับประกัน' : 'ไม่มีการรับประกัน'}
                            {/* Show warranty duration on the same line with space if product has warranty */}
                            {product.warranty == 1 && ' '}
                            {product.warranty == 1 && (
                                <>
                                    {product.warranty_years > 0 && `${product.warranty_years} ปี`}
                                    {product.warranty_months > 0 && `${product.warranty_months} เดือน`}
                                    {product.warranty_days > 0 && `${product.warranty_days} วัน`}
                                    {(product.warranty_years === 0 && product.warranty_months === 0 && product.warranty_days === 0) && ' ไม่ระบุ'}
                                </>
                            )}
                            </>
                            </span>
                            </>
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                        <Link
                            href={route('staff.products.show', product.id)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg text-center transition-colors duration-200"
                        >
                            เพิ่มเติม
                        </Link>
                        <Link
                            href={route('staff.products.edit', product.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg text-center transition-colors duration-200"
                        >
                            แก้ไข
                        </Link>
                        <button
                            onClick={() => deleteProduct(product)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-lg transition-colors duration-200"
                        >
                            ลบ
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="จัดการสินค้า" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">จัดการสินค้า</h1>
                                <p className="text-gray-600 mt-2">บริหารจัดการคลังสินค้าและรายการสินค้า</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                {/* View Toggle Buttons */}
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => changeViewMode('table')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                            viewMode === 'table'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                        title="มุมมองตาราง"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 6h18m-9 8h9m-9 4h9m-9-8h9m-9 4h9" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => changeViewMode('grid')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                            viewMode === 'grid'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                        title="มุมมองกริด"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <Link
                                    href={route('staff.products.create')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    เพิ่มสินค้า
                                </Link>
                            </div>
                        </div>
                    </div>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-1">จำนวนสินค้าทั้งหมด</p>
                                        <p className="text-2xl font-bold text-gray-900">{formatNumber(products.total)}</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-1">สินค้าที่เปิดใช้งาน</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatNumber(totalStats?.active || 0)}
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-green-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        <p className="text-sm font-medium text-gray-600 mb-1">สินค้าคงเหลือน้อย</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatNumber(totalStats?.lowStock || 0)}
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-yellow-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-1">สินค้าที่มี Lot</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatNumber(totalStats?.withLot || 0)}
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-purple-100 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">ตัวกรองสินค้า</h3>
                            <p className="text-sm text-gray-600 mt-1">ค้นหาและกรองรายการสินค้าในคลัง</p>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="">ทุกสถานะ</option>
                                            <option value="active">เปิดใช้งาน</option>
                                            <option value="inactive">ไม่เปิดใช้งาน</option>
                                            <option value="low_stock">คงเหลือน้อย</option>
                                            <option value="out_of_stock">สินค้าหมด</option>
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

                    {/* Products Display */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">รายการสินค้า</h3>
                                    <p className="text-sm text-gray-600 mt-1">พบ {formatNumber(products.data.length)} รายการ</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">แสดงผลแบบ:</span>
                                    <span className="text-sm font-medium text-gray-900">{viewMode === 'grid' ? 'กริด' : 'ตาราง'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {viewMode === 'table' ? (
                                /* Table View */
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
                                                    ราคาขาย
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                    ต้นทุน
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                    สต็อก
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                    ข้อมูล Lot
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
                                            {products.data.map((product) => {
                                                const latestMovement = product.stock_movements && product.stock_movements.length > 0 
                                                    ? product.stock_movements[0] 
                                                    : null;
                                                const lotInfo = latestMovement ? extractLotInfo(latestMovement.notes) : null;
                                                
                                                return (
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
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-green-600">{formatCurrency(product.price)}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-orange-600">{product.cost_price && product.cost_price > 0 ? formatCurrency(product.cost_price) : '-'}</div>
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
                                                        <td className="px-6 py-4">
                                                            {lotInfo ? (
                                                                <div className="bg-purple-50 rounded-lg p-2 border border-purple-200 min-w-0">
                                                                    <div className="space-y-1">
                                                                        {lotInfo.lot_number && (
                                                                            <div className="flex items-center space-x-1">
                                                                                <svg className="w-3 h-3 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                                                </svg>
                                                                                <span className="text-xs font-medium text-purple-900 truncate">{lotInfo.lot_number}</span>
                                                                            </div>
                                                                        )}
                                                                        {lotInfo.expiry_date && (
                                                                            <div className="text-xs text-purple-700">
                                                                                หมดอายุ: {formatDate(lotInfo.expiry_date)}
                                                                            </div>
                                                                        )}

                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">ไม่มีข้อมูล Lot</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-2">
                                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStockStatusColor(product)}`}>
                                                                    {getStockStatusIcon(product)}
                                                                    <span className="ml-1">{getStockStatusText(product)}</span>
                                                                </div>
                                                                {!product.is_active && (
                                                                    <div className="block">
                                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                                        ไม่เปิดใช้งาน
                                                                    </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex space-x-2">
                                                                <Link
                                                                    href={route('staff.products.show', product.id)}
                                                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                                >
                                                                    เพิ่มเติม
                                                                </Link>
                                                                <Link
                                                                    href={route('staff.products.edit', product.id)}
                                                                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                                >
                                                                    แก้ไข
                                                                </Link>
                                                                <button
                                                                    onClick={() => deleteProduct(product)}
                                                                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                                >
                                                                    ลบ
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                /* Grid View */
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {products.data.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            )}

                            {/* No Products Message */}
                            {products.data.length === 0 && (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่พบสินค้า</h3>
                                    <p className="mt-2 text-gray-500">ไม่มีสินค้าตรงกับเงื่อนไขที่เลือกในขณะนี้</p>
                                    <Link
                                        href={route('staff.products.create')}
                                        className="mt-4 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                    >
                                        เพิ่มสินค้าใหม่
                                    </Link>
                                </div>
                            )}

                            {/* Pagination */}
                            {products.links && products.data.length > 0 && (
                                <div className="mt-8 flex justify-between items-center">
                                    <div className="text-sm text-gray-700">
                                        แสดง {products.from} ถึง {products.to} จากทั้งหมด {formatNumber(products.total)} รายการ
                                    </div>
                                    <div className="flex space-x-1">
                                        {products.links.map((link, index) => {
                                            let linkUrl = link.url;
                                            if (linkUrl) {
                                                const url = new URL(linkUrl, window.location.origin);
                                                url.searchParams.set('view', viewMode);
                                                linkUrl = url.pathname + url.search;
                                            }
                                            
                                            return (
                                                <Link
                                                    key={index}
                                                    href={linkUrl || '#'}
                                                    className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                                                        link.active
                                                            ? 'bg-blue-500 text-white'
                                                            : link.url
                                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
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
                                    <p className="text-sm text-gray-600">เพิ่มรายการสินค้าเข้าสู่คลัง</p>
                                </div>
                            </div>
                            <Link 
                                href={route('staff.products.create')}
                                className="mt-4 block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                เพิ่มสินค้าใหม่
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">จัดการหมวดหมู่</h4>
                                    <p className="text-sm text-gray-600">จัดระเบียบหมวดหมู่สินค้า</p>
                                </div>
                            </div>
                            <Link 
                                href={route('staff.categories.index')}
                                className="mt-4 block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                ดูหมวดหมู่
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">รายงานคลังสินค้า</h4>
                                    <p className="text-sm text-gray-600">ดูการวิเคราะห์ข้อมูลเชิงลึก</p>
                                </div>
                            </div>
                            <Link 
                                href={route('staff.stock-movements.index')}
                                className="mt-4 block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                ดูการเคลื่อนไหว
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};