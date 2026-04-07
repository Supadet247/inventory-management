import { useState, useEffect, useRef } from 'react';

export default function AverageCostCalculator({ 
    onOpenProductModal,
    onShowNotification,
    onProductSelect,
    onClearProducts,
    syncProduct,
    apiBasePath = '/admin/calculator'
}) {
    // State
    const [skuInput, setSkuInput] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [beginningValue, setBeginningValue] = useState('');
    const [beginningUnitCost, setBeginningUnitCost] = useState('');
    const [purchaseValue, setPurchaseValue] = useState('');
    const [purchaseQuantity, setPurchaseQuantity] = useState('');
    const [result, setResult] = useState(null);
    const [savedCalculations, setSavedCalculations] = useState([]);
    const [showSavedCalculations, setShowSavedCalculations] = useState(false);

    const prevSyncProductRef = useRef(undefined);

    // Sync product from parent (when other calculator selects a product)
    useEffect(() => {
        const prevSyncProduct = prevSyncProductRef.current;
        prevSyncProductRef.current = syncProduct;

        // Only clear if syncProduct changed FROM a product TO null (not initial load)
        if (syncProduct === null && prevSyncProduct !== undefined && prevSyncProduct !== null) {
            // Clear only local state when synced null (don't call onClearProducts to avoid loop)
            setSkuInput('');
            setSelectedProduct(null);
            setBeginningValue('');
            setBeginningUnitCost('');
            setPurchaseValue('');
            setPurchaseQuantity('');
            setResult(null);
        } else if (syncProduct && syncProduct.sku) {
            if (!selectedProduct || selectedProduct.sku !== syncProduct.sku) {
                setSkuInput(syncProduct.sku);
                // Fetch full data including saved calculation and auto-calculate
                fetchProduct(syncProduct.sku);
            }
        }
    }, [syncProduct]);

    // Fetch product by SKU
    const fetchProduct = async (sku) => {
        if (!sku || sku.length < 2) return;
        
        try {
            const response = await fetch(`${apiBasePath}/product-for-average-cost?sku=${encodeURIComponent(sku)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.id) {
                    const product = {
                        id: data.id,
                        name: data.name,
                        sku: data.sku,
                        cost_price: data.cost_price,
                        image: data.image,
                    };
                    setSelectedProduct(product);
                    if (data.cost_price) {
                        setBeginningUnitCost(data.cost_price.toString());
                    }

                    // Load existing average cost calculation and auto-calculate
                    if (data.average_cost_calculation) {
                        const c = data.average_cost_calculation;
                        const bVal = parseFloat(c.beginning_value) || 0;
                        const bCost = parseFloat(c.beginning_unit_cost) || 0;
                        const pVal = parseFloat(c.purchase_value) || 0;
                        const pQty = parseFloat(c.purchase_quantity) || 0;

                        setBeginningValue(bVal.toString());
                        setBeginningUnitCost(bCost.toString());
                        setPurchaseValue(pVal.toString());
                        setPurchaseQuantity(pQty.toString());

                        const Qb = bCost > 0 ? bVal / bCost : 0;
                        const Cp = pQty > 0 ? pVal / pQty : 0;
                        const Qtotal = Qb + pQty;
                        const averageCostPerUnit = Qtotal > 0 ? (bVal + pVal) / Qtotal : 0;

                        setResult({
                            beginningValue: bVal, beginningUnitCost: bCost, calculatedQb: Qb,
                            purchaseValue: pVal, purchaseQuantity: pQty, calculatedCp: Cp,
                            totalQuantity: Qtotal, totalBeginningCost: bVal, totalPurchaseCost: pVal,
                            averageCostPerUnit,
                            raw: {
                                product_id: data.id, sku: data.sku, product_name: data.name,
                                beginning_value: bVal, beginning_unit_cost: bCost, calculated_qb: Qb,
                                purchase_value: pVal, purchase_quantity: pQty, calculated_cp: Cp,
                                total_quantity: Qtotal, total_beginning_cost: bVal, total_purchase_cost: pVal,
                                average_cost: averageCostPerUnit,
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        }
    };

    // Handle SKU input change - auto search
    const handleSkuChange = async (value) => {
        setSkuInput(value);
        if (value.length >= 3) {
            try {
                const response = await fetch(`${apiBasePath}/products?search=` + encodeURIComponent(value));
                const data = await response.json();
                
                if (data && Array.isArray(data) && data.length > 0) {
                    const found = data.find(p => p.sku && p.sku.toLowerCase() === value.toLowerCase());
                    if (found) {
                        const product = {
                            id: found.id,
                            name: found.name,
                            sku: found.sku,
                            cost_price: found.cost_price,
                            image: found.image,
                        };
                        setSelectedProduct(product);
                        if (found.cost_price) {
                            setBeginningUnitCost(found.cost_price.toString());
                        }
                        
                        // Notify parent to sync with other calculators
                        onProductSelect?.(product);
                        
                        // Fetch saved calculation data
                        fetchProduct(found.sku);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    // Handle SKU blur
    const handleSkuBlur = () => {
        if (skuInput && !selectedProduct) {
            fetchProduct(skuInput);
        }
    };

    // Load saved calculations
    const loadSavedCalculations = async () => {
        try {
            const response = await fetch(`${apiBasePath}/average-cost-calculations`);
            if (response.ok) {
                const data = await response.json();
                setSavedCalculations(data);
            }
        } catch (error) {
            console.error('Error loading saved calculations:', error);
        }
    };

    // Calculate Average Cost
    const calculate = () => {
        const beginningVal = parseFloat(beginningValue) || 0;
        const Cb = parseFloat(beginningUnitCost) || 0;
        const purchaseVal = parseFloat(purchaseValue) || 0;
        const Qp = parseFloat(purchaseQuantity) || 0;
        
        if (beginningVal <= 0 && purchaseVal <= 0) {
            setResult({ error: 'กรุณากรอกมูลค่าสินค้าอย่างน้อย 1 ช่อง' });
            return;
        }
        
        const Qb = Cb > 0 ? beginningVal / Cb : 0;
        const Cp = Qp > 0 ? purchaseVal / Qp : 0;
        const Qtotal = Qb + Qp;
        
        const totalBeginningCost = beginningVal;
        const totalPurchaseCost = purchaseVal;
        const averageCostPerUnit = Qtotal > 0 ? (totalBeginningCost + totalPurchaseCost) / Qtotal : 0;
        
        setResult({
            beginningValue: beginningVal,
            beginningUnitCost: Cb,
            calculatedQb: Qb,
            purchaseValue: purchaseVal,
            purchaseQuantity: Qp,
            calculatedCp: Cp,
            totalQuantity: Qtotal,
            totalBeginningCost,
            totalPurchaseCost,
            averageCostPerUnit,
            raw: {
                product_id: selectedProduct?.id || null,
                sku: skuInput || null,
                product_name: selectedProduct?.name || null,
                beginning_value: beginningVal,
                beginning_unit_cost: Cb,
                calculated_qb: Qb,
                purchase_value: purchaseVal,
                purchase_quantity: Qp,
                calculated_cp: Cp,
                total_quantity: Qtotal,
                total_beginning_cost: totalBeginningCost,
                total_purchase_cost: totalPurchaseCost,
                average_cost: averageCostPerUnit
            }
        });
        onShowNotification?.('คำนวณ Average Cost สำเร็จ', 'success');
    };

    // Save Average Cost
    const save = () => {
        if (!result || result.error) return;
        
        const rawData = result.raw;
        
        fetch(`${apiBasePath}/save-average-cost`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Accept': 'application/json'
            },
            body: JSON.stringify(rawData)
        })
        .then(async response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (response.ok) {
                    onShowNotification?.('บันทึกข้อมูล Average Cost สำเร็จ', 'success');
                    loadSavedCalculations();
                } else {
                    onShowNotification?.(data.error || 'เกิดข้อผิดพลาด', 'error');
                }
            } else {
                throw new Error('Response is not JSON');
            }
        })
        .catch(error => {
            console.error('Error saving average cost:', error);
            onShowNotification?.('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
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
        setBeginningValue('');
        setBeginningUnitCost('');
        setPurchaseValue('');
        setPurchaseQuantity('');
        setResult(null);
        onClearProducts?.();
        // Sync cancellation to other calculators
        onProductSelect?.(null);
    };

    // Load saved calculation into form
    const loadCalculationIntoForm = (calc) => {
        const product = {
            id: calc.product_id,
            name: calc.product_name,
            sku: calc.sku,
            cost_price: calc.beginning_unit_cost,
            image: calc.product?.image || null,
        };

        // Set product info
        if (calc.sku) {
            setSkuInput(calc.sku);
        }
        if (calc.product_name) {
            setSelectedProduct(product);
        }
        
        // Sync product to all other calculators
        if (calc.product_id || calc.sku) {
            onProductSelect?.(product);
        }
        
        // Set form values
        setBeginningValue(calc.beginning_value?.toString() || '');
        setBeginningUnitCost(calc.beginning_unit_cost?.toString() || '');
        setPurchaseValue(calc.purchase_value?.toString() || '');
        setPurchaseQuantity(calc.purchase_quantity?.toString() || '');
        
        // Calculate and show result immediately
        const beginningVal = parseFloat(calc.beginning_value) || 0;
        const Cb = parseFloat(calc.beginning_unit_cost) || 0;
        const purchaseVal = parseFloat(calc.purchase_value) || 0;
        const Qp = parseFloat(calc.purchase_quantity) || 0;
        
        const Qb = Cb > 0 ? beginningVal / Cb : 0;
        const Cp = Qp > 0 ? purchaseVal / Qp : 0;
        const Qtotal = Qb + Qp;
        
        const totalBeginningCost = beginningVal;
        const totalPurchaseCost = purchaseVal;
        const averageCostPerUnit = Qtotal > 0 ? (totalBeginningCost + totalPurchaseCost) / Qtotal : 0;
        
        setResult({
            beginningValue: beginningVal,
            beginningUnitCost: Cb,
            calculatedQb: Qb,
            purchaseValue: purchaseVal,
            purchaseQuantity: Qp,
            calculatedCp: Cp,
            totalQuantity: Qtotal,
            totalBeginningCost,
            totalPurchaseCost,
            averageCostPerUnit,
            raw: {
                product_id: calc.product_id,
                sku: calc.sku,
                product_name: calc.product_name,
                beginning_value: beginningVal,
                beginning_unit_cost: Cb,
                calculated_qb: Qb,
                purchase_value: purchaseVal,
                purchase_quantity: Qp,
                calculated_cp: Cp,
                total_quantity: Qtotal,
                total_beginning_cost: totalBeginningCost,
                total_purchase_cost: totalPurchaseCost,
                average_cost: averageCostPerUnit
            }
        });
        
        // Close modal
        setShowSavedCalculations(false);
    };

    // Handle product selection from modal
    const handleProductFromModal = (product) => {
        setSkuInput(product.sku);
        setSelectedProduct(product);
        if (product.cost_price) {
            setBeginningUnitCost(product.cost_price.toString());
        }
        onProductSelect?.(product);
    };

    // Expose method to parent via window (for modal callback)
    useEffect(() => {
        window.handleAverageCostProductFromModal = handleProductFromModal;
        return () => {
            delete window.handleAverageCostProductFromModal;
        };
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">ต้นทุนถัวเฉลี่ย (Average Cost)</h3>
                <p className="text-sm text-gray-600 mt-1">คำนวณต้นทุนถัวเฉลี่ยต่อหน่วย</p>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div>
                        <div className="space-y-6">
                            {/* SKU Input */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">ค้นหาสินค้า</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={skuInput}
                                        onChange={(e) => handleSkuChange(e.target.value)}
                                        onBlur={handleSkuBlur}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                fetchProduct(skuInput);
                                            }
                                        }}
                                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        placeholder="กรอก SKU"
                                    />
                                    <button
                                        onClick={() => onOpenProductModal?.('averageCost')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 text-sm flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        เลือกสินค้า
                                    </button>
                                </div>
                                {selectedProduct && (
                                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between">
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
                                                    <p className="text-sm font-medium text-green-900">{selectedProduct.name}</p>
                                                    <p className="text-xs text-green-700">SKU: {selectedProduct.sku}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={clearAll}
                                                className="text-green-600 hover:text-green-800"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            loadSavedCalculations();
                                            setShowSavedCalculations(true);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        ดูข้อมูลที่บันทึกไว้
                                    </button>
                                </div>
                            </div>

                            {/* Beginning Inventory */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">สินค้าคงเหลือต้นงวด</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            มูลค่าสินค้า (บาท)
                                        </label>
                                        <input
                                            type="number"
                                            value={beginningValue}
                                            onChange={(e) => setBeginningValue(e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            ราคาทุน/หน่วย (Cb)
                                        </label>
                                        <input
                                            type="number"
                                            value={beginningUnitCost}
                                            onChange={(e) => setBeginningUnitCost(e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                {beginningValue && beginningUnitCost && (
                                    <p className="text-xs text-blue-600 mt-2">
                                        Qb = {beginningValue} ÷ {beginningUnitCost} = {(parseFloat(beginningValue) / parseFloat(beginningUnitCost)).toFixed(2)} หน่วย
                                    </p>
                                )}
                            </div>

                            {/* Purchase */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">สินค้าที่ซื้อเพิ่ม</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            มูลค่าสินค้า (บาท)
                                        </label>
                                        <input
                                            type="number"
                                            value={purchaseValue}
                                            onChange={(e) => setPurchaseValue(e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            จำนวน (Qp)
                                        </label>
                                        <input
                                            type="number"
                                            value={purchaseQuantity}
                                            onChange={(e) => setPurchaseQuantity(e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                {purchaseValue && purchaseQuantity && (
                                    <p className="text-xs text-blue-600 mt-2">
                                        Cp = {purchaseValue} ÷ {purchaseQuantity} = {(parseFloat(purchaseValue) / parseFloat(purchaseQuantity)).toFixed(2)} บาท/หน่วย
                                    </p>
                                )}
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={calculate}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition duration-200"
                                >
                                    คำนวณ ต้นทุนถัวเฉลี่ย
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
                                            <p className="text-sm text-gray-600">ต้นทุนถัวเฉลี่ยต่อหน่วย (AC)</p>
                                            <p className="text-2xl font-bold text-blue-600 mt-1">{result.averageCostPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/หน่วย</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                จำนวนรวม: {result.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} หน่วย
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="text-xs font-medium text-gray-700 mb-2">การคำนวณ</p>
                                            <div className="space-y-2 text-xs">
                                                <div className="bg-gray-50 p-2 rounded">
                                                    <p className="text-gray-500">Qb = มูลค่าต้นงวด ÷ Cb</p>
                                                    <p className="font-medium">{result.beginningValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ÷ {result.beginningUnitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    <p className="font-medium text-blue-600">= {result.calculatedQb.toLocaleString(undefined, { maximumFractionDigits: 2 })} หน่วย</p>
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded">
                                                    <p className="text-gray-500">Cp = มูลค่าซื้อเพิ่ม ÷ Qp</p>
                                                    <p className="font-medium">{result.purchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ÷ {result.purchaseQuantity.toLocaleString()}</p>
                                                    <p className="font-medium text-blue-600">= {result.calculatedCp.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท/หน่วย</p>
                                                </div>
                                                <div className="bg-blue-50 p-2 rounded">
                                                    <p className="text-gray-600">AC = ((Qb×Cb) + (Qp×Cp)) / (Qb+Qp)</p>
                                                    <p className="font-medium text-sm mt-1">
                                                        = ({result.totalBeginningCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} + {result.totalPurchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}) / {result.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="font-bold text-blue-700 text-lg mt-1">
                                                        = {result.averageCostPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท/หน่วย
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-xs text-gray-600 mt-3">
                                        <p className="font-medium mb-1">สูตรที่ใช้:</p>
                                        <p className="font-mono">Qb = มูลค่าต้นงวด ÷ Cb</p>
                                        <p className="font-mono">Cp = มูลค่าซื้อเพิ่ม ÷ Qp</p>
                                        <p className="font-mono">AC = ((Qb×Cb) + (Qp×Cp)) / (Qb+Qp)</p>
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
                                    <p className="mt-3 text-sm text-blue-800">กรุณากรอกข้อมูลเพื่อคำนวณ ต้นทุนถัวเฉลี่ย</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Average Cost Explanation */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">ความหมายของ ต้นทุนถัวเฉลี่ย</h5>
                    <p className="text-sm text-gray-600">
                        การคำนวณต้นทุนถัวเฉลี่ยช่วยให้เข้าใจต้นทุนเฉลี่ยของสินค้าคงคลัง
                        ซึ่งเป็นข้อมูลสำคัญสำหรับการวิเคราะห์ผลประกอบการ
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
                        <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-gray-900">ต้นทุนถัวเฉลี่ย</p>
                            <p className="text-gray-600">คือ ต้นทุนเฉลี่ยต่อหน่วยของสินค้าทั้งหมดในสต๊อก คำนวณจาก ต้นทุนรวมหารด้วยจำนวนสินค้ารวม</p>
                            <p className="text-gray-600 mt-1">หน่วย: บาท/หน่วย</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Saved Calculations Modal */}
            {showSavedCalculations && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">ข้อมูล Average Cost ที่บันทึกไว้</h3>
                            <button
                                onClick={() => setShowSavedCalculations(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {savedCalculations.length > 0 ? (
                                <div className="space-y-4">
                                    {savedCalculations.map((calc, index) => (
                                        <div 
                                            key={index} 
                                            onClick={() => loadCalculationIntoForm(calc)}
                                            className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200 group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 group-hover:text-blue-700">{calc.product_name || 'ไม่ระบุสินค้า'}</p>
                                                        <p className="text-sm text-gray-600">SKU: {calc.sku || '-'}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-500">{new Date(calc.created_at).toLocaleDateString('th-TH')}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500">ต้นทุนถัวเฉลี่ย</p>
                                                    <p className="font-bold text-blue-600">{parseFloat(calc.average_cost_per_unit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท/หน่วย</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">จำนวนรวม</p>
                                                    <p className="font-medium">{parseFloat(calc.total_quantity || 0).toLocaleString()} หน่วย</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-center">
                                                <span className="text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">คลิกเพื่อโหลดข้อมูล</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">ไม่มีข้อมูลที่บันทึกไว้</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
