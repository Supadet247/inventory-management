<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            // ลบ foreign key
            if (Schema::hasColumn('stock_movements', 'stock_lot_instance_id')) {
                $table->dropForeign(['stock_lot_instance_id']);
                $table->dropColumn('stock_lot_instance_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('stock_lot_instance_id')->nullable()->constrained('stock_lot_instances')->onDelete('set null')->after('product_id');
        });
    }
};
