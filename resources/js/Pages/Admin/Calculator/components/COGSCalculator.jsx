import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

export default function COGSCalculator({ 
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
    const [beginningInventory, setBeginningInventory] = useState({ cost: '', quantity: '' });
    const [netPurchases, setNetPurchases] = useState({ cost: '', quantity: '' });
    const [endingInventory, setEndingInventory] = useState({ cost: '', quantity: '' });
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
            setBeginningInventory({ cost: '', quantity: '' });
            setNetPurchases({ cost: '', quantity: '' });
            setEndingInventory({ cost: '', quantity: '' });
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
                fetchProductForCogs(syncProduct.sku);
            }
        }
    }, [syncProduct]);

    // Fetch product by SKU
    const fetchProductForCogs = async (sku) => {
        if (!sku) return;
        
        setLoading(true);
        try {
            const response = await fetch(`${apiBasePath}/product-for-cogs?sku=${encodeURIComponent(sku)}`);
            const data = await response.json();
            
            if (response.ok) {
                setSelectedProduct({
                    id: data.id,
                    name: data.name,
                    sku: data.sku,
                    cost_price: data.cost_price,
                    quantity: data.quantity,
                    image: data.image,
                });

                // If there's existing COGS data, load and auto-calculate
                if (data.cogs_calculation) {
                    const c = data.cogs_calculation;
                    const bCost = parseFloat(c.beginning_inventory_cost) || 0;
                    const bQty = parseFloat(c.beginning_inventory_quantity) || 0;
                    const npCost = parseFloat(c.net_purchases_cost) || 0;
                    const npQty = parseFloat(c.net_purchases_quantity) || 0;
                    const eCost = parseFloat(c.ending_inventory_cost) || 0;
                    const eQty = parseFloat(c.ending_inventory_quantity) || 0;

                    setBeginningInventory({ cost: bCost.toString(), quantity: bQty.toString() });
                    setNetPurchases({ cost: npCost.toString(), quantity: npQty.toString() });
                    setEndingInventory({ cost: eCost.toString(), quantity: eQty.toString() });

                    const totalCost = bCost + npCost;
                    const totalQty = bQty + npQty;
                    const avgCost = totalQty > 0 ? totalCost / totalQty : 0;
                    const endingCalc = eQty * avgCost;

                    setResult({
                        beginning: { cost: bCost, quantity: bQty },
                        netPurchases: { cost: npCost, quantity: npQty },
                        ending: { cost: eCost, quantity: eQty, calculatedCost: endingCalc },
                        totalCostOfGoodsAvailable: totalCost,
                        cogs: totalCost - eCost,
                        totalQuantity: totalQty,
                        totalCost,
                        averageCostPerUnit: avgCost,
                        raw: {
                            beginning_inventory_cost: bCost, beginning_inventory_quantity: bQty,
                            net_purchases_cost: npCost, net_purchases_quantity: npQty,
                            ending_inventory_cost: eCost, ending_inventory_quantity: eQty,
                            total_cost: totalCost, total_quantity: totalQty,
                            cogs_per_unit: avgCost, cogs: totalCost - eCost,
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching product for COGS:', error);
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
                    fetchProductForCogs(found.sku);
                    
                    // Notify parent to sync with other calculators
                    onProductSelect?.(product);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Handle SKU blur
    const handleSkuBlur = () => {
        if (skuInput && !selectedProduct) {
            fetchProductForCogs(skuInput);
        }
    };

    // Handle input change
    const handleChange = (section, field, value) => {
        if (section === 'beginning') {
            setBeginningInventory(prev => ({ ...prev, [field]: value }));
        } else if (section === 'netPurchases') {
            setNetPurchases(prev => ({ ...prev, [field]: value }));
        } else if (section === 'ending') {
            setEndingInventory(prev => ({ ...prev, [field]: value }));
        }
    };

    // Calculate COGS
    const calculate = () => {
        const beginningCost = parseFloat(beginningInventory.cost) || 0;
        const beginningQty = parseFloat(beginningInventory.quantity) || 0;
        const netPurchaseCost = parseFloat(netPurchases.cost) || 0;
        const netPurchaseQty = parseFloat(netPurchases.quantity) || 0;
        const endingCost = parseFloat(endingInventory.cost) || 0;
        const endingQty = parseFloat(endingInventory.quantity) || 0;

        const totalCostOfGoodsAvailable = beginningCost + netPurchaseCost;
        const cogs = totalCostOfGoodsAvailable - endingCost;

        const totalQuantity = beginningQty + netPurchaseQty;
        const totalCost = beginningCost + netPurchaseCost;
        const averageCostPerUnit = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        const cogsPerUnit = totalQuantity > 0 ? cogs / totalQuantity : 0;

        const endingInventoryCost = endingQty * averageCostPerUnit;

        setResult({
            beginning: {
                cost: beginningCost,
                quantity: beginningQty
            },
            netPurchases: {
                cost: netPurchaseCost,
                quantity: netPurchaseQty
            },
            ending: {
                cost: endingCost,
                quantity: endingQty
            },
            totalCostOfGoodsAvailable,
            cogs,
            totalQuantity,
            averageCostPerUnit,
            endingInventoryCost,
            raw: {
                beginning_inventory_cost: beginningCost,
                beginning_inventory_quantity: beginningQty,
                net_purchases_cost: netPurchaseCost,
                net_purchases_quantity: netPurchaseQty,
                ending_inventory_cost: endingCost,
                ending_inventory_quantity: endingQty,
                total_cost: totalCost,
                total_quantity: totalQuantity,
                average_cost: averageCostPerUnit,
                cogs: cogs,
                cogs_per_unit: cogsPerUnit
            }
        });
        onShowNotification?.('คำนวณ COGS สำเร็จ', 'success');
    };

    // Save COGS
    const save = () => {
        if (!result) return;

        const saveData = {
            product_id: selectedProduct?.id || null,
            sku: skuInput || null,
            product_name: selectedProduct?.name || null,
            ...result.raw
        };

        router.post(route(`${routePrefix}.calculator.save-cogs`), saveData, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                if (page.props.flash?.success) {
                    onShowNotification?.(page.props.flash.success, 'success');
                }
            },
            onError: (errors) => {
                console.error('Failed to save COGS calculation:', errors);
                onShowNotification?.('เกิดข้อผิดพลาดในการบันทึกผลการคำนวณ COGS', 'error');
            }
        });
    };

    // Reset
    const reset = () => {
        setSkuInput('');
        setSelectedProduct(null);
        setBeginningInventory({ cost: '', quantity: '' });
        setNetPurchases({ cost: '', quantity: '' });
        setEndingInventory({ cost: '', quantity: '' });
        setResult(null);
    };

    // Clear all (including other calculators)
    const clearAll = () => {
        setSkuInput('');
        setSelectedProduct(null);
        setBeginningInventory({ cost: '', quantity: '' });
        setNetPurchases({ cost: '', quantity: '' });
        setEndingInventory({ cost: '', quantity: '' });
        setResult(null);
        onClearProducts?.();
        // Sync cancellation to other calculators
        onProductSelect?.(null);
    };

    // Handle product selection from modal
    const handleProductFromModal = (product) => {
        setSkuInput(product.sku);
        setSelectedProduct(product);
        fetchProductForCogs(product.sku);
        onProductSelect?.(product);
    };

    // Expose method to parent via window (for modal callback)
    useEffect(() => {
        window.handleCogsProductFromModal = handleProductFromModal;
        return () => {
            delete window.handleCogsProductFromModal;
        };
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">คำนวณต้นทุนขาย (COGS)</h3>
                <p className="text-sm text-gray-600 mt-1">คำนวณต้นทุนขาย (Cost of Goods Sold) โดยอิงจาก SKU สินค้า</p>
            </div>
            <div className="p-6">
                {/* SKU Input Section */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                SKU สินค้า
                            </label>
                            <input
                                type="text"
                                value={skuInput}
                                onChange={handleSkuChange}
                                onBlur={handleSkuBlur}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                placeholder="กรอก SKU สินค้า (เช่น PROD-001)"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onOpenProductModal?.('cogs')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 text-sm flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                เลือก
                            </button>
                        </div>
                    </div>
                    
                    {selectedProduct && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {selectedProduct.image ? (
                                    <img 
                                        src={`/storage/products/${selectedProduct.image}`}
                                        alt={selectedProduct.name}
                                        className="w-12 h-12 object-cover rounded"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                                    <p className="text-sm text-gray-600">SKU: {selectedProduct.sku}</p>
                                    {selectedProduct.cost_price && (
                                        <p className="text-sm text-gray-600">ราคาทุน: {parseFloat(selectedProduct.cost_price).toLocaleString()} บาท</p>
                                    )}
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div>
                        <div className="space-y-6">
                            {/* Beginning Inventory */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">ต้นงวด (Beginning Inventory)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            ต้นทุน (บาท)
                                        </label>
                                        <input
                                            type="number"
                                            value={beginningInventory.cost}
                                            onChange={(e) => handleChange('beginning', 'cost', e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            จำนวน (หน่วย)
                                        </label>
                                        <input
                                            type="number"
                                            value={beginningInventory.quantity}
                                            onChange={(e) => handleChange('beginning', 'quantity', e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Net Purchases */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">ซื้อสุทธิ (Net Purchases)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            ต้นทุน + ค่าจัดส่ง (บาท)
                                        </label>
                                        <input
                                            type="number"
                                            value={netPurchases.cost}
                                            onChange={(e) => handleChange('netPurchases', 'cost', e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            จำนวน (หน่วย)
                                        </label>
                                        <input
                                            type="number"
                                            value={netPurchases.quantity}
                                            onChange={(e) => handleChange('netPurchases', 'quantity', e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Ending Inventory */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">ปลายงวด (Ending Inventory)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            ต้นทุน สินค้าที่เหลือ (บาท)
                                        </label>
                                        <input
                                            type="number"
                                            value={endingInventory.cost}
                                            onChange={(e) => handleChange('ending', 'cost', e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            จำนวน (หน่วย)
                                        </label>
                                        <input
                                            type="number"
                                            value={endingInventory.quantity}
                                            onChange={(e) => handleChange('ending', 'quantity', e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={calculate}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition duration-200"
                                >
                                    คำนวณ COGS
                                </button>
                                <button
                                    onClick={save}
                                    disabled={!result}
                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg transition duration-200"
                                >
                                    บันทึกข้อมูล
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
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600">ต้นทุนขาย (COGS)</p>
                                            <p className="text-2xl font-bold text-blue-600 mt-1">{result.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p>
                                        </div>
                                    </div>

                                    {/* COGS Per Unit */}
                                    {result.totalQuantity > 0 && (
                                        <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
                                            <div className="text-center">
                                                <p className="text-sm text-green-700">ต้นทุนขายต่อชิ้น</p>
                                                <p className="text-xl font-bold text-green-600 mt-1">
                                                    {(result.cogs / result.totalQuantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/ชิ้น
                                                </p>
                                                <p className="text-xs text-green-600 mt-1">
                                                    ({result.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ÷ {result.totalQuantity.toLocaleString()} ชิ้น)
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-3">
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="font-medium text-gray-900 mb-2">การคำนวณ COGS</p>
                                            <div className="text-xs space-y-1">
                                                <p>(ต้นงวด + ซื้อสุทธิ) - ปลายงวด</p>
                                                <p>({result.beginning.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + {result.netPurchases.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) - {result.ending.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                <p>= {result.totalCostOfGoodsAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - {result.ending.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                <p className="font-bold">= {result.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-xs text-gray-600 mt-3">
                                        <p className="font-medium mb-1">สูตรที่ใช้:</p>
                                        <p className="font-mono">COGS = (ต้นงวด + ซื้อสุทธิ) - ปลายงวด</p>
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
                                    <p className="mt-3 text-sm text-blue-800">กรุณากรอกข้อมูลเพื่อคำนวณ COGS</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* COGS Explanation */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">ความหมายของ COGS</h5>
                    <p className="text-sm text-gray-600">
                        การคำนวณต้นทุนขาย (COGS) ช่วยให้เข้าใจต้นทุนที่เกี่ยวข้องกับสินค้าที่ขาย
                        ซึ่งเป็นข้อมูลสำคัญสำหรับการวิเคราะห์ผลประกอบการ
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
                        <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-gray-900">ต้นทุนขาย (COGS)</p>
                            <p className="text-gray-600">คือ ต้นทุนของสินค้าที่ขายในงวดนั้น คำนวณจากสินค้าต้นงวด + ซื้อเพิ่ม - สินค้าปลายงวด</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
