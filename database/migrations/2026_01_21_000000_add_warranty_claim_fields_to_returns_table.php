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
        Schema::table('returns', function (Blueprint $table) {
            $table->boolean('warranty_claim_received')->default(false)->after('status');
            $table->timestamp('warranty_claim_received_at')->nullable()->after('warranty_claim_received');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('returns', function (Blueprint $table) {
            $table->dropColumn(['warranty_claim_received', 'warranty_claim_received_at']);
        });
    }
};
