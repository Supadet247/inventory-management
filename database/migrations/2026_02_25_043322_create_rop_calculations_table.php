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
        Schema::create('rop_calculations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('set null');
            $table->string('product_name')->nullable();
            $table->string('sku')->nullable();
            $table->decimal('annual_demand', 15, 2);
            $table->decimal('lead_time', 10, 2);
            $table->decimal('safety_stock', 15, 2)->default(0);
            $table->decimal('daily_demand', 15, 2);
            $table->decimal('rop', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rop_calculations');
    }
};
