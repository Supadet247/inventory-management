import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import POSLayout from '@/Layouts/POSLayout';
import {
  ArrowLeft, Receipt, Package, User, Calendar, 
  CheckCircle, Clock, XCircle, AlertTriangle,
  Printer, FileText, MessageSquare
} from 'lucide-react';

export default function ReturnShow({ auth, returnItem, stockWarnings = [] }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: {
        color: 'text-yellow-800 bg-yellow-100',
        icon: Clock,
        text: 'รอดำเนินการ',
        bgColor: 'bg-yellow-50'
      },
      approved: {
        color: 'text-blue-800 bg-blue-100',
        icon: CheckCircle,
        text: 'อนุมัติแล้ว',
        bgColor: 'bg-blue-50'
      },
      completed: {
        color: 'text-green-800 bg-green-100',
        icon: CheckCircle,
        text: 'เสร็จสิ้น',
        bgColor: 'bg-green-50'
      },
      cancelled: {
        color: 'text-red-800 bg-red-100',
        icon: XCircle,
        text: 'ยกเลิก',
        bgColor: 'bg-red-50'
      }
    };
    return config[status] || config.pending;
  };

  const handleAction = async (type) => {
    setIsProcessing(true);
    
    const route_name = `pos.returns.${type}`;
    const data = actionNotes ? { notes: actionNotes } : {};
    
    router.patch(route(route_name, returnItem.id), data, {
      onSuccess: () => {
        setShowActionModal(false);
        setActionNotes('');
      },
      onError: (errors) => {
        console.error('Action error:', errors);
      },
      onFinish: () => {
        setIsProcessing(false);
      }
    });
  };

  const openActionModal = (type) => {
    setActionType(type);
    setActionNotes('');
    setShowActionModal(true);
  };

  const statusConfig = getStatusConfig(returnItem.status);
  const StatusIcon = statusConfig.icon;

  return (
    <POSLayout user={auth.user}>
      <Head title={`รายละเอียดการคืนสินค้า - ${returnItem.return_number}`} />

      <div className="p-6 max-w-6xl mx-auto">
        {/* Stock Warning Banner */}
        {stockWarnings.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-semibold text-red-800 mb-1">
                  ⚠️ สินค้าในสต็อกไม่เพียงพอ — ยังเบิกสินค้าให้ลูกค้าไม่ได้
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {stockWarnings.map((w, i) => (
                    <li key={i}>
                      • <strong>{w.product_name}</strong>: ต้องการ {w.required} ชิ้น
                      แต่มีในสต็อกเพียง <strong>{w.available} ชิ้น</strong>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-red-600 mt-2">
                  กรุณารับสินค้าจากดีลเลอร์ก่อน แล้วค่อยอนุมัติใบคืน
                </p>
              </div>
            </div>
          </div>
        )}
      
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.get(route('pos.returns.index'))}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            กลับ
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              รายละเอียดการคืนสินค้า
            </h1>
            <p className="text-gray-600">เลขที่: {returnItem.return_number}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Return Information */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className={`${statusConfig.bgColor} border-b px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Receipt className="text-gray-600" size={24} />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        การคืนสินค้า #{returnItem.return_number}
                      </h2>
                      <p className="text-sm text-gray-600">
                        อ้างอิงใบเสร็จ: {returnItem.original_receipt?.receipt_number}
                      </p>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${statusConfig.color}`}>
                    <StatusIcon size={16} />
                    <span className="font-medium">{statusConfig.text}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <span className="text-gray-600 text-sm">วันที่คืน</span>
                    <p className="font-semibold text-gray-900">
                      {new Date(returnItem.returned_at).toLocaleDateString('th-TH')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(returnItem.returned_at).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">ประเภทการคืน</span>
                    <p className="font-semibold text-gray-900">
                      {returnItem.return_type === 'full' ? 'คืนทั้งหมด' : 'คืนบางส่วน'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">พนักงาน</span>
                    <p className="font-semibold text-gray-900">
                      {returnItem.user?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">ยอดคืนสุทธิ</span>
                    <p className="font-bold text-lg text-blue-600">
                      {formatCurrency(returnItem.grand_return_total)}
                    </p>
                  </div>
                </div>

                {returnItem.reason && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">เหตุผลการคืนโดยรวม</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {returnItem.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Original Receipt Information */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="bg-gray-50 border-b px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="text-gray-600" size={20} />
                  ใบเสร็จต้นฉบับ
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">เลขที่ใบเสร็จ</span>
                    <p className="font-semibold text-blue-600">
                      {returnItem.original_receipt?.receipt_number}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">วันที่ออกใบเสร็จ</span>
                    <p className="font-semibold text-gray-900">
                      {new Date(returnItem.original_receipt?.issued_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">ลูกค้า</span>
                    <p className="font-semibold text-gray-900">
                      {returnItem.original_receipt?.customer_name || 'ลูกค้าทั่วไป'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">ยอดรวมใบเสร็จ</span>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(returnItem.original_receipt?.grand_total)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Return Items */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="bg-gray-50 border-b px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="text-gray-600" size={20} />
                  รายการสินค้าที่คืน
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สินค้า
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จำนวน
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ราคาต่อหน่วย
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รวม
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        เหตุผล
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {returnItem.return_items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.receipt_item?.product_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {item.receipt_item?.product_sku}
                            </div>
                            {item.condition_note && (
                              <div className="text-xs text-gray-600 mt-1 italic">
                                สภาพ: {item.condition_note}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          {item.quantity} {item.receipt_item?.unit || 'ชิ้น'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          {formatCurrency(item.total_price)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {item.reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-gray-50 border-t px-6 py-4">
                <div className="flex justify-end space-y-1">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      ยอดก่อนภาษี: {formatCurrency(returnItem.total_return_amount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      ภาษี VAT 7%: {formatCurrency(returnItem.tax_return_amount)}
                    </div>
                    <div className="text-lg font-bold text-gray-900 border-t pt-1 mt-1">
                      ยอดคืนสุทธิ: {formatCurrency(returnItem.grand_return_total)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="bg-gray-50 border-b px-6 py-4">
                <h3 className="font-semibold text-gray-900">การจัดการ</h3>
              </div>
              <div className="p-6 space-y-3">
                {returnItem.status === 'pending' && (
                  <>
                    <button
                      onClick={() => openActionModal('approve')}
                      disabled={stockWarnings.length > 0}
                      className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 text-white transition ${
                        stockWarnings.length > 0
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      <CheckCircle size={16} />
                      {stockWarnings.length > 0 ? 'ไม่สามารถอนุมัติได้ (สต็อกไม่พอ)' : 'อนุมัติ'}
                    </button>
                    <button
                      onClick={() => openActionModal('cancel')}
                      className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} />
                      ยกเลิก
                    </button>
                  </>
                )}

                {returnItem.status === 'approved' && (
                  <>
                    <button
                      onClick={() => openActionModal('complete')}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      ดำเนินการให้เสร็จสิ้น
                    </button>
                    <button
                      onClick={() => openActionModal('cancel')}
                      className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} />
                      ยกเลิก
                    </button>
                  </>
                )}

                {returnItem.status === 'completed' && (
                  <button
                    onClick={() => router.get(route('pos.returns.print', returnItem.id))}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
                  >
                    <Printer size={16} />
                    พิมพ์ใบคืนสินค้า
                  </button>
                )}

                <button
                  onClick={() => router.get(route('pos.returns.index'))}
                  className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                >
                  กลับสู่รายการ
                </button>
              </div>
            </div>

            {/* Notes/History */}
            {returnItem.notes && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="bg-gray-50 border-b px-6 py-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="text-gray-600" size={16} />
                    หมายเหตุ
                  </h3>
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {returnItem.notes}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {actionType === 'approve' && 'อนุมัติการคืนสินค้า'}
                {actionType === 'complete' && 'ดำเนินการให้เสร็จสิ้น'}
                {actionType === 'cancel' && 'ยกเลิกการคืนสินค้า'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ
                  {actionType === 'cancel' && <span className="text-red-500"> *</span>}
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={
                    actionType === 'cancel' 
                      ? 'ระบุเหตุผลการยกเลิก...' 
                      : 'หมายเหตุเพิ่มเติม...'
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleAction(actionType)}
                  disabled={isProcessing || (actionType === 'cancel' && !actionNotes.trim())}
                  className={`px-4 py-2 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed ${
                    actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    actionType === 'complete' ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isProcessing ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </POSLayout>
  );
}