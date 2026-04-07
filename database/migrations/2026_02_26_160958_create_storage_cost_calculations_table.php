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
        Schema::create('storage_cost_calculations', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->nullable();
            $table->string('product_name')->nullable();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->decimal('width', 10, 2)->nullable();                    // W - ความกว้าง (เมตร)
            $table->decimal('length', 10, 2)->nullable();                   // L - ความยาว (เมตร)
            $table->decimal('product_area', 10, 4)->nullable();             // A = W × L (ตร.ม.)
            $table->decimal('warehouse_total_area', 10, 2)->nullable();     // พื้นที่คลังสินค้ารวม (ตร.ม.)
            $table->decimal('total_storage_cost_per_year', 15, 2)->nullable(); // ค่าใช้จ่ายรวมต่อปี (จาก cost_per_area_calculations)
            $table->decimal('cost_per_sqm_per_year', 15, 2)->nullable();    // ต้นทุน/ตร.ม./ปี = total_storage_cost / warehouse_area
            $table->decimal('storage_cost_per_year', 15, 2)->nullable();    // ต้นทุนพื้นที่จัดเก็บสินค้า/ปี = A × cost_per_sqm
            $table->string('calculation_name')->nullable();
            $table->timestamps();

            // Foreign key
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
            
            // Indexes
            $table->index('sku');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('storage_cost_calculations');
    }
};
