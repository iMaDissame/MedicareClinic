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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // 'video_added', 'comment_approved', 'access_expiring', etc.
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // Additional data (video_id, comment_id, etc.)

            // Recipient (either user or admin)
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('admin_id')->nullable();

            // Status
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();

            // Priority levels
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');

            // Optional expiry
            $table->timestamp('expires_at')->nullable();

            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('admin_id')->references('id')->on('admins')->onDelete('cascade');

            // Indexes
            $table->index(['user_id', 'is_read']);
            $table->index(['admin_id', 'is_read']);
            $table->index(['type']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
