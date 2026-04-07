import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import POSLayout from '@/Layouts/POSLayout';
import {
  Search, Receipt, FileText, Clock, CheckCircle, 
  XCircle, RefreshCw, AlertCircle, Download, X,
  Grid3X3, List, Eye, Printer
} from 'lucide-react';

export default function ReturnsIndex({ auth, returns, filters, stats }) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [dateFrom, setDateFrom] = useState(filters.date_from || '');
  const [dateTo, setDateTo] = useState(filters.date_to || '');
  const [showAllModal, setShowAllModal] = useState(false);
  const [allReturns, setAllReturns] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    router.get(route('pos.returns.index'), {
      search: searchQuery,
      status: selectedStatus,
      date_from: dateFrom,
      date_to: dateTo,
    }, { preserveState: true });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
    router.get(route('pos.returns.index'));
  };

  const showAllRecords = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
    router.get(route('pos.returns.index'), {
      per_page: 1000 // Request many records to show "all"
    });
  };

  const fetchAllReturns = async () => {
    setIsLoadingAll(true);
    try {
      const response = await fetch(route('pos.returns.index') + '?per_page=1000', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
        },
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllReturns(data.props?.returns?.data || []);
      } else {
        // Fallback to Inertia visit
        router.visit(route('pos.returns.index', { per_page: 1000 }), {
          only: ['returns'],
          onSuccess: (page) => {
            setAllReturns(page.props.returns?.data || []);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching all returns:', error);
      // Fallback to current data
      setAllReturns(returns.data || []);
    } finally {
      setIsLoadingAll(false);
    }
  };

  const openAllReturnsModal = () => {
    setShowAllModal(true);
    fetchAllReturns();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'รอดำเนินการ' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'อนุมัติแล้ว' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'เสร็จสิ้น' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'ยกเลิก' },
    };

    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <StatusIcon size={12} />
        {config.text}
      </span>
    );
  };

  const getReturnTypeBadge = (type) => {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
        type === 'full' 
          ? 'bg-purple-100 text-purple-800' 
          : 'bg-orange-100 text-orange-800'
      }`}>
        {type === 'full' ? 'คืนทั้งหมด' : 'คืนบางส่วน'}
      </span>
    );
  };

  return (
    <POSLayout user={auth.user}>
      <Head title="ระบบคืนสินค้า" />

      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <RefreshCw className="text-blue-600" size={28} />
              ระบบคืนสินค้า
            </h1>
            <p className="text-gray-600 mt-1">จัดการการคืนสินค้าและการคืนเงิน</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex gap-2">
            <button
              onClick={() => router.get(route('pos.returns.index'), { status: 'pending' })}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
            >
              <AlertCircle size={16} />
              รายการรอดำเนินการ ({stats.pending_returns})
            </button>
            <button
              onClick={openAllReturnsModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FileText size={16} />
              ดูทั้งหมด
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">ยอดคืนสินค้าวันนี้</p>
                <p className="text-blue-900 text-2xl font-bold">{formatCurrency(stats.today_returns)}</p>
              </div>
              <Receipt className="text-blue-400" size={32} />
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">รายการรอดำเนินการ</p>
                <p className="text-yellow-900 text-2xl font-bold">{stats.pending_returns}</p>
              </div>
              <Clock className="text-yellow-400" size={32} />
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">ยอดคืนเดือนนี้</p>
                <p className="text-green-900 text-2xl font-bold">{formatCurrency(stats.this_month_returns)}</p>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ค้นหา
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="เลขที่การคืน หรือ เลขที่ใบเสร็จ"
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สถานะ
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="pending">รอดำเนินการ</option>
                  <option value="approved">อนุมัติแล้ว</option>
                  <option value="completed">เสร็จสิ้น</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Search size={16} />
                  ค้นหา
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ล้าง
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Returns Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เลขที่การคืน
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ใบเสร็จต้นฉบับ
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่คืน
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดคืน
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    พนักงาน
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {returns.data.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{returnItem.return_number}</div>
                      <div className="text-sm text-gray-500">#{returnItem.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-blue-600">
                        {returnItem.original_receipt?.receipt_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {returnItem.original_receipt?.customer_name || 'ลูกค้าทั่วไป'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(returnItem.returned_at).toLocaleDateString('th-TH')}
                      <div className="text-xs text-gray-500">
                        {new Date(returnItem.returned_at).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getReturnTypeBadge(returnItem.return_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {formatCurrency(returnItem.grand_return_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(returnItem.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {returnItem.user?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            // Store current URL for back navigation
                            sessionStorage.setItem('returns_previous_url', window.location.href);
                            router.get(route('pos.returns.show', returnItem.id));
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          ดูรายละเอียด
                        </button>
                        {returnItem.status === 'completed' && (
                          <button
                            onClick={() => router.get(route('pos.returns.print', returnItem.id))}
                            className="text-green-600 hover:text-green-800 text-sm font-medium ml-2"
                          >
                            พิมพ์
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {returns.data.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">ไม่พบรายการคืนสินค้า</p>
              {(searchQuery || selectedStatus || dateFrom || dateTo) ? (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  ล้างตัวกรอง
                </button>
              ) : (
                <button
                  onClick={openAllReturnsModal}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  โหลดข้อมูลทั้งหมด
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="bg-gray-50 border-t px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {returns.links && returns.links.length > 3 ? (
                  <>แสดง {returns.from} ถึง {returns.to} จาก {returns.total} รายการ</>
                ) : (
                  <>แสดงทั้งหมด {returns.total} รายการ</>
                )}
              </div>
              {returns.links && returns.links.length > 3 && (
                <div className="flex gap-2">
                  {returns.links.map((link, index) => {
                    if (!link.url) {
                      return (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm text-gray-400 cursor-not-allowed"
                          dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                      );
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => router.get(link.url)}
                        className={`px-3 py-1 text-sm rounded ${
                          link.active
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All Returns Modal */}
      {showAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">รายการคืนสินค้าทั้งหมด</h2>
                <p className="text-gray-600">แสดงทั้งหมด {allReturns.length} รายการ</p>
              </div>
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List size={16} className="inline mr-1" />
                    ตาราง
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid3X3 size={16} className="inline mr-1" />
                    กริด
                  </button>
                </div>
                <button
                  onClick={() => setShowAllModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {isLoadingAll ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="animate-spin mr-3" size={24} />
                  <span>กำลังโหลดข้อมูล...</span>
                </div>
              ) : viewMode === 'table' ? (
                /* Table View */
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          เลขที่การคืน
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          ใบเสร็จต้นฉบับ
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          วันที่คืน
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          ยอดคืน
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          สถานะ
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          การจัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allReturns.map((returnItem) => (
                        <tr key={returnItem.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{returnItem.return_number}</div>
                            <div className="text-sm text-gray-500">#{returnItem.id}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-blue-600">
                              {returnItem.original_receipt?.receipt_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              {returnItem.original_receipt?.customer_name || 'ลูกค้าทั่วไป'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(returnItem.returned_at).toLocaleDateString('th-TH')}
                            <div className="text-xs text-gray-500">
                              {new Date(returnItem.returned_at).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {formatCurrency(returnItem.grand_return_total)}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(returnItem.status)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setShowAllModal(false);
                                  sessionStorage.setItem('returns_previous_url', window.location.href);
                                  router.get(route('pos.returns.show', returnItem.id));
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                              >
                                <Eye size={14} />
                                ดู
                              </button>
                              {returnItem.status === 'completed' && (
                                <button
                                  onClick={() => router.get(route('pos.returns.print', returnItem.id))}
                                  className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                                >
                                  <Printer size={14} />
                                  พิมพ์
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid View */
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allReturns.map((returnItem) => (
                      <div key={returnItem.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900 text-sm">
                              {returnItem.return_number}
                            </h3>
                            <p className="text-xs text-gray-500">#{returnItem.id}</p>
                          </div>
                          {getStatusBadge(returnItem.status)}
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">ใบเสร็จต้นฉบับ</p>
                            <p className="text-sm font-medium text-blue-600">
                              {returnItem.original_receipt?.receipt_number}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">ลูกค้า</p>
                            <p className="text-sm">
                              {returnItem.original_receipt?.customer_name || 'ลูกค้าทั่วไป'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">วันที่คืน</p>
                            <p className="text-sm">
                              {new Date(returnItem.returned_at).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">ยอดคืน</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(returnItem.grand_return_total)}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">พนักงาน</p>
                            <p className="text-sm">{returnItem.user?.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowAllModal(false);
                              sessionStorage.setItem('returns_previous_url', window.location.href);
                              router.get(route('pos.returns.show', returnItem.id));
                            }}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1"
                          >
                            <Eye size={14} />
                            ดูรายละเอียด
                          </button>
                          {returnItem.status === 'completed' && (
                            <button
                              onClick={() => router.get(route('pos.returns.print', returnItem.id))}
                              className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1"
                            >
                              <Printer size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {allReturns.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-500">ไม่มีรายการคืนสินค้า</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </POSLayout>
  );
}