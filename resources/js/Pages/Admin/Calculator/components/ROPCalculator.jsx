import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

export default function ROPCalculator({ 
    onOpenProductModal,
    onShowNotification,
    onProductSelect,
    onClearProducts,
    syncProduct,
    apiBasePath = '/admin/calculator',
    routePrefix = 'admin'
}) {
    // State
    const [skuInput, setSkuInput] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [annualDemand, setAnnualDemand] = useState('');
    const [leadTime, setLeadTime] = useState(7);
    const [safetyStock, setSafetyStock] = useState(10);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // Track previous syncProduct to detect changes
    const prevSyncProductRef = useRef(null);
    
    // Sync product from parent (when other calculator selects a product)
    useEffect(() => {
        // Only process if syncProduct actually changed
        if (syncProduct === prevSyncProductRef.current) {
            return;
        }
        prevSyncProductRef.current = syncProduct;
        
        if (syncProduct === null && selectedProduct !== null) {
            // Clear only local state when synced null (don't call onClearProducts to avoid loop)
            setSkuInput('');
            setSelectedProduct(null);
            setAnnualDemand('');
            setLeadTime('');
            setSafetyStock('');
            setResult(null);
        } else if (syncProduct && syncProduct.sku) {
            // Only update if it's a different product
            if (!selectedProduct || selectedProduct.sku !== syncProduct.sku) {
                setSkuInput(syncProduct.sku);
                setSelectedProduct({
                    id: syncProduct.id,
                    name: syncProduct.name,
                    sku: syncProduct.sku,
                    cost_price: syncProduct.cost_price,
                    quantity: syncProduct.quantity,
                    image: syncProduct.image,
                });
                fetchProductForRop(syncProduct.sku);
            }
        }
    }, [syncProduct]);

    // Fetch product and EOQ data by SKU
    const fetchProductForRop = async (sku) => {
        if (!sku) return;
        
        setLoading(true);
        try {
            const response = await fetch(`${apiBasePath}/annual-demand-from-eoq?sku=${encodeURIComponent(sku)}`);
            const data = await response.json();
            
            if (response.ok) {
                setAnnualDemand(data.annual_demand || '');
                
                // Set SKU input to display in the field
                setSkuInput(data.sku || '');
                
                // Load saved ROP data if exists
                if (data.lead_time) setLeadTime(data.lead_time);
                if (data.safety_stock_pct !== undefined) setSafetyStock(data.safety_stock_pct);
                
                const product = {
                    id: data.product_id,
                    name: data.product_name,
                    sku: data.sku,
                    image: data.image,
                    cost_price: data.cost_price,
                    // Include EOQ data for syncing to EOQ calculator
                    eoq_calculation: {
                        annual_demand: data.annual_demand,
                        ordering_cost: data.ordering_cost,
                        unit_cost: data.unit_cost,
                        holding_rate: data.holding_rate,
                    }
                };
                setSelectedProduct(product);
                
                // Notify parent to sync with other calculators (including EOQ data)
                onProductSelect?.(product);

                // Auto-calculate ROP with fetched data
                if (data.annual_demand) {
                    const D = parseFloat(data.annual_demand);
                    const L = data.lead_time || leadTime || 7;
                    const safetyPct = data.safety_stock_pct !== undefined ? data.safety_stock_pct : (safetyStock || 10);
                    const dailyDemand = D / 365;
                    const dailyDemandDisplay = parseFloat(dailyDemand.toFixed(2));
                    const rop = dailyDemandDisplay * L;
                    const safetyStockVal = Math.ceil(rop * (safetyPct / 100));
                    setResult({
                        annualDemand: D,
                        leadTime: L,
                        safetyStock: safetyStockVal,
                        dailyDemand: dailyDemandDisplay.toFixed(2),
                        rop: rop.toFixed(2),
                        ropWithSafety: (rop + safetyStockVal).toFixed(2),
                        raw: {
                            product_id: data.product_id,
                            product_name: data.product_name,
                            sku: data.sku,
                            annual_demand: D,
                            lead_time: L,
                            safety_stock: safetyStockVal,
                            daily_demand: dailyDemand,
                            rop,
                        }
                    });
                }
            } else {
                onShowNotification?.(data.error || 'ไม่พบข้อมูล EOQ สำหรับสินค้านี้', 'error');
                setSelectedProduct(null);
            }
        } catch (error) {
            console.error('Error fetching product for ROP:', error);
            onShowNotification?.('เกิดข้อผิดพลาดในการดึงข้อมูล', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle SKU input change - auto search
    const handleSkuChange = async (e) => {
        const sku = e.target.value;
        setSkuInput(sku);
        
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
                    const product = {
                        id: found.id,
                        name: found.name,
                        sku: found.sku,
                        cost_price: found.cost_price,
                        quantity: found.quantity,
                        image: found.image,
                    };
                    setSelectedProduct(product);
                    fetchProductForRop(found.sku);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Handle SKU blur
    const handleSkuBlur = () => {
        if (skuInput && !selectedProduct) {
            fetchProductForRop(skuInput);
        }
    };

    // Calculate ROP
    const calculate = () => {
        const D = parseFloat(annualDemand) || 0;
        const L = parseFloat(leadTime) || 0;

        if (!annualDemand || D <= 0) {
            setResult({ error: 'กรุณากรอกความต้องการต่อปี' });
            return;
        }
        if (L <= 0) {
            setResult({ error: 'กรุณากรอกระยะเวลาจัดส่ง' });
            return;
        }

        const dailyDemand = D / 365;
        const dailyDemandDisplay = parseFloat(dailyDemand.toFixed(2));
        const rop = dailyDemandDisplay * L;
        const safetyStockPercent = parseFloat(safetyStock) || 0;
        const safetyStockValue = Math.ceil(rop * (safetyStockPercent / 100));

        setResult({
            annualDemand: D,
            leadTime: L,
            safetyStock: safetyStockValue,
            dailyDemand: dailyDemandDisplay.toFixed(2),
            rop: rop.toFixed(2),
            ropWithSafety: (rop + safetyStockValue).toFixed(2),
            raw: {
                product_id: selectedProduct?.id || null,
                product_name: selectedProduct?.name || null,
                sku: skuInput || null,
                annual_demand: D,
                lead_time: L,
                safety_stock: safetyStockValue,
                daily_demand: dailyDemand,
                rop: rop,
            }
        });
        onShowNotification?.('คำนวณ ROP สำเร็จ', 'success');
    };

    // Save ROP
    const save = () => {
        if (!result || result.error) return;

        const saveData = {
            product_id: result.raw.product_id,
            product_name: result.raw.product_name,
            sku: result.raw.sku,
            ...result.raw
        };

        router.post(route(`${routePrefix}.calculator.save-rop`), saveData, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                if (page.props.flash?.success) {
                    onShowNotification?.(page.props.flash.success, 'success');
                }
            },
            onError: (errors) => {
                console.error('Failed to save ROP calculation:', errors);
                onShowNotification?.('เกิดข้อผิดพลาดในการบันทึกผลการคำนวณ ROP', 'error');
            }
        });
    };

    // Reset - now clears all calculators
    const reset = () => {
        clearAll();
    };

    // Clear all (including other calculators)
    const clearAll = () => {
        setSkuInput('');
        setSelectedProduct(null);
        setAnnualDemand('');
        setLeadTime('');
        setSafetyStock('');
        setResult(null);
        onClearProducts?.();
        // Sync cancellation to other calculators
        onProductSelect?.(null);
    };

    // Handle product selection from modal
    const handleProductFromModal = (product) => {
        setSkuInput(product.sku);
        setSelectedProduct(product);
        fetchProductForRop(product.sku);
        onProductSelect?.(product);
    };

    // Expose method to parent via window (for modal callback)
    useEffect(() => {
        window.handleRopProductFromModal = handleProductFromModal;
        return () => {
            delete window.handleRopProductFromModal;
        };
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">การคำนวณ ROP</h3>
                <p className="text-sm text-gray-600 mt-1">คำนวณจุดสั่งซื้อใหม่ (Reorder Point)</p>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div>
                        <div className="space-y-6">
                            {/* SKU Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    รหัสสินค้า (SKU) <span className="text-red-500">*</span>
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={skuInput}
                                        onChange={handleSkuChange}
                                        onBlur={handleSkuBlur}
                                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="กรอกรหัส SKU หรือคลิกเลือกสินค้า"
                                    />
                                    <button
                                        onClick={() => onOpenProductModal?.('rop')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center space-x-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <span>เลือก</span>
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">กรอก SKU และกด Enter หรือคลิกเลือกสินค้าเพื่อดึงข้อมูลจาก EOQ</p>
                            </div>

                            {/* Product Info */}
                            {selectedProduct && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {selectedProduct.image ? (
                                            <img 
                                                src={`/storage/products/${selectedProduct.image}`}
                                                alt={selectedProduct.name}
                                                className="w-10 h-10 object-cover rounded"
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
                                        onClick={clearAll}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Annual Demand */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ความต้องการต่อปี (D) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={annualDemand}
                                    onChange={(e) => setAnnualDemand(e.target.value)}
                                    onWheel={(e) => e.target.blur()}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hide-spin-buttons"
                                    placeholder="กรอกความต้องการต่อปี"
                                    readOnly={!!selectedProduct}
                                />
                                {selectedProduct && (
                                    <p className="mt-1 text-xs text-green-600">ดึงข้อมูลอัตโนมัติจาก EOQ</p>
                                )}
                            </div>

                            {/* Lead Time */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ระยะเวลาจัดส่ง (วัน) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={leadTime}
                                    onChange={(e) => setLeadTime(e.target.value)}
                                    onWheel={(e) => e.target.blur()}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hide-spin-buttons"
                                    placeholder="กรอกระยะเวลาจัดส่ง"
                                />
                            </div>

                            {/* Safety Stock */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Safety Stock (%) <span className="text-gray-400">- ไม่บังคับ</span>
                                </label>
                                <input
                                    type="number"
                                    value={safetyStock}
                                    onChange={(e) => setSafetyStock(e.target.value)}
                                    onWheel={(e) => e.target.blur()}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hide-spin-buttons"
                                    placeholder="กรอกเปอร์เซ็นต์ Safety Stock"
                                />
                                <p className="mt-1 text-xs text-gray-500">กรอกเป็นตัวเลข (เช่น 10 = 10% ของ ROP) หรือลบออกเพื่อไม่ใช้ Safety Stock</p>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={calculate}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition duration-200"
                                >
                                    คำนวณ ROP
                                </button>
                                <button
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
                                <div className="space-y-4">
                                    {/* Main ROP Result */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-blue-200">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600">จุดสั่งซื้อ (ROP)</p>
                                            <p className="text-3xl font-bold text-blue-600 mt-1">{parseFloat(result.rop).toFixed(2)} หน่วย</p>
                                            <p className="text-xs text-gray-500 mt-1">ไม่รวม Safety Stock</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="text-xs text-gray-500">ความต้องการต่อวัน</p>
                                            <p className="font-medium">{parseFloat(result.dailyDemand).toFixed(2)} หน่วย/วัน</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="text-xs text-gray-500">ระยะเวลาจัดส่ง</p>
                                            <p className="font-medium">{result.leadTime} วัน</p>
                                        </div>
                                        {result.safetyStock > 0 && (
                                            <div className="bg-yellow-50 rounded-lg p-3 shadow-sm border border-yellow-200">
                                                <p className="text-xs text-yellow-700">Safety Stock (แนะนำ)</p>
                                                <p className="font-medium text-yellow-800">{result.safetyStock} หน่วย</p>
                                                <p className="text-xs text-yellow-600 mt-1">ROP + Safety = {parseFloat(result.ropWithSafety).toFixed(2)} หน่วย</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        onClick={save}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition duration-200"
                                    >
                                        บันทึกผลการคำนวณ
                                    </button>
                                    
                                    <div className="text-xs text-gray-600 mt-3">
                                        <p className="font-medium mb-1">สูตรที่ใช้:</p>
                                        <p className="font-mono">ROP = (D / 365) × L</p>
                                        <p className="mt-1">D = ความต้องการต่อปี, L = ระยะเวลาจัดส่ง</p>
                                        <p className="mt-1 text-yellow-700">Safety Stock = ค่าแนะนำเพิ่มเติม (ไม่รวมใน ROP)</p>
                                    </div>
                                </div>
                            ) : result && result.error ? (
                                <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center">
                                    <p className="text-red-700">{result.error}</p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="mt-3 text-sm text-blue-800">กรุณากรอกข้อมูลเพื่อคำนวณ ROP</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">ความหมายของ ROP (Reorder Point)</h5>
                    <p className="text-sm text-gray-600">
                        จุดสั่งซื้อใหม่ (ROP) คือระดับสต็อกที่ควรสั่งซื้อสินค้าใหม่ เพื่อไม่ให้สินค้าหมดก่อนที่จะได้รับของใหม่
                    </p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-gray-900">ความต้องการต่อวัน</p>
                            <p className="text-gray-600">ความต้องการต่อปี ÷ 365</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-gray-900">ROP</p>
                            <p className="text-gray-600">ความต้องการต่อวัน × ระยะเวลาจัดส่ง</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-gray-900">Safety Stock</p>
                            <p className="text-gray-600">สต็อกสำรองเผื่อความผันผวน (10% ของ ROP)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
