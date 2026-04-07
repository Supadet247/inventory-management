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
        Schema::create('returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_number')->unique();
            $table->foreignId('original_receipt_id')->constrained('receipts')->onDelete('restrict');
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->decimal('total_return_amount', 10, 2);
            $table->decimal('tax_return_amount', 10, 2);
            $table->decimal('grand_return_total', 10, 2);
            $table->enum('return_type', ['full', 'partial']);
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'completed', 'cancelled'])->default('pending');
            $table->timestamp('returned_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('return_number');
            $table->index(['returned_at', 'status']);
            $table->index('status');
            $table->index('original_receipt_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('returns');
    }
};