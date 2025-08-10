<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    /**
     * Helper method to check if current user is admin
     */
    private function isAdmin(): bool
    {
        return auth('admin')->check();
    }

    /**
     * Get current admin user
     */
    private function getAdminUser()
    {
        return auth('admin')->user();
    }

    /**
     * Get current regular user
     */
    private function getRegularUser()
    {
        return auth('api')->user();
    }

    /**
     * Get all comments for admin management
     */
    public function index(): JsonResponse
    {
        try {
            // Only admins can access this
            if (!$this->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $comments = Comment::with(['user:id,name,email', 'video:id,title'])
                              ->orderBy('created_at', 'desc')
                              ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $comments,
                'message' => 'Comments retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve comments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a comment
     */
    public function approve($id): JsonResponse
    {
        try {
            // Only admins can approve comments
            if (!$this->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $comment = Comment::findOrFail($id);
            $comment->update(['is_approved' => true]);

            // Load relationships for response
            $comment->load(['user:id,name,email', 'video:id,title']);

            return response()->json([
                'success' => true,
                'data' => $comment,
                'message' => 'Comment approved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve comment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject/Unapprove a comment
     */
    public function reject($id): JsonResponse
    {
        try {
            // Only admins can reject comments
            if (!$this->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $comment = Comment::findOrFail($id);
            $comment->update(['is_approved' => false]);

            // Load relationships for response
            $comment->load(['user:id,name,email', 'video:id,title']);

            return response()->json([
                'success' => true,
                'data' => $comment,
                'message' => 'Comment rejected successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject comment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a comment
     */
    public function destroy($id): JsonResponse
    {
        try {
            $comment = Comment::findOrFail($id);

            $adminUser = $this->getAdminUser();
            $regularUser = $this->getRegularUser();

            // Only admins or comment owners can delete comments
            $canDelete = $adminUser || ($regularUser && $comment->user_id === $regularUser->id);

            if (!$canDelete) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $comment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Comment deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete comment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending comments for admin review
     */
    public function pending(): JsonResponse
    {
        try {
            // Only admins can access this
            if (!$this->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $pendingComments = Comment::with(['user:id,name,email', 'video:id,title'])
                                     ->where('is_approved', false)
                                     ->orderBy('created_at', 'desc')
                                     ->get();

            return response()->json([
                'success' => true,
                'data' => $pendingComments,
                'message' => 'Pending comments retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pending comments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get comment statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            // Only admins can access this
            if (!$this->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $stats = [
                'total_comments' => Comment::count(),
                'approved_comments' => Comment::where('is_approved', true)->count(),
                'pending_comments' => Comment::where('is_approved', false)->count(),
                'comments_today' => Comment::whereDate('created_at', today())->count(),
                'comments_this_week' => Comment::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
                'comments_this_month' => Comment::whereMonth('created_at', now()->month)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Comment statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve comment statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
