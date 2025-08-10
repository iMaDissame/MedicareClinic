<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Comment;

class CommentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Comment::insert([
            [
                'content' => 'This video really helped me understand the topic.',
                'is_approved' => true,
                'user_id' => 12,
                'video_id' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'content' => 'Great explanation, very clear and concise.',
                'is_approved' => true,
                'user_id' => 12,
                'video_id' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'content' => 'Looking forward to more videos like this.',
                'is_approved' => false,
                'user_id' => 12,
                'video_id' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'content' => 'Thanks for sharing this valuable information.',
                'is_approved' => true,
                'user_id' => 12,
                'video_id' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
