<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Carbon\Carbon;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'access_start',
        'access_end',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'access_start' => 'date',
            'access_end' => 'date',
            'is_active' => 'boolean',
        ];
    }

    // JWT Methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'guard' => 'api',
            'role' => 'student'
        ];
    }

    public function getRoleAttribute()
    {
        return 'student';
    }

    // Access control methods
    public function hasValidAccess()
    {
        if (!$this->is_active) {
            return false;
        }

        $now = Carbon::now();
        $accessStart = Carbon::parse($this->access_start);
        $accessEnd = Carbon::parse($this->access_end);

        return $now->between($accessStart, $accessEnd);
    }

    public function getDaysRemainingAttribute()
    {
        if (!$this->access_end) {
            return null;
        }

        $now = Carbon::now();
        $accessEnd = Carbon::parse($this->access_end);

        return $now->diffInDays($accessEnd, false);
    }

    public function getAccessStatusAttribute()
    {
        if (!$this->is_active) {
            return 'inactive';
        }

        $daysRemaining = $this->days_remaining;

        if ($daysRemaining === null) {
            return 'no_expiry';
        }

        if ($daysRemaining < 0) {
            return 'expired';
        }

        if ($daysRemaining <= 7) {
            return 'expiring_soon';
        }

        return 'active';
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWithValidAccess($query)
    {
        $now = Carbon::now();
        return $query->active()
                    ->where('access_start', '<=', $now)
                    ->where('access_end', '>=', $now);
    }

    public function scopeExpiringSoon($query, $days = 7)
    {
        $now = Carbon::now();
        $threshold = $now->copy()->addDays($days);

        return $query->active()
                    ->where('access_end', '>=', $now)
                    ->where('access_end', '<=', $threshold);
    }

    public function scopeExpired($query)
    {
        $now = Carbon::now();
        return $query->where('access_end', '<', $now);
    }
}
