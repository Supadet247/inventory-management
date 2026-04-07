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
        Schema::create('cost_per_area_calculations', function (Blueprint $table) {
            $table->id();
            $table->string('calculation_name')->nullable();
            // Monthly data (stored as JSON)
            $table->json('monthly_data');
            // Fixed costs
            $table->decimal('land_cost', 15, 2);
            $table->integer('usage_years');
            $table->decimal('store_size', 10, 2);
            // Calculated results
            $table->decimal('total_monthly_cost', 15, 2);
            $table->decimal('avg_annual_store_cost', 15, 2);
            $table->decimal('total_storage_cost', 15, 2);
            $table->decimal('avg_monthly_storage_cost', 15, 2);
            $table->decimal('cost_per_square_meter', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cost_per_area_calculations');
    }
};
