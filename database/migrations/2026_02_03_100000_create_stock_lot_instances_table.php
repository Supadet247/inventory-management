<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_lot_instances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('lot_number');
            $table->integer('quantity')->default(0);
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Unique constraint: same product can't have duplicate lot numbers
            $table->unique(['product_id', 'lot_number'], 'unique_product_lot');
            
            // Indexes for faster queries
            $table->index('lot_number');
            $table->index('expiry_date');
        });

        // Add stock_lot_instance_id to stock_movements for tracking
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('stock_lot_instance_id')
                ->nullable()
                ->after('product_id')
                ->constrained('stock_lot_instances')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['stock_lot_instance_id']);
            $table->dropColumn('stock_lot_instance_id');
        });

        Schema::dropIfExists('stock_lot_instances');
    }
};
