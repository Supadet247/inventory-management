import { useState, useEffect } from 'react';

export default function CostPerAreaCalculator({ onShowNotification, apiBasePath = '/admin/calculator' }) {
    // State
    const [monthlyData, setMonthlyData] = useState(
        Array(12).fill(null).map(() => ({ electricity: '', water: '', labor: '' }))
    );
    const [landCost, setLandCost] = useState('');
    const [usageYears, setUsageYears] = useState(10);
    const [storeSize, setStoreSize] = useState('');
    const [calculationName, setCalculationName] = useState('');
    const [result, setResult] = useState(null);
    const [savedCalculations, setSavedCalculations] = useState([]);
    const [showSavedCalculations, setShowSavedCalculations] = useState(false);

    // Load saved calculations list
    const loadSavedCalculations = async () => {
        try {
            const response = await fetch(`${apiBasePath}/cost-per-area-history`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setSavedCalculations(data);
                    setShowSavedCalculations(true);
                } else {
                    onShowNotification?.('ข้อมูลไม่ถูกต้อง', 'error');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                onShowNotification?.(errorData.error || `เกิดข้อผิดพลาด: ${response.status}`, 'error');
            }
        } catch (error) {
            console.error('Error loading saved calculations:', error);
            onShowNotification?.('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
        }
    };

    // Load a specific calculation
    const loadCalculation = (calc) => {
        setLandCost(calc.land_cost?.toString() || '');
        setUsageYears(calc.usage_years?.toString() || '10');
        setStoreSize(calc.store_size?.toString() || '');
        setCalculationName(calc.calculation_name || '');
        if (calc.monthly_data) {
            setMonthlyData(calc.monthly_data.map(m => ({
                electricity: m.electricity?.toString() || '',
                water: m.water?.toString() || '',
                labor: m.labor?.toString() || ''
            })));
        }
        // Set calculation result from saved data
        setResult({
            monthlyTotals: calc.monthly_data?.map(m => 
                (parseFloat(m.electricity) || 0) + 
                (parseFloat(m.water) || 0) + 
                (parseFloat(m.labor) || 0)
            ) || [],
            totalMonthlyCost: calc.total_monthly_cost || 0,
            avgAnnualStoreCost: calc.avg_annual_store_cost || 0,
            totalStorageCost: calc.total_storage_cost || 0,
            avgMonthlyStorageCost: calc.avg_monthly_storage_cost || 0,
            costPerSquareMeter: calc.cost_per_square_meter || 0
        });
        setShowSavedCalculations(false);
    };

    // Handle monthly data change
    const handleMonthlyDataChange = (index, field, value) => {
        const newData = [...monthlyData];
        newData[index][field] = value;
        setMonthlyData(newData);
    };

    // Calculate cost per area
    const calculate = () => {
        const land = parseFloat(landCost) || 0;
        const years = parseInt(usageYears) || 1;
        const size = parseFloat(storeSize) || 0;

        if (size <= 0) {
            setResult({ error: 'กรุณากรอกขนาดของร้าน' });
            return;
        }

        // Calculate monthly totals
        const monthlyTotals = monthlyData.map(data => 
            (parseFloat(data.electricity) || 0) + 
            (parseFloat(data.water) || 0) + 
            (parseFloat(data.labor) || 0)
        );

        const totalMonthlyCost = monthlyTotals.reduce((sum, val) => sum + val, 0);
        const avgAnnualStoreCost = land / years;
        const totalStorageCost = totalMonthlyCost + avgAnnualStoreCost;
        const avgMonthlyStorageCost = totalStorageCost / 12;
        const costPerSquareMeter = avgMonthlyStorageCost / size;

        setResult({
            monthlyTotals,
            totalMonthlyCost,
            avgAnnualStoreCost,
            totalStorageCost,
            avgMonthlyStorageCost,
            costPerSquareMeter
        });
        onShowNotification?.('คำนวณ Cost Per Area สำเร็จ', 'success');
    };

    // Save calculation
    const save = async () => {
        if (!result || result.error) return;

        try {
            const response = await fetch(`${apiBasePath}/save-cost-per-area`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                },
                body: JSON.stringify({
                    monthly_data: monthlyData,
                    land_cost: parseFloat(landCost),
                    usage_years: parseInt(usageYears),
                    store_size: parseFloat(storeSize),
                    total_monthly_cost: result.totalMonthlyCost,
                    avg_annual_store_cost: result.avgAnnualStoreCost,
                    total_storage_cost: result.totalStorageCost,
                    avg_monthly_storage_cost: result.avgMonthlyStorageCost,
                    cost_per_square_meter: result.costPerSquareMeter,
                    calculation_name: calculationName
                })
            });

            if (response.ok) {
                onShowNotification?.('บันทึกข้อมูลสำเร็จ', 'success');
            } else {
                onShowNotification?.('บันทึกข้อมูลไม่สำเร็จ', 'error');
            }
        } catch (error) {
            console.error('Error saving:', error);
            onShowNotification?.('เกิดข้อผิดพลาด', 'error');
        }
    };

    // Reset form
    const reset = () => {
        setMonthlyData(Array(12).fill(null).map(() => ({ electricity: '', water: '', labor: '' })));
        setLandCost('');
        setUsageYears(10);
        setStoreSize('');
        setCalculationName('');
        setResult(null);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">คำนวณต้นทุนต่อพื้นที่</h3>
                <p className="text-sm text-gray-600 mt-1">คำนวณต้นทุนการดำเนินงานเฉลี่ยต่อตารางเมตร</p>
            </div>
            <div className="p-6">
                {/* Load Data Button */}
                <div className="mb-6">
                    <button
                        onClick={loadSavedCalculations}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ดูข้อมูลที่บันทึกไว้
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div>
                        <div className="space-y-6">
                            {/* Monthly Data Table */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">ข้อมูลรายเดือน (12 เดือน)</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เดือน</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าไฟ (บาท)</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าน้ำ (บาท)</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าจ้าง (บาท)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {monthlyData.map((data, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">เดือน {index + 1}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            value={data.electricity}
                                                            onChange={(e) => handleMonthlyDataChange(index, 'electricity', e.target.value)}
                                                            onWheel={(e) => e.target.blur()}
                                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            value={data.water}
                                                            onChange={(e) => handleMonthlyDataChange(index, 'water', e.target.value)}
                                                            onWheel={(e) => e.target.blur()}
                                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            value={data.labor}
                                                            onChange={(e) => handleMonthlyDataChange(index, 'labor', e.target.value)}
                                                            onWheel={(e) => e.target.blur()}
                                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm hide-spin-buttons"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Other Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ต้นทุนสร้างร้านรวมที่ดิน (บาท)
                                    </label>
                                    <input
                                        type="number"
                                        value={landCost}
                                        onChange={(e) => setLandCost(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hide-spin-buttons"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        อายุการใช้งาน (ปี)
                                    </label>
                                    <input
                                        type="number"
                                        value={usageYears}
                                        onChange={(e) => setUsageYears(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        min="1"
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hide-spin-buttons"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ขนาดของร้าน (ตารางเมตร)
                                    </label>
                                    <input
                                        type="number"
                                        value={storeSize}
                                        onChange={(e) => setStoreSize(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hide-spin-buttons"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Calculation Name */}
                            {result && !result.error && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ชื่อการคำนวณ (ไม่บังคับ)
                                    </label>
                                    <input
                                        type="text"
                                        value={calculationName}
                                        onChange={(e) => setCalculationName(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="เช่น คำนวณประจำเดือน มกราคม 2026"
                                    />
                                </div>
                            )}

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={calculate}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition duration-200"
                                >
                                    คำนวณต้นทุนต่อพื้นที่
                                </button>
                                <button
                                    onClick={reset}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2.5 rounded-lg transition duration-200"
                                >
                                    ล้างข้อมูล
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div>
                        <div className="bg-blue-50 rounded-lg p-5 h-full">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-blue-900">ผลลัพธ์การคำนวณ</h4>
                                {calculationName && (
                                    <span className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                        {calculationName}
                                    </span>
                                )}
                            </div>
                            
                            {result && !result.error ? (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600">ต้นทุนต่อตารางเมตร/เดือน</p>
                                            <p className="text-2xl font-bold text-blue-600 mt-1">{parseFloat(result.costPerSquareMeter).toFixed(2)} บาท/ตร.ม./เดือน</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="text-xs text-gray-500">ยอดรวม 12 เดือน</p>
                                            <p className="font-medium">{parseFloat(result.totalMonthlyCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="text-xs text-gray-500">ค่าสร้างร้านเฉลี่ย/ปี</p>
                                            <p className="font-medium">{parseFloat(result.avgAnnualStoreCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/ปี</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="text-xs text-gray-500">รวมค่าใช้จ่ายในการจัดเก็บ/ปี</p>
                                            <p className="font-medium">{parseFloat(result.totalStorageCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/ปี</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <p className="text-xs text-gray-500">เฉลี่ยค่าใช้จ่ายในการจัดเก็บ/เดือน</p>
                                            <p className="font-medium">{parseFloat(result.avgMonthlyStorageCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/เดือน</p>
                                        </div>
                                    </div>
                                    
                                    {/* Monthly storage costs */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm mt-4">
                                        <h5 className="font-medium text-gray-900 mb-2">ค่าใช้จ่ายในการจัดเก็บ รวมของแต่ละเดือน</h5>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {result.monthlyTotals.map((total, index) => (
                                                <div key={index} className="text-center p-2 bg-gray-50 rounded">
                                                    <p className="text-xs text-gray-500">เดือน {index + 1}</p>
                                                    <p className="font-medium">{parseFloat(total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        onClick={save}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition duration-200"
                                    >
                                        บันทึกผลการคำนวณ
                                    </button>
                                    
                                    <div className="text-xs text-gray-600 mt-3">
                                        <p className="font-medium mb-1">สูตรที่ใช้:</p>
                                        <p className="font-mono">ค่าสร้างร้านเฉลี่ย = ต้นทุนสร้างร้าน/อายุการใช้งาน</p>
                                        <p className="font-mono">รวมค่าใช้จ่ายในการจัดเก็บ = ยอดรวม 12 เดือน + ค่าสร้างร้านเฉลี่ย</p>
                                        <p className="font-mono">เฉลี่ยค่าใช้จ่ายในการจัดเก็บ = รวมค่าใช้จ่ายในการจัดเก็บ/12</p>
                                        <p className="font-mono">ค่าใช้จ่ายในการจัดเก็บ = เฉลี่ยค่าใช้จ่ายในการจัดเก็บ/ขนาดของร้าน</p>
                                    </div>
                                </div>
                            ) : result?.error ? (
                                <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center">
                                    <p className="text-red-700">{result.error}</p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="mt-3 text-sm text-blue-800">กรุณากรอกข้อมูลเพื่อคำนวณต้นทุนต่อพื้นที่</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Saved Calculations Modal */}
            {showSavedCalculations && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">ข้อมูลต้นทุนต่อพื้นที่ที่บันทึกไว้</h3>
                            <button
                                onClick={() => setShowSavedCalculations(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {savedCalculations.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">ไม่มีข้อมูลที่บันทึกไว้</p>
                            ) : (
                                <div className="space-y-3">
                                    {savedCalculations.map((calc) => (
                                        <div
                                            key={calc.id}
                                            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
                                            onClick={() => loadCalculation(calc)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {calc.calculation_name || `คำนวณ #${calc.id}`}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(calc.created_at).toLocaleDateString('th-TH')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">
                                                        {parseFloat(calc.cost_per_square_meter).toFixed(2)} บาท/ตร.ม.
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {calc.store_size} ตร.ม.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowSavedCalculations(false)}
                                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2.5 rounded-lg transition duration-200"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
