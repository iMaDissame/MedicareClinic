<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Example static users
        User::create([
            'name' => 'client zouhair',

            'email' => 'clientzouhair@example.com',
            'password' => Hash::make('123456789'),
        ]);


        // Optionally, generate random fake users
        User::factory()->count(10)->create();
    }
}
