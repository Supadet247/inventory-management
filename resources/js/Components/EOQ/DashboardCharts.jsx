import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Line, Cell
} from 'recharts';

export default function DashboardCharts({ productsWithEoq, formatCurrency, formatNumber }) {
    // ============ ข้อมูลกราฟ 1: Stock vs Reorder Point (สินค้าขายดี 10 อันดับ) ============
    const stockVsReorderData = useMemo(() => {
        if (!productsWithEoq.data) return [];
        
        // เรียงตามยอดขายมากไปน้อย และเลือก 10 อันดับแรก
        return productsWithEoq.data
            .filter(product => product.eoq_calculation) // เฉพาะที่มี EOQ
            .sort((a, b) => (b.sale_items_sum_quantity || 0) - (a.sale_items_sum_quantity || 0))
            .slice(0, 10)
            .map(product => ({
                name: (product.sku || 'N/A').substring(0, 10),
                fullName: (product.name || 'N/A').substring(0, 20),
                current: product.quantity || 0,
                reorder: product.eoq_calculation?.reorder_point ? Math.round(product.eoq_calculation.reorder_point) : 0,
                status: (product.quantity || 0) > (product.eoq_calculation?.reorder_point || 0) ? 'safe' : 'low',
            }));
    }, [productsWithEoq]);

    // ============ ข้อมูลกราฟ 2: Top 5 EOQ Value ============
    const topEoqData = useMemo(() => {
        if (!productsWithEoq.data) return [];
        
        const sortedByValue = productsWithEoq.data
            .filter(p => p.eoq_calculation)
            .map(product => ({
                name: (product.sku || 'N/A').substring(0, 10),
                fullName: (product.name || 'N/A').substring(0, 20),
                value: Math.round(product.eoq_calculation?.total_cost || 0),
                eoq: Math.round(product.eoq_calculation?.eoq || 0),
            }))
            .sort((a, b) => b.value - a.value);
        
        return sortedByValue.slice(0, 5);
    }, [productsWithEoq]);

    // ============ ข้อมูลกราฟ 3: ABC Analysis (Pareto Chart) ============
    const { abcAnalysisData, abcStats } = useMemo(() => {
        if (!productsWithEoq.data) return { abcAnalysisData: [], abcStats: { A: { count: 0, value: 0 }, B: { count: 0, value: 0 }, C: { count: 0, value: 0 } } };
        
        let data = [];
        let totalValue = 0;
        
        // Calculate values
        productsWithEoq.data.forEach(product => {
            if (product.eoq_calculation) {
                const annualDemand = parseFloat(product.eoq_calculation.annual_demand) || 0;
                const unitCost = parseFloat(product.eoq_calculation.unit_cost) || 0;
                const annualValue = annualDemand * unitCost;
                totalValue += annualValue;
                
                data.push({
                    name: (product.sku || 'N/A').substring(0, 10),
                    fullName: (product.name || 'N/A').substring(0, 25),
                    value: Math.round(annualValue),
                    annualValue: annualValue,
                });
            }
        });
        
        // Sort by value descending
        data.sort((a, b) => b.annualValue - a.annualValue);
        
        // Calculate percentages and ABC classification
        let cumulative = 0;
        const processedData = [];
        const stats = {
            A: { count: 0, value: 0 },
            B: { count: 0, value: 0 },
            C: { count: 0, value: 0 },
        };
        
        data.forEach(item => {
            cumulative += item.annualValue;
            const cumulativePercent = totalValue > 0 ? (cumulative / totalValue) * 100 : 0;
            const percentOfTotal = totalValue > 0 ? (item.annualValue / totalValue) * 100 : 0;
            
            // Classify into ABC
            let classification = 'C';
            if (cumulativePercent <= 80) {
                classification = 'A';
            } else if (cumulativePercent <= 95) {
                classification = 'B';
            }
            
            stats[classification].count++;
            stats[classification].value += percentOfTotal;
            
            processedData.push({
                name: item.name,
                fullName: item.fullName,
                percentValue: parseFloat(percentOfTotal.toFixed(2)),
                cumulative: parseFloat(cumulativePercent.toFixed(2)),
                classification: classification,
            });
        });
        
        // Take all products for display
        return {
            abcAnalysisData: processedData,
            abcStats: stats,
        };
    }, [productsWithEoq]);

    const CATEGORY_COLORS = {
        'A': '#3b82f6',  // Blue - High value
        'B': '#10b981',  // Green - Medium value
        'C': '#f59e0b'   // Amber - Low value
    };

    return (
        <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Chart 1: Stock vs Reorder Point */}
                {stockVsReorderData.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">สินค้าขายดี 10 อันดับแรก</h3>
                            <p className="text-sm text-gray-600 mt-1">สต็อกปัจจุบันเทียบ Reorder Point (จุดสั่งซื้อ)</p>
                        </div>
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stockVsReorderData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                        formatter={(value) => formatNumber(value)}
                                        labelFormatter={(label, payload) => {
                                            if (payload && payload.length > 0) {
                                                return payload[0].payload.fullName || label;
                                            }
                                            return label;
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="current" name="สต็อกปัจจุบัน" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="reorder" name="จุดสั่งซื้อ" fill="#ef4444" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Chart 2: Top 5 EOQ Value */}
                {topEoqData.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Top 5 มูลค่า EOQ</h3>
                            <p className="text-sm text-gray-600 mt-1">สินค้ากลุ่มที่มีมูลค่าการสั่งซื้อสูงสุด</p>
                        </div>
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topEoqData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                        formatter={(value) => formatCurrency(value)}
                                        labelFormatter={(label, payload) => {
                                            if (payload && payload.length > 0) {
                                                return payload[0].payload.fullName || label;
                                            }
                                            return label;
                                        }}
                                    />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Chart 3: ABC Analysis - Full Width */}
            {abcAnalysisData.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">วิเคราะห์ ABC (Pareto Analysis)</h3>
                        <p className="text-sm text-gray-600 mt-1">จำแนกสินค้าตามมูลค่า - A (80%), B (80-95%), C (95%+)</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center space-x-4 flex-wrap gap-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                                    <span className="text-sm text-gray-700"><strong>A</strong> - สินค้ากลุ่มสำคัญ (80%)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                                    <span className="text-sm text-gray-700"><strong>B</strong> - สินค้ากลุ่มปานกลาง (80-95%)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                                    <span className="text-sm text-gray-700"><strong>C</strong> - สินค้ากลุ่มต่ำ (95%+)</span>
                                </div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={350}>
                            <ComposedChart data={abcAnalysisData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" label={{ value: 'มูลค่า (%)', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'สะสม (%)', angle: 90, position: 'insideRight' }} tick={{ fontSize: 12 }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                    formatter={(value, name) => {
                                        if (name === 'percentValue') return value.toFixed(2) + '%';
                                        if (name === 'cumulative') return value.toFixed(2) + '%';
                                        return value;
                                    }}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) {
                                            return payload[0].payload.fullName || label;
                                        }
                                        return label;
                                    }}
                                />
                                <Bar yAxisId="left" dataKey="percentValue" name="ร้อยละ" radius={[8, 8, 0, 0]}>
                                    {abcAnalysisData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.classification]} />
                                    ))}
                                </Bar>
                                <Line yAxisId="right" type="monotone" dataKey="cumulative" name="สะสม" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 5 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                        
                        {/* ABC Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <p className="text-sm text-blue-600 font-medium">กลุ่ม A</p>
                                <p className="text-lg font-bold text-blue-900">
                                    {abcStats.A.count} รายการ
                                </p>
                                <p className="text-xs text-blue-600 mt-1">มูลค่า: {abcStats.A.value.toFixed(2)}%</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <p className="text-sm text-green-600 font-medium">กลุ่ม B</p>
                                <p className="text-lg font-bold text-green-900">
                                    {abcStats.B.count} รายการ
                                </p>
                                <p className="text-xs text-green-600 mt-1">มูลค่า: {abcStats.B.value.toFixed(2)}%</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                <p className="text-sm text-amber-600 font-medium">กลุ่ม C</p>
                                <p className="text-lg font-bold text-amber-900">
                                    {abcStats.C.count} รายการ
                                </p>
                                <p className="text-xs text-amber-600 mt-1">มูลค่า: {abcStats.C.value.toFixed(2)}%</p>
                            </div>
                        </div>

                        {/* Insights & Recommendations */}
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                                <h4 className="text-sm font-bold text-blue-900 mb-2">✅ กลุ่ม A - สินค้าสำคัญ (ดีคือมี)</h4>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>✓ ตรวจสต็อกทุกวัน</li>
                                    <li>✓ เก็บในสถานที่ดี</li>
                                    <li>✓ ลดการสูญเสีย</li>
                                    <li>✓ ซื้อในปริมาณที่เหมาะ (EOQ)</li>
                                </ul>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                                <h4 className="text-sm font-bold text-green-900 mb-2">📋 กลุ่ม B - สินค้าปานกลาง</h4>
                                <ul className="text-xs text-green-700 space-y-1">
                                    <li>• ตรวจสต็อกสัปดาห์ละ 1-2 ครั้ง</li>
                                    <li>• จัดการปกติตามขั้นตอน</li>
                                    <li>• ติดตามเทรนด์การขาย</li>
                                    <li>• ปรับสต็อกตามฤดูกาล</li>
                                </ul>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
                                <h4 className="text-sm font-bold text-amber-900 mb-2">⚠️ กลุ่ม C - สินค้าต่ำ</h4>
                                <ul className="text-xs text-amber-700 space-y-1">
                                    <li>• ตรวจสต็อกเดือนละ 1 ครั้ง</li>
                                    <li>• จัดการแบบเบา ๆ</li>
                                    <li>• ไม่ต้องจัดเก็บพิเศษ</li>
                                    <li>• พิจารณาลบหรือหยุดขาย</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
