import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function ReturnedStockManagement({ auth }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [summary, setSummary] = useState({});
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [restockQuantity, setRestockQuantity] = useState('');
    const [discardQuantity, setDiscardQuantity] = useState('');
    const [discardReason, setDiscardReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchReturnedStockProducts();
    }, [searchTerm]);

    const fetchReturnedStockProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/staff/returns/returned-stock/api/products?search=${searchTerm}`);
            const data = await response.json();
            
            if (data.success) {
                setProducts(data.data.data || []);
                setSummary(data.summary || {});
            }
        } catch (error) {
            console.error('Error fetching returned stock products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestock = async () => {
        if (!selectedProduct || !restockQuantity) return;

        setProcessing(true);
        setErrors({});

        try {
            const response = await fetch(`/staff/returns/returned-stock/api/restock/${selectedProduct.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    quantity: parseInt(restockQuantity),
                    reason: 'ตรวจสอบสภาพแล้ว สามารถขายต่อได้'
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                fetchReturnedStockProducts();
                setShowRestockModal(false);
                setSelectedProduct(null);
                setRestockQuantity('');
            } else {
                setErrors({ restock: data.message });
            }
        } catch (error) {
            setErrors({ restock: 'เกิดข้อผิดพลาดในการย้ายสต็อก' });
        } finally {
            setProcessing(false);
        }
    };

    const handleDiscard = async () => {
        if (!selectedProduct || !discardQuantity || !discardReason) return;

        setProcessing(true);
        setErrors({});

        try {
            const response = await fetch(`/staff/returns/returned-stock/api/discard/${selectedProduct.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    quantity: parseInt(discardQuantity),
                    reason: discardReason
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                fetchReturnedStockProducts();
                setShowDiscardModal(false);
                setSelectedProduct(null);
                setDiscardQuantity('');
                setDiscardReason('');
            } else {
                setErrors({ discard: data.message });
            }
        } catch (error) {
            setErrors({ discard: 'เกิดข้อผิดพลาดในการทิ้งสต็อก' });
        } finally {
            setProcessing(false);
        }
    };

    const openRestockModal = (product) => {
        setSelectedProduct(product);
        setRestockQuantity(product.returned_quantity.toString());
        setShowRestockModal(true);
        setErrors({});
    };

    const openDiscardModal = (product) => {
        setSelectedProduct(product);
        setDiscardQuantity('');
        setDiscardReason('');
        setShowDiscardModal(true);
        setErrors({});
    };

    const closeModals = () => {
        setShowRestockModal(false);
        setShowDiscardModal(false);
        setSelectedProduct(null);
        setRestockQuantity('');
        setDiscardQuantity('');
        setDiscardReason('');
        setErrors({});
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="จัดการสต็อกของคืน" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">จัดการสต็อกของคืน</h1>
                        <p className="text-gray-600 mt-2">ติดตามและจัดการสินค้าที่ถูกคืนมา</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm font-medium text-gray-500">สินค้าที่มีของคืน</div>
                            <div className="text-2xl font-bold text-gray-900">{summary.total_products || 0} รายการ</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm font-medium text-gray-500">จำนวนชิ้นรวม</div>
                            <div className="text-2xl font-bold text-gray-900">{summary.total_returned_items || 0} ชิ้น</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm font-medium text-gray-500">มูลค่าโดยประมาณ</div>
                            <div className="text-2xl font-bold text-gray-900">
                                ฿{(summary.total_returned_value || 0).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Search Bar */}
                            <div className="mb-6">
                                <TextInput
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="ค้นหาชื่อสินค้าหรือ SKU..."
                                    className="w-full max-w-md"
                                />
                            </div>

                            {/* Products Table */}
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                    <p className="mt-2 text-gray-600">กำลังโหลด...</p>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">ไม่มีสินค้าคืนในระบบ</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    สินค้า
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    หมวดหมู่
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    สต็อกขาย
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    สต็อกคืน
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    ราคา/ชิ้น
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    มูลค่าคืน
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    การจัดการ
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {products.map((product) => (
                                                <tr key={product.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {product.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                SKU: {product.sku}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {product.category?.name || 'ไม่ระบุ'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {product.quantity} ชิ้น
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            {product.returned_quantity} ชิ้น
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ฿{parseFloat(product.price).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ฿{(product.returned_quantity * parseFloat(product.price)).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <SecondaryButton
                                                                onClick={() => openRestockModal(product)}
                                                                className="text-xs"
                                                            >
                                                                ย้ายกลับสต็อก
                                                            </SecondaryButton>
                                                            <DangerButton
                                                                onClick={() => openDiscardModal(product)}
                                                                className="text-xs"
                                                            >
                                                                ทิ้ง
                                                            </DangerButton>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Restock Modal */}
            <Modal show={showRestockModal} onClose={closeModals}>
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        ย้ายสินค้ากลับเป็นสต็อกขาย
                    </h3>
                    
                    {selectedProduct && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">สินค้า: <span className="font-medium">{selectedProduct.name}</span></p>
                            <p className="text-sm text-gray-600">จำนวนของคืนที่มี: <span className="font-medium">{selectedProduct.returned_quantity} ชิ้น</span></p>
                        </div>
                    )}

                    <div className="mb-4">
                        <InputLabel htmlFor="restockQuantity" value="จำนวนที่ต้องการย้าย" />
                        <TextInput
                            id="restockQuantity"
                            type="number"
                            value={restockQuantity}
                            onChange={(e) => setRestockQuantity(e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            min="1"
                            max={selectedProduct?.returned_quantity || 1}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.restock} className="mt-2" />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <SecondaryButton onClick={closeModals}>
                            ยกเลิก
                        </SecondaryButton>
                        <PrimaryButton 
                            onClick={handleRestock} 
                            disabled={processing || !restockQuantity}
                        >
                            {processing ? 'กำลังดำเนินการ...' : 'ย้ายสต็อก'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            {/* Discard Modal */}
            <Modal show={showDiscardModal} onClose={closeModals}>
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        ทิ้งสินค้าคืน
                    </h3>
                    
                    {selectedProduct && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">สินค้า: <span className="font-medium">{selectedProduct.name}</span></p>
                            <p className="text-sm text-gray-600">จำนวนของคืนที่มี: <span className="font-medium">{selectedProduct.returned_quantity} ชิ้น</span></p>
                        </div>
                    )}

                    <div className="mb-4">
                        <InputLabel htmlFor="discardQuantity" value="จำนวนที่ต้องการทิ้ง" />
                        <TextInput
                            id="discardQuantity"
                            type="number"
                            value={discardQuantity}
                            onChange={(e) => setDiscardQuantity(e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            min="1"
                            max={selectedProduct?.returned_quantity || 1}
                            className="mt-1 block w-full"
                        />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="discardReason" value="เหตุผลในการทิ้ง" />
                        <textarea
                            id="discardReason"
                            value={discardReason}
                            onChange={(e) => setDiscardReason(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            rows="3"
                            placeholder="เช่น สินค้าเสียหาย, หมดอายุ, ไม่สามารถขายได้"
                        />
                        <InputError message={errors.discard} className="mt-2" />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <SecondaryButton onClick={closeModals}>
                            ยกเลิก
                        </SecondaryButton>
                        <DangerButton 
                            onClick={handleDiscard} 
                            disabled={processing || !discardQuantity || !discardReason}
                        >
                            {processing ? 'กำลังดำเนินการ...' : 'ทิ้งสินค้า'}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}