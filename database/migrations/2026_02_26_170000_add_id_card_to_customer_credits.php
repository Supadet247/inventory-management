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
        Schema::table('customer_credits', function (Blueprint $table) {
            $table->string('id_card_number', 13)->nullable()->after('customer_phone')->comment('รหัสบัตรประชาชน 13 หลัก');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_credits', function (Blueprint $table) {
            $table->dropColumn('id_card_number');
        });
    }
};
