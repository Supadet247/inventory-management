import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import ProductSelectorModal from '@/Components/EOQ/ProductSelectorModal';
import EOQCalculator from '@/Pages/Admin/Calculator/components/EOQCalculator';
import ROPCalculator from '@/Pages/Admin/Calculator/components/ROPCalculator';
import COGSCalculator from '@/Pages/Admin/Calculator/components/COGSCalculator';
import AverageCostCalculator from '@/Pages/Admin/Calculator/components/AverageCostCalculator';
import StorageCostCalculator from '@/Pages/Admin/Calculator/components/StorageCostCalculator';
import CostPerAreaCalculator from '@/Pages/Admin/Calculator/components/CostPerAreaCalculator';

const API_BASE = '/staff/calculator';
const ROUTE_PREFIX = 'staff';

export default function StaffCalculatorIndex({ auth }) {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [productModalMode, setProductModalMode] = useState('eoq');
    const [activeTab, setActiveTab] = useState('eoq');

    // Notification helper
    const showNotification = (message, type = 'success') => {
        const colors = type === 'success'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-400'
            : type === 'error'
            ? 'bg-gradient-to-r from-red-500 to-rose-500 border-red-400'
            : 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-400';
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-3 rounded-xl shadow-2xl z-50 text-white flex items-center gap-3 min-w-[300px] border ${colors} transform transition-all duration-300 ease-out translate-x-full opacity-0`;
        notification.innerHTML = `
            <div class="flex-1">
                <p class="font-medium text-sm">${type === 'success' ? 'สำเร็จ' : type === 'error' ? 'ผิดพลาด' : 'แจ้งเตือน'}</p>
                <p class="text-xs text-white/90">${message}</p>
            </div>
            <button class="flex-shrink-0 text-white/60 hover:text-white" onclick="this.parentElement.remove()">✕</button>
        `;
        document.body.appendChild(notification);
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        });
        setTimeout(() => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    const handleProductSync = (product) => {
        setSelectedProduct(product);
    };

    const handleOpenProductModal = (mode) => {
        setProductModalMode(mode);
        setShowProductModal(true);
    };

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setShowProductModal(false);
    };

    const tabs = [
        { id: 'eoq', label: 'EOQ', desc: 'ปริมาณสั่งซื้อที่เหมาะสม' },
        { id: 'rop', label: 'ROP', desc: 'จุดสั่งซื้อใหม่' },
        { id: 'cogs', label: 'COGS', desc: 'ต้นทุนขายสินค้า' },
        { id: 'avgcost', label: 'ต้นทุนเฉลี่ย', desc: 'ต้นทุนเฉลี่ยถ่วงน้ำหนัก' },
        { id: 'storage', label: 'ค่าเก็บรักษา', desc: 'ต้นทุนการจัดเก็บ' },
        { id: 'costperarea', label: 'ต้นทุน/พื้นที่', desc: 'ต้นทุนต่อตารางเมตร' },
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="ตัวช่วยคำนวณ" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">ตัวช่วยคำนวณ</h1>
                        <p className="text-sm lg:text-base text-gray-600 mt-1">เครื่องมือช่วยคำนวณต้นทุนและการสั่งซื้อสินค้า</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-2 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === tab.id
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="font-semibold">{tab.label}</span>
                                    <span className="hidden sm:inline text-xs ml-1 opacity-70">— {tab.desc}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div>
                        {activeTab === 'eoq' && (
                            <EOQCalculator
                                onOpenProductModal={handleOpenProductModal}
                                onProductSelect={handleProductSync}
                                onShowNotification={showNotification}
                                apiBasePath={API_BASE}
                                syncProduct={selectedProduct}
                            />
                        )}

                        {activeTab === 'rop' && (
                            <ROPCalculator
                                onOpenProductModal={handleOpenProductModal}
                                onShowNotification={showNotification}
                                onProductSelect={handleProductSync}
                                onClearProducts={() => setSelectedProduct(null)}
                                syncProduct={selectedProduct}
                                apiBasePath={API_BASE}
                                routePrefix={ROUTE_PREFIX}
                            />
                        )}

                        {activeTab === 'cogs' && (
                            <COGSCalculator
                                onOpenProductModal={handleOpenProductModal}
                                onShowNotification={showNotification}
                                onProductSelect={handleProductSync}
                                onClearProducts={() => setSelectedProduct(null)}
                                syncProduct={selectedProduct}
                                apiBasePath={API_BASE}
                                routePrefix={ROUTE_PREFIX}
                            />
                        )}

                        {activeTab === 'avgcost' && (
                            <AverageCostCalculator
                                onOpenProductModal={handleOpenProductModal}
                                onShowNotification={showNotification}
                                onProductSelect={handleProductSync}
                                syncProduct={selectedProduct}
                                apiBasePath={API_BASE}
                            />
                        )}

                        {activeTab === 'storage' && (
                            <StorageCostCalculator
                                onOpenProductModal={handleOpenProductModal}
                                onShowNotification={showNotification}
                                onProductSelect={handleProductSync}
                                syncProduct={selectedProduct}
                                apiBasePath={API_BASE}
                            />
                        )}

                        {activeTab === 'costperarea' && (
                            <CostPerAreaCalculator
                                onShowNotification={showNotification}
                                apiBasePath={API_BASE}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Product Selector Modal */}
            <ProductSelectorModal
                show={showProductModal}
                onClose={() => setShowProductModal(false)}
                onSelectProduct={handleSelectProduct}
                apiBasePath={API_BASE}
            />
        </AuthenticatedLayout>
    );
}
