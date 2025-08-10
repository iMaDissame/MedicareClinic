<?php

namespace App\Http\Controllers;

use App\Models\Video;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

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
            $video = Video::create([
                'title' => $request->title,
                'description' => $request->description,
                'video_path' => $request->video_path,
                'category_id' => $request->category_id,
                'is_published' => $request->is_published ?? false,
            ]);

            $video->load('category');

            return response()->json([
                'success' => true,
                'message' => 'Video created successfully',
                'data' => $video
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
     * Display the specified video
     */
    public function show(Video $video): JsonResponse
    {
        try {
            $video->load(['category', 'comments']);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $video->id,
                    'title' => $video->title,
                    'description' => $video->description,
                    'video_path' => $video->video_path,
                    'is_published' => $video->is_published,
                    'category' => $video->category ? [
                        'id' => $video->category->id,
                        'name' => $video->category->name,
                    ] : null,
                    'comments_count' => $video->comments->count(),
                    'created_at' => $video->created_at,
                    'updated_at' => $video->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch video',
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
                'data' => $video
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
            // Optionally delete the video file from storage
            if ($video->video_path && Storage::exists($video->video_path)) {
                Storage::delete($video->video_path);
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
                'data' => $video
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
                ->get();

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
                ->get();

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
}
