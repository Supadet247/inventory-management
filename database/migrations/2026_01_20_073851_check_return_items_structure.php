<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check the structure of return_items table
        echo "Checking return_items table structure...\n";
        
        $columns = DB::select('SHOW COLUMNS FROM return_items');
        foreach ($columns as $column) {
            echo $column->Field . " - " . $column->Type . " - " . $column->Null . " - " . $column->Key . "\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};