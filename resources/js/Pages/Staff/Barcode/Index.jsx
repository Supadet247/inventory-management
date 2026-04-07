import { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const SELECTED_PRODUCTS_KEY = 'barcode_selected_products';

const formatCurrency = (value) => {
    if (value === null || value === undefined) return '฿0.00';
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
    }).format(value);
};

export default function BarcodeIndex({ products, categories, filters, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedProducts, setSelectedProducts] = useState(() => {
        try {
            const saved = localStorage.getItem(SELECTED_PRODUCTS_KEY);
            const result = saved ? JSON.parse(saved) : [];
            console.log('Loading from localStorage on mount:', result.length, 'items');
            return result;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return [];
        }
    });
    const [printQuantity, setPrintQuantity] = useState(1);
    const [barcodeSize, setBarcodeSize] = useState('medium');
    const [showPreview, setShowPreview] = useState(false);
    const [previewProducts, setPreviewProducts] = useState([]);
    const printRef = useRef(null);

    useEffect(() => {
        console.log('Current selectedProducts state:', selectedProducts.length, 'items');
        try {
            localStorage.setItem(SELECTED_PRODUCTS_KEY, JSON.stringify(selectedProducts));
        } catch (e) {
            console.error('Failed to save selected products to localStorage:', e);
        }
    }, [selectedProducts]);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('staff.barcode.index'), { search }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        router.get(route('staff.barcode.index'), {}, { preserveState: true });
    };

    const toggleProductSelection = (product) => {
        const isSelected = selectedProducts.find(p => p.id === product.id);
        if (isSelected) {
            setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
        } else {
            setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
        }
    };

    const updateProductQuantity = (productId, quantity) => {
        setSelectedProducts(selectedProducts.map(p => {
            if (p.id === productId) {
                return { ...p, quantity: Math.max(1, parseInt(quantity) || 1) };
            }
            return p;
        }));
    };

    const removeProduct = (productId) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    };

    const clearSelection = () => {
        setSelectedProducts([]);
        setPrintQuantity(1);
        try {
            localStorage.removeItem(SELECTED_PRODUCTS_KEY);
        } catch (e) {
            console.error('Failed to clear localStorage:', e);
        }
    };

    const handlePreview = () => {
        const productsToPrint = [];
        selectedProducts.forEach(product => {
            for (let i = 0; i < product.quantity; i++) {
                productsToPrint.push(product);
            }
        });
        setPreviewProducts(productsToPrint);
        setShowPreview(true);
    };

    const handlePrint = () => {
        if (selectedProducts.length === 0) {
            alert('กรุณาเลือกสินค้าที่ต้องการพิมพ์บาร์โค๊ด');
            return;
        }
        handlePreview();
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const handleDownloadPdf = async () => {
        if (selectedProducts.length === 0) {
            alert('กรุณาเลือกสินค้าที่ต้องการดาวน์โหลดบาร์โค๊ด');
            return;
        }
        
        // Generate products to print
        const productsToPrint = [];
        selectedProducts.forEach(product => {
            for (let i = 0; i < product.quantity; i++) {
                productsToPrint.push(product);
            }
        });

        // Create a temporary container for rendering barcodes with Thai support
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = 'position: fixed; left: -9999px; top: 0; width: 680px; background: white; padding: 15px; font-family: "Sarabun", "TH Sarabun New", sans-serif; margin: 0; box-sizing: border-box;';
        
        // Create HTML structure for barcodes - fill entire page before breaking
        const itemsPerRow = 3;
        const gap = 15;
        const pageWidth = 650; // Width for fitting in A4
        const itemWidth = (pageWidth - (gap * (itemsPerRow - 1))) / itemsPerRow;
        
        // First, create all items to measure actual heights
        const itemElements = productsToPrint.map(product => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'barcode-item';
            itemDiv.style.cssText = `width: ${itemWidth}px; text-align: center; padding: 8px; display: flex; flex-direction: column; align-items: center; border: 2px solid #e5e7eb; border-radius: 6px; background: white; box-sizing: border-box;`;
            
            const canvas = document.createElement('canvas');
            JsBarcode(canvas, product.sku, {
                format: 'CODE128',
                width: 4,
                height: 60,
                displayValue: true,
                fontSize: 16,
                margin: 8,
                textMargin: 6,
                font: 'monospace',
            });
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
            
            // Full product name - no truncation, text wraps naturally
            const nameDiv = document.createElement('div');
            nameDiv.style.cssText = 'font-family: "Sarabun", "TH Sarabun New", sans-serif; font-size: 10px; margin-top: 6px; font-weight: bold; word-wrap: break-word; overflow-wrap: break-word; width: 100%; line-height: 1.3;';
            nameDiv.textContent = product.name;
            
            const priceDiv = document.createElement('div');
            priceDiv.style.cssText = 'font-family: "Sarabun", "TH Sarabun New", sans-serif; font-size: 13px; color: #2563eb; font-weight: bold; margin-top: 4px;';
            priceDiv.textContent = formatCurrency(product.price);
            
            itemDiv.appendChild(canvas);
            itemDiv.appendChild(nameDiv);
            itemDiv.appendChild(priceDiv);
            
            return itemDiv;
        });
        
        // Temporarily add to DOM to measure heights in a proper grid
        const measureContainer = document.createElement('div');
        measureContainer.style.cssText = `position: fixed; left: -9999px; top: 0; width: ${pageWidth}px; display: grid; grid-template-columns: repeat(${itemsPerRow}, ${itemWidth}px); gap: ${gap}px;`;
        itemElements.forEach(el => measureContainer.appendChild(el));
        document.body.appendChild(measureContainer);
        
        // Get actual height of the container when all items are laid out
        const totalHeight = measureContainer.offsetHeight;
        document.body.removeChild(measureContainer);
        
        // Measure height for a single row (first 3 items)
        const singleRowContainer = document.createElement('div');
        singleRowContainer.style.cssText = `position: fixed; left: -9999px; top: 0; width: ${pageWidth}px; display: grid; grid-template-columns: repeat(${itemsPerRow}, ${itemWidth}px); gap: ${gap}px;`;
        for (let i = 0; i < Math.min(3, itemElements.length); i++) {
            const clone = itemElements[i].cloneNode(true);
            singleRowContainer.appendChild(clone);
        }
        document.body.appendChild(singleRowContainer);
        const singleRowHeight = singleRowContainer.offsetHeight;
        document.body.removeChild(singleRowContainer);
        
        // Calculate how many complete rows fit on a page
        const maxPageHeight = 800; // Usable height for A4 (more generous)
        const rowsPerPage = Math.floor(maxPageHeight / singleRowHeight);
        const itemsPerPage = Math.max(itemsPerRow, rowsPerPage * itemsPerRow); // At least 1 row, max as many complete rows as fit
        
        // Now paginate items
        const pages = [];
        for (let i = 0; i < itemElements.length; i += itemsPerPage) {
            const pageItems = itemElements.slice(i, i + itemsPerPage);
            const pageDiv = document.createElement('div');
            pageDiv.className = 'barcode-page';
            pageDiv.style.cssText = `width: ${pageWidth}px; display: grid; grid-template-columns: repeat(${itemsPerRow}, ${itemWidth}px); gap: ${gap}px; padding: 0; margin: 0; page-break-after: always;`;
            
            pageItems.forEach(itemEl => {
                pageDiv.appendChild(itemEl);
            });
            
            pages.push(pageDiv);
            tempContainer.appendChild(pageDiv);
        }
        
        document.body.appendChild(tempContainer);
        
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const margin = 5;
            
            for (let i = 0; i < pages.length; i++) {
                if (i > 0) {
                    pdf.addPage();
                }
                
                const canvas = await html2canvas(pages[i], {
                    scale: 4,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pdfWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // Center horizontally
                const xOffset = (pdfWidth - imgWidth) / 2;
                
                pdf.addImage(imgData, 'PNG', xOffset, margin, imgWidth, imgHeight);
            }
            
            pdf.save(`barcodes-${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (e) {
            console.error('PDF generation error:', e);
            alert('เกิดข้อผิดพลาดในการสร้าง PDF');
        } finally {
            document.body.removeChild(tempContainer);
        }
    };

    // Generate barcodes when preview is shown
    useEffect(() => {
        if (showPreview) {
            // Generate barcodes for preview modal
            const previewCanvases = document.querySelectorAll('.barcode-canvas');
            previewCanvases.forEach((canvas) => {
                const idParts = canvas.id.replace('barcode-', '').split('-');
                const pageIndex = parseInt(idParts[0], 10);
                const itemIndex = parseInt(idParts[1], 10);
                const flatIndex = pageIndex * 18 + itemIndex;
                
                if (previewProducts[flatIndex]) {
                    try {
                        JsBarcode(canvas, previewProducts[flatIndex].sku, {
                            format: 'CODE128',
                            width: 2,
                            height: 60,
                            displayValue: true,
                            fontSize: 14,
                            margin: 10,
                            textMargin: 5,
                        });
                    } catch (e) {
                        console.error('Barcode generation error:', e);
                    }
                }
            });

            // Generate barcodes for print area
            const printCanvases = document.querySelectorAll('.print-barcode-canvas');
            printCanvases.forEach((canvas) => {
                const idParts = canvas.id.replace('print-barcode-', '').split('-');
                const pageIndex = parseInt(idParts[0], 10);
                const itemIndex = parseInt(idParts[1], 10);
                const flatIndex = pageIndex * 18 + itemIndex;
                
                if (previewProducts[flatIndex]) {
                    try {
                        JsBarcode(canvas, previewProducts[flatIndex].sku, {
                            format: 'CODE128',
                            width: 2,
                            height: 60,
                            displayValue: true,
                            fontSize: 14,
                            margin: 10,
                            textMargin: 5,
                        });
                    } catch (e) {
                        console.error('Print barcode generation error:', e);
                    }
                }
            });
        }
    }, [showPreview, previewProducts]);

    const getBarcodeDimensions = () => {
        switch (barcodeSize) {
            case 'small':
                return { width: 1, height: 40, fontSize: 10 };
            case 'large':
                return { width: 3, height: 80, fontSize: 18 };
            default:
                return { width: 2, height: 60, fontSize: 14 };
        }
    };

    const { width, height, fontSize } = getBarcodeDimensions();

    const sortBySku = (items) => {
        return [...items].sort((a, b) => {
            // Extract prefix and number from SKU (e.g., "A-001" -> ["A", "001"])
            const extractParts = (sku) => {
                const match = sku.match(/^([A-Za-zก-ฮ]+)[-]?(\d+)$/);
                if (match) {
                    return { prefix: match[1].toUpperCase(), number: parseInt(match[2], 10) };
                }
                return { prefix: sku.toUpperCase(), number: 0 };
            };
            
            const aParts = extractParts(a.sku);
            const bParts = extractParts(b.sku);
            
            // Compare by prefix first
            if (aParts.prefix < bParts.prefix) return -1;
            if (aParts.prefix > bParts.prefix) return 1;
            
            // Then compare by number
            return aParts.number - bParts.number;
        });
    };

    // Sort products for display
    const sortedProducts = products?.data ? sortBySku(products.data) : [];

    // Select All functionality
    const selectAll = () => {
        const currentSelectedIds = new Set(selectedProducts.map(p => p.id));
        const newProducts = sortedProducts
            .filter(product => !currentSelectedIds.has(product.id))
            .map(product => ({
                ...product,
                quantity: 1
            }));
        console.log('selectAll: Adding', newProducts.length, 'new products. Total:', selectedProducts.length + newProducts.length);
        setSelectedProducts([...selectedProducts, ...newProducts]);
    };

    const deselectAll = () => {
        console.log('deselectAll: Clearing all selections');
        setSelectedProducts([]);
    };

    const isAllSelected = sortedProducts.length > 0 && 
        sortedProducts.every(p => selectedProducts.some(sp => sp.id === p.id));

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="พิมพ์บาร์โค๊ด" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">พิมพ์บาร์โค๊ดสินค้า</h1>
                        <p className="text-gray-600 mt-2">เลือกสินค้าและพิมพ์บาร์โค๊ดสำหรับติดสินค้า</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Product List */}
                        <div className="lg:col-span-2">
                            {/* Search & Filter */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                                <form onSubmit={handleSearch} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหาสินค้า</label>
                                            <input
                                                type="text"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="ค้นหาตามรหัสสินค้า (SKU) หรือชื่อสินค้า..."
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                                            <select
                                                value={filters.category_filter || ''}
                                                onChange={(e) => {
                                                    router.get(route('staff.barcode.index'), { 
                                                        search, 
                                                        category_filter: e.target.value || undefined 
                                                    }, { preserveState: true });
                                                }}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="">ทั้งหมด</option>
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            ค้นหา
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            ล้าง
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Products Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-16">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                selectAll();
                                                            } else {
                                                                deselectAll();
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">รหัสสินค้า</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ชื่อสินค้า</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ราคา</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">สต็อก</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {sortedProducts.length > 0 ? (
                                                sortedProducts.map((product) => {
                                                    const isSelected = selectedProducts.find(p => p.id === product.id);
                                                    return (
                                                        <tr 
                                                            key={product.id} 
                                                            className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                                                            onClick={() => toggleProductSelection(product)}
                                                        >
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!isSelected}
                                                                    onChange={() => {}}
                                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="font-mono text-sm font-medium">{product.sku}</span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                                <div className="text-xs text-gray-500">{product.category?.name}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                {formatCurrency(product.price)}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`text-sm ${product.quantity <= 5 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                                                    {product.quantity} ชิ้น
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-12 text-center text-gray-500">
                                                        ไม่พบสินค้า
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {products?.links && (
                                    <div className="px-4 py-4 border-t border-gray-100">
                                        <div className="flex justify-center gap-2">
                                            {products.links.map((link, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                    className={`px-3 py-1 rounded ${
                                                        link.active 
                                                            ? 'bg-blue-600 text-white' 
                                                            : link.url 
                                                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                    disabled={!link.url}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Products Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    สินค้าที่เลือก ({selectedProducts.length})
                                </h3>

                                {selectedProducts.length > 0 ? (
                                    <>
                                        {/* Selected Products List */}
                                        <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                                            {selectedProducts.map((product) => (
                                                <div key={product.id} className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="font-mono text-sm font-medium">{product.sku}</div>
                                                            <div className="text-sm text-gray-900 truncate">{product.name}</div>
                                                            <div className="text-sm font-medium text-blue-600 mt-1">
                                                                {formatCurrency(product.price)}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeProduct(product.id)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center mt-2 space-x-2">
                                                        <span className="text-xs text-gray-500">จำนวน:</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={product.quantity}
                                                            onChange={(e) => updateProductQuantity(product.id, e.target.value)}
                                                            onWheel={(e) => e.target.blur()}
                                                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Summary */}
                                        <div className="border-t border-gray-200 pt-4 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">จำนวนบาร์โค๊ดทั้งหมด:</span>
                                                <span className="font-semibold">
                                                    {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} รายการ
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-3">
                                            <button
                                                onClick={clearSelection}
                                                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors"
                                            >
                                                ล้างทั้งหมด
                                            </button>
                                            <button
                                                onClick={handlePrint}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                                พิมพ์บาร์โค๊ด
                                            </button>
                                            <button
                                                onClick={handleDownloadPdf}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                </svg>
                                                ดาวน์โหลด PDF
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                        <p>เลือกสินค้าจากรายการด้านซ้าย</p>
                                        <p className="text-sm mt-1">เพื่อพิมพ์บาร์โค๊ด</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center print:hidden">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">ตัวอย่างก่อนพิมพ์</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-8">
                            {/* Paginate preview: 18 items per page (6 rows × 3 columns) */}
                            {Array.from({ length: Math.ceil(previewProducts.length / 18) }).map((_, pageIndex) => (
                                <div key={pageIndex} className="border-2 border-gray-300 p-4 bg-white">
                                    <div className="grid grid-cols-3 gap-4">
                                        {previewProducts.slice(pageIndex * 18, (pageIndex + 1) * 18).map((product, itemIndex) => (
                                            <div key={`${pageIndex}-${itemIndex}`} className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
                                                <canvas
                                                    id={`barcode-${pageIndex}-${itemIndex}`}
                                                    className="barcode-canvas w-full"
                                                ></canvas>
                                                <div className="mt-2 text-sm font-medium text-gray-900">{product.name}</div>
                                                <div className="text-xs text-gray-500">{formatCurrency(product.price)}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {pageIndex < Math.ceil(previewProducts.length / 18) - 1 && (
                                        <div className="mt-4 text-center text-sm text-gray-500">
                                            หน้า {pageIndex + 1} / {Math.ceil(previewProducts.length / 18)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                ปิด
                            </button>
                            <button
                                onClick={() => {
                                    window.print();
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                พิมพ์
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Area - Only visible when printing */}
            {showPreview && (
                <div className="print-area hidden print:block">
                    {Array.from({ length: Math.ceil(previewProducts.length / 18) }).map((_, pageIndex) => (
                        <div key={pageIndex} className="print-page">
                            <div className="print-grid">
                                {previewProducts.slice(pageIndex * 18, (pageIndex + 1) * 18).map((product, itemIndex) => (
                                    <div key={`print-${pageIndex}-${itemIndex}`} className="print-item">
                                        <canvas
                                            id={`print-barcode-${pageIndex}-${itemIndex}`}
                                            className="print-barcode-canvas"
                                        ></canvas>
                                        <div className="print-name">{product.name}</div>
                                        <div className="print-price">{formatCurrency(product.price)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible !important;
                    }
                    .print-area {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .print-page {
                        page-break-after: always;
                        padding: 10mm;
                        box-sizing: border-box;
                    }
                    .print-page:last-child {
                        page-break-after: avoid;
                    }
                    .print-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 8px;
                    }
                    .print-item {
                        text-align: center;
                        padding: 8px;
                        border: 1px dashed #ccc;
                    }
                    .print-barcode-canvas {
                        max-width: 100%;
                        height: auto;
                    }
                    .print-name {
                        font-size: 10px;
                        font-weight: bold;
                        margin-top: 4px;
                    }
                    .print-price {
                        font-size: 9px;
                        color: #666;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
