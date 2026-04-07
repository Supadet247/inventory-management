<?php

return [
    /*
    |--------------------------------------------------------------------------
    | POS Store Information
    |--------------------------------------------------------------------------
    |
    | These values are used throughout the POS system for receipts,
    | reports, and display purposes.
    |
    */
    'store_info' => [
        'name' => env('POS_STORE_NAME', 'สมบัติเกษตรยนต์'),
        'address' => env('POS_STORE_ADDRESS', '207 หมู่ 15 ต.เชียงดาว อ.เชียงดาว จ.เชียงใหม่'),
        'phone' => env('POS_STORE_PHONE', '089-560-8118'),
        'tax_id' => env('POS_STORE_TAX_ID', '1463315038'),
        'business_hours' => env('POS_BUSINESS_HOURS', '08:00 - 18:00'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Return Policy Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the return policy settings for the POS system.
    |
    */
    'return_policy' => [
        'max_days' => env('POS_RETURN_MAX_DAYS', 7),
        'allow_partial_returns' => env('POS_ALLOW_PARTIAL_RETURNS', true),
        'require_original_receipt' => env('POS_REQUIRE_ORIGINAL_RECEIPT', true),
        'allow_cash_returns' => env('POS_ALLOW_CASH_RETURNS', true),
        'allow_exchange_only' => env('POS_ALLOW_EXCHANGE_ONLY', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Returns Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for return processing behavior.
    |
    */
    'returns' => [
        'auto_approve' => env('POS_RETURNS_AUTO_APPROVE', false),
        'require_approval' => env('POS_RETURNS_REQUIRE_APPROVAL', false),
        'auto_complete' => env('POS_RETURNS_AUTO_COMPLETE', false),
        'require_manager_approval' => env('POS_RETURNS_REQUIRE_MANAGER_APPROVAL', false),
        'max_amount_without_approval' => env('POS_RETURNS_MAX_AMOUNT_WITHOUT_APPROVAL', 1000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Receipt Configuration
    |--------------------------------------------------------------------------
    |
    | Configure receipt generation and printing settings.
    |
    */
    'receipt' => [
        'paper_width' => env('POS_RECEIPT_PAPER_WIDTH', '80mm'),
        'print_logo' => env('POS_RECEIPT_PRINT_LOGO', false),
        'logo_path' => env('POS_RECEIPT_LOGO_PATH', null),
        'footer_message' => env('POS_RECEIPT_FOOTER_MESSAGE', 'ขอบคุณที่ใช้บริการ'),
        'show_cashier' => env('POS_RECEIPT_SHOW_CASHIER', true),
        'show_tax_breakdown' => env('POS_RECEIPT_SHOW_TAX_BREAKDOWN', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tax Configuration
    |--------------------------------------------------------------------------
    |
    | Configure tax calculation settings.
    |
    */
    'tax' => [
        'rate' => env('POS_TAX_RATE', 0.07), // 7% VAT
        'included_in_price' => env('POS_TAX_INCLUDED_IN_PRICE', false),
        'rounding_method' => env('POS_TAX_ROUNDING_METHOD', 'round'), // round, floor, ceil
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Methods
    |--------------------------------------------------------------------------
    |
    | Available payment methods in the POS system.
    |
    */
    'payment_methods' => [
        'cash' => [
            'enabled' => true,
            'name' => 'เงินสด',
            'icon' => '💵',
        ],
        'card' => [
            'enabled' => true,
            'name' => 'บัตรเครดิต/เดบิต',
            'icon' => '💳',
        ],
        'bank_transfer' => [
            'enabled' => true,
            'name' => 'โอนเงิน',
            'icon' => '🏦',
        ],
        'promptpay' => [
            'enabled' => true,
            'name' => 'พร้อมเพย์',
            'icon' => '📱',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Inventory Integration
    |--------------------------------------------------------------------------
    |
    | Configure how POS integrates with inventory management.
    |
    */
    'inventory' => [
        'auto_update_stock' => env('POS_AUTO_UPDATE_STOCK', true),
        'allow_negative_stock' => env('POS_ALLOW_NEGATIVE_STOCK', false),
        'low_stock_warning' => env('POS_LOW_STOCK_WARNING', true),
        'low_stock_threshold' => env('POS_LOW_STOCK_THRESHOLD', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Settings
    |--------------------------------------------------------------------------
    |
    | Configure POS security and access control settings.
    |
    */
    'security' => [
        'require_pin_for_void' => env('POS_REQUIRE_PIN_FOR_VOID', false),
        'require_pin_for_discount' => env('POS_REQUIRE_PIN_FOR_DISCOUNT', false),
        'max_discount_percentage' => env('POS_MAX_DISCOUNT_PERCENTAGE', 20),
        'session_timeout' => env('POS_SESSION_TIMEOUT', 480), // minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | Display Settings
    |--------------------------------------------------------------------------
    |
    | Configure POS display and UI settings.
    |
    */
    'display' => [
        'currency_symbol' => env('POS_CURRENCY_SYMBOL', '฿'),
        'currency_position' => env('POS_CURRENCY_POSITION', 'after'), // before, after
        'decimal_places' => env('POS_DECIMAL_PLACES', 2),
        'thousand_separator' => env('POS_THOUSAND_SEPARATOR', ','),
        'decimal_separator' => env('POS_DECIMAL_SEPARATOR', '.'),
        'date_format' => env('POS_DATE_FORMAT', 'd/m/Y'),
        'time_format' => env('POS_TIME_FORMAT', 'H:i'),
    ],
];