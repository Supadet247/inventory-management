import { useState, useEffect } from 'react';

export default function EOQCalculator({ 
    onOpenProductModal,
    onProductSelect,
    onShowNotification,
    apiBasePath = '/admin/calculator',
    syncProduct
}) {
    // State
    const [skuInput, setSkuInput] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [demand, setDemand] = useState('');
    const [monthlyQuantity, setMonthlyQuantity] = useState('');
    const [orderingCost, setOrderingCost] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [holdingRate, setHoldingRate] = useState('');
    const [result, setResult] = useState(null);

    // Fetch product by SKU
    const fetchProduct = async (sku) => {
        if (!sku.trim()) {
            setSelectedProduct(null);
            return;
        }

        try {
            const response = await fetch(`${apiBasePath}/products?search=` + encodeURIComponent(sku));
            const data = await response.json();

            if (data && Array.isArray(data) && data.length > 0) {
                const found = data.find(p => p.sku && p.sku.toLowerCase() === sku.toLowerCase());
                if (found) {
                    setSelectedProduct(found);
                    setUnitCost(found.cost_price || '');
                    onProductSelect?.(found);

                    // ถ้ามีข้อมูล EOQ ที่บันทึกไว้ ให้ดึงมาใส่ฟอร์มอัตโนมัติ
                    if (found.eoq_calculation) {
                        const eoq = found.eoq_calculation;
                        const D = parseFloat(eoq.annual_demand) || 0;
                        const S = parseFloat(eoq.ordering_cost) || 0;
                        const C = parseFloat(eoq.unit_cost) || parseFloat(found.cost_price) || 0;
                        const h = parseFloat(eoq.holding_rate) || 0;

                        if (eoq.annual_demand) setDemand(String(eoq.annual_demand));
                        if (eoq.ordering_cost) setOrderingCost(String(eoq.ordering_cost));
                        if (eoq.unit_cost) setUnitCost(String(eoq.unit_cost));
                        if (eoq.holding_rate) setHoldingRate(String(eoq.holding_rate));

                        // Auto-calculate ถ้ามีข้อมูลครบ
                        if (D > 0 && S > 0 && C > 0 && h > 0) {
                            const H = (h / 100) * C;
                            const eoqValue = Math.sqrt((2 * D * S) / H);
                            const numberOfOrders = Math.ceil(D / eoqValue);
                            const totalCost = ((D / eoqValue) * S) + ((eoqValue / 2) * H);
                            setResult({
                                eoq: Math.round(eoqValue),
                                annualDemand: D,
                                orderingCost: S,
                                holdingCost: H,
                                unitCost: C,
                                holdingRate: h,
                                numberOfOrders,
                                totalCost
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Sync product from parent (when modal selects a product)
    useEffect(() => {
        if (syncProduct === null && selectedProduct !== null) {
            reset();
        } else if (syncProduct && syncProduct.sku) {
            if (!selectedProduct || selectedProduct.sku !== syncProduct.sku) {
                setSkuInput(syncProduct.sku);
                setSelectedProduct(syncProduct);
                setUnitCost(syncProduct.cost_price || '');
                
                // If syncProduct has EOQ data from other calculator, use it directly
                if (syncProduct.eoq_calculation) {
                    const eoq = syncProduct.eoq_calculation;
                    const D = parseFloat(eoq.annual_demand) || 0;
                    const S = parseFloat(eoq.ordering_cost) || 0;
                    const C = parseFloat(eoq.unit_cost) || parseFloat(syncProduct.cost_price) || 0;
                    const h = parseFloat(eoq.holding_rate) || 0;

                    if (eoq.annual_demand) setDemand(String(eoq.annual_demand));
                    if (eoq.ordering_cost) setOrderingCost(String(eoq.ordering_cost));
                    if (eoq.unit_cost) setUnitCost(String(eoq.unit_cost));
                    if (eoq.holding_rate) setHoldingRate(String(eoq.holding_rate));

                    // Auto-calculate ถ้ามีข้อมูลครบ
                    if (D > 0 && S > 0 && C > 0 && h > 0) {
                        const H = (h / 100) * C;
                        const eoqValue = Math.sqrt((2 * D * S) / H);
                        const numberOfOrders = Math.ceil(D / eoqValue);
                        const totalCost = ((D / eoqValue) * S) + ((eoqValue / 2) * H);
                        setResult({
                            eoq: Math.round(eoqValue),
                            annualDemand: D,
                            orderingCost: S,
                            holdingCost: H,
                            unitCost: C,
                            holdingRate: h,
                            numberOfOrders,
                            totalCost
                        });
                    }
                } else {
                    // ดึง EOQ data จาก API เมื่อไม่มีข้อมูลจาก syncProduct
                    fetchProduct(syncProduct.sku);
                }
            }
        }
    }, [syncProduct]);

    // Calculate EOQ
    const calculate = () => {
        const D = parseFloat(demand) || (parseFloat(monthlyQuantity) * 12) || 0;
        const S = parseFloat(orderingCost) || 0;
        const C = parseFloat(unitCost) || 0;
        const h = parseFloat(holdingRate) || 0;

        if (D <= 0) {
            setResult({ error: 'กรุณากรอกความต้องการต่อปีหรือปริมาณต่อเดือน' });
            return;
        }
        if (S <= 0) {
            setResult({ error: 'กรุณากรอกต้นทุนการสั่งซื้อ' });
            return;
        }
        if (C <= 0) {
            setResult({ error: 'กรุณากรอกราคาทุนต่อหน่วย' });
            return;
        }
        if (h <= 0) {
            setResult({ error: 'กรุณากรอกอัตราต้นทุนการเก็บรักษา' });
            return;
        }

        // H = h × C (holding cost per unit per year)
        const H = (h / 100) * C;
        
        // EOQ = √((2 × D × S) / H)
        const eoq = Math.sqrt((2 * D * S) / H);
        
        // Number of orders per year
        const numberOfOrders = Math.ceil(D / eoq);
        
        // Total cost = (D/EOQ) × S + (EOQ/2) × H
        const totalCost = ((D / eoq) * S) + ((eoq / 2) * H);

        setResult({
            eoq: Math.round(eoq),
            annualDemand: D,
            orderingCost: S,
            holdingCost: H,
            unitCost: C,
            holdingRate: h,
            numberOfOrders,
            totalCost
        });
        onShowNotification?.('คำนวณ EOQ สำเร็จ', 'success');
    };

    // Save calculation
    const save = async () => {
        if (!result || result.error) return;

        try {
            const response = await fetch(`${apiBasePath}/save-eoq`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                },
                body: JSON.stringify({
                    product_id: selectedProduct?.id,
                    sku: selectedProduct?.sku || skuInput,
                    product_name: selectedProduct?.name,
                    annual_demand: result.annualDemand,
                    ordering_cost: result.orderingCost,
                    unit_cost: result.unitCost,
                    holding_rate: result.holdingRate,
                    holding_cost: result.holdingCost,
                    eoq: result.eoq,
                    number_of_orders: result.numberOfOrders,
                    total_cost: result.totalCost
                })
            });

            if (response.ok) {
                onShowNotification?.('บันทึกผลการคำนวณ EOQ สำเร็จ', 'success');
            } else {
                onShowNotification?.('เกิดข้อผิดพลาดในการบันทึก', 'error');
            }
        } catch (error) {
            console.error('Error saving EOQ:', error);
            onShowNotification?.('เกิดข้อผิดพลาด', 'error');
        }
    };

    // Reset form
    const reset = () => {
        setSkuInput('');
        setSelectedProduct(null);
        setDemand('');
        setMonthlyQuantity('');
        setOrderingCost('');
        setUnitCost('');
        setHoldingRate('');
        setResult(null);
        // Sync cancellation to other calculators
        onProductSelect?.(null);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">คำนวณ EOQ (Economic Order Quantity)</h3>
                <p className="text-sm text-gray-600 mt-1">ปริมาณการสั่งซื้อที่เหมาะสม</p>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div>
                        <div className="space-y-4">
                            {/* SKU Input Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    SKU สินค้า (ไม่บังคับ)
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={skuInput}
                                        onChange={(e) => {
                                            setSkuInput(e.target.value);
                                            fetchProduct(e.target.value);
                                        }}
                                        placeholder="กรอกรหัส SKU หรือคลิกเลือกสินค้า"
                                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => onOpenProductModal?.('eoq')}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center space-x-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <span>เลือก</span>
                                    </button>
                                </div>
                                {selectedProduct && (
                                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {selectedProduct.image ? (
                                                <img
                                                    src={`/storage/products/${selectedProduct.image}`}
                                                    alt={selectedProduct.name}
                                                    className="w-10 h-10 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{selectedProduct.name}</p>
                                                <p className="text-xs text-gray-600">SKU: {selectedProduct.sku}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={reset}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ความต้องการต่อปี (D) หรือ ปริมาณต่อเดือน
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="number"
                                        value={demand}
                                        onChange={(e) => setDemand(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        placeholder="ความต้องการต่อปี"
                                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hide-spin-buttons"
                                    />
                                    <span className="self-center text-gray-500">หรือ</span>
                                    <input
                                        type="number"
                                        value={monthlyQuantity}
                                        onChange={(e) => setMonthlyQuantity(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        placeholder="ปริมาณต่อเดือน"
                                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hide-spin-buttons"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">กรอกอย่างใดอย่างหนึ่ง</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ต้นทุนการสั่งซื้อแต่ละครั้ง (S)
                                </label>
                                <input
                                    type="number"
                                    value={orderingCost}
                                    onChange={(e) => setOrderingCost(e.target.value)}
                                    onWheel={(e) => e.target.blur()}
                                    placeholder="ต้นทุนการสั่งซื้อ"
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hide-spin-buttons"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ราคาทุนต่อหน่วย (C)
                                </label>
                                <input
                                    type="number"
                                    value={unitCost}
                                    onChange={(e) => setUnitCost(e.target.value)}
                                    onWheel={(e) => e.target.blur()}
                                    placeholder="ราคาทุนต่อหน่วย"
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hide-spin-buttons"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    อัตราต้นทุนการเก็บรักษา (h) %
                                </label>
                                <input
                                    type="number"
                                    value={holdingRate}
                                    onChange={(e) => setHoldingRate(e.target.value)}
                                    onWheel={(e) => e.target.blur()}
                                    placeholder="เช่น 22 สำหรับ 22%"
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hide-spin-buttons"
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={calculate}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition duration-200"
                                >
                                    คำนวณ EOQ
                                </button>
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2.5 rounded-lg transition duration-200"
                                >
                                    ล้างข้อมูล
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div>
                        <div className="bg-blue-50 rounded-lg p-5 h-full">
                            <h4 className="font-semibold text-blue-900 mb-3">ผลลัพธ์การคำนวณ</h4>
                            
                            {result && !result.error ? (
                                <div className="space-y-3">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600">ปริมาณการสั่งซื้อที่เหมาะสม (EOQ)</p>
                                            <p className="text-2xl font-bold text-blue-600 mt-1">{result.eoq} หน่วย</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="text-xs text-gray-500">ความต้องการต่อปี</p>
                                            <p className="font-medium">{result.annualDemand.toLocaleString()} หน่วย</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="text-xs text-gray-500">จำนวนครั้งการสั่งซื้อ</p>
                                            <p className="font-medium">{result.numberOfOrders} ครั้ง/ปี</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="text-xs text-gray-500">ต้นทุนการเก็บรักษา/ปี</p>
                                            <p className="font-medium">{result.holdingCost.toFixed(2)} บาท/หน่วย/ปี</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="text-xs text-gray-500">ต้นทุนรวมต่อปี</p>
                                            <p className="font-medium">{parseFloat(result.totalCost).toLocaleString()} บาท</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="text-xs text-gray-500">ต้นทุนการเก็บรักษาต่อหน่วยต่อปี (H)</p>
                                            <p className="font-medium">{result.holdingCost.toFixed(2)} บาท/หน่วย/ปี</p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-xs text-gray-600 mt-3">
                                        <p className="font-medium mb-1">สูตรที่ใช้:</p>
                                        <p className="font-mono">EOQ = √((2 × D × S) / H)</p>
                                        <p className="font-mono">H = h × C</p>
                                        <p className="mt-1">D = {result.annualDemand.toLocaleString()}, S = {result.orderingCost}, H = {result.holdingCost.toFixed(2)}</p>
                                    </div>

                                    <button
                                        onClick={save}
                                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                        </svg>
                                        บันทึกผลการคำนวณ
                                    </button>
                                </div>
                            ) : result?.error ? (
                                <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center">
                                    <p className="text-red-700">{result.error}</p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="mt-3 text-sm text-blue-800">กรุณากรอกข้อมูลเพื่อคำนวณ EOQ</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* EOQ Explanation */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">ความหมายของ EOQ</h5>
                    <p className="text-sm text-gray-600">
                        EOQ (Economic Order Quantity) คือ ปริมาณการสั่งซื้อที่เหมาะสมที่สุด 
                        ที่ช่วยลดต้นทุนรวมในการสั่งซื้อและการเก็บรักษาสินค้า
                    </p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-gray-900">D (Demand)</p>
                            <p className="text-gray-600">ความต้องการสินค้าต่อปี</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-gray-900">S (Ordering Cost)</p>
                            <p className="text-gray-600">ต้นทุนการสั่งซื้อแต่ละครั้ง</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-gray-900">H (Holding Cost)</p>
                            <p className="text-gray-600">ต้นทุนการเก็บรักษาต่อหน่วยต่อปี</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
