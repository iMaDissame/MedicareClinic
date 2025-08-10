<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $fillable = ['name', 'username', 'email', 'password'];
    protected $hidden = ['password'];

    // Add this to ensure password is always hashed
    protected $casts = [
        'password' => 'hashed',
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'guard' => 'admin',
            'role' => 'admin'
        ];
    }

    // Add this accessor to always return 'admin' as role
    public function getRoleAttribute()
    {
        return 'admin';
    }

    public function chats()
    {
        return $this->hasMany(DirectChat::class);
    }
}
