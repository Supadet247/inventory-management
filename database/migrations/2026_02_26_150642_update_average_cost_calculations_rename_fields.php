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
        Schema::table('average_cost_calculations', function (Blueprint $table) {
            // Rename existing columns
            $table->renameColumn('beginning_quantity', 'beginning_value');
            $table->renameColumn('purchase_unit_cost', 'purchase_value');
            
            // Add new calculated columns
            $table->decimal('calculated_qb', 15, 4)->nullable()->after('beginning_unit_cost');
            $table->decimal('calculated_cp', 15, 2)->nullable()->after('purchase_quantity');
            
            // Change precision for total_quantity
            $table->decimal('total_quantity', 15, 4)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('average_cost_calculations', function (Blueprint $table) {
            // Reverse changes
            $table->renameColumn('beginning_value', 'beginning_quantity');
            $table->renameColumn('purchase_value', 'purchase_unit_cost');
            
            $table->dropColumn('calculated_qb');
            $table->dropColumn('calculated_cp');
            
            $table->decimal('total_quantity', 15, 2)->change();
        });
    }
};
