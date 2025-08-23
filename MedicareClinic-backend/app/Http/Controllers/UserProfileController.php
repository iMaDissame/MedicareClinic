<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserProfileController extends Controller
{
    /**
     * Get the authenticated user's profile
     */
    public function show()
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => 'student',
                    'access_start' => $user->access_start,
                    'access_end' => $user->access_end,
                    'is_active' => $user->is_active,
                    'access_status' => $user->access_status,
                    'days_remaining' => $user->days_remaining,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching user profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch profile'
            ], 500);
        }
    }

    /**
     * Update the authenticated user's profile
     */
    public function update(Request $request)
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'username' => [
                    'required',
                    'string',
                    'max:255',
                    'alpha_dash',
                    Rule::unique('users', 'username')->ignore($user->id)
                ],
                'email' => [
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('users', 'email')->ignore($user->id)
                ],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Manual assignment and save instead of update()
            $user->name = $request->name;
            $user->username = $request->username;
            $user->email = $request->email;
            $user->save();

            Log::info('User profile updated successfully', [
                'user_id' => $user->id,
                'updated_fields' => ['name', 'username', 'email']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => 'student',
                    'access_start' => $user->access_start,
                    'access_end' => $user->access_end,
                    'is_active' => $user->is_active,
                    'access_status' => $user->access_status,
                    'days_remaining' => $user->days_remaining,
                    'updated_at' => $user->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating user profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile'
            ], 500);
        }
    }

    /**
     * Update the authenticated user's password
     */
    public function updatePassword(Request $request)
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 422);
            }

            $user->password = Hash::make($request->new_password);
            $user->save();

            Log::info('User password updated successfully', [
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating user password: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update password'
            ], 500);
        }
    }

    /**
     * Get user statistics
     */
    public function getStatistics()
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Get user's assigned categories
            $categoriesCount = $user->categories()->count();

            // Get available videos from assigned categories
            $assignedVideos = $user->getAssignedVideos();
            $totalVideos = $assignedVideos->count();

            // Get user's video progress
            $videoProgress = $user->videoProgress();
            $watchedVideos = $videoProgress->where('completed', true)->count();
            $inProgressVideos = $videoProgress->where('completed', false)->where('progress_percentage', '>', 0)->count();

            // Get user's comments
            $totalComments = \App\Models\Comment::where('user_id', $user->id)->count();
            $approvedComments = \App\Models\Comment::where('user_id', $user->id)->where('status', 'approved')->count();

            // Get user's notifications
            $unreadNotifications = $user->unreadNotifications()->count();

            // Calculate overall progress percentage
            $overallProgress = $totalVideos > 0 ? round(($watchedVideos / $totalVideos) * 100) : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'assigned_categories' => $categoriesCount,
                    'total_videos' => $totalVideos,
                    'watched_videos' => $watchedVideos,
                    'in_progress_videos' => $inProgressVideos,
                    'overall_progress' => $overallProgress,
                    'total_comments' => $totalComments,
                    'approved_comments' => $approvedComments,
                    'unread_notifications' => $unreadNotifications,
                    'access_status' => $user->access_status,
                    'days_remaining' => $user->days_remaining,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching user statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics'
            ], 500);
        }
    }

    /**
     * Get user activity log
     */
    public function getActivityLog()
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $activities = [];

            // Get recent video progress activities
            $recentProgress = $user->videoProgress()
                ->with('video')
                ->orderBy('updated_at', 'desc')
                ->limit(10)
                ->get();

            foreach ($recentProgress as $progress) {
                if ($progress->completed) {
                    $activities[] = [
                        'type' => 'video_completed',
                        'description' => "Completed watching: {$progress->video->title}",
                        'created_at' => $progress->updated_at
                    ];
                } else {
                    $activities[] = [
                        'type' => 'video_progress',
                        'description' => "Watched {$progress->progress_percentage}% of: {$progress->video->title}",
                        'created_at' => $progress->updated_at
                    ];
                }
            }

            // Get recent comments
            $recentComments = \App\Models\Comment::where('user_id', $user->id)
                ->with('video')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            foreach ($recentComments as $comment) {
                $activities[] = [
                    'type' => 'comment_posted',
                    'description' => "Posted a comment on: {$comment->video->title}",
                    'created_at' => $comment->created_at
                ];
            }

            // Sort activities by date
            usort($activities, function ($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            // Limit to 15 most recent activities
            $activities = array_slice($activities, 0, 15);

            return response()->json([
                'success' => true,
                'data' => $activities
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching user activity log: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch activity log'
            ], 500);
        }
    }
}
