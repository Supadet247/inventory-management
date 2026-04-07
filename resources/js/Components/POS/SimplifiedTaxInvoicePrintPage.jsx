import React from 'react';

export default function SimplifiedTaxInvoicePrintPage({ receipt }) {
  // Format number with thousand separators
  const formatNumber = (num) => {
    return parseFloat(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  return (
    <div
      className="print-area font-mono text-[12px] mx-auto"
      style={{
        width: '58mm',
        padding: '10px',
        backgroundColor: 'white',
        printColorAdjust: 'exact'
      }}
    >
      <div className="text-center border-b border-dashed pb-2 mb-2">
        <h2 className="font-bold text-sm">ใบกำกับภาษีอย่างย่อ</h2>
        <p className="text-xs">ร้าน สมบัติเกษตรยนต์</p>
        <p className="text-xs">เลขประจำตัวผู้เสียภาษี: 1463315038</p>
        <p className="text-xs">โทร: 089-560-8118</p>
      </div>

      <p className="text-xs">เลขที่: {receipt.id}</p>
      <p className="text-xs">วันที่: {receipt.date}</p>

      <hr className="my-2 border-dashed" />

      {receipt.items.map((item, index) => (
        <div key={index} className="flex justify-between text-xs mb-1">
          <div className="flex-1">
            <p className="truncate">{item.name}</p>
            <p className="text-gray-600">{item.quantity} × ฿{formatNumber(item.price)}</p>
          </div>
          <p className="ml-2">฿{formatNumber(item.price * item.quantity)}</p>
        </div>
      ))}

      <hr className="my-2 border-dashed" />

      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>รวม:</span>
          <span>฿{formatNumber(receipt.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT 7%:</span>
          <span>฿{formatNumber(receipt.tax)}</span>
        </div>
        <div className="flex justify-between font-bold border-t pt-1">
          <span>รวมสุทธิ:</span>
          <span>฿{formatNumber(receipt.grandTotal)}</span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-2 border-t border-dashed pt-2">
        <p>ราคานี้รวมภาษีมูลค่าเพิ่มแล้ว</p>
        <p>(VAT Included)</p>
      </div>

      <p className="text-center text-gray-600 text-xs mt-4">ขอบคุณที่อุดหนุน 🙏</p>
    </div>
  );
}