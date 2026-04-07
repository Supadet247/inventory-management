import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import POSLayout from '@/Layouts/POSLayout';
import {
  BarChart3,
  Check,
  FileText,
  Receipt,
  X,
  History,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  Printer
} from 'lucide-react';

// Import Components
import ModernPaymentTaxSystem from '@/Components/POS/ModernPaymentTaxSystem';
import TaxInvoiceForm from '@/Components/POS/TaxInvoiceForm';
import TaxInvoicePrintPage from '@/Components/POS/TaxInvoicePrintPage';
import ReturnSection from '@/Components/POS/ReturnSection';
import SimplifiedTaxInvoicePrintPage from '@/Components/POS/SimplifiedTaxInvoicePrintPage';
import ReceiptModal from '@/Components/POS/ReceiptModal';

// Format number with commas and 2 decimal places
const formatMoney = (amount) => {
  if (amount === undefined || amount === null) return '0.00';
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function Index({ auth, products: initialProducts = [], recent_returns = [] }) {
  const page = usePage();
  const [cartItems, setCartItems] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showReceipt, setShowReceipt] = useState(false);
  const [salesHistory, setSalesHistory] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesPage, setSalesPage] = useState(1);
  const [searchReceiptNumber, setSearchReceiptNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState('all'); // 'all' or 'search'
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSaleDetail, setShowSaleDetail] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [products, setProducts] = useState(initialProducts);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const [cartSearchQuery, setCartSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [showModernPayment, setShowModernPayment] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [printedReceiptData, setPrintedReceiptData] = useState(null);
  const [showTaxForm, setShowTaxForm] = useState(false);
  const [taxInvoiceData, setTaxInvoiceData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [simplifiedInvoiceData, setSimplifiedInvoiceData] = useState(null);
  const [showSimplifiedInvoice, setShowSimplifiedInvoice] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [addedProductId, setAddedProductId] = useState(null);

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amt);

  const itemsPerPage = 16;
  const cartItemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [cartPage, setCartPage] = useState(1);

  const getAvailableCategories = () => {
    const categories = [...new Set(products.map(p => (p.category || 'อื่นๆ').trim()))];
    return ['ทั้งหมด', ...categories.filter(cat => cat).sort()];
  };

  const filteredProducts = products.filter(p => {
    const productCategory = (p.category || 'อื่นๆ').trim();
    const searchCategory = selectedCategory.trim();
    const categoryMatch = searchCategory === 'ทั้งหมด' || productCategory === searchCategory;
    const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return categoryMatch && nameMatch;
  });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedCartItems = cartItems.slice(
    (cartPage - 1) * cartItemsPerPage,
    cartPage * cartItemsPerPage
  );

  const addToCart = (product) => {
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 300);
    
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1, unit: 'ชิ้น' }]);
    }
  };

  const updateQuantity = (id, change) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const filteredCartItems = cartItems.filter(item =>
    item.name.toLowerCase().includes(cartSearchQuery.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(cartSearchQuery.toLowerCase()))
  );

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePaymentClick = () => {
    setIsPaymentLoading(true);
    setTimeout(() => {
      setShowModernPayment(true);
      setIsPaymentLoading(false);
    }, 300);
  };

  const clearCart = () => {
    setCartItems([]);
    setCartPage(1);
    setCartSearchQuery('');
    setReceivedAmount('');
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      const query = searchQuery.trim().toLowerCase();
      const matchedProduct = products.find(p =>
        p.name.toLowerCase().includes(query) || 
        (p.sku && p.sku.toLowerCase().includes(query))
      );
      if (matchedProduct) {
        addToCart(matchedProduct);
        setSearchQuery('');
      } else {
        alert('ไม่พบสินค้า: ' + searchQuery);
      }
    }
  };

  useEffect(() => {
    if (activeSection === 'dashboard') {
      searchInputRef.current?.focus();
    }
  }, [activeSection]);

  useEffect(() => {
    if (!initialProducts || initialProducts.length === 0) {
      const fallbackProducts = [
        { id: 1, name: 'น้ำมันเครื่อง Mobil Super 4T', category: 'น้ำมัน/จาระบี', price: 180, image_url: '/images/default.png', sku: 'AG001', unit: 'ขวด', quantity: 50 },
        { id: 2, name: 'หัวเทียน NGK CR7HSA', category: 'อะไหล่', price: 90, image_url: '/images/default.png', sku: 'AG002', unit: 'หัว', quantity: 30 },
      ];
      setProducts(fallbackProducts);
    }
  }, [initialProducts]);

  useEffect(() => {
    if (page.props.sale_success && page.props.sale_data) {
      setLastReceipt(prev => {
        if (prev && page.props.sale_data.receipt_number) {
          return {
            ...prev,
            receipt_number: page.props.sale_data.receipt_number,
            id: page.props.sale_data.receipt_id,
            sale_id: page.props.sale_data.sale_id
          };
        }
        return prev;
      });
      setPrintedReceiptData(prev => {
        if (prev && page.props.sale_data.receipt_number) {
          return {
            ...prev,
            receipt_number: page.props.sale_data.receipt_number,
            id: page.props.sale_data.receipt_id,
            sale_id: page.props.sale_data.sale_id
          };
        }
        return prev;
      });
      setShowSuccessPopup(true);
      clearCart();
    }
    
    if (page.props.errors?.sale_error) {
      alert('❌ เกิดข้อผิดพลาด: ' + page.props.errors.sale_error);
    }
  }, [page.props.sale_success, page.props.sale_data, page.props.errors]);

  useEffect(() => {
    if (activeSection === 'history' && !salesHistory) {
      setLoadingSales(true);
      fetch(route('pos.sales.index'), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
        .then(res => res.json())
        .then(data => {
          setSalesHistory(data);
          setLoadingSales(false);
        })
        .catch(err => {
          console.error('Error loading sales:', err);
          setLoadingSales(false);
        });
    }
  }, [activeSection]);

  const handleSearchReceipt = () => {
    if (!searchReceiptNumber.trim()) {
      alert('กรุณากรอกเลขที่ใบเสร็จ');
      return;
    }

    setIsSearching(true);
    fetch(`${route('pos.sales.index')}?receipt_number=${searchReceiptNumber}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(res => res.json())
      .then(data => {
        setSalesHistory(data);
        setIsSearching(false);
        if (!data.sales || data.sales.data.length === 0) {
          alert('ไม่พบใบเสร็จที่ค้นหา');
        }
      })
      .catch(err => {
        console.error('Error searching receipt:', err);
        setIsSearching(false);
        alert('เกิดข้อผิดพลาดในการค้นหา');
      });
  };

  const refreshProducts = async () => {
    router.get(route('pos.index'), {}, { 
      preserveState: false,
      only: ['products']
    });
  };

  const recordSaleToAPI = async (cartItems, totalAmount, paymentMethod, receivedAmount, installmentData = null) => {
    try {
      return new Promise((resolve, reject) => {
        router.post(route('pos.sales.store'), {
          items: cartItems.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          total: totalAmount,
          payment_method: paymentMethod,
          received_amount: receivedAmount,
          installment_data: installmentData
        }, {
          onSuccess: (page) => {
            if (page.props.sale_success && page.props.sale_data) {
              setCartItems([]);
              setCartPage(1);
              setCartSearchQuery('');
              setReceivedAmount('');

              resolve(true);
            } else {
              reject(new Error('ไม่สามารถบันทึกการขายได้'));
            }
          },
          onError: (errors) => {
            let errorMessage = errors.sale_error || Object.values(errors)[0] || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
            alert('❌ เกิดข้อผิดพลาด: ' + errorMessage);
            reject(new Error(errorMessage));
          },
          preserveState: true,
          preserveScroll: true
        });
      });
    } catch (error) {
      alert('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      return false;
    }
  };

  const handleModernPaymentFinish = async (receiptData) => {
    const finalReceipt = {
      ...receiptData,
      seller: auth.user.name,
      receipt_number: generateReceiptNumber()
    };
    
    setLastReceipt(finalReceipt);
    setShowReceipt(true);
    
    try {
      const success = await recordSaleToAPI(
        cartItems, 
        receiptData.total, 
        receiptData.paymentMethod, 
        receiptData.received,
        receiptData.paymentMethod === 'installment' ? {
          customerName: receiptData.received?.customerName,
          customerPhone: receiptData.received?.customerPhone,
          idCardNumber: receiptData.received?.idCardNumber,
          downPaymentPercent: receiptData.received?.downPaymentPercent?.toString(),
          installmentCount: receiptData.received?.installmentCount?.toString(),
          installmentAmount: receiptData.received?.installmentAmount,
          installmentStartDate: receiptData.received?.installmentStartDate
        } : null
      );
      
      if (success) {
        clearCart();
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
    }
  };

  const generateReceiptNumber = () => {
    const now = new Date();
    const dateStr = now.getFullYear().toString() + 
                   (now.getMonth() + 1).toString().padStart(2, '0') + 
                   now.getDate().toString().padStart(2, '0');
    const timeStr = now.getHours().toString().padStart(2, '0') + 
                   now.getMinutes().toString().padStart(2, '0') + 
                   now.getSeconds().toString().padStart(2, '0');
    return dateStr + timeStr;
  };

  const generateReceipt = async () => {
    if (cartItems.length === 0) return;

    const total = getTotalAmount();
    const tax = parseFloat((total * 0.07).toFixed(2));
    const grandTotal = parseFloat((total + tax).toFixed(2));

    const receiptData = {
      id: Date.now(),
      receipt_number: generateReceiptNumber(),
      date: new Date().toLocaleString('th-TH'),
      items: [...cartItems],
      total,
      tax,
      grandTotal,
      paymentMethod,
      received: paymentMethod === 'cash' ? parseFloat(receivedAmount || 0) : null,
      seller: auth.user.name
    };

    setLastReceipt(receiptData);
    setShowReceipt(true);
    setReceivedAmount('');

    try {
      await recordSaleToAPI(cartItems, total, paymentMethod, receivedAmount);
    } catch (error) {
      console.error('Receipt generation failed:', error);
    }
  };

  const menuItems = [
    { id: 'dashboard', name: 'ขายสินค้า', icon: BarChart3 },
    { id: 'return', name: 'คืนสินค้า', icon: FileText },
    { id: 'history', name: 'ประวัติการขาย', icon: History }
  ];

  return (
    <div>
      <Head title="ระบบขายหน้าร้าน (POS)" />

      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 text-white flex flex-col">
          <div className="p-6 bg-slate-700">
            <a 
              href="http://127.0.0.1:8000" 
              className="block hover:text-blue-300 transition-colors"
            >
              <h1 className="text-xl font-bold">สมบัติเกษตรยนต์</h1>
            </a>
            <p className="text-sm text-gray-300 mt-1">ผู้ใช้งาน: {auth.user.name}</p>
          </div>

          <nav className="flex-1 p-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded ${
                    activeSection === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  <IconComponent className="mr-3" size={20} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        {activeSection === 'dashboard' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {/* Products Section */}
              <div className="col-span-2">
                <h2 className="text-xl font-bold mb-2">สินค้า</h2>
                <div className="flex gap-2 mb-4">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="ค้นหาสินค้า..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded"
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded"
                  >
                    {getAvailableCategories().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {paginatedProducts.map(product => (
                    <div 
                      key={product.id} 
                      onClick={() => addToCart(product)} 
                      className={`bg-white p-3 shadow rounded cursor-pointer hover:shadow-md transition-all duration-200 ${
                        addedProductId === product.id ? 'product-card-click' : ''
                      }`}
                    >
                      <img 
                        src={product.image_url || '/images/default-product.png'} 
                        alt={product.name} 
                        className="w-40 h-40 mx-auto object-contain" 
                      />
                      <div className="text-center text-sm font-semibold mt-2">{product.name}</div>
                      <div className="text-center text-xs text-gray-500">{product.sku}</div>
                      <div className="text-center text-red-500 font-bold mt-1">
                        ฿{formatMoney(product.price)}
                      </div>
                      {product.quantity !== undefined && (
                        <div className="text-center text-xs text-gray-400">
                          คงเหลือ: {product.quantity}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                <div className="flex justify-center mt-8 mb-8 gap-2">
                  {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }, (_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setCurrentPage(i + 1)} 
                      className={`px-3 py-1 rounded ${
                        currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart Section */}
              <div>
                <h2 className="text-xl font-bold mb-2">ตะกร้าสินค้า</h2>
                <div className="bg-white p-4 rounded shadow h-[60vh] overflow-y-auto space-y-3">
                  <input
                    type="text"
                    placeholder="ค้นหาในตะกร้า..."
                    value={cartSearchQuery}
                    onChange={(e) => setCartSearchQuery(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded mb-3"
                  />
                  
                  {filteredCartItems.slice((cartPage - 1) * cartItemsPerPage, cartPage * cartItemsPerPage).map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-2 animate-slide-up">
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.quantity} × ฿{formatMoney(item.price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)} 
                          className="px-2 bg-red-500 text-white rounded"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)} 
                          className="px-2 bg-green-500 text-white rounded"
                        >
                          +
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="text-xs text-red-600 ml-1"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {cartItems.length > cartItemsPerPage && (
                    <div className="flex justify-center gap-2 pt-2">
                      {Array.from({ length: Math.ceil(cartItems.length / cartItemsPerPage) }, (_, i) => (
                        <button 
                          key={i} 
                          onClick={() => setCartPage(i + 1)} 
                          className={`px-2 py-1 text-xs rounded ${
                            cartPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {cartItems.length > 0 && (
                    <div className="pt-3 border-t mt-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>ยอดรวม:</span>
                          <span>฿{formatMoney(getTotalAmount())}</span>
                        </div>
                        <div className="flex justify-between font-bold text-red-600">
                          <span>รวมทั้งสิ้น (+ VAT 7%):</span>
                          <span>฿{formatMoney(getTotalAmount() * 1.07)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePaymentClick}
                    disabled={isPaymentLoading || cartItems.length === 0}
                    className={`w-full py-2 rounded font-semibold transition-all duration-200 ${
                      isPaymentLoading 
                        ? 'btn-loading shimmer-button' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } ${cartItems.length === 0 ? 'disabled:bg-gray-400 disabled:cursor-not-allowed' : ''}`}
                  >
                    {isPaymentLoading ? 'กำลังผนวก...' : `เช็คบิล / ชำระเงิน (${cartItems.length} รายการ)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'return' && (
          <ReturnSection currentUser={auth.user} initialRecentReturns={recent_returns} />
        )}

        {activeSection === 'history' && (
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <div className="w-full max-w-screen-xl mx-auto">
              {/* Header - สไตล์ระบบคืนสินค้า */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-blue-600 mb-2 flex items-center gap-2">
                    <History className="text-blue-600" size={28} />
                    ประวัติการขาย
                  </h1>
                  <p className="text-gray-600">ดูรายละเอียดการขายทั้งหมด</p>
                </div>
              </div>

              {/* Tabs - สไตล์ระบบคืนสินค้า */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => {
                    setActiveHistoryTab('all');
                    setSearchReceiptNumber('');
                    if (salesHistory) {
                      setLoadingSales(true);
                      fetch(route('pos.sales.index'), {
                        headers: {
                          'Accept': 'application/json',
                          'Content-Type': 'application/json',
                          'X-Requested-With': 'XMLHttpRequest'
                        }
                      })
                        .then(res => res.json())
                        .then(data => {
                          setSalesHistory(data);
                          setLoadingSales(false);
                        })
                        .catch(err => {
                          console.error('Error loading sales:', err);
                          setLoadingSales(false);
                        });
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeHistoryTab === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setActiveHistoryTab('search')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeHistoryTab === 'search'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ค้นหาใบเสร็จ
                </button>
              </div>

              {/* Search Section */}
              {activeHistoryTab === 'search' && (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Search className="text-blue-600" size={20} />
                    ค้นหาใบเสร็จ
                  </h2>
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={searchReceiptNumber}
                        onChange={(e) => setSearchReceiptNumber(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchReceipt()}
                        placeholder="กรอกเลขที่ใบเสร็จ (เช่น 20250831001)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleSearchReceipt}
                      disabled={isSearching || !searchReceiptNumber.trim()}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSearching ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          ค้นหา...
                        </>
                      ) : (
                        <>
                          <Search size={16} />
                          ค้นหา
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 mt-2">
                    ตัวอย่างเลขที่ใบเสร็จ: 20250831001, 20250831002
                  </p>
                </div>
              )}

              {loadingSales ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                  </div>
                </div>
              ) : salesHistory ? (
                <>
                  {/* Stats Dashboard - สไตล์ระบบคืนสินค้า */}
                  {salesHistory.summary_stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-600 text-sm font-medium">ยอดขายรวม</p>
                            <p className="text-gray-900 text-2xl font-bold">
                              ฿{parseFloat(salesHistory.summary_stats.total_amount || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <DollarSign className="text-blue-600" size={24} />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-600 text-sm font-medium">จำนวนบิล</p>
                            <p className="text-green-600 text-2xl font-bold">
                              {salesHistory.summary_stats.total_transactions || 0}
                            </p>
                          </div>
                          <div className="bg-green-100 p-2 rounded-lg">
                            <ShoppingBag className="text-green-600" size={24} />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-600 text-sm font-medium">ยอดเฉลี่ย</p>
                            <p className="text-purple-600 text-2xl font-bold">
                              ฿{parseFloat(salesHistory.summary_stats.average_amount || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <TrendingUp className="text-purple-600" size={24} />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-600 text-sm font-medium">ภาษีรวม</p>
                            <p className="text-orange-600 text-2xl font-bold">
                              ฿{parseFloat(salesHistory.summary_stats.total_tax || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <Receipt className="text-orange-600" size={24} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sales List - สไตล์ระบบคืนสินค้า */}
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="divide-y divide-gray-200">
                      {salesHistory.sales.data && salesHistory.sales.data.length > 0 ? (
                        salesHistory.sales.data.map((sale) => (
                          <div key={sale.id} className="p-6 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {sale.receipt?.receipt_number || `SALE-${sale.id}`}
                                  </h4>
                                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                    sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                                    sale.payment_method === 'transfer' ? 'bg-blue-100 text-blue-800' :
                                    sale.payment_method === 'qrcode' ? 'bg-purple-100 text-purple-800' :
                                    sale.payment_method === 'installment' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {sale.payment_method === 'cash' ? 'เงินสด' :
                                     sale.payment_method === 'transfer' ? 'โอนเงิน' :
                                     sale.payment_method === 'qrcode' ? 'QR Code' :
                                     sale.payment_method === 'installment' ? 'ผ่อนชำระ' : sale.payment_method}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-4">
                                    <span>วันที่: {new Date(sale.sale_date).toLocaleDateString('th-TH', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</span>
                                    <span>ผู้ขาย: {sale.user?.name || '-'}</span>
                                  </div>
                                  <p>
                                    ยอดรวม: <span className="font-medium text-blue-600">฿{parseFloat(sale.grand_total).toLocaleString()}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedSale(sale);
                                    setShowSaleDetail(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                >
                                  <Eye size={16} />
                                  ดูรายละเอียด
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <FileText className="mx-auto text-gray-400 mb-4" size={32} />
                          <p className="text-gray-500">ยังไม่มีรายการขาย</p>
                        </div>
                      )}
                    </div>

                    {/* Pagination - สไตล์ระบบคืนสินค้า */}
                    {salesHistory.sales.data && salesHistory.sales.data.length > 0 && salesHistory.sales.last_page > 1 && (
                      <div className="bg-gray-50 border-t px-6 py-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            แสดง {salesHistory.sales.from || 0} - {salesHistory.sales.to || 0} จาก {salesHistory.sales.total || 0} รายการ
                          </div>
                          
                          {/* Pagination Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (salesPage > 1) {
                                  const newPage = salesPage - 1;
                                  setSalesPage(newPage);
                                  setLoadingSales(true);
                                  fetch(`${route('pos.sales.index')}?page=${newPage}`, {
                                    headers: {
                                      'Accept': 'application/json',
                                      'Content-Type': 'application/json',
                                      'X-Requested-With': 'XMLHttpRequest'
                                    }
                                  })
                                    .then(res => res.json())
                                    .then(data => {
                                      setSalesHistory(data);
                                      setLoadingSales(false);
                                    })
                                    .catch(err => {
                                      console.error('Error loading sales:', err);
                                      setLoadingSales(false);
                                    });
                                }
                              }}
                              disabled={salesPage === 1}
                              className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 ${
                                salesPage === 1
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <ChevronLeft size={16} />
                              ก่อนหน้า
                            </button>
                            
                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                              {Array.from({ length: salesHistory.sales.last_page }, (_, index) => {
                                const pageNum = index + 1;
                                const isCurrentPage = pageNum === salesPage;
                                
                                // Show first page, last page, current page, and pages around current
                                const showPage = pageNum === 1 || pageNum === salesHistory.sales.last_page || 
                                               Math.abs(pageNum - salesPage) <= 1;
                                
                                if (!showPage) {
                                  // Show ellipsis for gaps
                                  if (pageNum === 2 && salesPage > 4) {
                                    return (
                                      <span key={pageNum} className="px-2 text-gray-400 text-sm">
                                        ...
                                      </span>
                                    );
                                  }
                                  if (pageNum === salesHistory.sales.last_page - 1 && salesPage < salesHistory.sales.last_page - 3) {
                                    return (
                                      <span key={pageNum} className="px-2 text-gray-400 text-sm">
                                        ...
                                      </span>
                                    );
                                  }
                                  return null;
                                }
                                
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => {
                                      setSalesPage(pageNum);
                                      setLoadingSales(true);
                                      fetch(`${route('pos.sales.index')}?page=${pageNum}`, {
                                        headers: {
                                          'Accept': 'application/json',
                                          'Content-Type': 'application/json',
                                          'X-Requested-With': 'XMLHttpRequest'
                                        }
                                      })
                                        .then(res => res.json())
                                        .then(data => {
                                          setSalesHistory(data);
                                          setLoadingSales(false);
                                        })
                                        .catch(err => {
                                          console.error('Error loading sales:', err);
                                          setLoadingSales(false);
                                        });
                                    }}
                                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                                      isCurrentPage
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <button
                              onClick={() => {
                                if (salesPage < salesHistory.sales.last_page) {
                                  const newPage = salesPage + 1;
                                  setSalesPage(newPage);
                                  setLoadingSales(true);
                                  fetch(`${route('pos.sales.index')}?page=${newPage}`, {
                                    headers: {
                                      'Accept': 'application/json',
                                      'Content-Type': 'application/json',
                                      'X-Requested-With': 'XMLHttpRequest'
                                    }
                                  })
                                    .then(res => res.json())
                                    .then(data => {
                                      setSalesHistory(data);
                                      setLoadingSales(false);
                                    })
                                    .catch(err => {
                                      console.error('Error loading sales:', err);
                                      setLoadingSales(false);
                                    });
                                }
                              }}
                              disabled={salesPage === salesHistory.sales.last_page}
                              className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 ${
                                salesPage === salesHistory.sales.last_page
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              ถัดไป
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModernPayment && (
        <ModernPaymentTaxSystem
          totalAmount={getTotalAmount()}
          cartItems={cartItems}
          onClose={() => setShowModernPayment(false)}
          onFinish={handleModernPaymentFinish}
        />
      )}

      {/* Receipt Modal - New Component */}
      {showReceipt && lastReceipt && (
        <ReceiptModal
          receipt={lastReceipt}
          onPrint={() => {
            window.print();
            setTimeout(() => {
              setPrintedReceiptData(lastReceipt);
              setShowReceipt(false);
              setShowSuccessPopup(true);
            }, 500);
          }}
          onClose={() => {
            setShowReceipt(false);
            clearCart();
            setTimeout(() => refreshProducts(), 500);
          }}
        />
      )}

      {/* Success Popup */}
      {showSuccessPopup && printedReceiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500 rounded-full w-14 h-14 flex items-center justify-center">
                <Check className="w-7 h-7 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ชำระเงินสำเร็จ!</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 text-2xl font-bold">
                {formatCurrency(printedReceiptData.grandTotal)}
              </p>
              <p className="text-sm text-green-600">หมายเลขรายการ: {printedReceiptData.receipt_number}</p>
            </div>

            <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-800">ต้องการใบกำกับภาษีหรือไม่?</h3>
            <p className="text-gray-600 text-sm mb-4">สามารถใช้หักลดหย่อนภาษีได้</p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  setShowTaxForm(true);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg"
              >
                <div className="flex justify-center items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  <span>ต้องการใบกำกับภาษีแบบเต็ม</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  setSimplifiedInvoiceData(printedReceiptData);
                  setShowSimplifiedInvoice(true);
                  setTimeout(() => window.print(), 500);
                }}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 shadow-lg"
              >
                <div className="flex justify-center items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  <span>พิมพ์ใบกำกับภาษีแบบย่อ</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  clearCart();
                  setTimeout(() => refreshProducts(), 500);
                }}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 shadow-lg"
              >
                <div className="flex justify-center items-center gap-2">
                  <X className="w-5 h-5" />
                  <span>ไม่ต้องการใบกำกับภาษี</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Form */}
      {showTaxForm && (
        <TaxInvoiceForm
          onCancel={() => setShowTaxForm(false)}
          onConfirm={(data) => {
            setTaxInvoiceData({ customer: data, receipt: printedReceiptData });
            setShowTaxForm(false);
          }}
        />
      )}

      {/* Tax Invoice Print Page */}
      {taxInvoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center print:bg-transparent print:block">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl mx-auto print:w-full print:p-0 print:rounded-none print:shadow-none">
            <TaxInvoicePrintPage
              receipt={taxInvoiceData.receipt}
              taxInfo={taxInvoiceData.customer}
            />
            <div className="mt-4 flex justify-center gap-4 no-print">
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                🖨 พิมพ์ใบกำกับภาษี
              </button>
              <button
                onClick={() => {
                  setTaxInvoiceData(null);
                  clearCart();
                  setTimeout(() => refreshProducts(), 500);
                }}
                className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
              >
                ❌ ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Invoice */}
      {showSimplifiedInvoice && simplifiedInvoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center print:bg-transparent print:block">
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-auto print:w-full print:p-0 print:rounded-none print:shadow-none">
            <SimplifiedTaxInvoicePrintPage receipt={simplifiedInvoiceData} />
            <div className="mt-4 flex justify-center gap-4 no-print">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                🖨 พิมพ์ซ้ำ
              </button>
              <button
                onClick={() => {
                  setShowSimplifiedInvoice(false);
                  clearCart();
                  setTimeout(() => refreshProducts(), 500);
                }}
                className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
              >
                ❌ ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Detail Modal */}
      {showSaleDetail && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">รายละเอียดการขาย</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    เลขที่: {selectedSale.receipt?.receipt_number || `SALE-${selectedSale.id}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSaleDetail(false);
                    setSelectedSale(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Sale Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">วันที่ขาย</p>
                    <p className="font-medium">
                      {new Date(selectedSale.sale_date).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ผู้ขาย</p>
                    <p className="font-medium">{selectedSale.user?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ช่องทางชำระ</p>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      selectedSale.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                      selectedSale.payment_method === 'transfer' ? 'bg-blue-100 text-blue-800' :
                      selectedSale.payment_method === 'qrcode' ? 'bg-purple-100 text-purple-800' :
                      selectedSale.payment_method === 'installment' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSale.payment_method === 'cash' ? 'เงินสด' :
                       selectedSale.payment_method === 'transfer' ? 'โอนเงิน' :
                       selectedSale.payment_method === 'qrcode' ? 'QR Code' :
                       selectedSale.payment_method === 'installment' ? 'ผ่อนชำระ' : selectedSale.payment_method}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">รายการสินค้า</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">สินค้า</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">จำนวน</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">ราคา/หน่วย</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">รวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedSale.sale_items && selectedSale.sale_items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900">{item.product?.name || item.product_name}</div>
                            <div className="text-xs text-gray-500">SKU: {item.product?.sku || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">฿{parseFloat(item.unit_price).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">฿{parseFloat(item.total_price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ยอดรวมสินค้า:</span>
                  <span className="font-medium">฿{parseFloat(selectedSale.total_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT 7%:</span>
                  <span className="font-medium">฿{parseFloat(selectedSale.tax_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>ยอดรวมทั้งสิ้น:</span>
                  <span className="text-blue-600">฿{parseFloat(selectedSale.grand_total).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    if (selectedSale.sale_items && selectedSale.sale_items.length > 0) {
                      const receiptData = {
                        receipt_number: selectedSale.receipt?.receipt_number || `SALE-${selectedSale.id}`,
                        date: new Date(selectedSale.sale_date).toLocaleString('th-TH', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }),
                        seller: selectedSale.user?.name || '-',
                        paymentMethod: selectedSale.payment_method,
                        items: selectedSale.sale_items.map(item => ({
                          id: item.id,
                          name: item.product?.name || item.product_name || 'Unknown',
                          quantity: item.quantity,
                          unit: 'ชิ้น',
                          price: parseFloat(item.unit_price)
                        })),
                        total: parseFloat(selectedSale.total_amount || 0),
                        tax: parseFloat(selectedSale.tax_amount || 0),
                        grandTotal: parseFloat(selectedSale.grand_total)
                      };
                      setLastReceipt(receiptData);
                      setShowReceipt(true);
                      setShowSaleDetail(false);
                    } else {
                      alert('ไม่พบข้อมูลรายการสินค้า');
                    }
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Printer size={16} />
                  พิมพ์ใบเสร็จ
                </button>
                <button
                  onClick={() => {
                    setShowSaleDetail(false);
                    setSelectedSale(null);
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
