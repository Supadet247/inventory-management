import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { RefreshCw, FileText, Search, TrendingUp, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Eye, X, Printer } from 'lucide-react';
import ReturnSearchSection from './ReturnSearchSection';
import ReturnReceiptModal from './ReturnReceiptModal';
import { apiGet, getCsrfToken, handleApiError } from '../../utils/apiUtils';

export default function ReturnSection({ currentUser, initialRecentReturns = null }) {
  const { props } = usePage();
  const [activeTab, setActiveTab] = useState('search');
  const [stats, setStats] = useState({
    today_returns: 0,
    pending_returns: 0,
    this_month_returns: 0,
    total_returns: 0
  });
  const [recentReturns, setRecentReturns] = useState(initialRecentReturns || []);
  const [allReturns, setAllReturns] = useState([]); // Store all returns for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(!initialRecentReturns);
  const [error, setError] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showReturnDetail, setShowReturnDetail] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printReturnData, setPrintReturnData] = useState(null);

  // Fetch stats and recent returns
  useEffect(() => {
    fetchStats();
    
    // Only fetch recent returns if not provided as prop
    if (!initialRecentReturns) {
      fetchAllReturns();
    } else {
      console.log('Using initial recent returns data:', initialRecentReturns);
      setAllReturns(initialRecentReturns);
      updatePagination(initialRecentReturns, 1);
      setIsLoading(false);
    }
  }, [initialRecentReturns]);

  // Update pagination when data changes
  const updatePagination = (data, page = currentPage) => {
    const total = Math.ceil(data.length / itemsPerPage);
    setTotalPages(total);
    setCurrentPage(page);
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setRecentReturns(data.slice(startIndex, endIndex));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updatePagination(allReturns, newPage);
    }
  };

  const fetchStats = async () => {
    try {
      const url = route('pos.returns.api.stats');
      console.log('Fetching stats from:', url);
      
      const response = await apiGet(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stats response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Stats data received:', data);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      const errorMessage = handleApiError(error, 'ไม่สามารถดึงข้อมูลสถิติได้');
      setError(errorMessage);
      
      // Set default values if API fails
      setStats({
        today_returns: 0,
        pending_returns: 0,
        this_month_returns: 0,
        total_returns: 0
      });
    }
  };

  // Fetch stats and recent returns
  useEffect(() => {
    fetchStats();
    
    // Only fetch recent returns if not provided as prop
    if (!initialRecentReturns) {
      fetchAllReturns();
    } else {
      console.log('Using initial recent returns data:', initialRecentReturns);
      setAllReturns(initialRecentReturns);
      updatePagination(initialRecentReturns, 1);
      setIsLoading(false);
    }
  }, [initialRecentReturns]);

  const fetchAllReturns = async () => {
    try {
      setError(null); // Clear any previous errors
      const url = route('pos.returns.api.recent') + '?limit=50';
      console.log('Fetching all returns from:', url);
      
      const response = await apiGet(url);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('All returns data received:', data);
      
      if (data.success && data.data) {
        const allData = data.data;
        setAllReturns(allData);
        updatePagination(allData, 1);
        setError(null);
      } else {
        const errorMessage = data.message || 'Unknown error occurred';
        console.error('Failed to fetch returns:', errorMessage);
        setError(errorMessage);
        setAllReturns([]);
        setRecentReturns([]);
      }
    } catch (error) {
      console.error('Error fetching all returns:', error);
      const errorMessage = handleApiError(error, 'ไม่สามารถดึงข้อมูลการคืนสินค้าได้');
      setError(errorMessage);
      setAllReturns([]);
      setRecentReturns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  // ฟังก์ชันสำหรับแสดงจำนวนวันที่ผ่านมา
  const getTimeAgoThai = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // ถ้าเป็นวันเดียวกัน (น้อยกว่า 24 ชั่วโมง)
    if (days < 1) return 'วันนี้';
    if (days === 1) return '1 วัน';
    return `${days} วัน`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, text: 'รอดำเนินการ' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'อนุมัติแล้ว' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'เสร็จสิ้น' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'ยกเลิก' },
    };

    const config = statusConfig[status];
    if (!config) return null;
    
    const StatusIcon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <StatusIcon size={12} />
        {config.text}
      </span>
    );
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
      <div className="w-full max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-600 mb-2 flex items-center gap-2">
              <RefreshCw className="text-blue-600" size={28} />
              ระบบคืนสินค้า
            </h1>
            <p className="text-gray-600">จัดการการคืนสินค้าและการคืนเงิน</p>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">ยอดคืนวันนี้</p>
                <p className="text-gray-900 text-2xl font-bold">{formatCurrency(stats.today_returns)}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">รอดำเนินการ</p>
                <p className="text-yellow-600 text-2xl font-bold">{stats.pending_returns}</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertCircle className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">ยอดคืนเดือนนี้</p>
                <p className="text-green-600 text-2xl font-bold">{formatCurrency(stats.this_month_returns)}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">รวมทั้งหมด</p>
                <p className="text-gray-900 text-2xl font-bold">{stats.total_returns}</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg">
                <FileText className="text-gray-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('search')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'search'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Search size={16} />
                  คืนสินค้าใหม่
                </div>
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  รายการล่าสุด
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[60vh]">
          {activeTab === 'search' && (
            <ReturnSearchSection currentUser={currentUser} />
          )}

          {activeTab === 'recent' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="bg-gray-50 border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">รายการคืนสินค้าล่าสุด</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        setError(null);
                        setCurrentPage(1);
                        fetchAllReturns();
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      <RefreshCw size={14} />
                      รีเฟรช
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="animate-spin mx-auto text-gray-400 mb-4" size={32} />
                    <p className="text-gray-500">กำลังโหลด...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="mx-auto text-red-400 mb-4" size={32} />
                    <p className="text-red-500 mb-2">เกิดข้อผิดพลาด:</p>
                    <p className="text-sm text-red-600 mb-4">{error}</p>
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        setError(null);
                        setCurrentPage(1);
                        fetchAllReturns();
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      ลองใหม่
                    </button>
                  </div>
                ) : recentReturns.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="mx-auto text-gray-400 mb-4" size={32} />
                    <p className="text-gray-500">ยังไม่มีรายการคืนสินค้า</p>
                    <button
                      onClick={() => setActiveTab('search')}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      เริ่มคืนสินค้า
                    </button>
                  </div>
                ) : (
                  recentReturns.map((returnItem) => (
                    <div key={returnItem.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">
                              การคืนสินค้า #{returnItem.return_number}
                            </h4>
                            {getStatusBadge(returnItem.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-4">
                              <span>อ้างอิง: {returnItem.original_receipt?.receipt_number}</span>
                              <span>เมื่อ: {getTimeAgoThai(returnItem.returned_at)}</span>
                              <span>พนักงาน: {returnItem.user?.name}</span>
                            </div>
                            <p>
                              ยอดคืน: <span className="font-medium text-blue-600">{formatCurrency(returnItem.grand_return_total)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedReturn(returnItem);
                              setShowReturnDetail(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye size={16} />
                            ดูรายละเอียด
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {allReturns.length > 0 && totalPages > 1 && (
                <div className="bg-gray-50 border-t px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, allReturns.length)} จาก {allReturns.length} รายการ
                    </div>
                    
                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <ChevronLeft size={16} />
                        ก่อนหน้า
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, index) => {
                          const pageNum = index + 1;
                          const isCurrentPage = pageNum === currentPage;
                          
                          // Show first page, last page, current page, and pages around current
                          const showPage = pageNum === 1 || pageNum === totalPages || 
                                         Math.abs(pageNum - currentPage) <= 1;
                          
                          if (!showPage) {
                            // Show ellipsis for gaps
                            if (pageNum === 2 && currentPage > 4) {
                              return (
                                <span key={pageNum} className="px-2 text-gray-400 text-sm">
                                  ...
                                </span>
                              );
                            }
                            if (pageNum === totalPages - 1 && currentPage < totalPages - 3) {
                              return (
                                <span key={pageNum} className="px-2 text-gray-400 text-sm">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                isCurrentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        ถัดไป
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show "View All" button when there are items but only one page */}
              {allReturns.length > 0 && totalPages === 1 && (
                <div className="bg-gray-50 border-t px-6 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">แสดง {allReturns.length} รายการ</p>
                    <button
                      onClick={() => {
                        // Store current URL for back navigation
                        sessionStorage.setItem('returns_previous_url', window.location.href);
                        router.get(route('pos.returns.index'));
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      ดูทั้งหมด →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-blue-600" size={20} />
              <span className="text-blue-800 font-medium">เกร็ดความรู้:</span>
            </div>
            <div className="text-sm text-blue-700">
              สินค้าสามารถคืนได้ตามระยะเวลารับประกันของแต่ละสินค้า
            </div>
          </div>
        </div>
      </div>

      {/* Return Detail Modal */}
      {showReturnDetail && selectedReturn && (() => {
        const getStatusConfig = (status) => {
          const config = {
            pending: {
              color: 'text-yellow-800 bg-yellow-100',
              icon: AlertCircle,
              text: 'รอดำเนินการ',
              bgColor: 'bg-yellow-50'
            },
            approved: {
              color: 'text-blue-800 bg-blue-100',
              icon: CheckCircle,
              text: 'อนุมัติแล้ว',
              bgColor: 'bg-blue-50'
            },
            completed: {
              color: 'text-green-800 bg-green-100',
              icon: CheckCircle,
              text: 'เสร็จสิ้น',
              bgColor: 'bg-green-50'
            },
            cancelled: {
              color: 'text-red-800 bg-red-100',
              icon: X,
              text: 'ยกเลิก',
              bgColor: 'bg-red-50'
            }
          };
          return config[status] || config.pending;
        };

        const statusConfig = getStatusConfig(selectedReturn.status);
        const StatusIcon = statusConfig.icon;

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Close button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => {
                      setShowReturnDetail(false);
                      setSelectedReturn(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Return Information */}
                    <div className="bg-white rounded-lg shadow-sm border">
                      <div className={`${statusConfig.bgColor} border-b px-6 py-4`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RefreshCw className="text-gray-600" size={24} />
                            <div>
                              <h2 className="text-lg font-semibold text-gray-900">
                                การคืนสินค้า #{selectedReturn.return_number}
                              </h2>
                              <p className="text-sm text-gray-600">
                                อ้างอิงใบเสร็จ: {selectedReturn.original_receipt?.receipt_number}
                              </p>
                            </div>
                          </div>
                          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${statusConfig.color}`}>
                            <StatusIcon size={16} />
                            <span className="font-medium">{statusConfig.text}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                          <div>
                            <span className="text-gray-600 text-sm">วันที่คืน</span>
                            <p className="font-semibold text-gray-900">
                              {new Date(selectedReturn.returned_at).toLocaleDateString('th-TH')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(selectedReturn.returned_at).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">ประเภทการคืน</span>
                            <p className="font-semibold text-gray-900">
                              {selectedReturn.return_type === 'full' ? 'คืนทั้งหมด' : 'คืนบางส่วน'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">พนักงาน</span>
                            <p className="font-semibold text-gray-900">
                              {selectedReturn.user?.name}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">ยอดคืนสุทธิ</span>
                            <p className="font-bold text-lg text-blue-600">
                              {formatCurrency(selectedReturn.grand_return_total)}
                            </p>
                          </div>
                        </div>

                        {selectedReturn.reason && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-2">เหตุผลการคืนโดยรวม</h4>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {selectedReturn.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Original Receipt Information */}
                    <div className="bg-white rounded-lg shadow-sm border">
                      <div className="bg-gray-50 border-b px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <FileText className="text-gray-600" size={20} />
                          ใบเสร็จต้นฉบับ
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="text-gray-600 text-sm">เลขที่ใบเสร็จ</span>
                            <p className="font-semibold text-blue-600">
                              {selectedReturn.original_receipt?.receipt_number}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">วันที่ออกใบเสร็จ</span>
                            <p className="font-semibold text-gray-900">
                              {selectedReturn.original_receipt?.issued_at 
                                ? new Date(selectedReturn.original_receipt.issued_at).toLocaleDateString('th-TH')
                                : '-'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">ลูกค้า</span>
                            <p className="font-semibold text-gray-900">
                              {selectedReturn.original_receipt?.customer_name || 'ลูกค้าทั่วไป'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">ยอดรวมใบเสร็จ</span>
                            <p className="font-semibold text-gray-900">
                              {selectedReturn.original_receipt?.grand_total 
                                ? formatCurrency(selectedReturn.original_receipt.grand_total)
                                : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Return Items */}
                    <div className="bg-white rounded-lg shadow-sm border">
                      <div className="bg-gray-50 border-b px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <FileText className="text-gray-600" size={20} />
                          รายการสินค้าที่คืน
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                สินค้า
                              </th>
                              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                จำนวน
                              </th>
                              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ราคาต่อหน่วย
                              </th>
                              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                รวม
                              </th>
                              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                เหตุผล
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedReturn.return_items && selectedReturn.return_items.length > 0 ? (
                              selectedReturn.return_items.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-6 py-4">
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {item.receipt_item?.product_name || 'สินค้า'}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        SKU: {item.receipt_item?.product_sku || '-'}
                                      </div>
                                      {item.condition_note && (
                                        <div className="text-xs text-gray-600 mt-1 italic">
                                          สภาพ: {item.condition_note}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center font-medium">
                                    {item.quantity} {item.receipt_item?.unit || 'ชิ้น'}
                                  </td>
                                  <td className="px-6 py-4 text-right font-medium">
                                    {formatCurrency(item.unit_price)}
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold">
                                    {formatCurrency(item.total_price)}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                      {item.reason}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                  ไม่มีรายการสินค้าที่คืน
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="bg-gray-50 border-t px-6 py-4">
                        <div className="flex justify-end space-y-1">
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              ยอดก่อนภาษี: {selectedReturn.total_return_amount ? formatCurrency(selectedReturn.total_return_amount) : '฿0.00'}
                            </div>
                            <div className="text-sm text-gray-600">
                              ภาษี VAT 7%: {selectedReturn.tax_return_amount ? formatCurrency(selectedReturn.tax_return_amount) : '฿0.00'}
                            </div>
                            <div className="text-lg font-bold text-gray-900 border-t pt-1 mt-1">
                              ยอดคืนสุทธิ: {formatCurrency(selectedReturn.grand_return_total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Actions */}
                    <div className="bg-white rounded-lg shadow-sm border">
                      <div className="bg-gray-50 border-b px-6 py-4">
                        <h3 className="font-semibold text-gray-900">การจัดการ</h3>
                      </div>
                      <div className="p-6 space-y-3">
                        {selectedReturn.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                router.patch(route('pos.returns.approve', selectedReturn.id), {}, {
                                  onSuccess: () => {
                                    setShowReturnDetail(false);
                                    setSelectedReturn(null);
                                    fetchAllReturns();
                                    fetchStats();
                                  }
                                });
                              }}
                              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                              <CheckCircle size={16} />
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('คุณแน่ใจที่จะยกเลิกการคืนสินค้านี้หรือไม่?')) {
                                  router.patch(route('pos.returns.cancel', selectedReturn.id), {}, {
                                    onSuccess: () => {
                                      setShowReturnDetail(false);
                                      setSelectedReturn(null);
                                      fetchAllReturns();
                                      fetchStats();
                                    }
                                  });
                                }
                              }}
                              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                            >
                              <X size={16} />
                              ยกเลิก
                            </button>
                          </>
                        )}

                        {selectedReturn.status === 'approved' && (
                          <>
                            <button
                              onClick={() => {
                                router.patch(route('pos.returns.complete', selectedReturn.id), {}, {
                                  onSuccess: () => {
                                    setShowReturnDetail(false);
                                    setSelectedReturn(null);
                                    fetchAllReturns();
                                    fetchStats();
                                  }
                                });
                              }}
                              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                              <CheckCircle size={16} />
                              ดำเนินการให้เสร็จสิ้น
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('คุณแน่ใจที่จะยกเลิกการคืนสินค้านี้หรือไม่?')) {
                                  router.patch(route('pos.returns.cancel', selectedReturn.id), {}, {
                                    onSuccess: () => {
                                      setShowReturnDetail(false);
                                      setSelectedReturn(null);
                                      fetchAllReturns();
                                      fetchStats();
                                    }
                                  });
                                }
                              }}
                              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                            >
                              <X size={16} />
                              ยกเลิก
                            </button>
                          </>
                        )}

                        {selectedReturn.status === 'completed' && (
                          <button
                            onClick={() => {
                              setPrintReturnData(selectedReturn);
                              setShowPrintModal(true);
                            }}
                            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
                          >
                            <Printer size={16} />
                            พิมพ์ใบคืนสินค้า
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setShowReturnDetail(false);
                            setSelectedReturn(null);
                          }}
                          className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                        >
                          ปิด
                        </button>
                      </div>
                    </div>

                    {/* Notes/History */}
                    {selectedReturn.notes && (
                      <div className="bg-white rounded-lg shadow-sm border">
                        <div className="bg-gray-50 border-b px-6 py-4">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="text-gray-600" size={16} />
                            หมายเหตุ
                          </h3>
                        </div>
                        <div className="p-6">
                          <div className="text-sm text-gray-700 whitespace-pre-line">
                            {selectedReturn.notes}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Return Receipt Print Modal */}
      {showPrintModal && printReturnData && (
        <ReturnReceiptModal
          returnData={printReturnData}
          storeInfo={{
            name: 'สมบัติเกษตรยนต์',
            address: '207 หมู่ 15 ต.เชียงดาว อ.เชียงดาว จ.เชียงใหม่',
            phone: '089-560-8118',
            tax_id: '1463315038'
          }}
          onClose={() => {
            setShowPrintModal(false);
            setPrintReturnData(null);
          }}
        />
      )}
    </div>
  );
}