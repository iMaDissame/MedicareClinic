<?php

namespace App\Http\Controllers;

use App\Models\Video;
use App\Models\Comment;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class VideoController extends Controller
{
    /**
     * Display a listing of videos
     */
    public function index(): JsonResponse
    {
        try {
            $videos = Video::with(['category'])->get()->map(function ($video) {
                return [
                    'id' => $video->id,
                    'title' => $video->title,
                    'description' => $video->description,
                    'video_path' => $video->video_path,
                    'video_url' => $video->video_path ? Storage::url($video->video_path) : null,
                    'cover_image' => $video->cover_image,
                    'cover_url' => $video->cover_image ? Storage::url($video->cover_image) : null,
                    'is_published' => $video->is_published,
                    'category' => $video->category ? [
                        'id' => $video->category->id,
                        'name' => $video->category->name,
                    ] : null,
                    'created_at' => $video->created_at,
                    'updated_at' => $video->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $videos,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch videos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created video
     */
    public function store(Request $request): JsonResponse
    {
        // Increase memory limit and execution time for large uploads
        ini_set('memory_limit', '1024M');
        ini_set('max_execution_time', 600); // 10 minutes
        ini_set('upload_max_filesize', '512M');
        ini_set('post_max_size', '512M');

        // Check if file was uploaded successfully
        if (!$request->hasFile('video_file') || !$request->file('video_file')->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'Video file upload failed or file is too large',
                'error' => 'File upload error - check file size limits'
            ], 422);
        }

        if (!$request->hasFile('cover_image') || !$request->file('cover_image')->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'Cover image upload failed or file is too large',
                'error' => 'File upload error - check file size limits'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'video_file' => 'required|file|mimes:mp4,avi,mov,wmv,webm|max:512000', // 500MB in KB
            'cover_image' => 'required|file|mimes:jpeg,jpg,png,webp|max:10240', // 10MB in KB
            'category_id' => 'required|exists:categories,id',
            'is_published' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Upload video file
            $videoFile = $request->file('video_file');
            $videoPath = $videoFile->store('videos', 'public');

            // Upload cover image
            $coverFile = $request->file('cover_image');
            $coverPath = $coverFile->store('covers', 'public');

            $video = Video::create([
                'title' => $request->title,
                'description' => $request->description,
                'video_path' => $videoPath,
                'cover_image' => $coverPath,
                'category_id' => $request->category_id,
                'is_published' => $request->boolean('is_published', false),
            ]);

            $video->load('category');

            return response()->json([
                'success' => true,
                'message' => 'Video created successfully',
                'data' => [
                    'id' => $video->id,
                    'title' => $video->title,
                    'description' => $video->description,
                    'video_path' => $video->video_path,
                    'video_url' => Storage::url($video->video_path),
                    'cover_image' => $video->cover_image,
                    'cover_url' => Storage::url($video->cover_image),
                    'is_published' => $video->is_published,
                    'category' => $video->category ? [
                        'id' => $video->category->id,
                        'name' => $video->category->name,
                    ] : null,
                    'created_at' => $video->created_at,
                    'updated_at' => $video->updated_at,
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create video',
                'error' => $e->getMessage()
            ], 500);
        }
    }



    /**
     * Update the specified video
     */
    public function update(Request $request, Video $video): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'video_path' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'is_published' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $video->update([
                'title' => $request->title,
                'description' => $request->description,
                'video_path' => $request->video_path,
                'category_id' => $request->category_id,
                'is_published' => $request->is_published ?? $video->is_published,
            ]);

            $video->load('category');

            return response()->json([
                'success' => true,
                'message' => 'Video updated successfully',
                'data' => [
                    'id' => $video->id,
                    'title' => $video->title,
                    'description' => $video->description,
                    'video_path' => $video->video_path,
                    'video_url' => $video->video_path ? Storage::url($video->video_path) : null,
                    'cover_image' => $video->cover_image,
                    'cover_url' => $video->cover_image ? Storage::url($video->cover_image) : null,
                    'is_published' => $video->is_published,
                    'category' => $video->category ? [
                        'id' => $video->category->id,
                        'name' => $video->category->name,
                    ] : null,
                    'created_at' => $video->created_at,
                    'updated_at' => $video->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update video',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified video
     */
    public function destroy(Video $video): JsonResponse
    {
        try {
            // Delete the video file from storage
            if ($video->video_path && Storage::disk('public')->exists($video->video_path)) {
                Storage::disk('public')->delete($video->video_path);
            }

            // Delete the cover image from storage
            if ($video->cover_image && Storage::disk('public')->exists($video->cover_image)) {
                Storage::disk('public')->delete($video->cover_image);
            }

            $video->delete();

            return response()->json([
                'success' => true,
                'message' => 'Video deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete video',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle video publish status
     */
    public function togglePublishStatus(Video $video): JsonResponse
    {
        try {
            $video->update([
                'is_published' => !$video->is_published
            ]);

            return response()->json([
                'success' => true,
                'message' => $video->is_published ? 'Video published successfully' : 'Video unpublished successfully',
                'data' => [
                    'id' => $video->id,
                    'title' => $video->title,
                    'description' => $video->description,
                    'video_path' => $video->video_path,
                    'video_url' => $video->video_path ? Storage::url($video->video_path) : null,
                    'cover_image' => $video->cover_image,
                    'cover_url' => $video->cover_image ? Storage::url($video->cover_image) : null,
                    'is_published' => $video->is_published,
                    'category' => $video->category ? [
                        'id' => $video->category->id,
                        'name' => $video->category->name,
                    ] : null,
                    'created_at' => $video->created_at,
                    'updated_at' => $video->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle publish status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get videos by category for students
     */
    public function getByCategory(Category $category): JsonResponse
    {
        try {
            $videos = $category->videos()
                ->where('is_published', true)
                ->get()
                ->map(function ($video) {
                    return [
                        'id' => $video->id,
                        'title' => $video->title,
                        'description' => $video->description,
                        'video_path' => $video->video_path,
                        'video_url' => $video->video_path ? Storage::url($video->video_path) : null,
                        'cover_image' => $video->cover_image,
                        'cover_url' => $video->cover_image ? Storage::url($video->cover_image) : null,
                        'is_published' => $video->is_published,
                        'category' => [
                            'id' => $video->category->id,
                            'name' => $video->category->name,
                        ],
                        'created_at' => $video->created_at,
                        'updated_at' => $video->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $videos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch category videos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get videos for current user (based on their assigned categories)
     */
    public function getUserVideos(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Get user's assigned categories
            $categoryIds = $user->categories()->pluck('categories.id');

            if ($categoryIds->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'No categories assigned to this user'
                ]);
            }

            // Get published videos from user's categories
            $videos = Video::with('category')
                ->whereIn('category_id', $categoryIds)
                ->where('is_published', true)
                ->get()
                ->map(function ($video) {
                    return [
                        'id' => $video->id,
                        'title' => $video->title,
                        'description' => $video->description,
                        'video_path' => $video->video_path,
                        'video_url' => $video->video_path ? Storage::url($video->video_path) : null,
                        'cover_image' => $video->cover_image,
                        'cover_url' => $video->cover_image ? Storage::url($video->cover_image) : null,
                        'is_published' => $video->is_published,
                        'category' => $video->category ? [
                            'id' => $video->category->id,
                            'name' => $video->category->name,
                        ] : null,
                        'created_at' => $video->created_at,
                        'updated_at' => $video->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $videos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user videos',
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
                'total_videos' => Video::count(),
                'published_videos' => Video::where('is_published', true)->count(),
                'draft_videos' => Video::where('is_published', false)->count(),
                'videos_by_category' => Video::with('category')
                    ->selectRaw('category_id, count(*) as count')
                    ->groupBy('category_id')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'category' => $item->category?->name ?? 'Uncategorized',
                            'count' => $item->count
                        ];
                    }),
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

    /**
     * Get all categories for select dropdown
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

    public function show($id): JsonResponse
{
    try {
        $query = Video::with(['category', 'comments.user']);

        // Check if user is authenticated as admin or regular user
        $adminUser = auth('admin')->user();
        $regularUser = auth('api')->user();
        $isAdmin = $adminUser !== null;

        if (!$isAdmin) {
            // Non-admin users can only see published videos
            $query->where('is_published', true);
        }
        // Admin users can see all videos (published and unpublished)

        $video = $query->findOrFail($id);

        // Add full URLs for video and cover image
        $video->video_url = $video->video_path ? url('storage/' . $video->video_path) : null;
        $video->cover_url = $video->cover_image ? url('storage/' . $video->cover_image) : null;

        // Filter comments based on user role
        if (!$isAdmin) {
            // Non-admin users can only see approved comments and their own comments
            $video->comments = $video->comments->filter(function ($comment) use ($regularUser) {
                return $comment->is_approved || ($regularUser && $comment->user_id === $regularUser->id);
            });
        }
        // Admin users can see all comments

        return response()->json([
            'success' => true,
            'data' => $video,
            'message' => 'Video retrieved successfully'
        ]);
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Video not found or not published',
            'error' => 'Video not found'
        ], 404);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to retrieve video',
            'error' => $e->getMessage()
        ], 500);
    }
}

/**
 * Add a comment to a video
 */
public function addComment(Request $request, $videoId): JsonResponse
{
    try {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if video exists and is published (or if admin, allow unpublished videos too)
        $adminUser = auth('admin')->user();
        $regularUser = auth('api')->user();

        if (!$adminUser && !$regularUser) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        // For admin users, allow commenting on any video (published or not)
        // For regular users, only allow commenting on published videos
        if ($adminUser) {
            $video = Video::findOrFail($videoId);
        } else {
            $video = Video::where('is_published', true)->findOrFail($videoId);
        }

        // Create comment
        if ($adminUser) {
            // Admin is commenting - create a special admin comment
            $comment = Comment::create([
                'content' => $request->content,
                'user_id' => null,
                'admin_id' => $adminUser->id,
                'video_id' => $videoId,
                'is_approved' => true // Auto-approve admin comments
            ]);

            // Manually set the admin relationship for the response
            $comment->admin = $adminUser;
            $comment->user = null;
        } else {
            // Regular user is commenting
            $comment = Comment::create([
                'content' => $request->content,
                'user_id' => $regularUser->id,
                'admin_id' => null,
                'video_id' => $videoId,
                'is_approved' => false // Regular users need approval
            ]);

            // Load the user relationship
            $comment->load('user');
        }

        return response()->json([
            'success' => true,
            'data' => $comment,
            'message' => $adminUser
                ? 'Comment added successfully'
                : 'Comment submitted for approval'
        ], 201);

    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Video not found or not available for comments',
            'error' => 'Video not found'
        ], 404);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to add comment',
            'error' => $e->getMessage()
        ], 500);
    }
}


}
