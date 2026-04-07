import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';

export default function PrintReceipt({ return: returnData, store_info }) {
  const { url } = usePage();

  const handleGoBack = () => {
    // Determine the correct back URL based on current route context
    const currentUrl = url;
    let backUrl;
    
    // Check if we're in admin, staff, or pos context
    if (currentUrl.includes('/admin/')) {
      backUrl = route('admin.returns.show', returnData.id);
    } else if (currentUrl.includes('/staff/')) {
      backUrl = route('staff.returns.show', returnData.id);
    } else {
      backUrl = route('pos.returns.show', returnData.id);
    }
    
    router.visit(backUrl);
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Head title={`ใบคืนสินค้า #${returnData.return_number}`} />
      
      <div className="print-receipt">
        <style jsx>{`
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
            .print-receipt { 
              width: 80mm; 
              margin: 0 auto; 
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
            }
          }
          
          .print-receipt {
            width: 80mm;
            margin: 20px auto;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.3;
            background: white;
            border: 1px solid #ddd;
          }
          
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .border-dashed { border-style: dashed; }
          .border-t { border-top: 1px solid #000; }
          .border-b { border-bottom: 1px solid #000; }
          .py-2 { padding: 8px 0; }
          .mb-2 { margin-bottom: 8px; }
          .mb-3 { margin-bottom: 12px; }
        `}</style>

        {/* Header */}
        <div className="text-center mb-3">
          <div className="font-bold text-lg">{store_info.name}</div>
          <div className="text-sm">{store_info.address}</div>
          <div className="text-sm">โทร: {store_info.phone}</div>
          <div className="text-sm">เลขประจำตัวผู้เสียภาษี: {store_info.tax_id}</div>
        </div>

        <div className="border-dashed border-t border-b py-2 mb-3 text-center">
          <div className="font-bold">ใบคืนสินค้า / RETURN RECEIPT</div>
          <div>#{returnData.return_number}</div>
        </div>

        {/* Return Info */}
        <div className="mb-3">
          <div>วันที่คืน: {formatDate(returnData.returned_at)}</div>
          <div>อ้างอิงใบเสร็จ: {returnData.original_receipt?.receipt_number}</div>
          <div>พนักงาน: {returnData.user?.name}</div>
          <div>ลูกค้า: {returnData.original_receipt?.customer_name || 'ลูกค้าทั่วไป'}</div>
        </div>

        <div className="border-dashed border-t border-b py-2 mb-2">
          <div className="font-bold">รายการสินค้าที่คืน</div>
        </div>

        {/* Return Items */}
        {returnData.return_items?.map((item, index) => (
          <div key={item.id} className="mb-2">
            <div className="font-bold">{item.product?.name}</div>
            <div className="text-sm">SKU: {item.product?.sku}</div>
            <div className="flex justify-between">
              <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
              <span>{formatCurrency(item.quantity * item.unit_price)}</span>
            </div>
            <div className="text-sm">เหตุผล: {item.reason}</div>
            {item.condition_note && (
              <div className="text-sm">หมายเหตุ: {item.condition_note}</div>
            )}
            {index < returnData.return_items.length - 1 && (
              <div className="border-dashed border-b my-2"></div>
            )}
          </div>
        ))}

        <div className="border-dashed border-t py-2 mb-3">
          {/* Totals */}
          <div className="flex justify-between">
            <span>ยอดก่อนภาษี:</span>
            <span>{formatCurrency(returnData.total_return_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>ภาษี VAT 7%:</span>
            <span>{formatCurrency(returnData.tax_return_amount)}</span>
          </div>
          <div className="border-dashed border-t pt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>ยอดคืนสุทธิ:</span>
              <span>{formatCurrency(returnData.grand_return_total)}</span>
            </div>
          </div>
        </div>

        {/* Return Reason */}
        {returnData.reason && (
          <div className="mb-3">
            <div className="font-bold mb-1">เหตุผลการคืนโดยรวม:</div>
            <div className="text-sm">{returnData.reason}</div>
          </div>
        )}

        {/* Status */}
        <div className="mb-3">
          <div className="flex justify-between">
            <span>สถานะ:</span>
            <span className="font-bold">
              {returnData.status === 'pending' && 'รอดำเนินการ'}
              {returnData.status === 'approved' && 'อนุมัติแล้ว'}
              {returnData.status === 'completed' && 'เสร็จสิ้น'}
              {returnData.status === 'cancelled' && 'ยกเลิก'}
            </span>
          </div>
        </div>

        {/* Notes */}
        {returnData.notes && (
          <div className="mb-3">
            <div className="font-bold mb-1">หมายเหตุ:</div>
            <div className="text-sm">{returnData.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="border-dashed border-t pt-2 text-center text-sm">
          <div>ขอบคุณที่ใช้บริการ</div>
          <div>Thank you for your business</div>
          <div className="mt-2">
            พิมพ์เมื่อ: {formatDate(new Date())}
          </div>
        </div>

        {/* Print Button */}
        <div className="no-print text-center mt-6">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mr-3"
          >
            🖨 พิมพ์
          </button>
          <button
            onClick={handleGoBack}
            className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500"
          >
            ❌ ปิด
          </button>
        </div>
      </div>
    </>
  );
}