<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update the enum to include return-related types
        DB::statement("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('in', 'out', 'adjustment', 'return_in', 'restock_from_returned', 'discard_returned') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('in', 'out', 'adjustment') NOT NULL");
    }
};
