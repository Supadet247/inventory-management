import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import POSLayout from '@/Layouts/POSLayout';
import {
  RefreshCw, FileText, User, Calendar, Package, 
  Check, X, AlertTriangle, ArrowLeft, Printer
} from 'lucide-react';

export default function ReturnsShow({ auth, return: returnData, canApprove, canComplete, canCancel }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [backUrl, setBackUrl] = useState(null);

  const { url } = usePage();

  useEffect(() => {
    // Determine the correct back URL based on current route context
    const currentUrl = url;
    
    // Check if we're in admin, staff, or pos context
    if (currentUrl.includes('/admin/')) {
      setBackUrl('/admin/returns');
    } else if (currentUrl.includes('/staff/')) {
      setBackUrl('/staff/returns');
    } else {
      setBackUrl('/pos/returns');
    }

    // Also check for previous page in session storage as fallback
    const previousUrl = sessionStorage.getItem('returns_previous_url');
    if (previousUrl && !backUrl) {
      setBackUrl(previousUrl);
    }
  }, [url]);

  const handleGoBack = () => {
    if (backUrl) {
      router.visit(backUrl);
    } else {
      // Fallback to browser back
      window.history.back();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, text: 'รอดำเนินการ' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: Check, text: 'อนุมัติแล้ว' },
      completed: { color: 'bg-green-100 text-green-800', icon: Check, text: 'เสร็จสิ้น' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, text: 'ยกเลิก' },
    };

    const config = statusConfig[status];
    if (!config) return null;
    
    const StatusIcon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <StatusIcon size={12} />
        {config.text}
      </span>
    );
  };

  const handleApprove = () => {
    setIsProcessing(true);
    const currentUrl = url;
    let approveUrl;
    
    if (currentUrl.includes('/admin/')) {
      approveUrl = `/admin/returns/${returnData.id}/approve`;
    } else if (currentUrl.includes('/staff/')) {
      approveUrl = `/staff/returns/${returnData.id}/approve`;
    } else {
      approveUrl = `/pos/returns/${returnData.id}/approve`;
    }
    
    router.patch(approveUrl, { notes }, {
      onFinish: () => {
        setIsProcessing(false);
        setShowApproveModal(false);
        setNotes('');
      }
    });
  };

  const handleComplete = () => {
    setIsProcessing(true);
    const currentUrl = url;
    let completeUrl;
    
    if (currentUrl.includes('/admin/')) {
      completeUrl = `/admin/returns/${returnData.id}/complete`;
    } else if (currentUrl.includes('/staff/')) {
      completeUrl = `/staff/returns/${returnData.id}/complete`;
    } else {
      completeUrl = `/pos/returns/${returnData.id}/complete`;
    }
    
    router.patch(completeUrl, { notes }, {
      onFinish: () => {
        setIsProcessing(false);
        setShowCompleteModal(false);
        setNotes('');
      }
    });
  };

  const handleCancel = () => {
    setIsProcessing(true);
    const currentUrl = url;
    let cancelUrl;
    
    if (currentUrl.includes('/admin/')) {
      cancelUrl = `/admin/returns/${returnData.id}/cancel`;
    } else if (currentUrl.includes('/staff/')) {
      cancelUrl = `/staff/returns/${returnData.id}/cancel`;
    } else {
      cancelUrl = `/pos/returns/${returnData.id}/cancel`;
    }
    
    router.patch(cancelUrl, { reason: cancelReason }, {
      onFinish: () => {
        setIsProcessing(false);
        setShowCancelModal(false);
        setCancelReason('');
      }
    });
  };

  return (
    <POSLayout user={auth.user}>
      <Head title={`การคืนสินค้า #${returnData.return_number}`} />

      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="w-full max-w-screen-xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            {/* Back Navigation */}
            <div className="mb-4">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={20} />
                กลับ
              </button>
            </div>
            
            {/* Title and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-blue-600 mb-2 flex items-center gap-3">
                  <RefreshCw className="text-blue-600" size={28} />
                  การคืนสินค้า #{returnData.return_number}
                </h1>
                <p className="text-gray-600">รายละเอียดการคืนสินค้า</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {canApprove && (
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                  >
                    <Check size={16} />
                    อนุมัติ
                  </button>
                )}
                
                {canComplete && (
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                  >
                    <Check size={16} />
                    ดำเนินการเสร็จสิ้น
                  </button>
                )}
                
                {canCancel && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
                  >
                    <X size={16} />
                    ยกเลิก
                  </button>
                )}
                
                <button
                  onClick={() => {
                    const printUrl = `/pos/returns/${returnData.id}/print`;
                    router.get(printUrl);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <Printer size={16} />
                  พิมพ์
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Return Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Return Details Card */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="bg-gray-50 border-b px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">ข้อมูลการคืนสินค้า</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">เลขที่การคืน</label>
                      <p className="font-medium">{returnData.return_number}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">สถานะ</label>
                      <div className="mt-1">{getStatusBadge(returnData.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">วันที่คืน</label>
                      <p className="font-medium">
                        {new Date(returnData.returned_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">พนักงาน</label>
                      <p className="font-medium">{returnData.user?.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Original Receipt Info */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="bg-gray-50 border-b px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">ใบเสร็จต้นฉบับ</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">เลขที่ใบเสร็จ</label>
                      <p className="font-medium text-blue-600">
                        {returnData.original_receipt?.receipt_number}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">ลูกค้า</label>
                      <p className="font-medium">
                        {returnData.original_receipt?.customer_name || 'ลูกค้าทั่วไป'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">วันที่ซื้อ</label>
                      <p className="font-medium">
                        {new Date(returnData.original_receipt?.issued_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">ยอดรวม</label>
                      <p className="font-medium">
                        {formatCurrency(returnData.original_receipt?.grand_total)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Items */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="bg-gray-50 border-b px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">รายการสินค้าที่คืน</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">สินค้า</th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">จำนวนคืน</th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">ราคาต่อหน่วย</th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">ยอดรวม</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">เหตุผล</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {returnData.return_items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{item.product?.name}</p>
                              <p className="text-sm text-gray-500">SKU: {item.product?.sku}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-medium">{item.quantity}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            {formatCurrency(item.quantity * item.unit_price)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{item.reason}</span>
                            {item.condition_note && (
                              <p className="text-xs text-gray-500 mt-1">{item.condition_note}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Return Summary */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="bg-gray-50 border-b px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">สรุปยอดคืน</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ยอดก่อนภาษี:</span>
                    <span className="font-medium">{formatCurrency(returnData.total_return_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ภาษี VAT 7%:</span>
                    <span className="font-medium">{formatCurrency(returnData.tax_return_amount)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">ยอดคืนสุทธิ:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(returnData.grand_return_total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {returnData.notes && (
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="bg-gray-50 border-b px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">หมายเหตุ</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 whitespace-pre-wrap">{returnData.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">อนุมัติการคืนสินค้า</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="เพิ่มหมายเหตุ..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">ดำเนินการเสร็จสิ้น</h3>
            <p className="text-gray-600 mb-4">
              การดำเนินการนี้จะคืนสินค้าเข้าสต็อกและไม่สามารถยกเลิกได้
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="เพิ่มหมายเหตุ..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleComplete}
                disabled={isProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? 'กำลังดำเนินการ...' : 'ดำเนินการเสร็จสิ้น'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">ยกเลิกการคืนสินค้า</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เหตุผลการยกเลิก *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="ระบุเหตุผลการยกเลิก..."
                required
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCancel}
                disabled={isProcessing || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? 'กำลังดำเนินการ...' : 'ยกเลิกการคืน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </POSLayout>
  );
}