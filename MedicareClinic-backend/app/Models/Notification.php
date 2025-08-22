<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Notification extends Model
{
    protected $fillable = [
        'type',
        'title',
        'message',
        'data',
        'user_id',
        'admin_id',
        'is_read',
        'read_at',
        'priority',
        'expires_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }

    // Scopes
    public function scopeUnread(Builder $query): Builder
    {
        return $query->where('is_read', false);
    }

    public function scopeRead(Builder $query): Builder
    {
        return $query->where('is_read', true);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForAdmin(Builder $query, int $adminId): Builder
    {
        return $query->where('admin_id', $adminId);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeByPriority(Builder $query, string $priority): Builder
    {
        return $query->where('priority', $priority);
    }

    public function scopeNotExpired(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    // Helper methods
    public function markAsRead(): void
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    public function markAsUnread(): void
    {
        $this->update([
            'is_read' => false,
            'read_at' => null,
        ]);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function getRecipientAttribute()
    {
        return $this->user ?? $this->admin;
    }

    public function getRecipientTypeAttribute(): string
    {
        return $this->user_id ? 'user' : 'admin';
    }

    // Priority colors for frontend
    public function getPriorityColorAttribute(): string
    {
        return match($this->priority) {
            'low' => 'gray',
            'medium' => 'blue',
            'high' => 'orange',
            'urgent' => 'red',
            default => 'gray'
        };
    }

    // Notification types constants
    const TYPE_VIDEO_ADDED = 'video_added';
    const TYPE_COMMENT_APPROVED = 'comment_approved';
    const TYPE_COMMENT_REJECTED = 'comment_rejected';
    const TYPE_ACCESS_EXPIRING = 'access_expiring';
    const TYPE_ACCESS_EXPIRED = 'access_expired';
    const TYPE_NEW_COMMENT = 'new_comment';
    const TYPE_CATEGORY_ASSIGNED = 'category_assigned';
    const TYPE_SYSTEM_MAINTENANCE = 'system_maintenance';
    const TYPE_WELCOME = 'welcome';

    // Priority levels constants
    const PRIORITY_LOW = 'low';
    const PRIORITY_MEDIUM = 'medium';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_URGENT = 'urgent';
}
