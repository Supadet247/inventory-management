import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';

export default function ReturnReceiptModal({ returnData, storeInfo, onClose }) {
  const printRef = useRef();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount || 0);
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

  const handlePrint = () => {
    window.print();
  };

  if (!returnData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">พิมพ์ใบคืนสินค้า</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Receipt Content */}
        <div ref={printRef} className="flex-1 overflow-y-auto">
          <div className="print-area font-mono text-sm bg-white" style={{ width: '80mm', margin: '0 auto', padding: '10px' }}>
            {/* Store Header */}
            <div className="text-center border-b border-dashed pb-2 mb-3">
              <div className="font-bold text-base text-black">{storeInfo.name}</div>
              <div className="text-xs text-black">{storeInfo.address}</div>
              <div className="text-xs text-black">โทร: {storeInfo.phone}</div>
              <div className="text-xs text-black">เลขประจำตัวผู้เสียภาษี: {storeInfo.tax_id}</div>
            </div>

            {/* Return Title */}
            <div className="border-dashed border-t border-b border-black py-2 mb-3 text-center">
              <div className="font-bold text-black">ใบคืนสินค้า / RETURN RECEIPT</div>
              <div className="text-black">#{returnData.return_number}</div>
            </div>

            {/* Return Info */}
            <div className="mb-3 text-black text-xs">
              <div>วันที่คืน: {formatDate(returnData.returned_at)}</div>
              <div>อ้างอิงใบเสร็จ: {returnData.original_receipt?.receipt_number || '-'}</div>
              <div>พนักงาน: {returnData.user?.name || '-'}</div>
              <div>ลูกค้า: {returnData.original_receipt?.customer_name || 'ลูกค้าทั่วไป'}</div>
            </div>

            <div className="border-dashed border-t border-b border-black py-2 mb-2">
              <div className="font-bold text-black">รายการสินค้าที่คืน</div>
            </div>

            {/* Return Items */}
            {returnData.return_items && returnData.return_items.length > 0 ? (
              returnData.return_items.map((item, index) => (
                <div key={item.id} className="mb-2 text-black text-xs">
                  <div className="font-bold">{item.receipt_item?.product_name || 'สินค้า'}</div>
                  <div className="text-xs">SKU: {item.receipt_item?.product_sku || '-'}</div>
                  <div className="flex justify-between">
                    <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                    <span>{formatCurrency(item.total_price)}</span>
                  </div>
                  <div className="text-xs">เหตุผล: {item.reason || '-'}</div>
                  {item.condition_note && (
                    <div className="text-xs">หมายเหตุ: {item.condition_note}</div>
                  )}
                  {index < returnData.return_items.length - 1 && (
                    <div className="border-dashed border-b border-black my-2"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-black text-xs py-2">ไม่มีรายการสินค้า</div>
            )}

            <div className="border-dashed border-t border-black py-2 mb-3">
              {/* Totals */}
              <div className="flex justify-between text-black text-xs">
                <span>ยอดก่อนภาษี:</span>
                <span>{formatCurrency(returnData.total_return_amount)}</span>
              </div>
              <div className="flex justify-between text-black text-xs">
                <span>ภาษี VAT 7%:</span>
                <span>{formatCurrency(returnData.tax_return_amount)}</span>
              </div>
              <div className="border-dashed border-t border-black pt-2">
                <div className="flex justify-between font-bold text-black">
                  <span>ยอดคืนสุทธิ:</span>
                  <span>{formatCurrency(returnData.grand_return_total)}</span>
                </div>
              </div>
            </div>

            {/* Return Reason */}
            {returnData.reason && (
              <div className="mb-3 text-black text-xs">
                <div className="font-bold mb-1">เหตุผลการคืนโดยรวม:</div>
                <div>{returnData.reason}</div>
              </div>
            )}

            {/* Status */}
            <div className="mb-3 text-black text-xs">
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
              <div className="mb-3 text-black text-xs">
                <div className="font-bold mb-1">หมายเหตุ:</div>
                <div>{returnData.notes}</div>
              </div>
            )}

            {/* Footer */}
            <div className="border-dashed border-t border-black pt-2 text-center text-black text-xs">
              <div>ขอบคุณที่ใช้บริการ 🙏</div>
              <div>Thank you for your business</div>
              <div className="mt-2">
                พิมพ์เมื่อ: {formatDate(new Date())}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 p-4 border-t bg-gray-50 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold"
          >
            <Printer size={18} />
            พิมพ์
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 font-semibold"
          >
            ปิด
          </button>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
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
            margin: 0 !important;
            padding: 10px !important;
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
