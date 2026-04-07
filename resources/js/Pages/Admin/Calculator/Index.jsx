import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import ProductSelectorModal from '@/Components/EOQ/ProductSelectorModal';
import StorageCostCalculator from './components/StorageCostCalculator';
import CostPerAreaCalculator from './components/CostPerAreaCalculator';
import EOQCalculator from './components/EOQCalculator';
import ROPCalculator from './components/ROPCalculator';
import COGSCalculator from './components/COGSCalculator';
import AverageCostCalculator from './components/AverageCostCalculator';

export default function CalculatorIndex({ auth }) {
    // Hide spin buttons for number inputs
    const hideSpinButtonsStyle = `
        .hide-spin-buttons::-webkit-outer-spin-button,
        .hide-spin-buttons::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        .hide-spin-buttons {
            -moz-appearance: textfield;
        }
    `;
    // EOQ calculator states
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [skuInput, setSkuInput] = useState('');
    const [showProductModal, setShowProductModal] = useState(false);
    const [productModalMode, setProductModalMode] = useState('eoq'); // 'eoq' or 'cogs'
    const [demand, setDemand] = useState('');
    const [orderingCost, setOrderingCost] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [holdingRate, setHoldingRate] = useState('');
    const [eoqResult, setEoqResult] = useState(null);
    const [monthlyQuantity, setMonthlyQuantity] = useState('');

    // ROP calculator states
    const [ropSkuInput, setRopSkuInput] = useState('');
    const [ropSelectedProduct, setRopSelectedProduct] = useState(null);
    const [ropAnnualDemand, setRopAnnualDemand] = useState('');
    const [ropLeadTime, setRopLeadTime] = useState(7);
    const [ropSafetyStock, setRopSafetyStock] = useState(10); // Default 10%
    const [ropResult, setRopResult] = useState(null);
    const [ropLoading, setRopLoading] = useState(false);

    const [savedCalculations, setSavedCalculations] = useState([]);
    const [showSavedCalculations, setShowSavedCalculations] = useState(false);

    // Product storage cost calculator states
    const [largeProduct, setLargeProduct] = useState({ width: '', length: '', quantity: '' });
    const [mediumProduct, setMediumProduct] = useState({ rowWidth: '', shelfDepth: '', rows: '' });
    const [smallProduct, setSmallProduct] = useState({ width: '', length: '', boxes: '' });
    const [costPerSquareMeter, setCostPerSquareMeter] = useState('');
    const [productStorageResult, setProductStorageResult] = useState(null);

    // COGS calculator states
    const [cogsSkuInput, setCogsSkuInput] = useState('');
    const [cogsSelectedProduct, setCogsSelectedProduct] = useState(null);
    const [cogsLoading, setCogsLoading] = useState(false);
    const [beginningInventory, setBeginningInventory] = useState({ cost: '', quantity: '' });
    const [netPurchases, setNetPurchases] = useState({ cost: '', quantity: '' });
    const [endingInventory, setEndingInventory] = useState({ cost: '', quantity: '' });
    const [cogsResult, setCogsResult] = useState(null);
    const [savedCogsCalculations, setSavedCogsCalculations] = useState([]);
    const [showSavedCogsCalculations, setShowSavedCogsCalculations] = useState(false);
    
    // All products for search functionality
    const [allProducts, setAllProducts] = useState([]);

    // Notification helper function
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        const icon = type === 'success' 
            ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
            : type === 'error'
            ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'
            : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
        
        const colors = type === 'success' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-400' 
            : type === 'error'
            ? 'bg-gradient-to-r from-red-500 to-rose-500 border-red-400'
            : 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-400';
        
        notification.className = `fixed top-4 right-4 px-4 py-3 rounded-xl shadow-2xl z-50 text-white flex items-center gap-3 min-w-[300px] border ${colors} transform transition-all duration-300 ease-out translate-x-full opacity-0`;
        notification.innerHTML = `
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                ${icon}
            </div>
            <div class="flex-1">
                <p class="font-medium text-sm">${type === 'success' ? 'สำเร็จ' : type === 'error' ? 'ผิดพลาด' : 'แจ้งเตือน'}</p>
                <p class="text-xs text-white/90">${message}</p>
            </div>
            <button class="flex-shrink-0 text-white/60 hover:text-white transition-colors" onclick="this.parentElement.remove()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        });
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    // Initial check for product_id and action from URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('product_id');
        const action = urlParams.get('action');

        if (productId) {
            fetchProductAndEoq(productId, action);
        }
        
        // Fetch all products for search functionality
        fetchAllProducts();
    }, []);
    
    // Fetch all products for search
    const fetchAllProducts = async () => {
        try {
            const response = await fetch('/admin/calculator/all-products');
            if (response.ok) {
                const products = await response.json();
                setAllProducts(products);
            }
        } catch (error) {
            console.error('Error fetching all products:', error);
        }
    };

    const fetchProductAndEoq = async (productId, action) => {
        try {
            const response = await fetch(`/admin/calculator/products?id=${productId}`);
            const product = await response.json();
            
            if (product && product.id) {
                handleProductSelect(product);
                
                // If the product has existing EOQ data, fill it
                if (product.eoq_calculation) {
                    setDemand(product.eoq_calculation.annual_demand || '');
                    setOrderingCost(product.eoq_calculation.ordering_cost || '');
                    setUnitCost(product.eoq_calculation.unit_cost || product.cost_price || '');
                    setHoldingRate(product.eoq_calculation.holding_rate || '');
                    
                    // Trigger calculation if action is 'view'
                    if (action === 'view') {
                        // Use a timeout to ensure state updates are processed
                        setTimeout(() => {
                            calculateEOQ_withData(
                                product.eoq_calculation.annual_demand,
                                product.eoq_calculation.ordering_cost,
                                product.eoq_calculation.unit_cost || product.cost_price,
                                product.eoq_calculation.holding_rate
                            );
                        }, 100);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching product for calculator:', error);
        }
    };

    const calculateEOQ_withData = (demandVal, orderingCostVal, unitCostVal, holdingRateVal) => {
        const annualDemand = parseFloat(demandVal);
        const S = parseFloat(orderingCostVal);
        const C = parseFloat(unitCostVal);
        const h = parseFloat(holdingRateVal) / 100; // Convert percentage to decimal
        const H = h * C; // Calculate holding cost per unit per year

        if (isNaN(annualDemand) || isNaN(S) || isNaN(C) || isNaN(h) || annualDemand <= 0 || S <= 0 || C <= 0 || h <= 0) {
            return;
        }

        const eoq = Math.sqrt((2 * annualDemand * S) / H);
        const numberOfOrders = annualDemand / eoq;
        const orderCycle = 365 / numberOfOrders;
        const dailyDemand = annualDemand / 365;
        const rop = dailyDemand * 7;
        const totalCost = (annualDemand / eoq) * S + (eoq / 2) * H;

        setEoqResult({
            eoq: Math.round(eoq),
            annualDemand,
            numberOfOrders: numberOfOrders.toFixed(2),
            orderCycle: orderCycle.toFixed(2),
            dailyDemand: dailyDemand.toFixed(2),
            rop: rop.toFixed(2),
            totalCost: totalCost.toFixed(2),
            orderingCost: S,
            holdingCost: H,
            holdingRate: h * 100,
            unitCost: C,
            raw: {
                eoq: Math.round(eoq),
                annual_demand: annualDemand,
                ordering_cost: S,
                unit_cost: C,
                holding_rate: h * 100,
                holding_cost: H,
                number_of_orders: numberOfOrders,
                order_cycle_days: orderCycle,
                daily_demand: dailyDemand,
                reorder_point: rop,
                total_cost: totalCost
            }
        });
    };

    // Calculate EOQ
    const calculateEOQ = () => {
        // Convert monthly quantity to annual demand if provided
        let annualDemand = parseFloat(demand);
        if (monthlyQuantity && !demand) {
            annualDemand = parseFloat(monthlyQuantity) * 12;
        }

        const S = parseFloat(orderingCost);
        const C = parseFloat(unitCost);
        const h = parseFloat(holdingRate) / 100; // Convert percentage to decimal
        const H = h * C; // Calculate holding cost per unit per year

        if (isNaN(annualDemand) || isNaN(S) || isNaN(C) || isNaN(h) || annualDemand <= 0 || S <= 0 || C <= 0 || h <= 0) {
            setEoqResult({ error: 'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง' });
            return;
        }

        // EOQ Formula: sqrt((2 * D * S) / H)
        const eoq = Math.sqrt((2 * annualDemand * S) / H);
        const numberOfOrders = annualDemand / eoq; // Orders per year
        const orderCycle = 365 / numberOfOrders; // Days per order
        const dailyDemand = annualDemand / 365; // Daily demand
        const rop = dailyDemand * 7; // Reorder point (7 days lead time)
        const totalCost = (annualDemand / eoq) * S + (eoq / 2) * H;

        const result = {
            eoq: Math.round(eoq),
            annualDemand,
            numberOfOrders: numberOfOrders.toFixed(2),
            orderCycle: orderCycle.toFixed(2),
            dailyDemand: dailyDemand.toFixed(2),
            rop: rop.toFixed(2),
            totalCost: totalCost.toFixed(2),
            orderingCost: S,
            holdingCost: H,
            holdingRate: h * 100,
            unitCost: C,
            // Keep numerical values for saving later
            raw: {
                eoq: Math.round(eoq),
                annual_demand: annualDemand,
                ordering_cost: S,
                unit_cost: C,
                holding_rate: h * 100,
                holding_cost: H,
                number_of_orders: numberOfOrders,
                order_cycle_days: orderCycle,
                daily_demand: dailyDemand,
                reorder_point: rop,
                total_cost: totalCost
            }
        };

        setEoqResult(result);
    };

    // Save EOQ to database
    const saveEOQ = () => {
        if (!eoqResult || eoqResult.error) return;

        const saveData = {
            product_id: selectedProduct?.id || null,
            product_name: selectedProduct ? selectedProduct.name : `EOQ Calculation ${new Date().toLocaleDateString('th-TH')}`,
            ...eoqResult.raw
        };

        router.post(route('admin.calculator.save-eoq'), saveData, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                console.log('EOQ calculation saved successfully');
                if (page.props.flash && page.props.flash.success) {
                    // Using a more subtle notification would be better, but keeping alert for now as requested or just console
                    alert('บันทึกผลการคำนวณ EOQ สำเร็จ');
                }
            },
            onError: (errors) => {
                console.error('Failed to save EOQ calculation:', errors);
                alert('เกิดข้อผิดพลาดในการบันทึกผลการคำนวณ EOQ');
            }
        });
    };

    // Reset EOQ form
    const resetEOQ = () => {
        setSelectedProduct(null);
        setSkuInput('');
        setDemand('');
        setMonthlyQuantity('');
        setOrderingCost('');
        setUnitCost('');
        setHoldingRate('');
        setEoqResult(null);
    };

    // Handle product selection for EOQ - sync with ROP, COGS, and Average Cost
    const handleProductSelect = (product) => {
        if (product === null) {
            // Clear all calculators
            setSelectedProduct(null);
            setSkuInput('');
            setUnitCost('');
            setDemand('');
            setMonthlyQuantity('');
            setOrderingCost('');
            setHoldingRate('');
            setEoqResult(null);
            
            // Clear ROP
            setRopSelectedProduct(null);
            setRopSkuInput('');
            setRopAnnualDemand('');
            setRopLeadTime('');
            setRopSafetyStock('');
            setRopResult(null);
            
            // Clear COGS
            setCogsSelectedProduct(null);
            setCogsSkuInput('');
            setBeginningInventory({ cost: '', quantity: '' });
            setNetPurchases({ cost: '', quantity: '' });
            setEndingInventory({ cost: '', quantity: '' });
            setCogsResult(null);
            
            // Average Cost will be cleared via syncProduct
            
            return;
        }
        
        setSelectedProduct(product);
        setSkuInput(product.sku);
        setUnitCost(product.cost_price); // Auto-fill unit cost from product's cost price (ต้นทุน)
        
        // If product has EOQ data from other calculator (e.g., ROP), fill EOQ form
        if (product.eoq_calculation) {
            const eoq = product.eoq_calculation;
            if (eoq.annual_demand) setDemand(String(eoq.annual_demand));
            if (eoq.ordering_cost) setOrderingCost(String(eoq.ordering_cost));
            if (eoq.unit_cost) setUnitCost(String(eoq.unit_cost));
            if (eoq.holding_rate) setHoldingRate(String(eoq.holding_rate));
            
            // Auto-calculate EOQ if all data present
            const D = parseFloat(eoq.annual_demand) || 0;
            const S = parseFloat(eoq.ordering_cost) || 0;
            const C = parseFloat(eoq.unit_cost) || parseFloat(product.cost_price) || 0;
            const h = parseFloat(eoq.holding_rate) || 0;
            
            if (D > 0 && S > 0 && C > 0 && h > 0) {
                setTimeout(() => {
                    calculateEOQ_withData(eoq.annual_demand, eoq.ordering_cost, eoq.unit_cost || product.cost_price, eoq.holding_rate);
                }, 100);
            }
        }
        
        // Sync with ROP
        setRopSelectedProduct({
            id: product.id,
            name: product.name,
            sku: product.sku,
            cost_price: product.cost_price,
            quantity: product.quantity,
            image: product.image,
        });
        setRopSkuInput(product.sku);
        fetchProductForRop(product.sku);
        
        // Sync with COGS
        setCogsSelectedProduct({
            id: product.id,
            name: product.name,
            sku: product.sku,
            cost_price: product.cost_price,
            quantity: product.quantity,
            image: product.image,
        });
        setCogsSkuInput(product.sku);
        fetchProductForCogs(product.sku);
        
        setShowProductModal(false);
    };

    // Handle product selection for COGS - sync with EOQ and ROP
    const handleCogsProductSelect = (product) => {
        // Sync with EOQ
        setSelectedProduct(product);
        setSkuInput(product.sku);
        setUnitCost(product.cost_price);
        
        // Sync with ROP
        setRopSelectedProduct({
            id: product.id,
            name: product.name,
            sku: product.sku,
            cost_price: product.cost_price,
            quantity: product.quantity,
            image: product.image,
        });
        setRopSkuInput(product.sku);
        fetchProductForRop(product.sku);
        
        // Set COGS
        setCogsSelectedProduct({
            id: product.id,
            name: product.name,
            sku: product.sku,
            cost_price: product.cost_price,
            quantity: product.quantity,
            image: product.image,
        });
        setCogsSkuInput(product.sku);
        fetchProductForCogs(product.sku);
        
        setShowProductModal(false);
    };

    // Handle product selection for ROP - sync with EOQ and COGS
    const handleRopProductSelect = (product) => {
        // Sync with EOQ
        setSelectedProduct(product);
        setSkuInput(product.sku);
        setUnitCost(product.cost_price);
        
        // Set ROP
        setRopSelectedProduct({
            id: product.id,
            name: product.name,
            sku: product.sku,
            cost_price: product.cost_price,
            quantity: product.quantity,
            image: product.image,
        });
        setRopSkuInput(product.sku);
        fetchProductForRop(product.sku);
        
        // Sync with COGS
        setCogsSelectedProduct({
            id: product.id,
            name: product.name,
            sku: product.sku,
            cost_price: product.cost_price,
            quantity: product.quantity,
            image: product.image,
        });
        setCogsSkuInput(product.sku);
        fetchProductForCogs(product.sku);
        
        setShowProductModal(false);
    };

    // ROP Calculator Functions
    
    // Fetch product and EOQ data by SKU for ROP
    const fetchProductForRop = async (sku) => {
        if (!sku) return;
        
        setRopLoading(true);
        try {
            const response = await fetch(`/admin/calculator/annual-demand-from-eoq?sku=${encodeURIComponent(sku)}`);
            const data = await response.json();
            
            if (response.ok) {
                // Found EOQ data - auto fill
                setRopAnnualDemand(data.annual_demand || '');
                setRopSelectedProduct({
                    id: data.product_id,
                    name: data.product_name,
                    sku: data.sku,
                    image: data.image,
                    cost_price: data.cost_price,
                });
            } else {
                // No EOQ data found
                alert(data.error || 'ไม่พบข้อมูล EOQ สำหรับสินค้านี้');
                setRopSelectedProduct(null);
            }
        } catch (error) {
            console.error('Error fetching product for ROP:', error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setRopLoading(false);
        }
    };

    // Handle SKU input change for ROP - auto search like EOQ
    const handleRopSkuChange = async (e) => {
        const sku = e.target.value;
        setRopSkuInput(sku);
        
        if (!sku.trim()) {
            setRopSelectedProduct(null);
            return;
        }
        
        try {
            const response = await fetch('/admin/calculator/products?search=' + encodeURIComponent(sku));
            const data = await response.json();
            
            if (data && Array.isArray(data) && data.length > 0) {
                const found = data.find(p => p.sku && p.sku.toLowerCase() === sku.toLowerCase());
                if (found) {
                    // Sync with EOQ and COGS
                    setSelectedProduct(found);
                    setSkuInput(found.sku);
                    setUnitCost(found.cost_price || '');
                    
                    setRopSelectedProduct({
                        id: found.id,
                        name: found.name,
                        sku: found.sku,
                        cost_price: found.cost_price,
                        quantity: found.quantity,
                        image: found.image,
                    });
                    fetchProductForRop(found.sku);
                    
                    setCogsSelectedProduct({
                        id: found.id,
                        name: found.name,
                        sku: found.sku,
                        cost_price: found.cost_price,
                        quantity: found.quantity,
                        image: found.image,
                    });
                    setCogsSkuInput(found.sku);
                    fetchProductForCogs(found.sku);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Handle SKU blur - fetch data when user leaves the field (backup)
    const handleRopSkuBlur = () => {
        if (ropSkuInput && !ropSelectedProduct) {
            fetchProductForRop(ropSkuInput);
        }
    };

    const calculateROP = () => {
        const D = parseFloat(ropAnnualDemand) || 0;
        const L = parseFloat(ropLeadTime) || 0;

        if (!ropAnnualDemand || D <= 0) {
            setRopResult({ error: 'กรุณากรอกความต้องการต่อปี' });
            return;
        }
        if (L <= 0) {
            setRopResult({ error: 'กรุณากรอกระยะเวลาจัดส่ง' });
            return;
        }

        const dailyDemand = D / 365;
        const rop = dailyDemand * L; // ROP without safety stock
        // Calculate safety stock as percentage of base ROP (input number is treated as %)
        const safetyStockPercent = parseFloat(ropSafetyStock) || 0;
        const safetyStock = Math.ceil(rop * (safetyStockPercent / 100));

        setRopResult({
            annualDemand: D,
            leadTime: L,
            safetyStock: safetyStock,
            dailyDemand: dailyDemand.toFixed(2),
            rop: rop.toFixed(2), // ROP without safety stock
            ropWithSafety: (rop + safetyStock).toFixed(2), // ROP with safety stock (for reference)
            raw: {
                product_id: ropSelectedProduct?.id || null,
                product_name: ropSelectedProduct?.name || null,
                sku: ropSkuInput || null,
                annual_demand: D,
                lead_time: L,
                safety_stock: safetyStock,
                daily_demand: dailyDemand,
                rop: rop,
            }
        });
    };

    const saveROP = () => {
        if (!ropResult || ropResult.error) return;

        const saveData = {
            product_id: ropResult.raw.product_id,
            product_name: ropResult.raw.product_name,
            sku: ropResult.raw.sku,
            ...ropResult.raw
        };

        router.post(route('admin.calculator.save-rop'), saveData, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                console.log('ROP calculation saved successfully');
                if (page.props.flash && page.props.flash.success) {
                    alert(page.props.flash.success);
                }
            },
            onError: (errors) => {
                console.error('Failed to save ROP calculation:', errors);
                alert('เกิดข้อผิดพลาดในการบันทึกผลการคำนวณ ROP');
            }
        });
    };

    const resetROP = () => {
        setRopSkuInput('');
        setRopSelectedProduct(null);
        setRopAnnualDemand('');
        setRopLeadTime(7);
        setRopSafetyStock(10); // Reset to default 10%
        setRopResult(null);
    };

    // Handle monthly data change
    // COGS Calculator Functions
    
    // Fetch product by SKU for COGS
    const fetchProductForCogs = async (sku) => {
        if (!sku) return;
        
        setCogsLoading(true);
        try {
            const response = await fetch(`/admin/calculator/product-for-cogs?sku=${encodeURIComponent(sku)}`);
            const data = await response.json();
            
            if (response.ok) {
                setCogsSelectedProduct({
                    id: data.id,
                    name: data.name,
                    sku: data.sku,
                    cost_price: data.cost_price,
                    quantity: data.quantity,
                    image: data.image,
                });
                // If there's existing COGS data, load it
                if (data.cogs_calculation) {
                    setBeginningInventory({
                        cost: data.cogs_calculation.beginning_inventory_cost || '',
                        quantity: data.cogs_calculation.beginning_inventory_quantity || '',
                    });
                    setNetPurchases({
                        cost: data.cogs_calculation.net_purchases_cost || '',
                        quantity: data.cogs_calculation.net_purchases_quantity || '',
                    });
                    setEndingInventory({
                        cost: data.cogs_calculation.ending_inventory_cost || '',
                        quantity: data.cogs_calculation.ending_inventory_quantity || '',
                    });
                }
            } else {
                alert(data.error || 'ไม่พบสินค้า');
                setCogsSelectedProduct(null);
            }
        } catch (error) {
            console.error('Error fetching product for COGS:', error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setCogsLoading(false);
        }
    };

    // Handle SKU input change for COGS
    // Handle SKU input change for COGS - auto search like EOQ
    const handleCogsSkuChange = async (e) => {
        const sku = e.target.value;
        setCogsSkuInput(sku);
        
        if (!sku.trim()) {
            setCogsSelectedProduct(null);
            return;
        }
        
        try {
            const response = await fetch('/admin/calculator/products?search=' + encodeURIComponent(sku));
            const data = await response.json();
            
            if (data && Array.isArray(data) && data.length > 0) {
                const found = data.find(p => p.sku && p.sku.toLowerCase() === sku.toLowerCase());
                if (found) {
                    // Sync with EOQ and ROP
                    setSelectedProduct(found);
                    setSkuInput(found.sku);
                    setUnitCost(found.cost_price || '');
                    
                    setRopSelectedProduct({
                        id: found.id,
                        name: found.name,
                        sku: found.sku,
                        cost_price: found.cost_price,
                        quantity: found.quantity,
                        image: found.image,
                    });
                    setRopSkuInput(found.sku);
                    fetchProductForRop(found.sku);
                    
                    setCogsSelectedProduct({
                        id: found.id,
                        name: found.name,
                        sku: found.sku,
                        cost_price: found.cost_price,
                        quantity: found.quantity,
                        image: found.image,
                    });
                    fetchProductForCogs(found.sku);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Handle SKU blur - fetch data when user leaves the field (backup)
    const handleCogsSkuBlur = () => {
        if (cogsSkuInput && !cogsSelectedProduct) {
            fetchProductForCogs(cogsSkuInput);
        }
    };

    // Fetch saved COGS calculations
    const fetchSavedCogsCalculations = async () => {
        try {
            const response = await fetch('/admin/calculator/cogs-calculations');
            const data = await response.json();
            setSavedCogsCalculations(data);
        } catch (error) {
            console.error('Error fetching saved COGS calculations:', error);
        }
    };

    // Load saved COGS calculation
    const loadCogsCalculation = (calc) => {
        setCogsSkuInput(calc.sku || '');
        setCogsSelectedProduct(calc.product ? {
            id: calc.product.id,
            name: calc.product.name,
            sku: calc.product.sku,
        } : null);
        setBeginningInventory({
            cost: calc.beginning_inventory_cost || '',
            quantity: calc.beginning_inventory_quantity || '',
        });
        setNetPurchases({
            cost: calc.net_purchases_cost || '',
            quantity: calc.net_purchases_quantity || '',
        });
        setEndingInventory({
            cost: calc.ending_inventory_cost || '',
            quantity: calc.ending_inventory_quantity || '',
        });
        setCogsResult({
            totalCost: parseFloat(calc.total_cost),
            totalQuantity: parseFloat(calc.total_quantity),
            averageCost: parseFloat(calc.average_cost),
            cogs: parseFloat(calc.cogs),
            raw: {
                product_id: calc.product_id,
                sku: calc.sku,
                product_name: calc.product_name,
                beginning_inventory_cost: calc.beginning_inventory_cost,
                beginning_inventory_quantity: calc.beginning_inventory_quantity,
                net_purchases_cost: calc.net_purchases_cost,
                net_purchases_quantity: calc.net_purchases_quantity,
                ending_inventory_cost: calc.ending_inventory_cost,
                ending_inventory_quantity: calc.ending_inventory_quantity,
                total_cost: calc.total_cost,
                total_quantity: calc.total_quantity,
                average_cost: calc.average_cost,
                cogs: calc.cogs,
            }
        });
        setShowSavedCogsCalculations(false);
    };

    // Save COGS calculation
    const saveCogs = () => {
        if (!cogsResult) return;

        const saveData = {
            product_id: cogsSelectedProduct?.id || null,
            sku: cogsSkuInput || null,
            product_name: cogsSelectedProduct?.name || null,
            ...cogsResult.raw
        };

        router.post(route('admin.calculator.save-cogs'), saveData, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                console.log('COGS calculation saved successfully');
                if (page.props.flash && page.props.flash.success) {
                    alert(page.props.flash.success);
                }
                fetchSavedCogsCalculations();
            },
            onError: (errors) => {
                console.error('Failed to save COGS calculation:', errors);
                alert('เกิดข้อผิดพลาดในการบันทึกผลการคำนวณ COGS');
            }
        });
    };

    // Reset COGS form
    const resetCogs = () => {
        setCogsSkuInput('');
        setCogsSelectedProduct(null);
        setBeginningInventory({ cost: '', quantity: '' });
        setNetPurchases({ cost: '', quantity: '' });
        setEndingInventory({ cost: '', quantity: '' });
        setCogsResult(null);
    };

    // Handle large product change
    const handleLargeProductChange = (field, value) => {
        setLargeProduct(prev => ({ ...prev, [field]: value }));
    };

    // Handle medium product change
    const handleMediumProductChange = (field, value) => {
        setMediumProduct(prev => ({ ...prev, [field]: value }));
    };

    // Handle small product change
    const handleSmallProductChange = (field, value) => {
        setSmallProduct(prev => ({ ...prev, [field]: value }));
    };

    // Calculate product storage cost
    const calculateProductStorageCost = () => {
        const largeWidth = parseFloat(largeProduct.width) || 0;
        const largeLength = parseFloat(largeProduct.length) || 0;
        const largeQuantity = parseFloat(largeProduct.quantity) || 0;
        const mediumRowWidth = parseFloat(mediumProduct.rowWidth) || 0;
        const mediumShelfDepth = parseFloat(mediumProduct.shelfDepth) || 0;
        const mediumRows = parseFloat(mediumProduct.rows) || 0;
        const smallWidth = parseFloat(smallProduct.width) || 0;
        const smallLength = parseFloat(smallProduct.length) || 0;
        const smallBoxes = parseFloat(smallProduct.boxes) || 0;
        const costPerSqm = parseFloat(costPerSquareMeter) || 0;

        if (costPerSqm <= 0) {
            setProductStorageResult({ error: 'กรุณากรอกต้นทุนต่อตารางเมตร/เดือนให้ถูกต้อง' });
            return;
        }

        // Large product calculation
        const largeAreaPerItem = largeWidth * largeLength;
        const largeTotalArea = largeQuantity * largeAreaPerItem;
        const largeMonthlyCost = largeTotalArea * costPerSqm;

        // Medium product calculation
        const mediumAreaPerRow = mediumRowWidth * mediumShelfDepth;
        const mediumTotalArea = mediumAreaPerRow * mediumRows;
        const mediumMonthlyCost = mediumTotalArea * costPerSqm;

        // Small product calculation
        const smallAreaPerItem = smallWidth * smallLength;
        const smallTotalArea = smallBoxes * smallAreaPerItem;
        const smallMonthlyCost = smallTotalArea * costPerSqm;

        // Total cost
        const totalMonthlyCost = largeMonthlyCost + mediumMonthlyCost + smallMonthlyCost;

        setProductStorageResult({
            large: {
                areaPerItem: largeAreaPerItem,
                totalArea: largeTotalArea,
                monthlyCost: largeMonthlyCost
            },
            medium: {
                areaPerRow: mediumAreaPerRow,
                totalArea: mediumTotalArea,
                monthlyCost: mediumMonthlyCost
            },
            small: {
                areaPerItem: smallAreaPerItem,
                totalArea: smallTotalArea,
                monthlyCost: smallMonthlyCost
            },
            totalMonthlyCost: totalMonthlyCost,
            costPerSqm: costPerSqm
        });
    };

    // Reset product storage cost form
    const resetProductStorageCost = () => {
        setLargeProduct({ width: '', length: '', quantity: '' });
        setMediumProduct({ rowWidth: '', shelfDepth: '', rows: '' });
        setSmallProduct({ width: '', length: '', boxes: '' });
        setCostPerSquareMeter('');
        setProductStorageResult(null);
    };

    // Handle COGS input changes
    const handleCogsChange = (section, field, value) => {
        if (section === 'beginning') {
            setBeginningInventory(prev => ({ ...prev, [field]: value }));
        } else if (section === 'netPurchases') {
            setNetPurchases(prev => ({ ...prev, [field]: value }));
        } else if (section === 'ending') {
            setEndingInventory(prev => ({ ...prev, [field]: value }));
        }
    };

    // Calculate COGS and Average Cost
    const calculateCogs = () => {
        const beginningCost = parseFloat(beginningInventory.cost) || 0;
        const beginningQty = parseFloat(beginningInventory.quantity) || 0;
        const netPurchaseCost = parseFloat(netPurchases.cost) || 0;
        const netPurchaseQty = parseFloat(netPurchases.quantity) || 0;
        const endingCost = parseFloat(endingInventory.cost) || 0;
        const endingQty = parseFloat(endingInventory.quantity) || 0;

        // COGS calculation: (Beginning Inventory + Net Purchases) - Ending Inventory
        const totalCostOfGoodsAvailable = beginningCost + netPurchaseCost;
        const cogs = totalCostOfGoodsAvailable - endingCost;

        // Average Cost calculation: Total Cost / Total Quantity
        // ต้นทุนถัวเฉลี่ยต่อหน่วย = ต้นทุนรวม/จำนวนสินค้ารวม
        const totalQuantity = beginningQty + netPurchaseQty;  // จำนวนสินค้ารวม
        const totalCost = beginningCost + netPurchaseCost;    // ต้นทุนรวม (บาท)
        const averageCostPerUnit = totalQuantity > 0 ? totalCost / totalQuantity : 0;  // ต้นทุนถัวเฉลี่ยต่อหน่วย (บาท/หน่วย)

        // Average cost of ending inventory
        const endingInventoryCost = endingQty * averageCostPerUnit;

        setCogsResult({
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
                quantity: endingQty,
                calculatedCost: endingInventoryCost
            },
            totalCostOfGoodsAvailable: totalCostOfGoodsAvailable,
            cogs: cogs,
            totalQuantity: totalQuantity,
            totalCost: totalCost,
            averageCostPerUnit: averageCostPerUnit,
            // Raw data for saving
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
                cogs_per_unit: totalQuantity > 0 ? cogs / totalQuantity : 0
            }
        });
    };

    // Storage Cost Calculator Functions
    
    // Handle Storage Cost product selection
    const handleStorageCostProductSelect = (product) => {
        // Sync with all calculators via selectedProduct state
        setSelectedProduct(product);
        setSkuInput(product.sku);
        setUnitCost(product.cost_price || '');
        
        setShowProductModal(false);
    };
    
    return (
        <AuthenticatedLayout>
            <style>{hideSpinButtonsStyle}</style>
            <Head title="ตัวช่วยคำนวณ" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">ตัวช่วยคำนวณ</h1>
                                <p className="text-gray-600 mt-2">เครื่องมือช่วยในการคำนวณต่างๆ สำหรับการจัดการสินค้า</p>
                            </div>
                        </div>
                    </div>

                    {/* EOQ Calculator Card */}
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
                                                    onChange={async (e) => {
                                                        const sku = e.target.value;
                                                        setSkuInput(sku);
                                                        
                                                        if (!sku.trim()) {
                                                            setSelectedProduct(null);
                                                            return;
                                                        }
                                                        
                                                        try {
                                                            const response = await fetch('/admin/calculator/products?search=' + encodeURIComponent(sku));
                                                            const data = await response.json();
                                                            
                                                            if (data && Array.isArray(data) && data.length > 0) {
                                                                const found = data.find(p => p.sku && p.sku.toLowerCase() === sku.toLowerCase());
                                                                if (found) {
                                                                    // Set EOQ product
                                                                    setSelectedProduct(found);
                                                                    setUnitCost(found.cost_price || '');
                                                                    
                                                                    // Load EOQ data from database if exists
                                                                    if (found.eoq_calculation) {
                                                                        setDemand(found.eoq_calculation.annual_demand || '');
                                                                        setOrderingCost(found.eoq_calculation.ordering_cost || '');
                                                                        setUnitCost(found.eoq_calculation.unit_cost || found.cost_price || '');
                                                                        setHoldingRate(found.eoq_calculation.holding_rate || '');
                                                                        
                                                                        // Auto-calculate if all data present
                                                                        const D = parseFloat(found.eoq_calculation.annual_demand) || 0;
                                                                        const S = parseFloat(found.eoq_calculation.ordering_cost) || 0;
                                                                        const C = parseFloat(found.eoq_calculation.unit_cost) || parseFloat(found.cost_price) || 0;
                                                                        const h = parseFloat(found.eoq_calculation.holding_rate) || 0;
                                                                        
                                                                        if (D > 0 && S > 0 && C > 0 && h > 0) {
                                                                            setTimeout(() => {
                                                                                calculateEOQ_withData(
                                                                                    found.eoq_calculation.annual_demand,
                                                                                    found.eoq_calculation.ordering_cost,
                                                                                    found.eoq_calculation.unit_cost || found.cost_price,
                                                                                    found.eoq_calculation.holding_rate
                                                                                );
                                                                            }, 100);
                                                                        }
                                                                    }
                                                                    
                                                                    // Sync with ROP
                                                                    setRopSelectedProduct({
                                                                        id: found.id,
                                                                        name: found.name,
                                                                        sku: found.sku,
                                                                        cost_price: found.cost_price,
                                                                        quantity: found.quantity,
                                                                        image: found.image,
                                                                    });
                                                                    setRopSkuInput(found.sku);
                                                                    fetchProductForRop(found.sku);
                                                                    
                                                                    // Sync with COGS
                                                                    setCogsSelectedProduct({
                                                                        id: found.id,
                                                                        name: found.name,
                                                                        sku: found.sku,
                                                                        cost_price: found.cost_price,
                                                                        quantity: found.quantity,
                                                                        image: found.image,
                                                                    });
                                                                    setCogsSkuInput(found.sku);
                                                                    fetchProductForCogs(found.sku);
                                                                }
                                                            }
                                                        } catch (error) {
                                                            console.error('Error:', error);
                                                        }
                                                    }}
                                                    placeholder="กรอกรหัส SKU หรือคลิกเลือกสินค้า"
                                                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProductModalMode('eoq');
                                                        setShowProductModal(true);
                                                    }}
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
                                                        onClick={() => {
                                                            // Clear EOQ
                                                            setSelectedProduct(null);
                                                            setSkuInput('');
                                                            setDemand('');
                                                            setMonthlyQuantity('');
                                                            setOrderingCost('');
                                                            setUnitCost('');
                                                            setHoldingRate('');
                                                            setEoqResult(null);
                                                            
                                                            // Clear ROP
                                                            setRopSelectedProduct(null);
                                                            setRopSkuInput('');
                                                            setRopAnnualDemand('');
                                                            setRopLeadTime('');
                                                            setRopSafetyStock('');
                                                            setRopResult(null);
                                                            
                                                            // Clear COGS
                                                            setCogsSelectedProduct(null);
                                                            setCogsSkuInput('');
                                                            setBeginningInventory({ cost: '', quantity: '' });
                                                            setNetPurchases({ cost: '', quantity: '' });
                                                            setEndingInventory({ cost: '', quantity: '' });
                                                            setCogsResult(null);
                                                            
                                                            // Average Cost will be cleared via syncProduct
                                                        }}
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
                                                onClick={calculateEOQ}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition duration-200"
                                            >
                                                คำนวณ EOQ
                                            </button>
                                            <button
                                                onClick={resetEOQ}
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
                                        
                                        {eoqResult && !eoqResult.error ? (
                                            <div className="space-y-3">
                                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                                    <div className="text-center">
                                                        <p className="text-sm text-gray-600">ปริมาณการสั่งซื้อที่เหมาะสม (EOQ)</p>
                                                        <p className="text-2xl font-bold text-blue-600 mt-1">{eoqResult.eoq} หน่วย</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                                        <p className="text-xs text-gray-500">ความต้องการต่อปี</p>
                                                        <p className="font-medium">{eoqResult.annualDemand.toLocaleString()} หน่วย</p>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                                        <p className="text-xs text-gray-500">จำนวนครั้งการสั่งซื้อ</p>
                                                        <p className="font-medium">{eoqResult.numberOfOrders} ครั้ง/ปี</p>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                                        <p className="text-xs text-gray-500">ต้นทุนการเก็บรักษา/ปี</p>
                                                        <p className="font-medium">{eoqResult.holdingCost.toFixed(2)} บาท/หน่วย/ปี</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                                        <p className="text-xs text-gray-500">ต้นทุนรวมต่อปี</p>
                                                        <p className="font-medium">{parseFloat(eoqResult.totalCost).toLocaleString()} บาท</p>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                                        <p className="text-xs text-gray-500">ต้นทุนการเก็บรักษาต่อหน่วยต่อปี (H)</p>
                                                        <p className="font-medium">{eoqResult.holdingCost.toFixed(2)} บาท/หน่วย/ปี</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-xs text-gray-600 mt-3">
                                                    <p className="font-medium mb-1">สูตรที่ใช้:</p>
                                                    <p className="font-mono">EOQ = √((2 × D × S) / H)</p>
                                                    <p className="font-mono">H = h × C</p>
                                                    <p className="mt-1">D = {eoqResult.annualDemand.toLocaleString()}, S = {eoqResult.orderingCost}, H = {eoqResult.holdingCost.toFixed(2)}</p>
                                                </div>

                                                <button
                                                    onClick={saveEOQ}
                                                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                                    </svg>
                                                    บันทึกผลการคำนวณ
                                                </button>
                                            </div>
                                        ) : eoqResult && eoqResult.error ? (
                                            <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center">
                                                <p className="text-red-700">{eoqResult.error}</p>
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
                                    EOQ (Economic Order Quantity) คือ ปริมาณการสั่งซื้อที่เหมาะสมที่สุดที่ช่วยให้ต้นทุนรวม 
                                    ซึ่งประกอบด้วยต้นทุนการสั่งซื้อและต้นทุนการเก็บรักษา ต่ำที่สุด
                                </p>
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                                    <div className="bg-white p-3 rounded border">
                                        <p className="font-medium text-gray-900">D (Annual Demand)</p>
                                        <p className="text-gray-600">ความต้องการต่อปี</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                        <p className="font-medium text-gray-900">S (Ordering Cost)</p>
                                        <p className="text-gray-600">ต้นทุนการสั่งซื้อแต่ละครั้ง</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                        <p className="font-medium text-gray-900">C (Unit Cost)</p>
                                        <p className="text-gray-600">ราคาทุนต่อหน่วย</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                        <p className="font-medium text-gray-900">H (Holding Cost)</p>
                                        <p className="text-gray-600">ต้นทุนการเก็บรักษา </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ROP Calculator */}
                    <ROPCalculator 
                        onOpenProductModal={(mode) => { setProductModalMode(mode); setShowProductModal(true); }}
                        onShowNotification={(message, type) => showNotification(message, type)}
                        onProductSelect={handleProductSelect}
                        onClearProducts={() => {
                            // Clear EOQ
                            setSelectedProduct(null);
                            setSkuInput('');
                            setDemand('');
                            setMonthlyQuantity('');
                            setOrderingCost('');
                            setUnitCost('');
                            setHoldingRate('');
                            setEoqResult(null);
                            
                            // Clear ROP
                            setRopSelectedProduct(null);
                            setRopSkuInput('');
                            setRopAnnualDemand('');
                            setRopLeadTime('');
                            setRopSafetyStock('');
                            setRopResult(null);
                            
                            // Clear COGS
                            setCogsSelectedProduct(null);
                            setCogsSkuInput('');
                            setBeginningInventory({ cost: '', quantity: '' });
                            setNetPurchases({ cost: '', quantity: '' });
                            setEndingInventory({ cost: '', quantity: '' });
                            setCogsResult(null);
                            
                            // Average Cost will be cleared via syncProduct
                        }}
                        syncProduct={ropSelectedProduct}
                    />

                    {/* Cost Per Area Calculator */}
                    <CostPerAreaCalculator 
                        onShowNotification={(message, type) => showNotification(message, type)}
                    />

                    {/* COGS Calculator */}
                    <COGSCalculator 
                        onOpenProductModal={(mode) => { setProductModalMode(mode); setShowProductModal(true); }}
                        onShowNotification={(message, type) => showNotification(message, type)}
                        onProductSelect={(product) => {
                            // Sync with all calculators
                            if (product === null) {
                                // Clear EOQ
                                setSelectedProduct(null);
                                setSkuInput('');
                                setDemand('');
                                setMonthlyQuantity('');
                                setOrderingCost('');
                                setUnitCost('');
                                setHoldingRate('');
                                setEoqResult(null);
                                
                                // Clear ROP
                                setRopSelectedProduct(null);
                                setRopSkuInput('');
                                setRopAnnualDemand('');
                                setRopLeadTime('');
                                setRopSafetyStock('');
                                setRopResult(null);
                                
                                // Clear COGS
                                setCogsSelectedProduct(null);
                                setCogsSkuInput('');
                                setBeginningInventory({ cost: '', quantity: '' });
                                setNetPurchases({ cost: '', quantity: '' });
                                setEndingInventory({ cost: '', quantity: '' });
                                setCogsResult(null);
                                
                                // Average Cost will be cleared via syncProduct
                            } else {
                                setSelectedProduct(product);
                                setSkuInput(product.sku);
                                setUnitCost(product.cost_price || '');
                            }
                        }}
                        onClearProducts={() => {
                            // Clear EOQ
                            setSelectedProduct(null);
                            setSkuInput('');
                            setDemand('');
                            setMonthlyQuantity('');
                            setOrderingCost('');
                            setUnitCost('');
                            setHoldingRate('');
                            setEoqResult(null);
                            
                            // Clear ROP
                            setRopSelectedProduct(null);
                            setRopSkuInput('');
                            setRopAnnualDemand('');
                            setRopLeadTime('');
                            setRopSafetyStock('');
                            setRopResult(null);
                            
                            // Clear COGS
                            setCogsSelectedProduct(null);
                            setCogsSkuInput('');
                            setBeginningInventory({ cost: '', quantity: '' });
                            setNetPurchases({ cost: '', quantity: '' });
                            setEndingInventory({ cost: '', quantity: '' });
                            setCogsResult(null);
                            
                            // Average Cost will be cleared via syncProduct
                        }}
                        syncProduct={selectedProduct}
                    />

                    {/* Average Cost Calculator */}
                    <AverageCostCalculator 
                        onOpenProductModal={(mode) => { setProductModalMode(mode); setShowProductModal(true); }}
                        onShowNotification={(message, type) => showNotification(message, type)}
                        onProductSelect={(product) => {
                            // Sync with all calculators
                            if (product === null) {
                                // Clear EOQ
                                setSelectedProduct(null);
                                setSkuInput('');
                                setDemand('');
                                setMonthlyQuantity('');
                                setOrderingCost('');
                                setUnitCost('');
                                setHoldingRate('');
                                setEoqResult(null);
                                
                                // Clear ROP
                                setRopSelectedProduct(null);
                                setRopSkuInput('');
                                setRopAnnualDemand('');
                                setRopLeadTime('');
                                setRopSafetyStock('');
                                setRopResult(null);
                                
                                // Clear COGS
                                setCogsSelectedProduct(null);
                                setCogsSkuInput('');
                                setBeginningInventory({ cost: '', quantity: '' });
                                setNetPurchases({ cost: '', quantity: '' });
                                setEndingInventory({ cost: '', quantity: '' });
                                setCogsResult(null);
                                
                                // Average Cost will be cleared via syncProduct
                            } else {
                                setSelectedProduct(product);
                                setSkuInput(product.sku);
                                setUnitCost(product.cost_price || '');
                            }
                        }}
                        onClearProducts={() => {
                            // Clear EOQ
                            setSelectedProduct(null);
                            setSkuInput('');
                            setDemand('');
                            setMonthlyQuantity('');
                            setOrderingCost('');
                            setUnitCost('');
                            setHoldingRate('');
                            setEoqResult(null);
                            
                            // Clear ROP
                            setRopSelectedProduct(null);
                            setRopSkuInput('');
                            setRopAnnualDemand('');
                            setRopLeadTime('');
                            setRopSafetyStock('');
                            setRopResult(null);
                            
                            // Clear COGS
                            setCogsSelectedProduct(null);
                            setCogsSkuInput('');
                            setBeginningInventory({ cost: '', quantity: '' });
                            setNetPurchases({ cost: '', quantity: '' });
                            setEndingInventory({ cost: '', quantity: '' });
                            setCogsResult(null);
                            
                            // Average Cost will be cleared via syncProduct
                        }}
                        syncProduct={selectedProduct}
                    />

                {/* Storage Cost Calculator */}
                <StorageCostCalculator 
                    onOpenProductModal={(mode) => { setProductModalMode(mode); setShowProductModal(true); }}
                    onShowNotification={(message, type) => showNotification(message, type)}
                    onProductSelect={handleProductSelect}
                    onClearProducts={() => {
                        // Clear EOQ
                        setSelectedProduct(null);
                        setSkuInput('');
                        setDemand('');
                        setMonthlyQuantity('');
                        setOrderingCost('');
                        setUnitCost('');
                        setHoldingRate('');
                        setEoqResult(null);
                        
                        // Clear ROP
                        setRopSelectedProduct(null);
                        setRopSkuInput('');
                        setRopAnnualDemand('');
                        setRopLeadTime('');
                        setRopSafetyStock('');
                        setRopResult(null);
                        
                        // Clear COGS
                        setCogsSelectedProduct(null);
                        setCogsSkuInput('');
                        setBeginningInventory({ cost: '', quantity: '' });
                        setNetPurchases({ cost: '', quantity: '' });
                        setEndingInventory({ cost: '', quantity: '' });
                        setCogsResult(null);
                        
                        // Storage Cost will be cleared via syncProduct
                    }}
                    syncProduct={selectedProduct}
                />

                </div>
            </div>

            {/* Product Selector Modal */}
        <ProductSelectorModal
                show={showProductModal}
                onClose={() => setShowProductModal(false)}
                onSelectProduct={
                    productModalMode === 'cogs' ? handleCogsProductSelect : 
                    productModalMode === 'rop' ? handleRopProductSelect : 
                    productModalMode === 'storageCost' ? handleStorageCostProductSelect :
                    handleProductSelect
                }
            />

            {/* Saved Calculations Modal */}
            {showSavedCalculations && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">ข้อมูลที่บันทึกไว้</h3>
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
                            {savedCalculations.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">ไม่มีข้อมูลที่บันทึกไว้</p>
                            ) : (
                                <div className="space-y-3">
                                    {savedCalculations.map((calc) => (
                                        <div
                                            key={calc.id}
                                            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
                                            onClick={() => loadCalculation(calc)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {calc.calculation_name || `คำนวณ #${calc.id}`}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(calc.created_at).toLocaleDateString('th-TH')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">
                                                        {parseFloat(calc.cost_per_square_meter).toFixed(2)} บาท/ตร.ม.
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {calc.store_size} ตร.ม.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowSavedCalculations(false)}
                                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2.5 rounded-lg transition duration-200"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Saved COGS Calculations Modal */}
            {showSavedCogsCalculations && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">ข้อมูล COGS ที่บันทึกไว้</h3>
                            <button
                                onClick={() => setShowSavedCogsCalculations(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {savedCogsCalculations.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">ไม่มีข้อมูล COGS ที่บันทึกไว้</p>
                            ) : (
                                <div className="space-y-3">
                                    {savedCogsCalculations.map((calc) => (
                                        <div
                                            key={calc.id}
                                            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
                                            onClick={() => loadCogsCalculation(calc)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {calc.product_name || `SKU: ${calc.sku}` || `คำนวณ #${calc.id}`}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        COGS: {parseFloat(calc.cogs).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        บันทึกเมื่อ: {new Date(calc.created_at).toLocaleDateString('th-TH')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">
                                                        ต้นทุนเฉลี่ย: {parseFloat(calc.average_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        ต้นงวด: {parseFloat(calc.beginning_inventory_cost).toLocaleString()} | ซื้อ: {parseFloat(calc.net_purchases_cost).toLocaleString()} | ปลายงวด: {parseFloat(calc.ending_inventory_cost).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowSavedCogsCalculations(false)}
                                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2.5 rounded-lg transition duration-200"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
