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
        Schema::table('sales', function (Blueprint $table) {
            // Change payment_method from enum to string to be more flexible
            $table->string('payment_method')->nullable()->change();
            // Change received_amount from decimal to text/json to support mixed/installment data
            $table->text('received_amount')->nullable()->change();
        });

        Schema::table('receipts', function (Blueprint $table) {
            // Change payment_method from enum to string
            $table->string('payment_method')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->enum('payment_method', ['cash', 'creditcard', 'promptpay'])->change();
            $table->decimal('received_amount', 10, 2)->nullable()->change();
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->enum('payment_method', ['cash', 'creditcard', 'promptpay', 'mixed'])->change();
        });
    }
};
