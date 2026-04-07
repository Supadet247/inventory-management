import React from 'react';
import { Head } from '@inertiajs/react';

export default function ReturnPrintReceipt({ returnItem, store_info }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  // Auto-print when component mounts
  React.useEffect(() => {
    // Small delay to ensure content is rendered
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="print-area font-mono text-sm mx-auto bg-white" style={{ width: '80mm', padding: '10px' }}>
      <Head title={`พิมพ์ใบคืนสินค้า - ${returnItem.return_number}`} />
      
      {/* Header */}
      <div className="text-center border-b border-dashed pb-2 mb-3">
        <h2 className="font-bold text-base mb-1">ใบคืนสินค้า</h2>
        <h3 className="font-bold text-sm mb-1">{store_info?.name || 'ร้านสมบัติเกษตรยนต์'}</h3>
        <div className="text-xs text-gray-600">
          <p>{store_info?.address || '207 หมู่ 15 ต.เชียงดาว อ.เชียงดาว จ.เชียงใหม่'}</p>
          <p>โทร: {store_info?.phone || '089-560-8118'}</p>
          <p>เลขประจำตัวผู้เสียภาษี: {store_info?.tax_id || '1463315038'}</p>
        </div>
      </div>

      {/* Return Info */}
      <div className="text-xs mb-3 space-y-1">
        <div className="flex justify-between">
          <span>เลขที่การคืน:</span>
          <span className="font-bold">{returnItem.return_number}</span>
        </div>
        <div className="flex justify-between">
          <span>อ้างอิงใบเสร็จ:</span>
          <span className="font-bold">{returnItem.original_receipt?.receipt_number}</span>
        </div>
        <div className="flex justify-between">
          <span>วันที่คืน:</span>
          <span>{new Date(returnItem.returned_at).toLocaleDateString('th-TH')}</span>
        </div>
        <div className="flex justify-between">
          <span>เวลา:</span>
          <span>
            {new Date(returnItem.returned_at).toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>พนักงาน:</span>
          <span>{returnItem.user?.name}</span>
        </div>
        <div className="flex justify-between">
          <span>ประเภท:</span>
          <span>{returnItem.return_type === 'full' ? 'คืนทั้งหมด' : 'คืนบางส่วน'}</span>
        </div>
      </div>

      <hr className="my-2 border-dashed" />

      {/* Original Receipt Info */}
      <div className="text-xs mb-3">
        <div className="font-bold mb-1">รายละเอียดใบเสร็จต้นฉบับ:</div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>วันที่ซื้อ:</span>
            <span>
              {new Date(returnItem.original_receipt?.issued_at).toLocaleDateString('th-TH')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>ลูกค้า:</span>
            <span>{returnItem.original_receipt?.customer_name || 'ลูกค้าทั่วไป'}</span>
          </div>
          <div className="flex justify-between">
            <span>ยอดใบเสร็จ:</span>
            <span>{formatCurrency(returnItem.original_receipt?.grand_total)}</span>
          </div>
        </div>
      </div>

      <hr className="my-2 border-dashed" />

      {/* Return Items */}
      <div className="text-xs mb-3">
        <div className="font-bold mb-2">รายการสินค้าที่คืน:</div>
        {returnItem.return_items?.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="font-medium">{item.receipt_item?.product_name}</div>
            <div className="flex justify-between text-gray-600 text-xs">
              <span>SKU: {item.receipt_item?.product_sku}</span>
              <span>คืน: {item.quantity} {item.receipt_item?.unit || 'ชิ้น'}</span>
            </div>
            <div className="flex justify-between">
              <span>{item.quantity} × ฿{parseFloat(item.unit_price).toFixed(2)}</span>
              <span className="font-bold">฿{parseFloat(item.total_price).toFixed(2)}</span>
            </div>
            <div className="text-xs text-gray-600">
              <span>เหตุผล: {item.reason}</span>
            </div>
            {item.condition_note && (
              <div className="text-xs text-gray-600">
                <span>สภาพ: {item.condition_note}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <hr className="my-2 border-dashed" />

      {/* Totals */}
      <div className="text-xs space-y-1 mb-3">
        <div className="flex justify-between">
          <span>ยอดก่อนภาษี:</span>
          <span>฿{parseFloat(returnItem.total_return_amount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>ภาษี VAT 7%:</span>
          <span>฿{parseFloat(returnItem.tax_return_amount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm border-t border-dashed pt-1">
          <span>ยอดคืนสุทธิ:</span>
          <span>฿{parseFloat(returnItem.grand_return_total).toFixed(2)}</span>
        </div>
      </div>

      <hr className="my-2 border-dashed" />

      {/* Return Reason */}
      {returnItem.reason && (
        <div className="text-xs mb-3">
          <div className="font-bold mb-1">เหตุผลการคืนโดยรวม:</div>
          <div className="text-gray-700">{returnItem.reason}</div>
        </div>
      )}

      {/* Status */}
      <div className="text-xs mb-3">
        <div className="flex justify-between">
          <span>สถานะ:</span>
          <span className="font-bold">
            {returnItem.status === 'pending' && 'รอดำเนินการ'}
            {returnItem.status === 'approved' && 'อนุมัติแล้ว'}
            {returnItem.status === 'completed' && 'เสร็จสิ้น'}
            {returnItem.status === 'cancelled' && 'ยกเลิก'}
          </span>
        </div>
      </div>

      <hr className="my-2 border-dashed" />

      {/* Instructions */}
      <div className="text-xs text-center text-gray-600 mb-3">
        <p>กรุณาเก็บใบคืนสินค้านี้ไว้เป็นหลักฐาน</p>
        <p>สำหรับการติดตามสถานะการคืนเงิน</p>
      </div>

      {/* Signatures */}
      <div className="text-xs mt-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-1 mt-8">
            <p>ลายเซ็นผู้คืนสินค้า</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-1 mt-8">
            <p>ลายเซ็นผู้รับคืนสินค้า</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 mt-4 border-t border-dashed pt-2">
        <p>ขอบคุณที่ให้ความไว้วางใจ</p>
        <p>พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
            margin: 0;
            padding: 5mm;
            font-size: 12px;
            line-height: 1.3;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}