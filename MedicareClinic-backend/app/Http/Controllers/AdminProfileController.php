<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class AdminProfileController extends Controller
{
    /**
     * Get the authenticated admin's profile
     */
    public function show()
    {
        try {
            $admin = Auth::guard('admin')->user();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'username' => $admin->username,
                    'email' => $admin->email,
                    'role' => 'admin',
                    'created_at' => $admin->created_at,
                    'updated_at' => $admin->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching admin profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch profile'
            ], 500);
        }
    }

    /**
     * Update the authenticated admin's profile
     */
    public function update(Request $request)
    {
        try {
            $admin = Auth::guard('admin')->user();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'username' => [
                    'required',
                    'string',
                    'max:255',
                    'alpha_dash',
                    Rule::unique('admins', 'username')->ignore($admin->id)
                ],
                'email' => [
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('admins', 'email')->ignore($admin->id)
                ],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Fix: Use manual assignment and save instead of update()
            $admin->name = $request->name;
            $admin->username = $request->username;
            $admin->email = $request->email;
            $admin->save();

            Log::info('Admin profile updated successfully', [
                'admin_id' => $admin->id,
                'updated_fields' => ['name', 'username', 'email']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'username' => $admin->username,
                    'email' => $admin->email,
                    'role' => 'admin',
                    'updated_at' => $admin->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating admin profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile'
            ], 500);
        }
    }

    /**
     * Update the authenticated admin's password
     */
    public function updatePassword(Request $request)
    {
        try {
            $admin = Auth::guard('admin')->user();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin not found'
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

            if (!Hash::check($request->current_password, $admin->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 422);
            }

            // Fix: Use manual assignment and save instead of update()
            $admin->password = Hash::make($request->new_password);
            $admin->save();

            Log::info('Admin password updated successfully', [
                'admin_id' => $admin->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating admin password: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update password'
            ], 500);
        }
    }

    /**
     * Get admin dashboard statistics
     */
    public function getStatistics()
    {
        try {
            $admin = Auth::guard('admin')->user();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin not found'
                ], 404);
            }

            $stats = [
                'total_users' => \App\Models\User::count(),
                'active_users' => \App\Models\User::where('is_active', true)->count(),
                'total_videos' => \App\Models\Video::count(),
                'published_videos' => \App\Models\Video::where('is_published', true)->count(),
                'total_categories' => \App\Models\Category::count(),
                'total_comments' => \App\Models\Comment::count(),
                'pending_comments' => \App\Models\Comment::where('is_approved', false)->count(),
                // Fix: Replace notifications() with direct DB query
                'admin_notifications' => \DB::table('notifications')->where('notifiable_id', $admin->id)->where('read_at', null)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching admin statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics'
            ], 500);
        }
    }

    /**
     * Get admin activity log (recent actions)
     */
    public function getActivityLog()
    {
        try {
            $admin = Auth::guard('admin')->user();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin not found'
                ], 404);
            }

            $activities = collect([]);

            // If your models have a 'created_by' field, filter by admin
            $recentVideos = \App\Models\Video::where('created_by', $admin->id)->latest()->take(5)->get(['id', 'title', 'created_at']);
            foreach ($recentVideos as $video) {
                $activities->push([
                    'type' => 'video_created',
                    'description' => "Video '{$video->title}' was created",
                    'created_at' => $video->created_at->toISOString(),
                ]);
            }

            $recentCategories = \App\Models\Category::where('created_by', $admin->id)->latest()->take(3)->get(['id', 'name', 'created_at']);
            foreach ($recentCategories as $category) {
                $activities->push([
                    'type' => 'category_created',
                    'description' => "Category '{$category->name}' was created",
                    'created_at' => $category->created_at->toISOString(),
                ]);
            }

            $activities = $activities->sortByDesc('created_at')->take(10)->values();

            return response()->json([
                'success' => true,
                'data' => $activities
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching admin activity log: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch activity log'
            ], 500);
        }
    }
}
