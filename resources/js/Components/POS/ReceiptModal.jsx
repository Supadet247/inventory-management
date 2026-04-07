import React from 'react';

// Format number with commas and 2 decimal places
const formatMoney = (amount) => {
  if (amount === undefined || amount === null) return '0.00';
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ReceiptModal({ receipt, onPrint, onClose }) {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:static print:inset-auto print:p-0 print:bg-white print:m-0">
      <div className="print-area bg-white rounded-lg w-full max-w-md mx-auto text-xs max-h-[90vh] overflow-y-auto flex flex-col print:max-h-full print:overflow-visible print:rounded-none print:w-full print:text-xs print:m-0 print:p-0">
        
        {/* Header */}
        <div className="p-4 print:p-1.5 print:mb-0 flex-shrink-0">
          {receipt.paymentMethod === 'installment' && (
            <h3 className="text-base font-bold text-center mb-1">ใบส่งของ</h3>
          )}
          <h3 className="text-base font-bold text-center mb-0.5">ร้าน สมบัติเกษตรยนต์</h3>
          <p className="text-center text-black text-xs">โทร: 089-560-8118 | LINE: @sombat</p>
          <p className="text-center text-black text-xs">207 หมู่ 15 ต.เชียงดาว จ.เชียงใหม่</p>
          <p className="text-center text-black text-xs">เลขที่: {receipt.receipt_number}</p>
          <p className="text-center text-black text-xs">{receipt.date}</p>
          {receipt.seller && (
            <p className="text-center text-black text-xs mt-1">ผู้ขาย: {receipt.seller}</p>
          )}
        </div>

        <hr className="border-black" />

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-2">
          {receipt.items.map(item => (
            <div key={item.id} className="flex justify-between items-start mb-0.5 pb-0.5 border-b border-black print:mb-0">
              <div className="flex-1 pr-2">
                <p className="font-medium text-xs">{item.name}</p>
                <p className="text-black text-xs">
                  {item.quantity} {item.unit} × ฿{formatMoney(item.price)}
                </p>
              </div>
              <div className="font-bold whitespace-nowrap text-xs">฿{formatMoney(item.quantity * item.price)}</div>
            </div>
          ))}
        </div>

        <hr className="border-black" />

        {/* Summary */}
        <div className="p-2 print:p-1 flex-shrink-0 text-xs space-y-0.5">
          <div className="flex justify-between">
            <span>รวม:</span>
            <span>฿{formatMoney(receipt.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>ภาษี (7%):</span>
            <span>฿{formatMoney(receipt.tax)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-0.5">
            <span>ยอดรวมทั้งสิ้น:</span>
            <span>฿{formatMoney(receipt.grandTotal)}</span>
          </div>

          {/* Payment Methods */}
          {receipt.paymentMethod === 'cash' && (
            <>
              <div className="flex justify-between pt-1">
                <span>รับเงิน:</span>
                <span>฿{formatMoney(receipt.received)}</span>
              </div>
              <div className="flex justify-between text-black font-semibold">
                <span>เงินทอน:</span>
                <span>฿{formatMoney((receipt.received || 0) - receipt.grandTotal)}</span>
              </div>
            </>
          )}

          {receipt.paymentMethod === 'mixed' && (
            <>
              <div className="flex justify-between pt-1">
                <span>เงินสด:</span>
                <span>฿{formatMoney(receipt.received.cash)}</span>
              </div>
              <div className="flex justify-between">
                <span>โอนเงิน:</span>
                <span>฿{formatMoney(receipt.received.transfer)}</span>
              </div>
              <div className="flex justify-between text-black font-semibold">
                <span>เงินทอน:</span>
                <span>฿{formatMoney(parseFloat(receipt.received.total || 0) - parseFloat(receipt.grandTotal || 0))}</span>
              </div>
            </>
          )}

          {receipt.paymentMethod === 'installment' && (
            <>
              <div className="flex justify-between pt-1">
                <span>ลูกค้า:</span>
                <span className="text-right">{receipt.received?.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>เงินดาวน์:</span>
                <span>฿{formatMoney(receipt.received?.downPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span>ผ่อนงวดละ:</span>
                <span>฿{formatMoney(receipt.received?.installmentAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>จำนวนงวด:</span>
                <span>{receipt.received?.installmentCount}</span>
              </div>
            </>
          )}

          {receipt.paymentMethod === 'qrcode' && (
            <div className="flex justify-center py-2">
              <img 
                src="/images/qrcode.jpg"
                alt="QR Code" 
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDE2MCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIiBmaWxsPSIjZjNmNGY2Ii8+CjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8dGV4dCB4PSI4MCIgeT0iODUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjczODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiI+UVIgQ29kZTwvdGV4dD4KPC9zdmc+';
                }}
              />
            </div>
          )}
        </div>

        <hr className="border-black" />

        <p className="text-center text-black py-1 print:py-0.5 print:text-xs flex-shrink-0">ขอบคุณที่ใช้บริการ 🙏</p>

        {/* Buttons */}
        <div className="flex gap-2 p-2 no-print flex-shrink-0">
          <button
            onClick={onPrint}
            className="flex-1 bg-blue-600 text-white py-1.5 rounded hover:bg-blue-700 text-xs"
          >
            พิมพ์บิล
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white py-1.5 rounded hover:bg-gray-600 text-xs"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
