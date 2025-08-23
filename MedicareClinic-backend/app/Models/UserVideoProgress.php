<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserVideoProgress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'video_id',
        'progress',
        'current_time',
        'total_duration',
        'completed',
        'last_watched_at'
    ];

    protected $casts = [
        'progress' => 'decimal:2',
        'current_time' => 'decimal:2',
        'total_duration' => 'decimal:2',
        'completed' => 'boolean',
        'last_watched_at' => 'datetime'
    ];

    protected $attributes = [
        'progress' => 0,
        'current_time' => 0,
        'completed' => false
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function video()
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * Calculate progress percentage based on current time and duration
     */
    public function calculateProgress(): float
    {
        if (!$this->total_duration || $this->total_duration <= 0) {
            return 0;
        }

        $progress = ($this->current_time / $this->total_duration) * 100;
        return min(100, max(0, round($progress, 2)));
    }

    /**
     * Update progress and automatically set completion status
     */
    public function updateProgress(float $currentTime, float $totalDuration): bool
    {
        $this->current_time = $currentTime;
        $this->total_duration = $totalDuration;
        $this->progress = $this->calculateProgress();
        $this->completed = $this->progress >= 95;
        $this->last_watched_at = now();

        return $this->save();
    }

    /**
     * Scope to get completed videos
     */
    public function scopeCompleted($query)
    {
        return $query->where('completed', true);
    }

    /**
     * Scope to get videos in progress
     */
    public function scopeInProgress($query)
    {
        return $query->where('progress', '>', 0)->where('completed', false);
    }

    /**
     * Scope to get videos not started
     */
    public function scopeNotStarted($query)
    {
        return $query->where('progress', 0);
    }
}
