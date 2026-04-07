import React, { useState, useEffect } from 'react';

export default function TaxInvoiceForm({ onConfirm, onCancel }) {
  const getSavedCustomers = () => {
    try {
      return JSON.parse(localStorage.getItem('savedCustomers')) || {};
    } catch {
      return {};
    }
  };

  const [formData, setFormData] = useState({
    customerName: '',
    taxId: '',
    addressNo: '',
    street: '',
    subdistrict: '',
    district: '',
    province: '',
    postalCode: '',
    phone: '',
    email: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    country: 'ไทย',
    useStructure: true,
    isEnglish: false,
    vatIncluded: false
  });

  // Auto-fill เมื่อพิมพ์ชื่อลูกค้าที่เคยกรอกไว้
  useEffect(() => {
    const saved = getSavedCustomers();
    const match = saved[formData.customerName];
    if (match) {
      setFormData(prev => ({
        ...prev,
        ...match,
        customerName: prev.customerName // อย่าทับชื่อที่กรอกอยู่
      }));
    }
  }, [formData.customerName]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.customerName || !formData.taxId) {
      alert('กรุณากรอกชื่อและเลขผู้เสียภาษี');
      return;
    }

    // บันทึกลูกค้าไว้
    const saved = getSavedCustomers();
    saved[formData.customerName] = {
      taxId: formData.taxId,
      addressNo: formData.addressNo,
      street: formData.street,
      subdistrict: formData.subdistrict,
      district: formData.district,
      province: formData.province,
      postalCode: formData.postalCode,
      phone: formData.phone,
      email: formData.email,
      country: formData.country,
      vatIncluded: formData.vatIncluded
    };
    localStorage.setItem('savedCustomers', JSON.stringify(saved));

    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-xl p-6 shadow-lg text-sm m-4">
        <div className="flex justify-between border-b pb-2 mb-4">
          <div>
            <h2 className="text-lg font-bold">สมบัติเกษตรยนต์</h2>
            <p className="text-xs text-gray-700">
              207 หมู่ 15 ถ.โชตนา อ.เชียงดาว ต.เชียงดาว จ.เชียงใหม่ 50170<br />
              โทร. 089-560-8118 อีเมล renuthonkong@gmail.com<br />
              เลขประจำตัวผู้เสียภาษี 1463315038
            </p>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-bold text-blue-700">ใบเสร็จรับเงิน/ใบกำกับภาษี</h3>
            <p className="text-xs text-gray-500">Receipt/Tax Invoice</p>
            <div className="mt-2">
              <label className="block font-medium mt-2">วันที่ *</label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={handleChange('invoiceDate')}
                className="border px-3 py-1 rounded w-full"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block font-medium">ชื่อลูกค้า *</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={handleChange('customerName')}
              className="w-full border px-3 py-2 rounded"
              placeholder="กรอกชื่อลูกค้า"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium">เลขที่</label>
                <input 
                  type="text" 
                  value={formData.addressNo} 
                  onChange={handleChange('addressNo')} 
                  className="w-full border px-3 py-2 rounded" 
                  placeholder="เลขที่บ้าน"
                />
              </div>
              <div>
                <label className="block font-medium">ถนน</label>
                <input 
                  type="text" 
                  value={formData.street} 
                  onChange={handleChange('street')} 
                  className="w-full border px-3 py-2 rounded" 
                  placeholder="ชื่อถนน"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-medium">ตำบล</label>
                <input 
                  type="text" 
                  value={formData.subdistrict} 
                  onChange={handleChange('subdistrict')} 
                  className="w-full border px-3 py-2 rounded"
                  placeholder="ตำบล" 
                />
              </div>
              <div>
                <label className="block font-medium">อำเภอ</label>
                <input 
                  type="text" 
                  value={formData.district} 
                  onChange={handleChange('district')} 
                  className="w-full border px-3 py-2 rounded"
                  placeholder="อำเภอ" 
                />
              </div>
              <div>
                <label className="block font-medium">จังหวัด</label>
                <input 
                  type="text" 
                  value={formData.province} 
                  onChange={handleChange('province')} 
                  className="w-full border px-3 py-2 rounded"
                  placeholder="จังหวัด" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium">รหัสไปรษณีย์</label>
                <input 
                  type="text" 
                  value={formData.postalCode} 
                  onChange={handleChange('postalCode')} 
                  className="w-full border px-3 py-2 rounded"
                  placeholder="รหัสไปรษณีย์" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-medium">ประเทศ *</label>
            <input 
              type="text" 
              value={formData.country} 
              onChange={handleChange('country')} 
              className="w-full border px-3 py-2 rounded" 
            />

            <label className="block font-medium">เลขประจำตัวผู้เสียภาษี *</label>
            <input 
              type="text" 
              value={formData.taxId} 
              onChange={handleChange('taxId')} 
              className="w-full border px-3 py-2 rounded"
              placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก" 
            />

            <label className="block font-medium">โทรศัพท์</label>
            <input 
              type="text" 
              value={formData.phone} 
              onChange={handleChange('phone')} 
              className="w-full border px-3 py-2 rounded"
              placeholder="เบอร์โทรศัพท์" 
            />

            <label className="block font-medium">อีเมล</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={handleChange('email')} 
              className="w-full border px-3 py-2 rounded"
              placeholder="อีเมล" 
            />

            <div className="flex items-center gap-2 mt-4 p-3 bg-gray-50 rounded">
              <input 
                type="checkbox" 
                id="vatIncluded"
                checked={formData.vatIncluded} 
                onChange={handleChange('vatIncluded')} 
                className="w-4 h-4"
              />
              <label htmlFor="vatIncluded" className="font-medium flex-1">
                ราคารวมภาษีมูลค่าเพิ่มแล้ว (VAT Included)
              </label>
              <span className={`text-sm px-2 py-1 rounded ${
                formData.vatIncluded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {formData.vatIncluded ? 'เปิด' : 'ปิด'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button 
            onClick={onCancel} 
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            ✅ สร้างใบกำกับภาษี
          </button>
        </div>
      </div>
    </div>
  );
}