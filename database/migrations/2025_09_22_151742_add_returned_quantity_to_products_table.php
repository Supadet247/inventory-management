<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // เพิ่มคอลัมน์เก็บจำนวนสินค้าที่ถูกคืน
            $table->integer('returned_quantity')->default(0)->after('quantity');
            
            // เพิ่ม index เพื่อความเร็วในการ query
            $table->index('returned_quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['returned_quantity']);
            $table->dropColumn('returned_quantity');
        });
    }
};