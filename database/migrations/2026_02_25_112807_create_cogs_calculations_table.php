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
        Schema::create('cogs_calculations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('set null');
            $table->string('sku')->nullable();
            $table->string('product_name')->nullable();
            // Beginning inventory
            $table->decimal('beginning_inventory_cost', 15, 2)->default(0);
            $table->decimal('beginning_inventory_quantity', 15, 2)->default(0);
            // Net purchases
            $table->decimal('net_purchases_cost', 15, 2)->default(0);
            $table->decimal('net_purchases_quantity', 15, 2)->default(0);
            // Ending inventory
            $table->decimal('ending_inventory_cost', 15, 2)->default(0);
            $table->decimal('ending_inventory_quantity', 15, 2)->default(0);
            // Calculated results
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->decimal('total_quantity', 15, 2)->default(0);
            $table->decimal('average_cost', 15, 2)->default(0);
            $table->decimal('cogs', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cogs_calculations');
    }
};
