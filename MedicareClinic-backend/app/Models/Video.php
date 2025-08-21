<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    protected $fillable = ['title', 'description', 'video_path', 'is_published', 'category_id', 'cover_image'];

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
}
