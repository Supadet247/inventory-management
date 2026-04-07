import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    CubeIcon,
    TagIcon,
    UsersIcon,
    ChartBarIcon,
    BuildingStorefrontIcon,
    ArrowLeftOnRectangleIcon,
    UserCircleIcon,
    ArrowUturnLeftIcon,
    CalendarDaysIcon,
    BanknotesIcon,
    DocumentTextIcon,
    QrCodeIcon
} from '@heroicons/react/24/outline';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // กำหนด menu items ตาม role
    const getMenuItems = () => {
        const isAdmin = user.role === 'admin';
        
        const commonItems = [
            {
                name: 'หน้าแรก',
                href: route('dashboard'),
                icon: HomeIcon,
                current: route().current('dashboard')
            },
            {
                name: 'จัดการสินค้า',
                href: isAdmin ? route('admin.products.index') : route('staff.products.index'),
                icon: CubeIcon,
                current: route().current('admin.products.*') || route().current('staff.products.*')
            },
            {
                name: 'พิมพ์บาร์โค๊ด',
                href: route('staff.barcode.index'),
                icon: QrCodeIcon,
                current: route().current('staff.barcode.index')
            },
            {
                name: 'หมวดหมู่',
                href: isAdmin ? route('admin.categories.index') : route('staff.categories.index'),
                icon: TagIcon,
                current: route().current('admin.categories.*') || route().current('staff.categories.*')
            },
            {
                name: 'บัญชีลูกหนี้',
                href: isAdmin ? route('admin.accounts-receivable.index') : route('staff.accounts-receivable.index'),
                icon: BanknotesIcon,
                current: route().current('admin.accounts-receivable.*') || route().current('staff.accounts-receivable.*')
            },
            {
                name: 'ระบบ POS',
                href: route('pos.index'),
                icon: BuildingStorefrontIcon,
                current: route().current('pos.*')
            },
            {
                name: 'การคืนสินค้า',
                href: isAdmin ? route('admin.returns.index') : route('staff.returns.index'),
                icon: ArrowUturnLeftIcon,
                current: route().current('admin.returns.*') || route().current('staff.returns.*') || route().current('pos.returns.*') || route().current('returns.index')
            }
        ];

        // เพิ่ม menu items สำหรับ admin เท่านั้น
        if (isAdmin) {
            commonItems.splice(3, 0, {
                name: 'จัดการผู้ใช้',
                href: route('admin.users.index'),
                icon: UsersIcon,
                current: route().current('admin.users.*')
            });
            commonItems.push({
                name: 'รายงาน',
                href: route('admin.reports.index'),
                icon: ChartBarIcon,
                current: route().current('admin.reports.*')
            });
            
            // Add EOQ Dashboard menu item for admin
            commonItems.push({
                name: 'EOQ Dashboard',
                href: route('admin.eoq.dashboard'),
                icon: CalendarDaysIcon,
                current: route().current('admin.eoq.dashboard')
            });
            
            // Add Calculator Helper menu item for admin
            commonItems.push({
                name: 'ตัวช่วยคำนวณ',
                href: route('admin.calculator.index'),
                icon: ChartBarIcon,
                current: route().current('admin.calculator.*')
            });
        } else {
            // Staff calculator
            commonItems.push({
                name: 'ตัวช่วยคำนวณ',
                href: route('staff.calculator.index'),
                icon: DocumentTextIcon,
                current: route().current('staff.calculator.*')
            });
        }

        return commonItems;
    };

    const menuItems = getMenuItems();

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 lg:hidden bg-gray-600 bg-opacity-75"
                    onClick={() => setSidebarOpen(false)}
                >
                </div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:flex-shrink-0 lg:w-64 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="flex flex-col h-full w-full">
                    {/* Logo section */}
                    <div className="flex items-center justify-between w-full h-16 px-4 lg:px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        <Link href="/" className="flex items-center space-x-2 lg:space-x-3 min-w-0">
                            <ApplicationLogo className="h-6 w-6 lg:h-8 lg:w-8 text-white flex-shrink-0" />
                            <span className="text-sm lg:text-lg font-semibold truncate">สมบัติเกษตรยนต์</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 rounded-md hover:bg-blue-500 transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5 lg:h-6 lg:w-6" />
                        </button>
                    </div>

                    {/* User info */}
                    <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2 lg:space-x-3 min-w-0">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-xs lg:text-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs lg:text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 lg:px-4 py-3 lg:py-4 space-y-1 lg:space-y-2 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-2 lg:px-3 py-2 lg:py-2.5 text-xs lg:text-sm font-medium rounded-lg transition-colors duration-200 min-w-0 ${
                                        item.current
                                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                                    }`}
                                >
                                    <Icon className={`flex-shrink-0 w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 ${
                                        item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-600'
                                    }`} />
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6">
                        <div className="flex items-center min-w-0">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors mr-2"
                            >
                                <Bars3Icon className="h-5 w-5" />
                            </button>
                            {header && (
                                <div className="min-w-0 flex-1">
                                    {header}
                                </div>
                            )}
                        </div>

                        {/* Desktop user menu */}
                        <div className="hidden lg:block flex-shrink-0">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center space-x-2 lg:space-x-3 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg hover:bg-gray-50 transition-colors min-w-0">
                                        <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-semibold text-xs lg:text-sm">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-xs lg:text-sm font-medium text-gray-700 truncate max-w-32">{user.name}</span>
                                        <svg className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>
                                        โปรไฟล์
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        ออกจากระบบ
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}