<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // This migration was intended to update foreign key constraints to allow product deletion
        // However, due to complexity with existing data and constraints, 
        // we're handling this in the application layer instead.
        
        // The controllers now check for related records before deletion
        // and show an appropriate error message to the user
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op for this simplified approach
    }
};