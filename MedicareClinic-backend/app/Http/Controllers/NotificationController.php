<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get notifications for the authenticated user/admin
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $onlyUnread = $request->boolean('unread_only', false);
            $type = $request->get('type');

            // Determine if user or admin is authenticated
            $user = Auth::guard('api')->user();
            $admin = Auth::guard('admin')->user();

            if (!$user && !$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            // Build query
            $query = Notification::query()
                ->notExpired()
                ->orderBy('created_at', 'desc');

            if ($user) {
                $query->forUser($user->id);
            } else {
                $query->forAdmin($admin->id);
            }

            if ($onlyUnread) {
                $query->unread();
            }

            if ($type) {
                $query->byType($type);
            }

            $notifications = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $notifications->items(),
                'meta' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                    'unread_count' => $this->notificationService->getUnreadCount(
                        $user?->id,
                        $admin?->id
                    )
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get unread notifications count
     */
    public function getUnreadCount(): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();
            $admin = Auth::guard('admin')->user();

            if (!$user && !$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            $count = $this->notificationService->getUnreadCount(
                $user?->id,
                $admin?->id
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'unread_count' => $count
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get unread count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();
            $admin = Auth::guard('admin')->user();

            if (!$user && !$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            $success = $this->notificationService->markAsRead(
                $id,
                $user?->id,
                $admin?->id
            );

            if (!$success) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification not found or access denied'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();
            $admin = Auth::guard('admin')->user();

            if (!$user && !$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            $count = $this->notificationService->markAllAsRead(
                $user?->id,
                $admin?->id
            );

            return response()->json([
                'success' => true,
                'message' => "Marked {$count} notifications as read",
                'data' => [
                    'marked_count' => $count
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all notifications as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();
            $admin = Auth::guard('admin')->user();

            if (!$user && !$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            $query = Notification::where('id', $id);

            if ($user) {
                $query->where('user_id', $user->id);
            } else {
                $query->where('admin_id', $admin->id);
            }

            $notification = $query->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification not found or access denied'
                ], 404);
            }

            $notification->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notification deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notification types and their counts
     */
    public function getStats(): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();
            $admin = Auth::guard('admin')->user();

            if (!$user && !$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            $query = Notification::query()->notExpired();

            if ($user) {
                $query->forUser($user->id);
            } else {
                $query->forAdmin($admin->id);
            }

            $stats = $query->selectRaw('type, priority, COUNT(*) as count, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count')
                ->groupBy(['type', 'priority'])
                ->get()
                ->groupBy('type')
                ->map(function ($typeGroup) {
                    return [
                        'total' => $typeGroup->sum('count'),
                        'unread' => $typeGroup->sum('unread_count'),
                        'by_priority' => $typeGroup->keyBy('priority')->map(function ($item) {
                            return [
                                'total' => $item->count,
                                'unread' => $item->unread_count
                            ];
                        })
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get notification stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
