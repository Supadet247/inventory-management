import React from 'react';
import { Link } from '@inertiajs/react';
import { 
    BarChart3, 
    History, 
    FileText, 
    TrendingUp, 
    Settings,
    ArrowLeft
} from 'lucide-react';

export default function POSNavigation({ user }) {
    const isAdmin = user?.role === 'admin';

    const menuItems = [
        {
            name: 'ขายสินค้า',
            href: route('pos.index'),
            icon: BarChart3,
            description: 'หน้าจอขายสินค้า'
        },
        {
            name: 'ประวัติการขาย',
            href: route('pos.sales.index'),
            icon: History,
            description: 'ดูรายการขายที่ผ่านมา'
        },
        {
            name: 'รายงานประจำวัน',
            href: route('pos.reports.daily'),
            icon: FileText,
            description: 'รายงานยอดขายประจำวัน'
        },
        {
            name: 'รายงานสรุป',
            href: route('pos.reports.summary'),
            icon: TrendingUp,
            description: 'รายงานสรุปยอดขาย'
        }
    ];

    // เมนูสำหรับ Admin เท่านั้น
    const adminMenuItems = [
        {
            name: 'ตั้งค่าระบบ POS',
            href: route('admin.pos.settings'),
            icon: Settings,
            description: 'จัดการการตั้งค่า POS'
        }
    ];

    return (
        <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={route('dashboard')}
                            className="flex items-center text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            กลับหน้าหลัก
                        </Link>
                        <div className="h-6 border-l border-gray-300"></div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            ระบบขายหน้าร้าน (POS)
                        </h1>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                            ผู้ใช้งาน: {user?.name}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
                        </span>
                    </div>
                </div>

                <nav className="flex space-x-8 pb-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = route().current(item.href.split('/').pop());
                        
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                                title={item.description}
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                {item.name}
                            </Link>
                        );
                    })}

                    {/* Admin Menu */}
                    {isAdmin && (
                        <>
                            <div className="h-6 border-l border-gray-300 self-center"></div>
                            {adminMenuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = route().current(item.href.split('/').pop());
                                
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-red-100 text-red-700'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                        title={item.description}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </>
                    )}
                </nav>
            </div>
        </div>
    );
}