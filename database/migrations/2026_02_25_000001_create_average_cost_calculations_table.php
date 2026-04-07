<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('average_cost_calculations', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->nullable();
            $table->string('product_name')->nullable();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->decimal('beginning_value', 15, 2)->nullable();           // มูลค่าสินค้าคงเหลือต้นงวด (THB)
            $table->decimal('beginning_unit_cost', 15, 2)->nullable();       // Cb - ราคาทุนต่อหน่วยต้นงวด
            $table->decimal('calculated_qb', 15, 4)->nullable();             // Qb = beginning_value / Cb
            $table->decimal('purchase_value', 15, 2)->nullable();            // มูลค่าสินค้าที่ซื้อเพิ่ม (THB)
            $table->decimal('purchase_quantity', 15, 2)->nullable();         // Qp - จำนวนที่ซื้อเพิ่ม
            $table->decimal('calculated_cp', 15, 2)->nullable();             // Cp = purchase_value / Qp
            $table->decimal('average_cost', 15, 2)->nullable();              // AC - ต้นทุนต่อหน่วยเฉลี่ย
            $table->decimal('total_beginning_cost', 15, 2)->nullable();      // = beginning_value
            $table->decimal('total_purchase_cost', 15, 2)->nullable();       // = purchase_value
            $table->decimal('total_quantity', 15, 4)->nullable();            // Qtotal = Qb + Qp
            $table->string('calculation_name')->nullable();                  // ชื่อการคำนวณ (สำหรับ upsert)
            $table->timestamps();

            // Foreign key to products table
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');

            // Index for faster lookups
            $table->index('sku');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('average_cost_calculations');
    }
};
