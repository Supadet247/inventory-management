import React, { useState, useEffect } from 'react';

const StorageCostCalculator = ({ allProducts, productModalMode, setProductModalMode, setShowProductModal }) => {
    // State variables
    const [storageCostSkuInput, setStorageCostSkuInput] = useState('');
    const [storageCostSelectedProduct, setStorageCostSelectedProduct] = useState(null);
    const [storageWidth, setStorageWidth] = useState('');
    const [storageLength, setStorageLength] = useState('');
    const [warehouseTotalArea, setWarehouseTotalArea] = useState('');
    const [totalStorageCostPerYear, setTotalStorageCostPerYear] = useState('');
    const [storageCostResult, setStorageCostResult] = useState(null);
    const [savedStorageCostCalculations, setSavedStorageCostCalculations] = useState([]);
    const [showSavedStorageCostCalculations, setShowSavedStorageCostCalculations] = useState(false);

    // Calculate Storage Cost
    const calculateStorageCost = () => {
        const W = parseFloat(storageWidth) || 0;
        const L = parseFloat(storageLength) || 0;
        const warehouseArea = parseFloat(warehouseTotalArea) || 0;
        const totalCost = parseFloat(totalStorageCostPerYear) || 0;
        
        if (W <= 0 || L <= 0) {
            setStorageCostResult({ error: 'กรุณากรอกความกว้างและความยาวสินค้า' });
            return;
        }
        
        if (warehouseArea <= 0) {
            setStorageCostResult({ error: 'กรุณากรอกพื้นที่คลังสินค้ารวม' });
            return;
        }
        
        if (totalCost <= 0) {
            setStorageCostResult({ error: 'กรุณากรอกค่าใช้จ่ายรวมต่อปี' });
            return;
        }
        
        const A = W * L;
        const costPerSqmPerYear = totalCost / warehouseArea;
        const storageCostPerYear = A * costPerSqmPerYear;
        
        setStorageCostResult({
            width: W,
            length: L,
            productArea: A,
            warehouseTotalArea: warehouseArea,
            totalStorageCostPerYear: totalCost,
            costPerSqmPerYear: costPerSqmPerYear,
            storageCostPerYear: storageCostPerYear,
            raw: {
                product_id: storageCostSelectedProduct?.id || null,
                sku: storageCostSelectedProduct?.sku || storageCostSkuInput || null,
                product_name: storageCostSelectedProduct?.name || null,
                width: W,
                length: L,
                product_area: A,
                warehouse_total_area: warehouseArea,
                total_storage_cost_per_year: totalCost,
                cost_per_sqm_per_year: costPerSqmPerYear,
                storage_cost_per_year: storageCostPerYear,
                calculation_name: storageCostSelectedProduct?.name 
                    ? `Storage Cost - ${storageCostSelectedProduct.name}` 
                    : `Storage Cost - ${storageCostSkuInput || 'ไม่ระบุสินค้า'}`,
            }
        });
    };
    
    // Save Storage Cost
    const saveStorageCost = () => {
        if (!storageCostResult || storageCostResult.error) return;
        
        fetch('/admin/calculator/save-storage-cost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Accept': 'application/json'
            },
            body: JSON.stringify(storageCostResult.raw)
        })
        .then(async response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (response.ok) {
                    alert('บันทึกข้อมูลต้นทุนพื้นที่จัดเก็บสำเร็จ');
                    loadSavedStorageCostCalculations();
                } else {
                    alert('เกิดข้อผิดพลาด: ' + (data.message || 'ไม่สามารถบันทึกข้อมูลได้'));
                }
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text.substring(0, 500));
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
        })
        .catch(error => {
            console.error('Error saving Storage Cost:', error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        });
    };
    
    // Load saved calculations
    const loadSavedStorageCostCalculations = () => {
        fetch('/admin/calculator/storage-cost-calculations')
            .then(response => response.json())
            .then(data => setSavedStorageCostCalculations(data))
            .catch(error => console.error('Error loading Storage Cost calculations:', error));
    };
    
    // Fetch product by SKU
    const fetchProductForStorageCost = async (sku) => {
        if (!sku) return;
        try {
            const response = await fetch(`/admin/calculator/product-for-storage-cost?sku=${encodeURIComponent(sku)}`);
            if (!response.ok) throw new Error('Product not found');
            const product = await response.json();
            handleStorageCostProductSelect(product);
        } catch (error) {
            console.log('Product not found for Storage Cost');
        }
    };
    
    // Handle product selection
    const handleStorageCostProductSelect = (product) => {
        setStorageCostSelectedProduct(product);
        setStorageCostSkuInput(product.sku);
        
        if (product.storage_cost_calculation) {
            const calc = product.storage_cost_calculation;
            setStorageWidth(calc.width || '');
            setStorageLength(calc.length || '');
            setWarehouseTotalArea(calc.warehouse_total_area || '');
            setTotalStorageCostPerYear(calc.total_storage_cost_per_year || '');
        }
    };
    
    // Load latest storage cost data
    const loadLatestStorageCostData = () => {
        fetch('/admin/calculator/latest-storage-cost-data')
            .then(response => response.json())
            .then(data => {
                if (data.total_storage_cost_per_year > 0) {
                    setTotalStorageCostPerYear(data.total_storage_cost_per_year);
                    setWarehouseTotalArea(data.warehouse_total_area);
                    alert(`โหลดข้อมูลสำเร็จ:\nค่าใช้จ่ายรวม: ${data.total_storage_cost_per_year.toLocaleString()} บาท/ปี\nพื้นที่คลัง: ${data.warehouse_total_area.toLocaleString()} ตร.ม.`);
                } else {
                    alert('ไม่พบข้อมูล Cost Per Area');
                }
            })
            .catch(error => {
                console.error('Error loading latest storage cost data:', error);
                alert('ไม่สามารถโหลดข้อมูลได้');
            });
    };
    
    // Handle SKU input change
    const handleStorageCostSkuChange = (value) => {
        setStorageCostSkuInput(value);
        
        if (value.length >= 3 && allProducts) {
            const found = allProducts.find(p => 
                p.sku.toLowerCase().includes(value.toLowerCase()) ||
                p.name.toLowerCase().includes(value.toLowerCase())
            );
            
            if (found) {
                setStorageCostSelectedProduct(found);
                fetchProductForStorageCost(found.sku);
            }
        }
    };
    
    // Reset form
    const resetStorageCost = () => {
        setStorageCostSkuInput('');
        setStorageCostSelectedProduct(null);
        setStorageWidth('');
        setStorageLength('');
        setWarehouseTotalArea('');
        setTotalStorageCostPerYear('');
        setStorageCostResult(null);
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
                                    value={storageCostSkuInput}
                                    onChange={(e) => handleStorageCostSkuChange(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchProductForStorageCost(storageCostSkuInput)}
                                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                    placeholder="กรอก SKU"
                                />
                                <button
                                    onClick={() => { setProductModalMode('storageCost'); setShowProductModal(true); }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    เลือกสินค้า
                                </button>
                            </div>
                            {storageCostSelectedProduct && (
                                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-green-900">{storageCostSelectedProduct.name}</p>
                                            <p className="text-xs text-green-700">SKU: {storageCostSelectedProduct.sku}</p>
                                        </div>
                                        <button
                                            onClick={() => { setStorageCostSkuInput(''); setStorageCostSelectedProduct(null); }}
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
                                        value={storageWidth}
                                        onChange={(e) => setStorageWidth(e.target.value)}
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
                                        value={storageLength}
                                        onChange={(e) => setStorageLength(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            {storageWidth && storageLength && (
                                <p className="text-xs text-blue-600 mt-2">
                                    A = {storageWidth} × {storageLength} = {(parseFloat(storageWidth) * parseFloat(storageLength)).toFixed(4)} ตร.ม.
                                </p>
                            )}
                        </div>

                        {/* Warehouse Data */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium text-gray-900">ข้อมูลคลังสินค้า</h4>
                                <button
                                    onClick={loadLatestStorageCostData}
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
                            <button onClick={calculateStorageCost} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg">
                                คำนวณต้นทุนพื้นที่
                            </button>
                            <button onClick={saveStorageCost} disabled={!storageCostResult} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg">
                                บันทึกข้อมูล
                            </button>
                            <button onClick={resetStorageCost} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2.5 rounded-lg">
                                ล้างข้อมูล
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="bg-blue-50 rounded-lg p-5 h-full">
                        <h4 className="font-semibold text-blue-900 mb-3">ผลลัพธ์การคำนวณ</h4>
                        
                        {storageCostResult && !storageCostResult.error ? (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                                    <p className="text-sm text-gray-600">ต้นทุนพื้นที่จัดเก็บ/ปี</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">
                                        {storageCostResult.storageCostPerYear.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท/ปี
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">พื้นที่สินค้า: {storageCostResult.productArea.toFixed(4)} ตร.ม.</p>
                                </div>
                                
                                <div className="space-y-2 text-xs">
                                    <div className="bg-gray-50 p-2 rounded">
                                        <p className="text-gray-500">A = W × L</p>
                                        <p className="font-medium">{storageCostResult.width} × {storageCostResult.length} = {storageCostResult.productArea.toFixed(4)} ตร.ม.</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded">
                                        <p className="text-gray-500">ต้นทุน/ตร.ม./ปี</p>
                                        <p className="font-medium">{storageCostResult.costPerSqmPerYear.toFixed(2)} บาท/ตร.ม./ปี</p>
                                    </div>
                                    <div className="bg-blue-50 p-2 rounded">
                                        <p className="text-gray-600">ต้นทุนพื้นที่ = A × ต้นทุน/ตร.ม./ปี</p>
                                        <p className="font-bold text-blue-700 text-lg">= {storageCostResult.storageCostPerYear.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท/ปี</p>
                                    </div>
                                </div>
                            </div>
                        ) : storageCostResult?.error ? (
                            <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center">
                                <p className="text-red-700">{storageCostResult.error}</p>
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
};

export default StorageCostCalculator;
