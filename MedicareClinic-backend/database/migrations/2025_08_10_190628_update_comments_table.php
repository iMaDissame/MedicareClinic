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
    Schema::table('comments', function (Blueprint $table) {
        if (!Schema::hasColumn('comments', 'content')) {
            $table->text('content')->after('id');
        }
        if (!Schema::hasColumn('comments', 'is_approved')) {
            $table->boolean('is_approved')->default(false)->after('content');
        }
        if (!Schema::hasColumn('comments', 'user_id')) {
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->after('is_approved');
        }
        if (!Schema::hasColumn('comments', 'video_id')) {
            $table->foreignId('video_id')->constrained()->onDelete('cascade')->after('user_id');
        }

        $table->index(['video_id', 'is_approved']);
        $table->index(['user_id']);
        $table->index(['created_at']);
    });
}

public function down(): void
{
    Schema::table('comments', function (Blueprint $table) {
        $table->dropIndex(['video_id', 'is_approved']);
        $table->dropIndex(['user_id']);
        $table->dropIndex(['created_at']);

        $table->dropColumn(['content', 'is_approved', 'user_id', 'video_id']);
    });
}

};
