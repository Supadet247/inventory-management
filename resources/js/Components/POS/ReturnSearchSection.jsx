import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
  Search, Receipt, ShoppingCart, Calendar, User,
  Package, RefreshCw, AlertTriangle, CheckCircle, Download
} from 'lucide-react';
import { apiGet, apiPost, getCsrfToken, handleApiError } from '../../utils/apiUtils';

export default function ReturnSearchSection({ currentUser }) {
  const [receiptNumber, setReceiptNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundReceipt, setFoundReceipt] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReasons, setReturnReasons] = useState({});
  const [conditionNotes, setConditionNotes] = useState({});
  const [generalReason, setGeneralReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchMode, setSearchMode] = useState('receipt'); // 'receipt' or 'suggestions'
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Fetch returnable receipts suggestions
  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await apiGet(route('pos.returns.api.returnable-receipts'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSuggestions(data.data || []);
      } else {
        console.error('Failed to fetch suggestions:', data.message);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      const errorMessage = handleApiError(error, 'ไม่สามารถดึงข้อมูลคำแนะนำได้');
      alert(errorMessage);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setReceiptNumber(suggestion.receipt_number);
    setSearchMode('receipt');
    handleSearch(suggestion.receipt_number);
  };

  const reasonOptions = [
    'เครมประกันสินค้า',
    'สินค้าชำรุด',
    'ซื้อผิด',
  ];

  // Filter reason options based on product warranty
  const getReasonOptionsForItem = (item) => {
    if (item.has_warranty) {
      return reasonOptions; // สินค้ามีประกัน: แสดงทุกตัวเลือก
    }
    // สินค้าไม่มีประกัน: ไม่แสดง "เครมประกันสินค้า"
    return reasonOptions.filter(r => r !== 'เครมประกันสินค้า');
  };

  const handleSearch = async (searchReceiptNumber = null) => {
    const numberToSearch = searchReceiptNumber || receiptNumber;
    if (!numberToSearch.trim()) {
      alert('กรุณากรอกเลขที่ใบเสร็จ');
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiPost(route('pos.returns.search'), {
        receipt_number: numberToSearch
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setFoundReceipt(data.receipt);
        const initialReturns = {};
        const initialReasons = {};
        const initialNotes = {};
        
        data.receipt.returnable_items.forEach(item => {
          initialReturns[item.id] = 0;
          // เลือกเหตุผลเริ่มต้นตามสินค้ามีประกันหรือไม่
          const availableReasons = item.has_warranty ? reasonOptions : reasonOptions.filter(r => r !== 'เครมประกันสินค้า');
          initialReasons[item.id] = availableReasons[0];
          initialNotes[item.id] = '';
        });
        
        setReturnItems(initialReturns);
        setReturnReasons(initialReasons);
        setConditionNotes(initialNotes);
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการค้นหา');
        setFoundReceipt(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = handleApiError(error, 'เกิดข้อผิดพลาดในการค้นหาใบเสร็จ');
      alert(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const updateReturnQuantity = (itemId, change) => {
    const item = foundReceipt.returnable_items.find(i => i.id === itemId);
    if (!item) return;

    setReturnItems(prev => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(0, Math.min(item.returnable_quantity, currentQty + change));
      return { ...prev, [itemId]: newQty };
    });
  };

  const setReturnQuantity = (itemId, quantity) => {
    const item = foundReceipt.returnable_items.find(i => i.id === itemId);
    if (!item) return;

    const newQty = Math.max(0, Math.min(item.returnable_quantity, parseInt(quantity) || 0));
    setReturnItems(prev => ({ ...prev, [itemId]: newQty }));
  };

  const getTotalReturnAmount = () => {
    if (!foundReceipt) return 0;
    
    return foundReceipt.returnable_items.reduce((total, item) => {
      const returnQty = returnItems[item.id] || 0;
      return total + (returnQty * item.unit_price);
    }, 0);
  };

  const getTotalReturnItems = () => {
    return Object.values(returnItems).reduce((sum, qty) => sum + qty, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const handleSubmitReturn = async () => {
    const itemsToReturn = foundReceipt.returnable_items.filter(item => 
      (returnItems[item.id] || 0) > 0
    );

    if (itemsToReturn.length === 0) {
      alert('กรุณาเลือกสินค้าที่ต้องการคืน');
      return;
    }

    // Validate reasons
    const hasEmptyReason = itemsToReturn.some(item => 
      !returnReasons[item.id] || returnReasons[item.id].trim() === ''
    );

    if (hasEmptyReason) {
      alert('กรุณาระบุเหตุผลการคืนสำหรับทุกรายการ');
      return;
    }

    const returnData = {
      receipt_id: foundReceipt.id,
      items: itemsToReturn.map(item => ({
        receipt_item_id: item.id,
        quantity: returnItems[item.id],
        reason: returnReasons[item.id],
        condition_note: conditionNotes[item.id] || null
      })),
      general_reason: generalReason,
      return_type: getTotalReturnItems() === foundReceipt.returnable_items.reduce((sum, item) => sum + item.returnable_quantity, 0) ? 'full' : 'partial'
    };

    setIsSubmitting(true);
    
    router.post(route('pos.returns.process'), returnData, {
      onSuccess: () => {
        // Reset form
        setFoundReceipt(null);
        setReceiptNumber('');
        setReturnItems([]);
        setReturnReasons({});
        setConditionNotes({});
        setGeneralReason('');
      },
      onError: (errors) => {
        console.error('Return processing errors:', errors);
      },
      onFinish: () => {
        setIsSubmitting(false);
      }
    });
  };

  const resetForm = () => {
    setFoundReceipt(null);
    setReceiptNumber('');
    setReturnItems([]);
    setReturnReasons({});
    setConditionNotes({});
    setGeneralReason('');
  };

  return (
    <div className="space-y-6">
      {/* Search Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setSearchMode('receipt')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              searchMode === 'receipt'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ค้นหาโดยเลขใบเสร็จ
          </button>
          <button
            onClick={() => {
              setSearchMode('suggestions');
              if (suggestions.length === 0) {
                fetchSuggestions();
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              searchMode === 'suggestions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            เลือกจากรายการที่คืนได้
          </button>
        </div>
      </div>

      {/* Search Section */}
      {searchMode === 'receipt' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="text-blue-600" size={20} />
            ค้นหาใบเสร็จ
          </h2>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="กรอกเลขที่ใบเสร็จ (เช่น 20250831001)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isSearching || !receiptNumber.trim()}
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

      {/* Suggestions Section */}
      {searchMode === 'suggestions' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="text-blue-600" size={20} />
              รายการที่สามารถคืนได้
            </h2>
            <button
              onClick={fetchSuggestions}
              disabled={isLoadingSuggestions}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <RefreshCw className={isLoadingSuggestions ? 'animate-spin' : ''} size={14} />
              รีเฟรช
            </button>
          </div>

          {isLoadingSuggestions ? (
            <div className="text-center py-8">
              <RefreshCw className="animate-spin mx-auto text-gray-400 mb-2" size={24} />
              <p className="text-gray-500">กำลังโหลด...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto text-gray-400 mb-2" size={24} />
              <p className="text-gray-500">ไม่มีรายการที่สามารถคืนได้</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-600">{suggestion.receipt_number}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      (() => {
                        const daysPassedFloor = Math.floor(suggestion.days_since_purchase);
                        // หาระยะรับประกันที่ยาวที่สุดจากสินค้าในใบเสร็จ
                        const maxWarrantyDays = suggestion.max_warranty_days || 7; // default 7 วันถ้าไม่มีรับประกัน
                        const daysRemaining = maxWarrantyDays - daysPassedFloor;
                        
                        if (daysRemaining <= 0) return 'bg-red-100 text-red-800';
                        if (daysRemaining <= 2) return 'bg-yellow-100 text-yellow-800';
                        return 'bg-green-100 text-green-800';
                      })()
                    }`}>
                      {(() => {
                        const daysPassedFloor = Math.floor(suggestion.days_since_purchase);
                        const maxWarrantyDays = suggestion.max_warranty_days || 7;
                        const daysRemaining = maxWarrantyDays - daysPassedFloor;
                        
                        if (daysRemaining <= 0) return 'หมดเวลา';
                        if (daysRemaining === 1) return 'วันนี้';
                        return `${daysRemaining} วัน`;
                      })()
                    }</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    ลูกค้า: {suggestion.customer_name}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    ยอดรวม: {formatCurrency(suggestion.grand_total)}
                  </p>
                  <p className="text-sm text-gray-500">
                    วันที่: {suggestion.formatted_issued_date}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Receipt Details */}
      {foundReceipt && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-blue-50 border-b px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="text-blue-600" size={20} />
              รายละเอียดใบเสร็จ: {foundReceipt.receipt_number}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
              <div>
                <span className="text-gray-600">วันที่:</span>
                <p className="font-medium">
                  {new Date(foundReceipt.issued_at).toLocaleDateString('th-TH')}
                </p>
              </div>
              <div>
                <span className="text-gray-600">ลูกค้า:</span>
                <p className="font-medium">
                  {foundReceipt.customer_name || 'ลูกค้าทั่วไป'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">พนักงาน:</span>
                <p className="font-medium">{foundReceipt.cashier}</p>
              </div>
              <div>
                <span className="text-gray-600">ยอดรวม:</span>
                <p className="font-medium text-blue-600">
                  {formatCurrency(foundReceipt.grand_total)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h4 className="font-semibold text-gray-900 mb-4">รายการสินค้าที่สามารถคืนได้:</h4>
            
            <div className="space-y-4">
              {foundReceipt.returnable_items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-gray-900">{item.product_name}</h5>
                        {item.has_warranty && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            มีประกัน
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        SKU: {item.product_sku} | ราคา: {formatCurrency(item.unit_price)}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-600">
                          ซื้อมา: <span className="font-medium">{item.quantity} {item.unit}</span>
                        </span>
                        <span className="text-gray-600">
                          คืนได้: <span className="font-medium text-green-600">{item.returnable_quantity} {item.unit}</span>
                        </span>
                        {item.returned_quantity > 0 && (
                          <span className="text-gray-600">
                            คืนแล้ว: <span className="font-medium text-red-600">{item.returned_quantity} {item.unit}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.returnable_amount)}
                      </p>
                      <p className="text-sm text-gray-500">คืนได้สูงสุด</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Quantity Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        จำนวนที่ต้องการคืน
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateReturnQuantity(item.id, -1)}
                          className="bg-red-500 text-white w-8 h-8 rounded hover:bg-red-600 flex items-center justify-center"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={item.returnable_quantity}
                          value={returnItems[item.id] || 0}
                          onChange={(e) => setReturnQuantity(item.id, e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          className="flex-1 text-center border border-gray-300 rounded px-2 py-1"
                        />
                        <button
                          onClick={() => updateReturnQuantity(item.id, 1)}
                          className="bg-green-500 text-white w-8 h-8 rounded hover:bg-green-600 flex items-center justify-center"
                        >
                          +
                        </button>
                        <button
                          onClick={() => setReturnQuantity(item.id, item.returnable_quantity)}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          ทั้งหมด
                        </button>
                      </div>
                    </div>

                    {/* Return Reason */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        เหตุผลการคืน *
                      </label>
                      <select
                        value={returnReasons[item.id] || ''}
                        onChange={(e) => setReturnReasons(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                      >
                        {getReasonOptionsForItem(item).map((reason) => (
                          <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </select>
                    </div>

                    {/* Condition Note */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        หมายเหตุสภาพสินค้า
                      </label>
                      <input
                        type="text"
                        value={conditionNotes[item.id] || ''}
                        onChange={(e) => setConditionNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="สภาพสินค้าเมื่อคืน..."
                        className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                      />
                    </div>
                  </div>

                  {(returnItems[item.id] || 0) > 0 && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="text-green-600" size={16} />
                        <span className="text-green-800 font-medium">
                          จะคืน: {returnItems[item.id]} {item.unit} = {formatCurrency((returnItems[item.id] || 0) * item.unit_price)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* General Reason */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เหตุผลการคืนโดยรวม (เพิ่มเติม)
              </label>
              <textarea
                value={generalReason}
                onChange={(e) => setGeneralReason(e.target.value)}
                placeholder="ระบุเหตุผลการคืนสินค้าเพิ่มเติม..."
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>

            {/* Return Summary */}
            {getTotalReturnItems() > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-3">สรุปการคืนสินค้า</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">จำนวนชิ้น:</span>
                    <p className="font-semibold text-blue-900">{getTotalReturnItems()} ชิ้น</p>
                  </div>
                  <div>
                    <span className="text-blue-600">ยอดเงิน (ก่อนภาษี):</span>
                    <p className="font-semibold text-blue-900">{formatCurrency(getTotalReturnAmount())}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">ภาษี VAT 7%:</span>
                    <p className="font-semibold text-blue-900">{formatCurrency(getTotalReturnAmount() * 0.07)}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">ยอดคืนสุทธิ:</span>
                    <p className="font-bold text-lg text-blue-900">
                      {formatCurrency(getTotalReturnAmount() * 1.07)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleSubmitReturn}
                disabled={isSubmitting || getTotalReturnItems() === 0}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    ดำเนินการคืนสินค้า ({getTotalReturnItems()} รายการ)
                  </>
                )}
              </button>
              
              <button
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
              >
                เริ่มใหม่
              </button>
            </div>

            {getTotalReturnItems() === 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-yellow-600" size={20} />
                  <p className="text-yellow-800">
                    กรุณาเลือกสินค้าและระบุจำนวนที่ต้องการคืน
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}