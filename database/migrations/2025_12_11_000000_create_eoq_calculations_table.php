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
        Schema::create('eoq_calculations', function (Blueprint $table) {
            $table->id();
            $table->string('product_name')->nullable();
            $table->decimal('annual_demand', 15, 2);
            $table->decimal('ordering_cost', 15, 2);
            $table->decimal('unit_cost', 15, 2);
            $table->decimal('holding_rate', 8, 4)->default(0.22);
            $table->decimal('holding_cost', 15, 2);
            $table->integer('eoq');
            $table->decimal('number_of_orders', 10, 2);
            $table->decimal('order_cycle_days', 10, 2);
            $table->decimal('daily_demand', 15, 2);
            $table->decimal('reorder_point', 15, 2);
            $table->decimal('total_cost', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('eoq_calculations');
    }
};