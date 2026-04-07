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
        Schema::table('products', function (Blueprint $table) {
            $table->integer('warranty_days')->default(0)->after('warranty');
            $table->integer('warranty_months')->default(0)->after('warranty_days');
            $table->integer('warranty_years')->default(0)->after('warranty_months');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['warranty_days', 'warranty_months', 'warranty_years']);
        });
    }
};