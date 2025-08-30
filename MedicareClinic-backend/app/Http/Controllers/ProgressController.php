<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Video;
use Illuminate\Http\Request;
use App\Models\UserVideoProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProgressController extends Controller
{
    /**
     * Reset progress for a specific user and video
     */
    public function resetUserVideoProgress(Request $request, $userId, $videoId): JsonResponse
    {
        try {
            $progress = UserVideoProgress::where([
                'user_id' => $userId,
                'video_id' => $videoId
            ])->first();

            if ($progress) {
                $progress->progress = 0;
                $progress->current_time = 0;
                $progress->completed = false;
                $progress->last_watched_at = null;
                $progress->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Progress reset successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset progress: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Save user progress for a video
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'video_id' => 'required|exists:videos,id',
            'progress' => 'required|numeric|min:0|max:100',
            'user_id' => 'required|exists:users,id',
            'current_time' => 'nullable|numeric|min:0', // Add current time for better tracking
            'duration' => 'nullable|numeric|min:0'      // Add duration for validation
        ]);

        try {
            // Get the video to validate duration
            $video = Video::findOrFail($request->video_id);

            // If current_time and duration are provided, recalculate progress
            $calculatedProgress = $request->progress;
            if ($request->has('current_time') && $request->has('duration') && $request->duration > 0) {
                $calculatedProgress = min(100, ($request->current_time / $request->duration) * 100);
            }

            // Ensure progress never decreases unless explicitly resetting
            $existingProgress = UserVideoProgress::where([
                'user_id' => $request->user_id,
                'video_id' => $request->video_id
            ])->first();

            // Only update if the new progress is higher or if it's a reset (progress = 0)
            $finalProgress = $calculatedProgress;
            if ($existingProgress && $calculatedProgress > 0) {
                $finalProgress = max($existingProgress->progress, $calculatedProgress);
            }

            $progress = UserVideoProgress::updateOrCreate(
                [
                    'user_id' => $request->user_id,
                    'video_id' => $request->video_id
                ],
                [
                    'progress' => round($finalProgress, 2),
                    'current_time' => $request->current_time ?? null,
                    'total_duration' => $video->duration ?? $request->duration,
                    'completed' => $finalProgress >= 95, // Mark as completed if >=95%
                    'last_watched_at' => now()
                ]
            );

            Log::info("Progress updated", [
                'user_id' => $request->user_id,
                'video_id' => $request->video_id,
                'old_progress' => $existingProgress?->progress ?? 0,
                'new_progress' => $finalProgress,
                'current_time' => $request->current_time,
                'duration' => $request->duration
            ]);

            return response()->json([
                'success' => true,
                'data' => $progress,
                'message' => 'Progress saved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Progress save error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save progress: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's progress for a specific video
     */
    public function getUserVideoProgress($userId, $videoId): JsonResponse
    {
        try {
            $progress = UserVideoProgress::where([
                'user_id' => $userId,
                'video_id' => $videoId
            ])->first();

            return response()->json([
                'success' => true,
                'data' => $progress ? [
                    'progress' => (float) $progress->progress,
                    'current_time' => (float) ($progress->current_time ?? 0),
                    'completed' => $progress->completed,
                    'last_watched_at' => $progress->last_watched_at
                ] : null
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch progress'
            ], 500);
        }
    }

    /**
     * Reset all progress for a user (admin only)
     */
    public function resetAllUserProgress(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'confirm' => 'required|boolean|accepted'
        ]);

        try {
            $deletedCount = UserVideoProgress::where('user_id', $userId)->delete();

            Log::info("Reset all progress for user", [
                'user_id' => $userId,
                'deleted_records' => $deletedCount
            ]);

            return response()->json([
                'success' => true,
                'message' => "All progress reset successfully. Removed {$deletedCount} records."
            ]);
        } catch (\Exception $e) {
            Log::error('resetAllUserProgress error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset all progress'
            ], 500);
        }
    }

    /**
     * Recalculate progress for a user based on current video positions
     */
    public function recalculateProgress(Request $request, $userId): JsonResponse
    {
        try {
            $progressRecords = UserVideoProgress::where('user_id', $userId)
                ->with('video')
                ->get();

            $updatedCount = 0;
            foreach ($progressRecords as $progress) {
                if ($progress->current_time && $progress->total_duration && $progress->total_duration > 0) {
                    $newProgress = min(100, ($progress->current_time / $progress->total_duration) * 100);
                    $newCompleted = $newProgress >= 95;

                    if ($progress->progress !== $newProgress || $progress->completed !== $newCompleted) {
                        $progress->update([
                            'progress' => round($newProgress, 2),
                            'completed' => $newCompleted
                        ]);
                        $updatedCount++;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Progress recalculated successfully. Updated {$updatedCount} records."
            ]);
        } catch (\Exception $e) {
            Log::error('recalculateProgress error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to recalculate progress'
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
                'total_watch_time' => UserVideoProgress::sum(DB::raw('(progress / 100) * total_duration')),
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
                    'videoId' => $item->video_id, // Match frontend property name
                    'video_id' => $item->video_id,
                    'video_title' => $item->video->title,
                    'video_category' => $item->video->category?->name ?? 'Uncategorized',
                    'progress' => (float) $item->progress,
                    'current_time' => (float) ($item->current_time ?? 0),
                    'duration' => (float) ($item->total_duration ?? $item->video->duration ?? 0),
                    'completed' => $item->completed,
                    'last_watched' => $item->last_watched_at,
                ];
            });

            $overallProgress = $user->videoProgress->avg('progress') ?? 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'username' => $user->username
                    ],
                    'overall_progress' => round($overallProgress, 2),
                    'videos_completed' => $user->videoProgress->where('completed', true)->count(),
                    'total_videos_assigned' => $user->categories->sum(function ($category) {
                        return $category->videos()->where('is_published', true)->count();
                    }),
                    'progress_details' => $progress
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('getUserProgress error: ' . $e->getMessage());
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

    public function getUserStats($userId)
    {
        try {
            $user = User::findOrFail($userId);

            // Calculate total watch time based on actual progress and duration
            $totalWatchTime = UserVideoProgress::where('user_id', $userId)
                ->join('videos', 'user_video_progress.video_id', '=', 'videos.id')
                ->sum(DB::raw('(user_video_progress.progress / 100) * COALESCE(videos.duration, user_video_progress.total_duration, 0)'));

            // Find favorite category based on most watched videos
            $favoriteCategory = DB::table('user_video_progress')
                ->join('videos', 'user_video_progress.video_id', '=', 'videos.id')
                ->join('categories', 'videos.category_id', '=', 'categories.id')
                ->where('user_video_progress.user_id', $userId)
                ->where('user_video_progress.progress', '>', 0)
                ->select('categories.name')
                ->groupBy('categories.id', 'categories.name')
                ->orderByRaw('COUNT(*) DESC')
                ->value('categories.name');

            // Get last watched video
            $lastWatched = DB::table('user_video_progress')
                ->join('videos', 'user_video_progress.video_id', '=', 'videos.id')
                ->where('user_video_progress.user_id', $userId)
                ->orderBy('user_video_progress.updated_at', 'DESC')
                ->select('videos.id', 'videos.title', 'videos.description')
                ->first();

            // Calculate achievements (completed videos count)
            $achievements = UserVideoProgress::where('user_id', $userId)
                ->where('completed', true)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'totalWatchTime' => $totalWatchTime ?: 0,
                    'favoriteCategory' => $favoriteCategory ?: '',
                    'lastWatched' => $lastWatched ? [
                        'id' => $lastWatched->id,
                        'title' => $lastWatched->title,
                        'description' => $lastWatched->description
                    ] : null,
                    'achievements' => $achievements
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('getUserStats error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
