<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('stock_lot_instances');
    }

    public function down(): void
    {
        Schema::create('stock_lot_instances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('lot_number');
            $table->integer('quantity')->default(0);
            $table->date('expiry_date')->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'lot_number'], 'unique_product_lot');
            $table->index('lot_number');
            $table->index('expiry_date');
        });
    }
};
