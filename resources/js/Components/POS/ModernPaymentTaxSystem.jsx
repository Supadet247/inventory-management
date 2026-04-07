import React, { useState, useEffect } from 'react';
import {
  CreditCard, Check, QrCode, Wallet, X, Calendar
} from 'lucide-react';

const paymentChannels = [
  {
    id: 'cash',
    name: 'เงินสด',
    description: 'รับเงินสดจากลูกค้า',
    icon: Wallet,
    color: 'from-gray-500 to-gray-700'
  },
  {
    id: 'promptpay',
    name: 'พร้อมเพย์',
    description: 'สแกน QR Code เพื่อชำระ',
    icon: QrCode,
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'mixed',
    name: 'เงินสด + โอน',
    description: 'ชำระบางส่วนด้วยเงินสดและโอนที่เหลือ',
    icon: Wallet,
    color: 'from-yellow-500 to-orange-600'
  },
  {
    id: 'installment',
    name: 'ผ่อนชำระ',
    description: 'ผ่อนชำระสินค้า 3-5 งวด',
    icon: Calendar,
    color: 'from-purple-500 to-pink-600'
  }
];

export default function ModernPaymentTaxSystem({ totalAmount, cartItems, onClose, onFinish }) {
  const [channel, setChannel] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Installment fields
  const [installmentData, setInstallmentData] = useState({
    customerName: '',
    customerPhone: '',
    idCardNumber: '',
    downPaymentPercent: '30',
    installmentCount: '3',
    installmentStartDate: new Date().toISOString().split('T')[0]
  });
  const [installmentErrors, setInstallmentErrors] = useState({});

  const netAmount = parseFloat((totalAmount * 1.07).toFixed(2));

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amt);

  // Calculate interest based on down payment percentage and installment count
  const calculateInterest = (percent, count) => {
    // 50% = 0% interest always
    if (percent >= 50) {
      return { rate: 0, totalInterest: 0, description: 'ดอกเบี้ย 0% (เงินดาวน์ 50%)' };
    }
    
    // 45% = 0% for 1-2 installments, 1% for months 3-5
    if (percent === 45) {
      if (count <= 2) {
        return { rate: 0, totalInterest: 0, description: 'ดอกเบี้ย 0% (1-2 งวด)' };
      }
      // Months 3, 4, 5 have 1% interest
      const interestMonths = count - 2;
      const interestRate = 1;
      const totalInterest = interestRate * interestMonths;
      return { 
        rate: interestRate, 
        totalInterest, 
        description: `ดอกเบี้ย ${interestRate}% x ${interestMonths} งวด = ${totalInterest}%` 
      };
    }
    
    // 40% = 0% for 1 installment, 1.5% for months 2-5
    if (percent === 40) {
      if (count === 1) {
        return { rate: 0, totalInterest: 0, description: 'ดอกเบี้ย 0% (1 งวด)' };
      }
      const interestMonths = count - 1;
      const interestRate = 1.5;
      const totalInterest = interestRate * interestMonths;
      return { 
        rate: interestRate, 
        totalInterest, 
        description: `ดอกเบี้ย ${interestRate}% x ${interestMonths} งวด = ${totalInterest}%` 
      };
    }
    
    // 35% = 0% for 1 installment, 1.75% for months 2-5
    if (percent === 35) {
      if (count === 1) {
        return { rate: 0, totalInterest: 0, description: 'ดอกเบี้ย 0% (1 งวด)' };
      }
      const interestMonths = count - 1;
      const interestRate = 1.75;
      const totalInterest = interestRate * interestMonths;
      return { 
        rate: interestRate, 
        totalInterest, 
        description: `ดอกเบี้ย ${interestRate}% x ${interestMonths} งวด = ${totalInterest}%` 
      };
    }
    
    // 30% = 0% for 1 installment, 2% for months 2-5
    if (percent === 30) {
      if (count === 1) {
        return { rate: 0, totalInterest: 0, description: 'ดอกเบี้ย 0% (1 งวด)' };
      }
      const interestMonths = count - 1;
      const interestRate = 2;
      const totalInterest = interestRate * interestMonths;
      return { 
        rate: interestRate, 
        totalInterest, 
        description: `ดอกเบี้ย ${interestRate}% x ${interestMonths} งวด = ${totalInterest}%` 
      };
    }
    
    return { rate: 0, totalInterest: 0, description: 'ดอกเบี้ย 0%' };
  };

  // Calculate installment details
  const getInstallmentDetails = () => {
    const percent = parseFloat(installmentData.downPaymentPercent) || 30;
    const count = parseInt(installmentData.installmentCount) || 3;
    const downPayment = netAmount * (percent / 100);
    const remaining = netAmount - downPayment;
    
    // Calculate interest
    const interest = calculateInterest(percent, count);
    
    // Calculate total with interest
    const totalWithInterest = remaining * (1 + interest.totalInterest / 100);
    const interestAmount = totalWithInterest - remaining;
    const perInstallment = totalWithInterest / count;
    
    return {
      downPayment,
      remaining,
      perInstallment,
      percent,
      count,
      interestRate: interest.rate,
      totalInterestPercent: interest.totalInterest,
      interestAmount,
      totalWithInterest,
      interestDescription: interest.description
    };
  };

  const installmentDetails = getInstallmentDetails();

  // คิดยอดโอนอัตโนมัติเมื่อพิมพ์เงินสด
  useEffect(() => {
    if (channel === 'mixed') {
      const cash = parseFloat(cashAmount || 0);
      const remaining = Math.max(0, netAmount - cash);
      setTransferAmount(Number(remaining.toFixed(2)));
    }
  }, [cashAmount, channel, netAmount]);

  const validateInstallment = () => {
    const errors = {};
    
    if (!installmentData.customerName.trim()) {
      errors.customerName = 'กรุณากรอกชื่อลูกค้า';
    }
    
    if (!installmentData.customerPhone.trim()) {
      errors.customerPhone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (installmentData.customerPhone.replace(/\D/g, '').length !== 10) {
      errors.customerPhone = 'เบอร์โทรศัพท์ต้องเป็น 10 ตัว';
    }
    
    if (!installmentData.idCardNumber.trim()) {
      errors.idCardNumber = 'กรุณากรอกรหัสบัตรประชาชน';
    } else if (installmentData.idCardNumber.replace(/\D/g, '').length !== 13) {
      errors.idCardNumber = 'รหัสบัตรประชาชนต้องเป็น 13 หลัก';
    }
    
    if (!installmentData.installmentStartDate) {
      errors.installmentStartDate = 'กรุณาเลือกวันที่เริ่มผ่อน';
    }

    setInstallmentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirm = async () => {
    if (!channel) return alert('เลือกช่องทางชำระเงิน');

    if (channel === 'cash' && (!receivedAmount || parseFloat(receivedAmount) < netAmount)) {
      return alert('รับเงินมาน้อยกว่ายอดสุทธิ');
    }

    if (channel === 'mixed') {
      const cash = parseFloat(cashAmount || 0);
      const transfer = parseFloat(transferAmount || 0);
      const totalPaid = cash + transfer;
      if (totalPaid < netAmount) return alert('ยอดชำระยังไม่ครบ');
    }

    if (channel === 'installment') {
      if (!validateInstallment()) {
        return;
      }
    }

    setIsProcessing(true);
    await new Promise((res) => setTimeout(res, 1000));

    const receiptData = {
      id: `TXN${Date.now()}`,
      date: new Date().toLocaleString('th-TH'),
      items: cartItems,
      total: Number(totalAmount.toFixed(2)),
      tax: Number((totalAmount * 0.07).toFixed(2)),
      grandTotal: Number((totalAmount * 1.07).toFixed(2)),
      paymentMethod: channel,
      received:
        channel === 'cash'
          ? Number(parseFloat(receivedAmount).toFixed(2))
          : channel === 'mixed'
          ? {
              cash: Number(parseFloat(cashAmount || 0).toFixed(2)),
              transfer: Number(parseFloat(transferAmount || 0).toFixed(2)),
              total: Number((parseFloat(cashAmount || 0) + parseFloat(transferAmount || 0)).toFixed(2))
            }
          : channel === 'installment'
          ? {
              downPayment: Number(installmentDetails.downPayment.toFixed(2)),
              downPaymentPercent: installmentDetails.percent,
              installmentAmount: Number(installmentDetails.perInstallment.toFixed(2)),
              installmentCount: installmentDetails.count,
              customerName: installmentData.customerName,
              customerPhone: installmentData.customerPhone,
              idCardNumber: installmentData.idCardNumber,
              installmentStartDate: installmentData.installmentStartDate,
              interestRate: installmentDetails.interestRate,
              totalInterestPercent: installmentDetails.totalInterestPercent,
              interestAmount: Number(installmentDetails.interestAmount.toFixed(2)),
              totalWithInterest: Number(installmentDetails.totalWithInterest.toFixed(2))
            }
          : null
    };

    onFinish(receiptData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg text-sm relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
        >
          <X />
        </button>

        <h2 className="text-lg font-bold mb-4">💳 ชำระเงิน</h2>

        <div className="mb-4">
          <div className="text-sm font-semibold">ยอดสุทธิ (รวม VAT):</div>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(netAmount)}</div>
        </div>

        <div className="space-y-3 mb-4">
          <label className="block text-sm font-semibold text-gray-700">
            วิธีการชำระเงิน
          </label>
          <div className="grid grid-cols-1 gap-3">
            {paymentChannels.map((ch) => {
              const Icon = ch.icon;
              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    setChannel(ch.id);
                    setReceivedAmount('');
                    setCashAmount('');
                    setTransferAmount('');
                    if (ch.id !== 'installment') {
                      setInstallmentErrors({});
                    }
                  }}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition ${
                    channel === ch.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:shadow'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${ch.color} flex items-center justify-center mr-4`}>
                      <Icon className="text-white w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{ch.name}</div>
                      <div className="text-sm text-gray-500">{ch.description}</div>
                    </div>
                    {channel === ch.id && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center ml-2">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {channel === 'promptpay' && (
          <div className="space-y-3 mb-4">
            <p className="text-sm font-semibold text-gray-700 text-center">
              สแกน QR Code เพื่อชำระเงิน
            </p>
            <div className="flex justify-center">
              <img
                src="/images/qrcode.jpg"
                alt="PromptPay QR Code"
                className="w-56 h-56 object-contain rounded-xl border border-gray-200 shadow"
              />
            </div>
            <p className="text-center text-green-600 font-bold text-xl">
              {formatCurrency(netAmount)}
            </p>
            <p className="text-center text-sm text-gray-500">
              กรุณาสแกน QR Code ด้านบนเพื่อชำระเงิน
            </p>
          </div>
        )}

        {channel === 'cash' && (
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-semibold text-gray-700">
              รับเงินมา (บาท)
            </label>
            <input
              type="number"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              onWheel={(e) => e.target.blur()}
              className="w-full px-3 py-2 border rounded"
              placeholder="เช่น 100"
            />
            {receivedAmount && (
              <p className="text-green-600 font-semibold">
                เงินทอน: {formatCurrency(receivedAmount - netAmount)}
              </p>
            )}
          </div>
        )}

        {channel === 'mixed' && (
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-semibold text-gray-700">
              รับเงินสด (บาท)
            </label>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              onWheel={(e) => e.target.blur()}
              className="w-full px-3 py-2 border rounded"
              placeholder="เช่น 300"
            />

            <label className="block text-sm font-semibold text-gray-700">
              โอนเงิน (บาท)
            </label>
            <input
              type="number"
              value={transferAmount}
              readOnly
              className="w-full px-3 py-2 border rounded bg-gray-100"
              placeholder="ระบบจะคำนวณให้อัตโนมัติ"
            />

            {(cashAmount || transferAmount) && (
              <>
                <p className="text-green-600 font-semibold">
                  รวมชำระ: {formatCurrency(parseFloat(cashAmount || 0) + parseFloat(transferAmount || 0))}
                </p>
                <p className="text-green-700 font-semibold">
                  เงินทอน: {formatCurrency(
                    (parseFloat(cashAmount || 0) + parseFloat(transferAmount || 0)) - netAmount
                  )}
                </p>
              </>
            )}
          </div>
        )}

        {channel === 'installment' && (
          <div className="space-y-4 mb-4 bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">📋 ข้อมูลการผ่อนชำระ</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ-นามสกุลลูกค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={installmentData.customerName}
                onChange={(e) => setInstallmentData({...installmentData, customerName: e.target.value})}
                className={`w-full px-3 py-2 border rounded ${installmentErrors.customerName ? 'border-red-500' : ''}`}
                placeholder="กรอกชื่อ-นามสกุล"
              />
              {installmentErrors.customerName && (
                <p className="text-red-500 text-xs mt-1">{installmentErrors.customerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทรศัพท์ (10 ตัว) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={installmentData.customerPhone}
                onChange={(e) => setInstallmentData({...installmentData, customerPhone: e.target.value})}
                maxLength={10}
                className={`w-full px-3 py-2 border rounded ${installmentErrors.customerPhone ? 'border-red-500' : ''}`}
                placeholder="08xxxxxxxx"
              />
              {installmentErrors.customerPhone && (
                <p className="text-red-500 text-xs mt-1">{installmentErrors.customerPhone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสบัตรประชาชน (13 หลัก) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={installmentData.idCardNumber}
                onChange={(e) => setInstallmentData({...installmentData, idCardNumber: e.target.value})}
                maxLength={13}
                className={`w-full px-3 py-2 border rounded ${installmentErrors.idCardNumber ? 'border-red-500' : ''}`}
                placeholder="1xxxxxxxxxxxxx"
              />
              {installmentErrors.idCardNumber && (
                <p className="text-red-500 text-xs mt-1">{installmentErrors.idCardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เงินดาวน์ <span className="text-red-500">*</span>
                </label>
                <select
                  value={installmentData.downPaymentPercent}
                  onChange={(e) => setInstallmentData({...installmentData, downPaymentPercent: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="30">30%</option>
                  <option value="35">35%</option>
                  <option value="40">40%</option>
                  <option value="45">45%</option>
                  <option value="50">50%</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนงวด <span className="text-red-500">*</span>
                </label>
                <select
                  value={installmentData.installmentCount}
                  onChange={(e) => setInstallmentData({...installmentData, installmentCount: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="1">1 งวด</option>
                  <option value="2">2 งวด</option>
                  <option value="3">3 งวด</option>
                  <option value="4">4 งวด</option>
                  <option value="5">5 งวด</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่เริ่มผ่อน <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={installmentData.installmentStartDate}
                onChange={(e) => setInstallmentData({...installmentData, installmentStartDate: e.target.value})}
                className={`w-full px-3 py-2 border rounded ${installmentErrors.installmentStartDate ? 'border-red-500' : ''}`}
              />
              {installmentErrors.installmentStartDate && (
                <p className="text-red-500 text-xs mt-1">{installmentErrors.installmentStartDate}</p>
              )}
            </div>

            {/* Installment Summary */}
            <div className="bg-white p-3 rounded border border-purple-200">
              <h4 className="font-medium text-gray-800 mb-2">สรุปการผ่อนชำระ</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ยอดสินค้ารวม VAT:</span>
                  <span className="font-medium">{formatCurrency(netAmount)}</span>
                </div>
                <div className="flex justify-between text-purple-600">
                  <span>เงินดาวน์ {installmentDetails.percent}%:</span>
                  <span className="font-bold">{formatCurrency(installmentDetails.downPayment)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>ยอดค้างผ่อน (ก่อนดอกเบี้ย):</span>
                  <span className="font-bold">{formatCurrency(installmentDetails.remaining)}</span>
                </div>
                {installmentDetails.totalInterestPercent > 0 ? (
                  <>
                    <div className="flex justify-between text-red-500">
                      <span>ดอกเบี้ย {installmentDetails.totalInterestPercent}%:</span>
                      <span className="font-bold">+{formatCurrency(installmentDetails.interestAmount)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600 font-semibold border-t pt-1">
                      <span>ยอดค้างผ่อน (รวมดอกเบี้ย):</span>
                      <span className="font-bold">{formatCurrency(installmentDetails.totalWithInterest)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-green-600">
                    <span>ไม่มีดอกเบี้ย:</span>
                    <span className="font-bold">0%</span>
                  </div>
                )}
                <div className="flex justify-between text-green-600 font-semibold border-t pt-1">
                  <span>งวดละ ({installmentDetails.count} งวด):</span>
                  <span className="font-bold">{formatCurrency(installmentDetails.perInstallment)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                  {installmentDetails.interestDescription}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!channel || isProcessing}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {isProcessing ? 'กำลังประมวลผล...' : 'ชำระเงิน'}
        </button>
      </div>
    </div>
  );
}
