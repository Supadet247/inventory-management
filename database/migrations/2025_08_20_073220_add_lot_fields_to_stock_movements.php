<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->string('lot_number')->nullable()->after('notes');
            $table->date('expiry_date')->nullable()->after('lot_number');
            $table->string('supplier')->nullable()->after('expiry_date');
            $table->decimal('purchase_price', 10, 2)->nullable()->after('supplier');
            
            // เพิ่ม index สำหรับ lot_number
            $table->index('lot_number');
            $table->index('expiry_date');
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex(['lot_number']);
            $table->dropIndex(['expiry_date']);
            $table->dropColumn(['lot_number', 'expiry_date', 'supplier', 'purchase_price']);
        });
    }
};