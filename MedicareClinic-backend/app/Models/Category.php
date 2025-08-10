<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    /**
     * A category can have many videos
     */
    public function videos()
    {
        return $this->hasMany(Video::class);
    }

    /**
     * A category can be assigned to many users (many-to-many relationship)
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'category_user', 'category_id', 'user_id')
               ->withTimestamps();
    }

    /**
     * Scope to get categories with users count
     */
    public function scopeWithUsersCount($query)
    {
        return $query->withCount('users');
    }

    /**
     * Scope to get categories with videos count
     */
    public function scopeWithVideosCount($query)
    {
        return $query->withCount('videos');
    }

    /**
     * Get categories that have at least one user
     */
    public function scopeHasUsers($query)
    {
        return $query->has('users');
    }

    /**
     * Get categories that have at least one video
     */
    public function scopeHasVideos($query)
    {
        return $query->has('videos');
    }
}
