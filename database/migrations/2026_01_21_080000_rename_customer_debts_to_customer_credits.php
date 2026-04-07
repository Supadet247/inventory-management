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
        // Drop the old table if exists
        Schema::dropIfExists('customer_debts');

        // Create new customer_credits table
        Schema::create('customer_credits', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name'); // ชื่อ-นามสกุล
            $table->string('customer_phone', 10); // เบอร์โทรศัพท์ 10 ตัว
            $table->decimal('total_amount', 10, 2); // ยอดผ่อนชำระทั้งหมด
            $table->decimal('down_payment_percent', 5, 2); // เงินดาวน์เป็น % (30-50%)
            $table->integer('installment_count')->unsigned()->default(1); // จำนวนงวด (1-5)
            $table->decimal('installment_amount', 10, 2); // ยอดต่องวด
            $table->date('installment_start_date'); // วันที่เริ่มผ่อน
            $table->decimal('paid_amount', 10, 2)->default(0); // ยอดที่ชำระแล้ว
            $table->integer('paid_installments')->unsigned()->default(0); // จำนวนงวดที่ชำระแล้ว
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_credits');

        // Recreate the old table structure
        Schema::create('customer_debts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('receipt_id')->constrained()->onDelete('cascade');
            $table->string('customer_name');
            $table->string('customer_phone')->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->text('description')->nullable();
            $table->enum('status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            $table->timestamps();
        });
    }
};
