<?php

namespace App\Http\Controllers;

use App\Models\UserVideoProgress;
use App\Models\User;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    /**
     * Save user progress for a video
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'video_id' => 'required|exists:videos,id',
            'progress' => 'required|numeric|min:0|max:100',
            'user_id' => 'required|exists:users,id'
        ]);

        try {
            $progress = UserVideoProgress::updateOrCreate(
                [
                    'user_id' => $request->user_id,
                    'video_id' => $request->video_id
                ],
                [
                    'progress' => $request->progress,
                    'completed' => $request->progress >= 95, // Mark as completed if >95%
                    'last_watched_at' => now()
                ]
            );

            return response()->json([
                'success' => true,
                'data' => $progress
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save progress'
            ], 500);
        }
    }

    /**
     * Get progress statistics for admin dashboard
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::withValidAccess()->count(),
                'total_videos' => Video::where('is_published', true)->count(),
                'total_watch_time' => UserVideoProgress::sum('progress'),
                'average_completion_rate' => UserVideoProgress::avg('progress'),
                'completed_videos_count' => UserVideoProgress::where('completed', true)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics'
            ], 500);
        }
    }

    /**
     * Get user progress details for admin
     */
    public function getUserProgress($userId): JsonResponse
    {
        try {
            $user = User::with(['categories', 'videoProgress.video.category'])->findOrFail($userId);

            $progress = $user->videoProgress->map(function ($item) {
                return [
                    'video_id' => $item->video_id,
                    'video_title' => $item->video->title,
                    'video_category' => $item->video->category->name,
                    'progress' => (float) $item->progress,
                    'completed' => $item->completed,
                    'last_watched' => $item->last_watched_at,
                    'duration' => null // You can add duration to videos later
                ];
            });

            $overallProgress = $user->videoProgress->avg('progress');

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'username' => $user->username
                    ],
                    'overall_progress' => $overallProgress,
                    'videos_completed' => $user->videoProgress->where('completed', true)->count(),
                    'total_videos_assigned' => $user->categories->sum(function ($category) {
                        return $category->videos()->where('is_published', true)->count();
                    }),
                    'progress_details' => $progress
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user progress'
            ], 500);
        }
    }

    /**
     * Get all users progress for admin
     */
    public function getAllUsersProgress(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);

            $users = User::withCount([
                'videoProgress as completed_videos_count' => function ($query) {
                    $query->where('completed', true);
                }
            ])->with(['categories' => function ($query) {
                $query->withCount(['videos' => function ($query) {
                    $query->where('is_published', true);
                }]);
            }])->paginate($perPage);

            $users->getCollection()->transform(function ($user) {
                $totalVideos = $user->categories->sum('videos_count');
                $progress = UserVideoProgress::where('user_id', $user->id)
                    ->selectRaw('AVG(progress) as avg_progress, COUNT(*) as videos_started')
                    ->first();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'total_videos_assigned' => $totalVideos,
                    'videos_started' => $progress->videos_started ?? 0,
                    'videos_completed' => $user->completed_videos_count,
                    'overall_progress' => (float) ($progress->avg_progress ?? 0),
                    'last_activity' => UserVideoProgress::where('user_id', $user->id)
                        ->max('last_watched_at')
                ];
            });

            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users progress'
            ], 500);
        }
    }
}
