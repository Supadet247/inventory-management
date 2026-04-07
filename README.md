# ระบบจัดการสินค้าคงคลัง (Inventory Management System)

## 📋 ภาพรวมโครงการ

ระบบจัดการสินค้าคงคลังแบบครบวงจร ออกแบบมาเพื่อช่วยจัดการสินค้า ขาย และคำนวณความต้องการสินค้าที่เหมาะสม (EOQ) สำหรับธุรกิจเกษตร

### ✨ คุณสมบัติหลัก
- 📦 **จัดการสินค้า** - เพิ่ม แก้ไข ลบ สินค้าพร้อมรูปภาพและข้อมูล
- 💳 **ระบบ POS** - ขายสินค้าแบบแยกล็อต FIFO พร้อมพิมพ์บิล
- 🔄 **ระบบรับคืนสินค้า** - จัดการการคืนสินค้าและเคลมประกัน
- 💰 **ระบบลูกหนี้การค้า** - จัดการการขายผ่อนชำระ
- 📊 **คำนวณ EOQ** - วิเคราะห์ปริมาณการสั่งซื้อที่เหมาะสม
- 👥 **จัดการผู้ใช้** - ระบบบทบาท (Admin, Staff)
- 📈 **รายงานและวิเคราะห์** - รายงานยอดขาย คลังสินค้า

---

## 🛠️ ส่วนประกอบเทคนิค

### Backend (Laravel 12)
- **Framework:** Laravel 12
- **Database:** MySQL
- **Authentication:** Laravel Sanctum + Email Verification
- **API:** RESTful API พร้อม CORS
- **Routing:** Route groups ด้วย middleware
- **Queue:** Database driver สำหรับ background jobs

### Frontend (React + Inertia)
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React Hooks (useState, useEffect)
- **HTTP Client:** Fetch API + Axios
- **Charts:** Chart.js / Recharts สำหรับกราฟ EOQ

### Database Tables หลัก
```
users                  - ข้อมูลผู้ใช้ระบบ
categories             - หมวดหมู่สินค้า
products               - สินค้า (SKU, ชื่อ, ราคา, รูปภาพ)
stock_movements        - บันทึกการเปลี่ยนแปลงสต็อก
sales                  - บิลขาย
sale_items             - รายการสินค้าในแต่ละบิล
receipts               - ใบเสร็จ
return_items           - สินค้าคืน
returns                - ใบคืนสินค้า
customer_credits       - บัญชีลูกค้าหนี
eoq_calculations       - ผลการคำนวณ EOQ
average_cost_calculations - คำนวณต้นทุนถัวเฉลี่ย
rop_calculations      - จุดสั่งซื้อใหม่
cogs_calculations     - ต้นทุนขาย
storage_cost_calculations - ค่าใช้จ่ายในการเก็บรักษา
stock_lot_instances   - ล็อตสินค้า (FIFO tracking)
```

---

## 🔌 การเชื่อมต่อ API

### Authentication (การตรวจสอบสิทธิ์)

#### 1. Login
```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "remember": false
}
```

**Response:**
```json
{
  "status": "success",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

#### 2. Get CSRF Token
```http
GET /csrf-token
```

**Response:**
```json
{
  "csrf_token": "abc123..."
}
```

---

### Products API (สินค้า)

#### 1. ดึงรายการสินค้าทั้งหมด
```http
GET /api/v1/pos/products
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "สินค้า A",
    "sku": "SKU001",
    "price": 100.00,
    "quantity": 50,
    "image_url": "/storage/products/product1.jpg",
    "category": "หมวดหมู่ A",
    "is_low_stock": false
  }
]
```

#### 2. ค้นหาสินค้า
```http
GET /api/v1/pos/products/search?q=ชื่อสินค้า&category=1&price_min=50&price_max=200
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "products": [...],
  "total": 10
}
```

#### 3. สแกนบาร์โค้ด
```http
GET /api/v1/pos/products/barcode/{barcode}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": 1,
    "name": "สินค้า A",
    "sku": "SKU001",
    "price": 100.00,
    "quantity": 50
  }
}
```

---

### Sales API (การขาย)

#### 1. สร้างการขายใหม่
```http
POST /api/v1/pos/sales
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "price": 100.00
    }
  ],
  "total": 200.00,
  "payment_method": "cash",
  "received_amount": 500.00,
  "customer_info": {
    "name": "ลูกค้า A",
    "phone": "0812345678",
    "tax_id": "1234567890123"
  },
  "notes": "หมายเหตุ"
}
```

**Response:**
```json
{
  "sale_success": true,
  "sale_data": {
    "sale_id": 1,
    "receipt_id": 1,
    "receipt_number": "R000001",
    "transaction_number": "T000001",
    "grand_total": 214.00,
    "change_amount": 286.00
  }
}
```

#### 2. ดูประวัติการขาย
```http
GET /pos/sales?date_from=2024-01-01&date_to=2024-12-31&payment_method=cash
Authorization: Bearer {token}
```

**Response:**
```json
{
  "sales": [...],
  "summary_stats": {
    "total_transactions": 100,
    "total_amount": 50000.00,
    "average_amount": 500.00,
    "total_tax": 3500.00
  }
}
```

---

### Returns API (การคืนสินค้า)

#### 1. ค้นหาใบเสร็จเพื่อคืนสินค้า
```http
POST /pos/returns/api/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "receipt_number": "R000001"
}
```

**Response:**
```json
{
  "success": true,
  "receipt": {
    "id": 1,
    "receipt_number": "R000001",
    "issued_at": "2024-01-01 10:00:00",
    "customer_name": "ลูกค้า A",
    "grand_total": 500.00,
    "can_return": true,
    "returnable_items": [
      {
        "id": 1,
        "product_name": "สินค้า A",
        "quantity": 2,
        "returnable_quantity": 2,
        "unit_price": 100.00,
        "has_warranty": true,
        "warranty_expires_at": "2025-01-01",
        "days_remaining": 30
      }
    ]
  }
}
```

#### 2. ดำเนินการคืนสินค้า
```http
POST /pos/returns/process
Authorization: Bearer {token}
Content-Type: application/json

{
  "receipt_id": 1,
  "items": [
    {
      "receipt_item_id": 1,
      "quantity": 1,
      "reason": "สินค้าชำรุด",
      "condition_note": "แตกหัก"
    }
  ],
  "return_type": "partial",
  "general_reason": "ลูกค้าไม่พอใจสินค้า"
}
```

**Response:**
```json
{
  "return_success": true,
  "return_data": {
    "return_id": 1,
    "return_number": "RET000001",
    "total_amount": 100.00,
    "status": "approved"
  }
}
```

#### 3. ดูรายการคืนสินค้าล่าสุด
```http
GET /pos/returns/api/recent?limit=10
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

---

### Accounts Receivable API (ลูกหนี้การค้า)

#### 1. ดูรายการสินเชื่อทั้งหมด
```http
GET /staff/accounts-receivable/api/credits?status=active&customer_name=ลูกค้า
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "customer_name": "ลูกค้า A",
        "customer_phone": "0812345678",
        "total_amount": 10000.00,
        "paid_amount": 3000.00,
        "paid_installments": 1,
        "installment_count": 3,
        "status": "active"
      }
    ],
    "total": 50
  }
}
```

#### 2. สร้างสินเชื่อใหม่
```http
POST /staff/accounts-receivable/api/credit
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_name": "ลูกค้า A",
  "customer_phone": "0812345678",
  "total_amount": 10000.00,
  "down_payment_percent": 30,
  "installment_count": 3,
  "installment_amount": 2500.00,
  "installment_start_date": "2024-02-01",
  "note": "ผ่อนชำระ 3 งวด"
}
```

**Response:**
```json
{
  "success": true,
  "message": "สร้างสินเชื่อสำเร็จ",
  "data": {...}
}
```

#### 3. บันทึกการชำระเงินงวด
```http
POST /staff/accounts-receivable/api/installment
Authorization: Bearer {token}
Content-Type: application/json

{
  "credit_id": 1,
  "note": "ชำระงวดที่ 1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "บันทึกการผ่อนชำระสำเร็จ",
  "data": {
    "paid_installments": 1,
    "paid_amount": 5500.00,
    "status": "active"
  }
}
```

---

### Inventory API (คลังสินค้า)

#### 1. ดูล็อตสินค้าถัดไป
```http
GET /api/next-lot-number?product_id=1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "lot_number": "LOT-2024-001"
}
```

#### 2. ดูสถิติการคืนสินค้า
```http
GET /pos/returns/api/stats?period=30
Authorization: Bearer {token}
```

**Response:**
```json
{
  "today_returns": 500.00,
  "pending_returns": 5,
  "this_month_returns": 15000.00,
  "total_returns": 100,
  "top_return_reasons": [
    {"reason": "สินค้าชำรุด", "count": 25},
    {"reason": "ไม่พอใจสินค้า", "count": 15}
  ]
}
```

---

### Reports API (รายงาน)

#### 1. Dashboard Statistics
```http
GET /pos/api/dashboard-stats
Authorization: Bearer {token}
```

**Response:**
```json
{
  "today": {
    "sales": 50000.00,
    "transactions": 25,
    "items_sold": 100
  },
  "this_week": {
    "sales": 350000.00,
    "transactions": 150
  },
  "this_month": {
    "sales": 1500000.00,
    "transactions": 600
  }
}
```

---

### Error Responses

#### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

#### 403 Forbidden
```json
{
  "message": "You do not have permission to access this resource."
}
```

#### 404 Not Found
```json
{
  "message": "Resource not found."
}
```

#### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "product_id": ["The product id field is required."],
    "quantity": ["The quantity must be at least 1."]
  }
}
```

#### 500 Server Error
```json
{
  "success": false,
  "message": "เกิดข้อผิดพลาดในการประมวลผล"
}
```

---

## 📂 โครงสร้างไฟล์ที่สำคัญ

### Controllers (Backend Logic)

#### 1. POSController - จัดการการขาย
**ไฟล์:** `app/Http/Controllers/POSController.php`

**Methods สำคัญ:**
- `index()` - แสดงหน้า POS
- `storeSale()` - บันทึกการขาย
- `getProducts()` - API ดึงสินค้า
- `searchProducts()` - ค้นหาสินค้า
- `getProductByBarcode()` - สแกนบาร์โค้ด
- `salesHistory()` - ประวัติการขาย

**ส่วนที่แก้ไขได้:**
```php
// แก้ไขการคำนวณภาษี
$taxRate = config('pos.tax_rate', 7) / 100;

// แก้ไขการสร้าง receipt number
$receipt = Receipt::create([...]);

// แก้ไขการอัปเดตสต็อก
$product->update(['quantity' => $newQuantity]);
```

---

#### 2. ReturnsController - จัดการการคืนสินค้า
**ไฟล์:** `app/Http/Controllers/ReturnsController.php`

**Methods สำคัญ:**
- `index()` - แสดงรายการคืนสินค้า
- `searchReceipt()` - ค้นหาใบเสร็จ
- `processReturn()` - ดำเนินการคืน
- `approve()` - อนุมัติการคืน
- `complete()` - ทำให้เสร็จสิ้น
- `getReturnedStockProducts()` - ดูสินค้าคงค้างคืน

**ส่วนที่แก้ไขได้:**
```php
// แก้ไขเงื่อนไขการคืนสินค้า
if (!$receipt->canBeReturned()) {
    throw new \Exception('ใบเสร็จนี้ไม่สามารถคืนสินค้าได้');
}

// แก้ไขการ approve อัตโนมัติ
if (config('pos.returns.auto_approve', true)) {
    $return->approve('Auto-approved by system');
}
```

---

#### 3. AccountsReceivableController - จัดการลูกหนี้
**ไฟล์:** `app/Http/Controllers/AccountsReceivableController.php`

**Methods สำคัญ:**
- `index()` - แสดงรายการสินเชื่อ
- `createCredit()` - สร้างสินเชื่อใหม่
- `recordInstallment()` - บันทึกการชำระงวด
- `getCredits()` - API ดึงข้อมูลสินเชื่อ

**ส่วนที่แก้ไขได้:**
```php
// แก้ไข validation
$request->validate([
    'down_payment_percent' => 'required|numeric|min:30|max:50',
    'installment_count' => 'required|integer|min:1|max:5',
]);

// แก้ไขการคำนวณดอกเบี้ย
$interestRate = 0;
if ($downPaymentPercent == 30) {
    $interestRate = 2; // 2% สำหรับดาวน์ 30%
}
```

---

#### 4. EoqController - คำนวณ EOQ
**ไฟล์:** `app/Http/Controllers/Admin/EoqController.php`

**Methods สำคัญ:**
- `saveEoq()` - บันทึกผลการคำนวณ
- `getLatestEoq()` - ดึงค่าล่าสุด
- `saveRop()` - บันทึกจุดสั่งซื้อ
- `getCogsCalculations()` - คำนวณต้นทุนขาย

**ส่วนที่แก้ไขได้:**
```php
// แก้ไขสูตร EOQ
$eoq = sqrt((2 * $annualDemand * $orderingCost) / $holdingCost);

// แก้ไขการคำนวณ ROP
$rop = ($averageDailyUsage * $leadTime) + $safetyStock;
```

---

### Models (Data Layer)

#### 1. Product Model
**ไฟล์:** `app/Models/Product.php`

**Fillable Fields:**
```php
protected $fillable = [
    'name', 'sku', 'price', 'quantity', 
    'category_id', 'image', 'min_stock',
    'returned_quantity', 'warranty',
];
```

**Relationships:**
```php
public function category() {
    return $this->belongsTo(Category::class);
}

public function stockMovements() {
    return $this->hasMany(StockMovement::class);
}

public function stockLotInstances() {
    return $this->hasMany(StockLotInstance::class);
}
```

**ส่วนที่แก้ไขได้:**
- เพิ่ม fields ใหม่ใน `$fillable`
- เพิ่ม relationships ใหม่
- เพิ่ม accessor/mutator

---

#### 2. Sale & SaleItem Models
**ไฟล์:** `app/Models/Sale.php`, `app/Models/SaleItem.php`

**Features:**
- Auto-generate transaction number
- Calculate tax automatically
- Track payment methods

---

#### 3. ReturnModel & ReturnItem
**ไฟล์:** `app/Models/ReturnModel.php`, `app/Models/ReturnItem.php`

**Features:**
- Track warranty claims
- Calculate return amounts
- Manage return status workflow

---

#### 4. CustomerCredit Model
**ไฟล์:** `app/Models/CustomerCredit.php`

**Features:**
- Track installment payments
- Calculate down payment
- Manage payment schedule

---

### Routes (API & Web)

#### 1. Web Routes
**ไฟล์:** `routes/web.php`

**โครงสร้าง:**
```php
// Admin routes
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->group(function () {
    Route::resource('products', AdminProductController::class);
    Route::prefix('calculator')->group([...]);
});

// Staff routes
Route::middleware(['auth', 'verified', 'role:staff,admin'])->prefix('staff')->group(function () {
    Route::resource('products', StaffProductController::class);
    Route::prefix('accounts-receivable')->group([...]);
});

// POS routes
Route::middleware(['auth', 'verified', 'role:staff,admin'])->prefix('pos')->group(function () {
    Route::get('/', [POSController::class, 'index']);
    Route::post('/sales', [POSController::class, 'storeSale']);
});
```

**ส่วนที่แก้ไขได้:**
- เพิ่ม route ใหม่
- เปลี่ยน middleware
- เพิ่ม prefix paths

---

#### 2. API Routes
**ไฟล์:** `routes/api.php` และ inline ใน `web.php`

**ตัวอย่าง:**
```php
Route::middleware(['auth:sanctum', 'role:staff,admin'])->prefix('api/v1')->group(function () {
    Route::get('/pos/products', [POSController::class, 'getProducts']);
    Route::post('/pos/sales', [POSController::class, 'storeSale']);
});
```

---

### Frontend Components (React + Inertia)

#### 1. POS Component
**ไฟล์:** `resources/js/Pages/POS/Index.jsx`

**โครงสร้าง:**
```jsx
export default function Index({ products, categories }) {
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  const addToCart = (product) => { ... };
  const processCheckout = () => { ... };
  
  return (
    <div>
      <ProductGrid products={products} onAddToCart={addToCart} />
      <Cart cart={cart} onUpdateCart={updateCart} />
      <Checkout paymentMethod={paymentMethod} onCheckout={processCheckout} />
    </div>
  );
}
```

**ส่วนที่แก้ไขได้:**
- เพิ่ม UI components
- แก้ไข logic การคำนวณ
- เพิ่ม validation

---

#### 2. Returns Component
**ไฟล์:** `resources/js/Pages/POS/Returns/Index.jsx`

**Features:**
- Search receipts
- Display returnable items
- Process returns
- Print return receipts

---

#### 3. Calculator Components
**ไฟล์:** `resources/js/Pages/Admin/Calculator/`

**Components:**
- `EoqForm.jsx` - แบบฟอร์มคำนวณ EOQ
- `RopForm.jsx` - แบบฟอร์มคำนวณ ROP
- `CogsForm.jsx` - แบบฟอร์มคำนวณ COGS

---

### Configuration Files

#### 1. POS Config
**ไฟล์:** `config/pos.php`

**แก้ไขได้:**
```php
return [
    'store_info' => [
        'name' => env('POS_STORE_NAME', 'สมบัติเกษตรยนต์'),
        'address' => env('POS_STORE_ADDRESS', '...'),
    ],
    'tax' => [
        'rate' => env('POS_TAX_RATE', 0.07),
    ],
    'returns' => [
        'max_days' => env('POS_RETURN_MAX_DAYS', 7),
        'auto_approve' => env('POS_RETURNS_AUTO_APPROVE', false),
    ],
];
```

---

#### 2. Environment Variables
**ไฟล์:** `.env`

**ค่าที่แก้ไขได้:**
```bash
# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=ggkeystore

# POS Settings
POS_TAX_RATE=7
POS_STORE_NAME="สมบัติเกษตรยนต์"
POS_STORE_PHONE="089-560-8118"

# Return Policy
POS_RETURN_MAX_DAYS=7
POS_RETURNS_AUTO_APPROVE=false

# Cache
CACHE_DRIVER=array
```

---

## 🔧 การแก้ไขทั่วไป

### 1. เพิ่ม Field ใหม่ใน Products Table

**ขั้นตอน:**

1. สร้าง Migration
```bash
php artisan make:migration add_color_to_products_table
```

2. แก้ไข Migration
```php
public function up(): void
{
    Schema::table('products', function (Blueprint $table) {
        $table->string('color')->nullable()->after('name');
    });
}

public function down(): void
{
    Schema::table('products', function (Blueprint $table) {
        $table->dropColumn('color');
    });
}
```

3. รัน Migration
```bash
php artisan migrate
```

4. อัปเดต Model
```php
// app/Models/Product.php
protected $fillable = ['color', ...];
```

5. อัปเดต Form
```jsx
// resources/js/Pages/Admin/Products/Form.jsx
<input 
  name="color" 
  defaultValue={product.color} 
  className="..."
/>
```

---

### 2. เพิ่ม API Endpoint ใหม่

**ขั้นตอน:**

1. เพิ่ม Route
```php
// routes/web.php
Route::get('/api/products/low-stock', [ProductController::class, 'getLowStock'])
  ->middleware(['auth', 'verified']);
```

2. สร้าง Method ใน Controller
```php
// app/Http/Controllers/Admin/ProductController.php
public function getLowStock()
{
    $products = Product::whereColumn('quantity', '<=', 'min_stock')
        ->where('quantity', '>', 0)
        ->get();
    
    return response()->json([
        'success' => true,
        'data' => $products
    ]);
}
```

3. เรียกใช้จาก Frontend
```javascript
const response = await fetch('/api/products/low-stock');
const data = await response.json();
```

---

### 3. เปลี่ยนแปลงการคำนวณภาษี

**ตำแหน่งที่แก้:**

1. Config File
```php
// config/pos.php
'tax' => [
    'rate' => env('POS_TAX_RATE', 10), // เปลี่ยนจาก 7 เป็น 10
],
```

2. Environment
```bash
# .env
POS_TAX_RATE=10
```

3. Controller (ถ้าต้องการ override)
```php
// POSController.php
$taxRate = 0.10; // Hardcode 10%
```

---

### 4. เพิ่ม Payment Method ใหม่

**ขั้นตอน:**

1. เพิ่มใน Config
```php
// config/pos.php
'payment_methods' => [
    'cash' => [...],
    'qr_code' => [
        'enabled' => true,
        'name' => 'QR Code',
        'icon' => '📱',
    ],
],
```

2. เพิ่มใน Frontend
```jsx
// resources/js/Pages/POS/Checkout.jsx
{paymentMethods.map(method => (
  <button 
    key={method.id}
    onClick={() => setPaymentMethod(method.id)}
  >
    {method.icon} {method.name}
  </button>
))}
```

3. อัปเดต Validation
```php
// POSController.php
$request->validate([
    'payment_method' => 'required|string|in:cash,card,promptpay,qr_code',
]);
```

---

### 5. ปรับปรุงการแจ้งเตือน (Notifications)

**เพิ่ม Line Notify:**

1. ติดตั้ง Package
```bash
composer require line/laravel-bot-sdk
```

2. เพิ่ม Service Class
```php
// app/Services/LineNotifyService.php
class LineNotifyService {
    public function sendLowStockAlert($product) {
        $message = "สินค้า {$product->name} เหลือ {$product->quantity} ชิ้น";
        // Send to Line Notify
    }
}
```

3. เรียกใช้ใน Controller
```php
// POSController.php
if ($product->quantity <= $product->min_stock) {
    app(LineNotifyService::class)->sendLowStockAlert($product);
}
```

---

## 🎯 Business Logic สำคัญ

### 1. FIFO Stock Management (First-In, First-Out)

**การทำงาน:**
- สินค้าเข้าก่อนจะถูกขายออกก่อน
- ติดตามผ่าน `stock_lot_instances` table
- แต่ละ lot มี cost price และ received date

**Code Example:**
```php
// POSController.php - storeSale()
$activeLots = $product->stockLotInstances()
    ->where('quantity', '>', 0)
    ->orderBy('created_at', 'asc') // เอา lot เก่าที่สุดก่อน
    ->get();

foreach ($activeLots as $lot) {
    if ($remainingQtyToDeduct <= 0) break;
    
    $deductFromThisLot = min($lot->quantity, $remainingQtyToDeduct);
    $lot->update(['quantity' => $lot->quantity - $deductFromThisLot]);
    $remainingQtyToDeduct -= $deductFromThisLot;
}
```

---

### 2. Return Policy & Warranty

**กฎการคืนสินค้า:**
- คืนภายใน 7 วัน (configurable)
- สินค้าต้องอยู่ในสภาพเดิม
- มีใบเสร็จต้นฉบับ

**Warranty Tracking:**
```php
// Receipt.php - canBeReturned()
public function canBeReturned() {
    if (!$this->can_return) return false;
    
    $maxDays = config('pos.return_policy.max_days', 7);
    $daysSincePurchase = $this->issued_at->diffInDays(now());
    
    // ตรวจสอบ warranty ของสินค้าแต่ละชิ้น
    foreach ($this->receiptItems as $item) {
        if ($item->product && $item->product->warranty > 0) {
            $warrantyDays = $item->product->warranty_days + 
                           ($item->product->warranty_months * 30) + 
                           ($item->product->warranty_years * 365);
            
            if ($daysSincePurchase <= $warrantyDays) {
                return true; // ยังอยู่ในประกัน
            }
        }
    }
    
    return $daysSincePurchase <= $maxDays;
}
```

---

### 3. Installment Calculation (ผ่อนชำระ)

**การคำนวณ:**
- ดาวน์ขั้นต่ำ 30%
- ผ่อนได้สูงสุด 5 งวด
- ดอกเบี้ยตาม % ดาวน์

**Interest Rates:**
```php
// POSController.php - storeSale()
if ($downPaymentPercent >= 50) {
    $interestRate = 0; // 0% ดอกเบี้ย
} elseif ($downPaymentPercent == 45) {
    if ($installmentCount <= 2) {
        $interestRate = 0;
    } else {
        $interestRate = 1; // 1% สำหรับงวดที่ 3-5
    }
} elseif ($downPaymentPercent == 30) {
    $interestMonths = $installmentCount - 1;
    $interestRate = 2; // 2% ต่อเดือน
}

$totalWithInterest = $remainingAmount * (1 + $totalInterestPercent / 100);
$installmentAmount = $totalWithInterest / $installmentCount;
```

---

### 4. EOQ Calculation (Economic Order Quantity)

**สูตร:**
```
EOQ = √[(2 × Demand × Ordering Cost) / Holding Cost]
```

**Implementation:**
```php
// EoqController.php
$eoq = sqrt(
    (2 * $annualDemand * $orderingCostPerOrder) / 
    $holdingCostPerUnitPerYear
);

$numberOfOrders = $annualDemand / $eoq;
$orderCycle = 365 / $numberOfOrders; // วันต่อการสั่งซื้อ 1 ครั้ง
```

---

### 5. ROP Calculation (Reorder Point)

**สูตร:**
```
ROP = (Average Daily Usage × Lead Time) + Safety Stock
```

**Implementation:**
```php
// คำนวณการใช้งานเฉลี่ยต่อวัน
$dailyUsage = $totalUsage / $numberOfDays;

// Safety Stock
$safetyStock = $dailyUsage * $safetyDays;

// ROP
$rop = ($dailyUsage * $leadTimeDays) + $safetyStock;
```

---

### 6. COGS Calculation (Cost of Goods Sold)

**วิธีคำนวณ:**
- ใช้ Weighted Average Cost
- รวมค่าใช้จ่ายในการซื้อ
- คำนวณต่อหน่วย

```php
// คำนวณต้นทุนถัวเฉลี่ย
$totalCost = $beginningInventory + $purchases;
$totalUnits = $beginningUnits + $purchasedUnits;
$averageCost = $totalCost / $totalUnits;

// COGS
$cogs = $unitsSold * $averageCost;

// กำไรขั้นต้น
$grossProfit = $revenue - $cogs;
$grossMargin = ($grossProfit / $revenue) * 100;
```

---

## 🔄 Workflow การทำงาน

### 1. ขายสินค้า (POS Flow)

```
1. เลือกสินค้า → 2. เพิ่มลงตะกร้า → 3. ชำระเงิน → 4. สร้างใบเสร็จ
     ↓                              ↓
5. อัปเดตสต็อก                   6. พิมพ์บิล
     ↓
7. บันทึก stock movement
```

**Sequence:**
```php
// 1. สร้าง Sale record
$sale = Sale::create([...]);

// 2. สร้าง Receipt record
$receipt = Receipt::create([...]);

// 3. สร้าง SaleItem records
foreach ($items as $item) {
    SaleItem::create([...]);
}

// 4. อัปเดตสต็อกสินค้า
$product->update(['quantity' => $newQuantity]);

// 5. อัปเดต stock_lot_instances (FIFO)
foreach ($lots as $lot) {
    $lot->update(['quantity' => $newQty]);
}

// 6. บันทึก Stock Movement
StockMovement::create([
    'type' => 'out',
    'quantity' => $soldQty,
]);
```

---

### 2. คืนสินค้า (Return Flow)

```
1. ค้นหาใบเสร็จ → 2. เลือกสินค้าที่จะคืน → 3. ตรวจสอบเงื่อนไข
                                                    ↓
4. สร้างใบคืนสินค้า ← (ผ่าน/ไม่ผ่าน)
     ↓
5. อนุมัติ (Admin) → 6. เพิ่มสต็อกคืน → 7. ชำระเงินคืน
```

**Sequence:**
```php
// 1. Validate receipt
if (!$receipt->canBeReturned()) {
    throw new Exception('ไม่สามารถคืนสินค้าได้');
}

// 2. Create return record
$return = ReturnModel::createFromReceipt($receipt, $items);

// 3. Auto-approve (ถ้าเปิดใช้งาน)
if (config('pos.returns.auto_approve')) {
    $return->approve('Auto-approved');
}

// 4. Update returned_quantity
foreach ($items as $item) {
    $product = Product::find($item->product_id);
    $product->increment('returned_quantity', $item->quantity);
}
```

---

### 3. ผ่อนชำระ (Installment Flow)

```
1. เลือกสินค้า → 2. คำนวณดาวน์ + งวด → 3. สร้างสัญญาสินเชื่อ
                                              ↓
4. รับชำระเงินดาวน์ → 5. ติดตามงวดรายเดือน
                            ↓
                    6. บันทึกการชำระแต่ละงวด
                            ↓
                    7. ปิดสัญญาเมื่อครบ
```

**Sequence:**
```php
// 1. สร้าง CustomerCredit
$credit = CustomerCredit::create([
    'total_amount' => $totalAmount,
    'down_payment_percent' => $downPaymentPercent,
    'paid_amount' => $downPaymentAmount,
    'paid_installments' => 0,
]);

// 2. บันทึกการชำระแต่ละงวด
public function recordInstallment($creditId) {
    $credit = CustomerCredit::findOrFail($creditId);
    
    $credit->increment('paid_installments');
    $credit->increment('paid_amount', $installmentAmount);
    
    if ($credit->paid_installments >= $credit->installment_count) {
        $credit->update(['status' => 'completed']);
    }
    
    $credit->save();
}
```

---

## ⚠️ ข้อควรระวัง

### 1. Stock Discrepancy
**ปัญหา:** สต็อกใน system ไม่ตรงกับของจริง
**วิธีแก้:**
- ทำ stock count เป็นประจำ
- ใช้ stock movements เพื่อติดตาม
- Enable `POS_ALLOW_NEGATIVE_STOCK = false`

---

### 2. Round-off Errors
**ปัญหา:** ยอดเงินปัดเศษไม่ตรง
**วิธีแก้:**
```php
// ใช้ round() เสมอ
$finalAmount = round($amount, 2);

// ในกรณี installment
if ($newPaidInstallments >= $credit->installment_count) {
    $credit->paid_amount = $credit->total_amount; // Snap to total on last payment
}
```

---

### 3. Duplicate Payments
**ปัญหา:** ลูกค้าชำระซ้ำ
**วิธีป้องกัน:**
```php
// Check status ก่อนรับชำระ
if ($credit->status !== 'active') {
    throw new Exception('สินเชื่อนี้ปิดไปแล้ว');
}

if ($credit->paid_installments >= $credit->installment_count) {
    throw new Exception('ผ่อนครบแล้ว');
}
```

---

### 4. Concurrent Sales
**ปัญหา:** ขายสินค้าเดียวกันพร้อมกัน
**วิธีแก้:**
```php
DB::transaction(function () use ($productId, $quantity) {
    $product = Product::lockForUpdate()->find($productId);
    
    if ($product->quantity < $quantity) {
        throw new Exception('สต็อกไม่เพียงพอ');
    }
    
    $product->decrement('quantity', $quantity);
});
```

---

## 📊 Reporting & Analytics

### 1. Daily Sales Report
```php
$todaySales = Sale::whereDate('sale_date', today())
    ->sum('grand_total');
    
$hourlyBreakdown = $sales->groupBy(function($sale) {
    return $sale->created_at->format('H');
});
```

### 2. Top Selling Products
```php
$topProducts = Sale::join('sale_items', 'sales.id', '=', 'sale_items.sale_id')
    ->join('products', 'sale_items.product_id', '=', 'products.id')
    ->whereBetween('sales.sale_date', [$from, $to])
    ->selectRaw('products.id, SUM(sale_items.quantity) as total_sold')
    ->groupBy('products.id')
    ->orderByDesc('total_sold')
    ->limit(10)
    ->get();
```

### 3. Returns Analytics
```php
$returnRate = ($totalReturns / $totalSales) * 100;

$topReturnReasons = ReturnItem::select('reason', DB::raw('COUNT(*) as count'))
    ->groupBy('reason')
    ->orderByDesc('count')
    ->get();
```

---

## 🔐 Security Considerations

### 1. Role-based Access Control
```php
// Middleware
Route::middleware(['role:admin'])->group(function () {
    // Admin only routes
});

// In Controller
if (auth()->user()->role !== 'admin') {
    abort(403, 'Unauthorized');
}
```

### 2. CSRF Protection
```jsx
// Frontend - Inertia automatically handles CSRF
// For manual AJAX calls:
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.head.querySelector('meta[name="csrf-token"]').content;
```

### 3. SQL Injection Prevention
```php
// ✅ Good - Using Eloquent
Product::where('name', $request->name)->get();

// ❌ Bad - Raw query without binding
DB::select("SELECT * FROM products WHERE name = '{$request->name}'");
```

---

## 🚀 Performance Optimization

### 1. Caching Strategy
```php
// Cache products for 5 minutes
$products = Cache::tags(['products'])
    ->remember('pos_products', 300, function () {
        return Product::with('category')->get();
    });

// Clear cache when product updated
Cache::tags(['products'])->flush();
```

### 2. Eager Loading
```php
// ✅ Good - Prevent N+1 queries
$products = Product::with('category', 'stockMovements')->get();

// ❌ Bad - N+1 problem
$products = Product::all();
foreach ($products as $product) {
    echo $product->category->name; // Query per iteration
}
```

### 3. Database Indexing
```php
// Add indexes for frequently queried columns
Schema::table('products', function (Blueprint $table) {
    $table->index('sku');
    $table->index('category_id');
    $table->index('is_active');
});
```

---

## 🧪 Testing Guidelines

### Unit Tests
```php
// tests/Feature/ProductTest.php
public function test_can_create_product()
{
    $response = $this->post('/admin/products', [
        'name' => 'Test Product',
        'sku' => 'TEST001',
        'price' => 100,
    ]);
    
    $response->assertRedirect();
    $this->assertDatabaseHas('products', ['sku' => 'TEST001']);
}
```

### API Tests
```php
public function test_pos_api_returns_products()
{
    $user = User::factory()->create(['role' => 'staff']);
    
    $response = $this->actingAs($user)
        ->getJson('/api/v1/pos/products');
    
    $response->assertStatus(200)
        ->assertJsonStructure([
            '*' => ['id', 'name', 'sku', 'price', 'quantity']
        ]);
}
```

---

## 📞 Support & Contact

### Technical Support
- **Developer:** [ระบุชื่อ developer]
- **Email:** [ระบุ email]
- **Phone:** [ระบุเบอร์โทร]

### Business Contact
- **Store:** สมบัติเกษตรยนต์
- **Address:** 207 หมู่ 15 ต.เชียงดาว อ.เชียงดาว จ.เชียงใหม่ 50170
- **Phone:** 089-560-8118
- **LINE:** @sombat
- **Email:** renuthonkong@gmail.com

---

## 📝 Changelog

### Version 2.0 (March 2026)
- ✅ เพิ่มระบบลูกหนี้การค้า (Accounts Receivable)
- ✅ เพิ่มระบบรับคืนสินค้า (Returns Management)
- ✅ เพิ่มการคำนวณ EOQ, ROP, COGS
- ✅ ปรับปรุง FIFO stock tracking
- ✅ เพิ่ม API endpoints

### Version 1.0 (January 2025)
- 🎉 Initial release
- Basic POS functionality
- Product management
- User management

---

## 📄 License

MIT License - Copyright (c) 2025 สมบัติเกษตรยนต์

---

**ปรับปรุงล่าสุด:** March 2026
**Version:** 2.0

## 🎯 Best Practices

### 1. การจัดการข้อผิดพลาด
```php
try {
    DB::beginTransaction();
    // Your code here
    DB::commit();
} catch (\Exception $e) {
    DB::rollback();
    Log::error('Error: ' . $e->getMessage());
    return redirect()->back()->withErrors(['error' => $e->getMessage()]);
}
```

### 2. Validation
```php
$request->validate([
    'product_id' => 'required|exists:products,id',
    'quantity' => 'required|integer|min:1',
    'price' => 'required|numeric|min:0',
], [
    'product_id.required' => 'กรุณาเลือกสินค้า',
    'quantity.min' => 'จำนวนต้องมากกว่า 0',
]);
```

### 3. Caching
```php
$products = Cache::tags(['products'])->remember(
    'pos_products', 
    300, 
    function () {
        return Product::all();
    }
);
```

### 4. Logging
```php
Log::info('Sale completed', [
    'sale_id' => $sale->id,
    'total_amount' => $sale->grand_total,
    'user_id' => auth()->id(),
]);
```

---

## 🚀 วิธีเริ่มต้นใช้งาน

### ข้อกำหนดเบื้องต้น
- PHP 8.2+
- Composer
- Node.js 18+
- npm หรือ yarn
- MySQL 8.0+

### ขั้นตอนการติดตั้ง

#### 1. Clone Repository
```bash
git clone <repository-url>
cd inventory-management
```

#### 2. ติดตั้ง Dependencies
```bash
# Backend dependencies
composer install

# Frontend dependencies
npm install
```

#### 3. ตั้งค่าไฟล์ Environment
```bash
cp .env.example .env
php artisan key:generate
```

**แก้ไข `.env`:**
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inventory_management
DB_USERNAME=root
DB_PASSWORD=
```

#### 4. สร้างฐานข้อมูล
```bash
mysql -u root -p -e "CREATE DATABASE inventory_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

#### 5. รัน Migration
```bash
php artisan migrate
php artisan db:seed
```

#### 6. สร้าง Storage Symlink
```bash
php artisan storage:link
```

#### 7. Build Frontend
```bash
npm run build
```

#### 8. เริ่มเซิร์ฟเวอร์
```bash
php artisan serve
```

เข้าเว็บที่ `http://localhost:8000`

---

## 📝 วิธีปรับปรุงแก้ไข

### โครงสร้างโครงการ
```
inventory-management/
├── app/
│   ├── Http/Controllers/     - Controllers สำหรับแต่ละหมวดจัดการ
│   ├── Models/               - Eloquent Models
│   ├── Services/             - Business Logic
│   └── Console/Commands/     - Artisan Commands
├── resources/
│   ├── js/
│   │   ├── Pages/            - React Pages (Admin, POS, Dashboard)
│   │   └── Components/       - React Components (Modal, Form, etc.)
│   ├── css/                  - Styling
│   └── views/                - Blade Templates
├── routes/
│   ├── web.php               - Web Routes
│   ├── api.php               - API Routes
│   └── auth.php              - Authentication Routes
├── database/
│   ├── migrations/           - Database Migrations
│   ├── seeders/              - Database Seeds
│   └── database.sqlite       - SQLite (development)
├── config/                   - Configuration Files
├── storage/                  - File Storage
└── public/                   - Public Assets
```

### ขั้นตอนการแก้ไขทั่วไป

#### 1️⃣ แก้ไขแบบฟอร์ม / Component React
```bash
# ไฟล์ที่เกี่ยวข้อง
resources/js/Pages/Admin/Products/Index.jsx
resources/js/Components/ProductForm.jsx

# Build และ refresh
npm run build
# Refresh browser (F5)
```

#### 2️⃣ แก้ไข Backend Logic / Controller
```bash
# ไฟล์ที่เกี่ยวข้อง
app/Http/Controllers/Admin/ProductController.php

# Test ด้วย artisan (optional)
php artisan tinker

# Restart server ไม่ต้อง (Hot reload)
```

#### 3️⃣ เพิ่ม Database Field
```bash
# สร้าง Migration
php artisan make:migration add_field_to_products_table

# แก้ไขไฟล์ migration
database/migrations/YYYY_MM_DD_XXXXXX_add_field_to_products_table.php

# รัน migration
php artisan migrate

# Update Model
app/Models/Product.php
// เพิ่ม $fillable หรือ $casts
```

#### 4️⃣ เพิ่ม Route ใหม่
```bash
# แก้ไข routes/web.php หรือ routes/api.php
Route::post('products', [ProductController::class, 'store'])->name('products.store');

# สร้าง Controller Method
public function store(StoreProductRequest $request) { ... }
```

#### 5️⃣ แก้ไข Styling (Tailwind)
```bash
# ไฟล์ที่เกี่ยวข้อง
resources/css/app.css

# ระบบ Tailwind จะ auto-compile
npm run dev  # Development mode with watch
```

### ⚙️ คำสั่งที่ใช้บ่อย

```bash
# Development Server
php artisan serve

# Frontend Build
npm run build          # Production build
npm run dev            # Development with watch

# Database
php artisan migrate    # รัน migrations
php artisan migrate:rollback  # ยกเลิก migration ล่าสุด
php artisan db:seed    # รัน seeders

# Cache
php artisan cache:clear     # ล้าง cache
php artisan view:clear      # ล้าง view cache
php artisan config:cache    # Cache config

# Tinker (Interactive Shell)
php artisan tinker     # Test code แบบ interactive

# Generate Keys
php artisan key:generate           # Generate APP_KEY
php artisan jwt:secret             # Generate JWT Secret (if using)
```

---

## 🔐 ความปลอดภัย

### Authentication
- ✅ Email Verification บังคับ
- ✅ CSRF Token Protection
- ✅ Sanctum API Tokens
- ✅ Role-based Access Control (Admin/Staff)

### Best Practices
- 🔒 ไม่ commit `.env` ลงใน Git
- 🔒 ใช้ Environment Variables สำหรับ sensitive data
- 🔒 Validate ข้อมูล input ทั้ง frontend และ backend
- 🔒 ใช้ HTTPS ใน production

---

## 🧪 การทดสอบ

### Unit Tests
```bash
php artisan test                    # รันทดสอบทั้งหมด
php artisan test --filter=ProductTest  # ทดสอบเฉพาะ class
```

### Feature Tests
```bash
php artisan test --filter=ProductFeatureTest
```

---

## 📱 หน้าสำคัญ

### Admin Pages
| หน้า | URL | ฟังก์ชัน |
|------|-----|----------|
| Dashboard | `/admin/dashboard` | สรุปข้อมูล |
| Products | `/admin/products` | จัดการสินค้า |
| Categories | `/admin/categories` | จัดการหมวดหมู่ |
| Users | `/admin/users` | จัดการผู้ใช้ |
| EOQ Calculator | `/admin/calculator` | คำนวณ EOQ |
| EOQ Dashboard | `/admin/eoq-dashboard` | ดูผลลัพธ์ EOQ |
| Reports | `/admin/reports/*` | รายงาน |

### POS Pages
| หน้า | URL | ฟังก์ชัน |
|------|-----|----------|
| POS | `/pos` | ขายสินค้า |

---

## 🐛 Troubleshooting

### ปัญหา: ข้อมูลไม่อัพเดต
**วิธีแก้:**
```bash
php artisan cache:clear
npm run build
# Refresh browser (Ctrl+Shift+R)
```

### ปัญหา: รูปภาพไม่แสดง
**วิธีแก้:**
```bash
php artisan storage:link
# ตรวจสอบ public/storage symlink
```

### ปัญหา: Database connection error
**วิธีแก้:**
```bash
# ตรวจสอบ .env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inventory_management
# ตรวจสอบ MySQL กำลังทำงาน
```

### ปัญหา: 500 Error
**วิธีแก้:**
```bash
# ดู error log
tail -f storage/logs/laravel.log

# Clear cache
php artisan cache:clear
php artisan config:clear
```

---

## 📚 Documentation Links

- [Laravel Official Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MySQL Documentation](https://dev.mysql.com/doc)

---

## 👥 ผู้ปฏิบัติงาน

| บทบาท | หน้าที่ |
|-------|--------|
| Admin | จัดการระบบทั้งหมด, สินค้า, ผู้ใช้, รายงาน |
| Staff | ขายสินค้า (POS) |

---
## 📞 ติดต่อ
<!--
- **ร้าน:** สมบัติเกษตรยนต์
- **โทร:** 089-560-8118
- **LINE:** @sombat
- **ที่อยู่:** 207 หมู่ 15 ต.เชียงดาว จ.เชียงใหม่
-->
---
## 📄 ใบอนุญาต
<!--
[ระบุประเภทใบอนุญาต เช่น MIT, GPL, ฯลฯ]

---
-->
**ปรับปรุงล่าสุด:** February 2025
