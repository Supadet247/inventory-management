import { Head, Link } from '@inertiajs/react';
import { 
    BuildingStorefrontIcon,
    CubeIcon
} from '@heroicons/react/24/outline';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    // ถ้ายังไม่ล็อกอิน ให้แสดงหน้า login
    if (!auth.user) {
        return (
            <>
                <Head title="ระบบจัดการคลังสินค้า" />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
                    <div className="text-center">
                        {/* Logo */}
                        <div className="flex flex-col items-center justify-center mb-8">
                            <img 
                                src="/images/logo.png" 
                                alt="สมบัติเกษตรยนต์ Logo" 
                                className="w-32 h-32 rounded-lg object-cover mb-4"
                            />
                            <span className="text-3xl font-bold text-gray-900">สมบัติเกษตรยนต์</span>
                        </div>
                        
                        {/* Login Button */}
                        <Link
                            href={route('login')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-lg"
                        >
                            เข้าสู่ระบบ
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    // ตรวจสอบว่าเป็น admin หรือไม่ เพื่อกำหนดลิงค์ที่ถูกต้อง
    const isAdmin = auth.user.role === 'admin' || auth.user.email === 'admin@example.com'; // ปรับเงื่อนไขตามระบบของคุณ
    const productsRoute = isAdmin ? route('admin.products.index') : route('staff.products.index');

    return (
        <>
            <Head title="ระบบจัดการคลังสินค้า" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
                <div className="text-center">
                    {/* Logo */}
                    <div className="flex flex-col items-center justify-center mb-12">
                        <img 
                            src="/images/logo.png" 
                            alt="สมบัติเกษตรยนต์ Logo" 
                            className="w-32 h-32 rounded-lg object-cover mb-4"
                        />
                        <span className="text-3xl font-bold text-gray-900">สมบัติเกษตรยนต์</span>
                    </div>

                    {/* User Greeting */}
                    <div className="mb-8">
                        <p className="text-xl text-gray-600">สวัสดี, {auth.user.name}</p>
                    </div>

                    {/* Main Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        {/* POS System Button */}
                        <Link
                            href={route('pos.index')}
                            className="group bg-green-600 hover:bg-green-700 text-white px-12 py-8 rounded-xl font-semibold text-xl transition-all duration-200 hover:shadow-xl hover:scale-105 flex flex-col items-center space-y-3 w-64"
                        >
                            <BuildingStorefrontIcon className="w-12 h-12 group-hover:scale-110 transition-transform duration-200" />
                            <span>ระบบ POS</span>
                        </Link>

                        {/* Stock Management Button */}
                        <Link
                            href={productsRoute}
                            className="group bg-blue-600 hover:bg-blue-700 text-white px-12 py-8 rounded-xl font-semibold text-xl transition-all duration-200 hover:shadow-xl hover:scale-105 flex flex-col items-center space-y-3 w-64"
                        >
                            <CubeIcon className="w-12 h-12 group-hover:scale-110 transition-transform duration-200" />
                            <span>จัดการสต็อก</span>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}