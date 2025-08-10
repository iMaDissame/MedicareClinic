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
        Schema::table('users', function (Blueprint $table) {
           
            $table->date('access_start')->nullable()->after('password');
            $table->date('access_end')->nullable()->after('access_start');
            $table->boolean('is_active')->default(true)->after('access_end');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['access_start', 'access_end', 'is_active']);
            // Note: We're not dropping username as it might be used elsewhere
        });
    }
};
