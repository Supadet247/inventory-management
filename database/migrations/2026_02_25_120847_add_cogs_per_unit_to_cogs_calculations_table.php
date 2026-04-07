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
        Schema::table('cogs_calculations', function (Blueprint $table) {
            $table->decimal('cogs_per_unit', 15, 2)->default(0)->after('cogs');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cogs_calculations', function (Blueprint $table) {
            $table->dropColumn('cogs_per_unit');
        });
    }
};
