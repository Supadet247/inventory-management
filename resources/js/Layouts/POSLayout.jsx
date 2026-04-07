import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

export default function POSLayout({ user, header, children }) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    // Function to refresh CSRF token
    const refreshCsrfToken = async () => {
        try {
            const response = await fetch(route('get-csrf-token'), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            if (data.csrf_token) {
                // Update meta tag
                const metaTag = document.querySelector('meta[name="csrf-token"]');
                if (metaTag) {
                    metaTag.setAttribute('content', data.csrf_token);
                }
                
                // Update Inertia CSRF token
                window.Inertia = window.Inertia || {};
                window.Inertia.csrfToken = data.csrf_token;
            }
        } catch (error) {
            console.error('Failed to refresh CSRF token:', error);
        }
    };

    // Refresh CSRF token periodically
    useEffect(() => {
        // Refresh token every 15 minutes
        const interval = setInterval(refreshCsrfToken, 15 * 60 * 1000);
        
        // Initial refresh
        refreshCsrfToken();
        
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <meta name="csrf-token" content={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''} />
            </Head>

            {/* Page Heading */}
            {header && (
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* Page Content */}
            <main className="min-h-screen">
                {children}
            </main>

            {/* Mobile Navigation Menu */}
            <div className={`md:hidden ${showingNavigationDropdown ? 'block' : 'hidden'}`}>
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowingNavigationDropdown(false)}>
                    <div className="bg-white w-64 h-full shadow-lg p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold">เมนู POS</h2>
                            <button
                                onClick={() => setShowingNavigationDropdown(false)}
                                className="p-2 text-gray-500 hover:text-gray-700"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <nav className="space-y-2">
                            <Link
                                href={route('dashboard')}
                                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                                onClick={() => setShowingNavigationDropdown(false)}
                            >
                                หน้าหลัก
                            </Link>
                            <Link
                                href={route('pos.index')}
                                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                                onClick={() => setShowingNavigationDropdown(false)}
                            >
                                ระบบ POS
                            </Link>
                            <Link
                                href={route('staff.products.index')}
                                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                                onClick={() => setShowingNavigationDropdown(false)}
                            >
                                จัดการสินค้า
                            </Link>
                            
                            {user?.role === 'admin' && (
                                <>
                                    <hr className="my-2" />
                                    <Link
                                        href={route('admin.users.index')}
                                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                                        onClick={() => setShowingNavigationDropdown(false)}
                                    >
                                        จัดการผู้ใช้
                                    </Link>
                                    <Link
                                        href={route('admin.pos.settings')}
                                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                                        onClick={() => setShowingNavigationDropdown(false)}
                                    >
                                        ตั้งค่าระบบ
                                    </Link>
                                </>
                            )}
                        </nav>

                        <div className="mt-6 pt-6 border-t">
                            <div className="text-sm text-gray-600 mb-2">
                                ผู้ใช้งาน: {user?.name}
                            </div>
                            <button
                                onClick={() => router.post(route('logout'))}
                                className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded"
                            >
                                ออกจากระบบ
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setShowingNavigationDropdown(true)}
                className="md:hidden fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-40 hover:bg-blue-700"
            >
                <Bars3Icon className="w-6 h-6" />
            </button>
        </div>
    );
}