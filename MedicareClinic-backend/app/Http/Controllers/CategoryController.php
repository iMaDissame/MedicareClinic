<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Services\NotificationService;

class CategoryController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Display a listing of categories
     */
    public function index(): JsonResponse
    {
        try {
            $categories = Category::with(['videos', 'users'])->get()->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'videos_count' => $category->videos->count(),
                    'users_count' => $category->users->count(),
                    'created_at' => $category->created_at,
                    'updated_at' => $category->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $categories,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created category
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:categories,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $category = Category::create([
                'name' => $request->name,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Category created successfully',
                'data' => $category
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified category
     */
    public function show(Category $category): JsonResponse
    {
        try {
            $category->load(['videos', 'users']);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'videos' => $category->videos->map(function ($video) {
                        return [
                            'id' => $video->id,
                            'title' => $video->title,
                            'description' => $video->description,
                        ];
                    }),
                    'users' => $category->users->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'name' => $user->name,
                            'username' => $user->username,
                            'email' => $user->email,
                        ];
                    }),
                    'created_at' => $category->created_at,
                    'updated_at' => $category->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified category
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $category->update([
                'name' => $request->name,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Category updated successfully',
                'data' => $category
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified category
     */
    public function destroy(Category $category): JsonResponse
    {
        try {
            // Check if category has assigned users or videos
            $usersCount = $category->users()->count();
            $videosCount = $category->videos()->count();

            if ($usersCount > 0 || $videosCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete category. It has {$usersCount} assigned users and {$videosCount} videos."
                ], 400);
            }

            $category->delete();

            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign users to a category
     */
    public function assignUsers(Request $request, Category $category): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $category->users()->sync($request->user_ids);

            // Notify users about category assignment
            $users = User::whereIn('id', $request->user_ids)->get();
            foreach ($users as $user) {
                $this->notificationService->notifyCategoriesAssigned($user, [$category->name]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Users assigned to category successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign users to category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all categories for dropdown/select options
     */
    public function getAllForSelect(): JsonResponse
    {
        try {
            $categories = Category::select('id', 'name')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for dashboard
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = [
                'total_categories' => Category::count(),
                'categories_with_users' => Category::has('users')->count(),
                'categories_with_videos' => Category::has('videos')->count(),
                'most_popular_category' => Category::withCount('users')
                    ->orderBy('users_count', 'desc')
                    ->first(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
