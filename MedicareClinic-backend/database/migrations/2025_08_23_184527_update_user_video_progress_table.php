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
        Schema::table('user_video_progress', function (Blueprint $table) {
            // Add current_time column to track where user stopped watching
            if (!Schema::hasColumn('user_video_progress', 'current_time')) {
                $table->decimal('current_time', 10, 2)->nullable()->after('progress');
            }

            // Add total_duration column to store video duration at time of watching
            if (!Schema::hasColumn('user_video_progress', 'total_duration')) {
                $table->decimal('total_duration', 10, 2)->nullable()->after('current_time');
            }

            // Modify progress column to ensure it's decimal with 2 places
            $table->decimal('progress', 5, 2)->default(0)->change();

            // Add index for better performance
            if (!Schema::hasIndex('user_video_progress', 'user_video_progress_user_video_index')) {
                $table->index(['user_id', 'video_id'], 'user_video_progress_user_video_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_video_progress', function (Blueprint $table) {
            $table->dropColumn(['current_time', 'total_duration']);
            $table->dropIndex('user_video_progress_user_video_index');
        });
    }
};
