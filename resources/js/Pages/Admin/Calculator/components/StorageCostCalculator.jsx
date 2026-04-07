import { useState, useEffect, useRef } from 'react';

export default function StorageCostCalculator({ 
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
    const [width, setWidth] = useState('');
    const [length, setLength] = useState('');
    const [warehouseTotalArea, setWarehouseTotalArea] = useState('');
    const [totalStorageCostPerYear, setTotalStorageCostPerYear] = useState('');
    const [result, setResult] = useState(null);

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
            setWidth('');
            setLength('');
            setWarehouseTotalArea('');
            setTotalStorageCostPerYear('');
            setResult(null);
        } else if (syncProduct && syncProduct.sku) {
            // Only update if it's a different product
            if (!selectedProduct || selectedProduct.sku !== syncProduct.sku) {
                setSkuInput(syncProduct.sku);
                const product = {
                    id: syncProduct.id,
                    name: syncProduct.name,
                    sku: syncProduct.sku,
                    cost_price: syncProduct.cost_price,
                    quantity: syncProduct.quantity,
                    image: syncProduct.image,
                    width: syncProduct.width,
                    length: syncProduct.length,
                };
                setSelectedProduct(product);
                // Auto-fetch product details including dimensions
                fetchProduct(syncProduct.sku);
            }
        }
    }, [syncProduct]);

    // Fetch product by SKU
    const fetchProduct = async (sku) => {
        if (!sku || sku.length < 2) return;
        
        try {
            const response = await fetch(`${apiBasePath}/product-for-storage-cost?sku=${encodeURIComponent(sku)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.id) {
                    const product = {
                        id: data.id,
                        name: data.name,
                        sku: data.sku,
                        cost_price: data.cost_price,
                        quantity: data.quantity,
                        image: data.image,
                    };
                    setSelectedProduct(product);
                    
                    // Notify parent to sync with other calculators
                    onProductSelect?.(product);

                    // Load existing storage cost calculation and auto-calculate
                    if (data.storage_cost_calculation) {
                        const c = data.storage_cost_calculation;
                        const w = parseFloat(c.width) || 0;
                        const l = parseFloat(c.length) || 0;
                        const area = parseFloat(c.warehouse_total_area) || 0;
                        const cost = parseFloat(c.total_storage_cost_per_year) || 0;

                        if (c.width) setWidth(c.width.toString());
                        if (c.length) setLength(c.length.toString());
                        if (c.warehouse_total_area) setWarehouseTotalArea(c.warehouse_total_area.toString());
                        if (c.total_storage_cost_per_year) setTotalStorageCostPerYear(c.total_storage_cost_per_year.toString());

                        if (w && l && area && cost) {
                            const productArea = w * l;
                            const costPerSqmPerYear = cost / area;
                            const storageCostPerYear = productArea * costPerSqmPerYear;
                            setResult({ width: w, length: l, productArea, warehouseTotalArea: area, totalStorageCostPerYear: cost, costPerSqmPerYear, storageCostPerYear });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        }
    };

    // Handle SKU input change
    const handleSkuChange = (value) => {
        setSkuInput(value);
        if (value.length >= 3) {
            fetchProduct(value);
        }
    };

    // Load latest storage cost data
    const loadLatestData = async () => {
        try {
            const response = await fetch(`${apiBasePath}/latest-storage-cost-data`);
            if (response.ok) {
                const data = await response.json();
                if (data.warehouse_total_area) setWarehouseTotalArea(data.warehouse_total_area.toString());
                if (data.total_storage_cost_per_year) setTotalStorageCostPerYear(data.total_storage_cost_per_year.toString());
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    // Calculate storage cost
    const calculate = () => {
        const w = parseFloat(width);
        const l = parseFloat(length);
        const area = parseFloat(warehouseTotalArea);
        const cost = parseFloat(totalStorageCostPerYear);

        if (!w || !l || !area || !cost) {
            setResult({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
            return;
        }

        const productArea = w * l;
        const costPerSqmPerYear = cost / area;
        const storageCostPerYear = productArea * costPerSqmPerYear;

        setResult({
            width: w,
            length: l,
            productArea,
            warehouseTotalArea: area,
            totalStorageCostPerYear: cost,
            costPerSqmPerYear,
            storageCostPerYear
        });
        onShowNotification?.('คำนวณ Storage Cost สำเร็จ', 'success');
    };

    // Save calculation
    const save = async () => {
        if (!result) return;

        try {
            const response = await fetch(`${apiBasePath}/save-storage-cost`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                },
                body: JSON.stringify({
                    sku: skuInput,
                    product_name: selectedProduct?.name,
                    product_id: selectedProduct?.id,
                    width: parseFloat(width),
                    length: parseFloat(length),
                    product_area: result.productArea,
                    warehouse_total_area: parseFloat(warehouseTotalArea),
                    total_storage_cost_per_year: parseFloat(totalStorageCostPerYear),
                    cost_per_sqm_per_year: result.costPerSqmPerYear,
                    storage_cost_per_year: result.storageCostPerYear
                })
            });

            if (response.ok) {
                onShowNotification?.('บันทึกข้อมูลสำเร็จ', 'success');
            } else {
                onShowNotification?.('บันทึกข้อมูลไม่สำเร็จ', 'error');
            }
        } catch (error) {
            console.error('Error saving:', error);
            onShowNotification?.('เกิดข้อผิดพลาด', 'error');
        }
    };

    // Clear all (including other calculators)
    const clearAll = () => {
        setSkuInput('');
        setSelectedProduct(null);
        setWidth('');
        setLength('');
        setWarehouseTotalArea('');
        setTotalStorageCostPerYear('');
        setResult(null);
        onClearProducts?.();
        // Sync cancellation to other calculators
        onProductSelect?.(null);
    };
    
    // Reset - now clears all calculators
    const reset = () => {
        clearAll();
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">คำนวณต้นทุนพื้นที่จัดเก็บสินค้า (Storage Cost)</h3>
                <p className="text-gray-600 mt-1">คำนวณต้นทุนค่าใช้จ่ายพื้นที่จัดเก็บสินค้าต่อปี</p>
            </div>
            
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Form */}
                    <div className="space-y-6">
                        {/* SKU Input */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">ค้นหาสินค้า</h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={skuInput}
                                    onChange={(e) => handleSkuChange(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchProduct(skuInput)}
                                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                    placeholder="กรอก SKU"
                                />
                                <button
                                    onClick={() => onOpenProductModal?.('storageCost')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center gap-2"
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
                        </div>

                        {/* Product Dimensions */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">ขนาดสินค้า</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">ความกว้าง (W) เมตร</label>
                                    <input
                                        type="number"
                                        value={width}
                                        onChange={(e) => setWidth(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">ความยาว (L) เมตร</label>
                                    <input
                                        type="number"
                                        value={length}
                                        onChange={(e) => setLength(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            {width && length && (
                                <p className="text-xs text-blue-600 mt-2">
                                    A = {width} × {length} = {(parseFloat(width) * parseFloat(length)).toFixed(4)} ตร.ม.
                                </p>
                            )}
                        </div>

                        {/* Warehouse Data */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium text-gray-900">ข้อมูลคลังสินค้า</h4>
                                <button
                                    onClick={loadLatestData}
                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                >
                                    โหลดจาก Cost Per Area
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">พื้นที่คลังรวม (ตร.ม.)</label>
                                    <input
                                        type="number"
                                        value={warehouseTotalArea}
                                        onChange={(e) => setWarehouseTotalArea(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">ค่าใช้จ่ายรวม/ปี (บาท)</label>
                                    <input
                                        type="number"
                                        value={totalStorageCostPerYear}
                                        onChange={(e) => setTotalStorageCostPerYear(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3 pt-2">
                            <button onClick={calculate} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg">
                                คำนวณต้นทุนพื้นที่
                            </button>
                            <button onClick={save} disabled={!result} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg">
                                บันทึกข้อมูล
                            </button>
                            <button onClick={reset} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2.5 rounded-lg">
                                ล้างข้อมูล
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="bg-blue-50 rounded-lg p-5 h-full">
                        <h4 className="font-semibold text-blue-900 mb-3">ผลลัพธ์การคำนวณ</h4>
                        
                        {result && !result.error ? (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                                    <p className="text-sm text-gray-600">ต้นทุนพื้นที่จัดเก็บ/ปี</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">
                                        {result.storageCostPerYear.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท/ปี
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">พื้นที่สินค้า: {result.productArea.toFixed(4)} ตร.ม.</p>
                                </div>
                                
                                <div className="space-y-2 text-xs">
                                    <div className="bg-gray-50 p-2 rounded">
                                        <p className="text-gray-500">A = W × L</p>
                                        <p className="font-medium">{result.width} × {result.length} = {result.productArea.toFixed(4)} ตร.ม.</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded">
                                        <p className="text-gray-500">ต้นทุน/ตร.ม./ปี</p>
                                        <p className="font-medium">{result.costPerSqmPerYear.toFixed(2)} บาท/ตร.ม./ปี</p>
                                    </div>
                                    <div className="bg-blue-50 p-2 rounded">
                                        <p className="text-gray-600">ต้นทุนพื้นที่ = A × ต้นทุน/ตร.ม./ปี</p>
                                        <p className="font-bold text-blue-700 text-lg">= {result.storageCostPerYear.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท/ปี</p>
                                    </div>
                                </div>
                            </div>
                        ) : result?.error ? (
                            <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center">
                                <p className="text-red-700">{result.error}</p>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="mx-auto h-12 w-12 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p className="mt-3 text-sm text-blue-800">กรุณากรอกข้อมูลเพื่อคำนวณ</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
