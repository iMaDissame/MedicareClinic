<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DirectChat extends Model
{
    protected $fillable = ['admin_id', 'user_id'];

    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'chat_id');
    }

    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

