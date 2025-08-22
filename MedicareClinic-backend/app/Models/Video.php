<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    protected $fillable = [
        'title',
        'description',
        'video_path',
        'cloudinary_public_id',
        'cloudinary_url',
        'cover_image',
        'cover_cloudinary_id',
        'cover_cloudinary_url',
        'is_published',
        'category_id',
        'duration',
        'file_size'
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'duration' => 'integer',
        'file_size' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function userProgress()
    {
        return $this->hasMany(UserVideoProgress::class);
    }

    // Helper method to get the video URL (prioritize Cloudinary)
    public function getVideoUrlAttribute()
    {
        if ($this->cloudinary_url) {
            return $this->cloudinary_url;
        }

        if ($this->video_path) {
            return url('storage/' . $this->video_path);
        }

        return null;
    }

    // Helper method to get the cover image URL (prioritize Cloudinary)
    public function getCoverUrlAttribute()
    {
        if ($this->cover_cloudinary_url) {
            return $this->cover_cloudinary_url;
        }

        if ($this->cover_image) {
            return url('storage/' . $this->cover_image);
        }

        return null;
    }
}
