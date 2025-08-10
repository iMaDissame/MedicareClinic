<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function stats()
    {
        try {
            $totalStudents = User::count();
            $activeStudents = User::where('is_active', true)->count();
            $publishedVideos = Video::where('is_published', true)->count();
            $totalVideos = Video::count();

            // Get the 5 most recently added videos - using correct column name
            $recentVideos = Video::latest()
                ->take(5)
                ->select(['id', 'title', 'created_at', 'is_published', 'cover_image'])
                ->get()
                ->map(function ($video) {
                    return [
                        'id' => $video->id,
                        'title' => $video->title,
                        'is_published' => $video->is_published,
                        'created_at' => $video->created_at->toISOString(),
                        'cover_image' => $video->cover_image,
                    ];
                });

            return response()->json([
                'total_students' => $totalStudents,
                'active_students' => $activeStudents,
                'active_published_videos' => $publishedVideos,
                'total_videos' => $totalVideos,
                'recent_videos' => $recentVideos
            ]);

        } catch (\Exception $e) {
            Log::error('Dashboard stats error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'message' => 'Error fetching dashboard statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
