import React from 'react';

export default function TaxInvoicePrintPage({ receipt, taxInfo }) {
  const formatCurrency = (amt) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amt);

  return (
    <div className="p-8 max-w-4xl mx-auto text-sm print:text-xs" id="print-area">
      <div className="border p-6 rounded shadow print-area">
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="flex gap-4 items-start">
            <img
              src="/images/logo.jpg"
              alt="Company Logo"
              className="w-28 h-auto mb-2"
              onError={(e) => (e.target.style.display = 'none')}
            />
            <div>
              <p className="font-bold text-base">สมบัติเกษตรยนต์</p>
              <p className="text-xs">
                207 หมู่ 15 ต.เชียงดาว อ.เชียงดาว จ.เชียงใหม่ 50170
              </p>
              <p className="text-xs">
                โทร. 089-560-8118 | LINE: 089-560-8118
              </p>
              <p className="text-xs">
                เลขประจำตัวผู้เสียภาษี 1463315038
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-blue-800">
              ใบเสร็จรับเงิน/ใบกำกับภาษี
            </h2>
            <p className="text-xs text-gray-700">Receipt/Tax Invoice</p>
            <div className="mt-2 text-sm">
              <p><span className="font-semibold">เลขที่:</span> {receipt?.invoiceNumber || `TXN${receipt?.id}`}</p>
              <p><span className="font-semibold">วันที่:</span> {receipt?.date}</p>
            </div>
          </div>
        </div>

        <hr className="my-4 border-t" />

        {/* CUSTOMER INFO */}
        <div className="mb-4 text-sm">
          <p><span className="font-semibold">ลูกค้า:</span> {taxInfo?.customerName || '-'}</p>
          <p><span className="font-semibold">ที่อยู่:</span>{' '}
            {taxInfo?.addressNo && `${taxInfo.addressNo} `}
            {taxInfo?.street && `ถนน${taxInfo.street} `}
            {taxInfo?.subdistrict && `ต.${taxInfo.subdistrict} `}
            {taxInfo?.district && `อ.${taxInfo.district} `}
            {taxInfo?.province && `จ.${taxInfo.province} `}
            {taxInfo?.postalCode || ''}
          </p>
          <p><span className="font-semibold">เลขประจำตัวผู้เสียภาษี:</span> {taxInfo?.taxId || '-'}</p>
          <p><span className="font-semibold">อีเมล:</span> {taxInfo?.email || '-'}</p>
          <p><span className="font-semibold">โทร:</span> {taxInfo?.phone || '-'}</p>
        </div>

        {/* ITEM TABLE */}
        <table className="w-full text-sm border border-collapse">
          <thead>
            <tr className="bg-gray-100 border">
              <th className="border px-2 py-1">ลำดับ</th>
              <th className="border px-2 py-1 text-left">รายการ</th>
              <th className="border px-2 py-1">จำนวน</th>
              <th className="border px-2 py-1">หน่วย</th>
              <th className="border px-2 py-1">ราคาต่อหน่วย</th>
              <th className="border px-2 py-1">รวม</th>
            </tr>
          </thead>
          <tbody>
            {receipt?.items?.map((item, index) => (
              <tr key={item.id}>
                <td className="border px-2 py-1 text-center">{index + 1}</td>
                <td className="border px-2 py-1">{item.name}</td>
                <td className="border px-2 py-1 text-center">{item.quantity}</td>
                <td className="border px-2 py-1 text-center">{item.unit || 'ชิ้น'}</td>
                <td className="border px-2 py-1 text-right">{formatCurrency(item.price)}</td>
                <td className="border px-2 py-1 text-right">
                  {formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAL */}
        <div className="mt-4 text-right space-y-1">
          {receipt?.vatIncluded ? (
            <>
              <p>ราคารวม (รวม VAT แล้ว): {formatCurrency(receipt.total || 0)}</p>
              <p>ภาษีที่รวมอยู่แล้ว (7%): {formatCurrency(receipt.tax || 0)}</p>
              <p className="text-lg font-bold text-black">
                รวมทั้งสิ้น: {formatCurrency(receipt.grandTotal || 0)}
              </p>
            </>
          ) : (
            <>
              <p>ราคารวมสินค้า (ไม่รวม VAT): {formatCurrency(receipt.total || 0)}</p>
              <p>ภาษี 7%: {formatCurrency(receipt.tax || 0)}</p>
              <p className="text-lg font-bold text-black">
                รวมทั้งสิ้น (รวม VAT): {formatCurrency(receipt.grandTotal || 0)}
              </p>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-6">
          <p className="text-xs text-gray-500 text-center mb-2">
            ขอบคุณที่ใช้บริการ 🙏
          </p>
          <div className="flex justify-between mt-6">
            <div className="text-sm text-center w-1/2">
              <p className="mb-12">.................................</p>
              <p>ลายเซ็นผู้รับเงิน</p>
            </div>
            <div className="text-sm text-center w-1/2">
              <p className="mb-12">.................................</p>
              <p>ลายเซ็นผู้มีอำนาจลงนาม</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}