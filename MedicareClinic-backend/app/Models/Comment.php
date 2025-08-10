<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'content',
        'user_id',
        'admin_id', // Add this field
        'video_id',
        'is_approved'
    ];

    protected $casts = [
        'is_approved' => 'boolean',
    ];

    // Relationship with regular users
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relationship with admin users
    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }

    // Relationship with videos
    public function video()
    {
        return $this->belongsTo(Video::class);
    }

    // Accessor to get the author (either user or admin)
    public function getAuthorAttribute()
    {
        if ($this->admin_id) {
            return $this->admin;
        }
        return $this->user;
    }

    // Accessor to get author name
    public function getAuthorNameAttribute()
    {
        $author = $this->author;
        return $author ? $author->name : 'Unknown';
    }

    // Check if comment was made by admin
    public function isFromAdmin()
    {
        return $this->admin_id !== null;
    }
}
