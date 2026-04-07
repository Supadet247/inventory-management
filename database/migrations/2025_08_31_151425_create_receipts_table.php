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
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->unique();
            $table->foreignId('sale_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->string('customer_name')->nullable();
            $table->string('customer_phone', 50)->nullable();
            $table->string('customer_tax_id', 20)->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->decimal('tax_amount', 10, 2);
            $table->decimal('grand_total', 10, 2);
            $table->enum('payment_method', ['cash', 'creditcard', 'promptpay', 'mixed']);
            $table->json('received_amount')->nullable(); // รองรับ mixed payment
            $table->decimal('change_amount', 10, 2)->default(0);
            $table->enum('receipt_type', ['sale', 'return', 'adjustment'])->default('sale');
            $table->enum('status', ['active', 'voided', 'returned'])->default('active');
            $table->timestamp('issued_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('receipt_number');
            $table->index(['issued_at', 'status']);
            $table->index('status');
            $table->index('receipt_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};