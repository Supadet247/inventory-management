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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('total_amount', 10, 2); // ยอดรวมก่อนภาษี
            $table->decimal('tax_amount', 10, 2); // ภาษี VAT 7%
            $table->decimal('grand_total', 10, 2); // ยอดรวมสุทธิ
            $table->enum('payment_method', ['cash', 'creditcard', 'promptpay']);
            $table->decimal('received_amount', 10, 2)->nullable(); // เงินที่รับมา (สำหรับเงินสด)
            $table->decimal('change_amount', 10, 2)->default(0); // เงินทอน
            $table->datetime('sale_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'sale_date']);
            $table->index('payment_method');
            $table->index('sale_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};