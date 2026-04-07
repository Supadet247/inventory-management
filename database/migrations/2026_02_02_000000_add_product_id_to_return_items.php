<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Skip if product_id already exists
        if (Schema::hasColumn('return_items', 'product_id')) {
            return;
        }
        
        // Add the column as nullable
        Schema::table('return_items', function (Blueprint $table) {
            $table->unsignedBigInteger('product_id')->nullable()->after('receipt_item_id');
        });
        
        // Populate product_id from receipt_items table
        DB::table('return_items')
            ->join('receipt_items', 'return_items.receipt_item_id', '=', 'receipt_items.id')
            ->update(['return_items.product_id' => DB::raw('receipt_items.product_id')]);
        
        // Now add the foreign key constraint
        Schema::table('return_items', function (Blueprint $table) {
            $table->foreign('product_id')
                  ->references('id')
                  ->on('products')
                  ->onDelete('restrict');
            $table->index(['return_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::table('return_items', function (Blueprint $table) {
            if (Schema::hasColumn('return_items', 'product_id')) {
                $table->dropForeignKeyIfExists(['product_id']);
                $table->dropColumn('product_id');
            }
        });
    }
};
