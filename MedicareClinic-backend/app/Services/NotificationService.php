<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Admin;
use App\Models\Video;
use App\Models\Comment;
use Carbon\Carbon;

class NotificationService
{
    /**
     * Create a notification for a user
     */
    public function createForUser(
        int $userId,
        string $type,
        string $title,
        string $message,
        array $data = [],
        string $priority = Notification::PRIORITY_MEDIUM,
        ?Carbon $expiresAt = null
    ): Notification {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'priority' => $priority,
            'expires_at' => $expiresAt,
        ]);
    }

    /**
     * Create a notification for an admin
     */
    public function createForAdmin(
        int $adminId,
        string $type,
        string $title,
        string $message,
        array $data = [],
        string $priority = Notification::PRIORITY_MEDIUM,
        ?Carbon $expiresAt = null
    ): Notification {
        return Notification::create([
            'admin_id' => $adminId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'priority' => $priority,
            'expires_at' => $expiresAt,
        ]);
    }

    /**
     * Create notifications for all users in specific categories
     */
    public function notifyUsersInCategories(
        array $categoryIds,
        string $type,
        string $title,
        string $message,
        array $data = [],
        string $priority = Notification::PRIORITY_MEDIUM
    ): int {
        $users = User::whereHas('categories', function ($query) use ($categoryIds) {
            $query->whereIn('categories.id', $categoryIds);
        })->get();

        $count = 0;
        foreach ($users as $user) {
            $this->createForUser(
                $user->id,
                $type,
                $title,
                $message,
                $data,
                $priority
            );
            $count++;
        }

        return $count;
    }

    /**
     * Create notifications for all admins
     */
    public function notifyAllAdmins(
        string $type,
        string $title,
        string $message,
        array $data = [],
        string $priority = Notification::PRIORITY_MEDIUM
    ): int {
        $admins = Admin::all();
        $count = 0;

        foreach ($admins as $admin) {
            $this->createForAdmin(
                $admin->id,
                $type,
                $title,
                $message,
                $data,
                $priority
            );
            $count++;
        }

        return $count;
    }

    /**
     * Notify users when a new video is added to their categories
     */
    public function notifyVideoAdded(Video $video): int
    {
        if (!$video->category_id) {
            return 0;
        }

        return $this->notifyUsersInCategories(
            [$video->category_id],
            Notification::TYPE_VIDEO_ADDED,
            'New Video Available!',
            "A new video '{$video->title}' has been added to {$video->category->name}.",
            [
                'video_id' => $video->id,
                'video_title' => $video->title,
                'category_name' => $video->category->name,
                'action_url' => "/app/watch/{$video->id}"
            ],
            Notification::PRIORITY_MEDIUM
        );
    }

    /**
     * Notify user when their comment is approved
     */
    public function notifyCommentApproved(Comment $comment): ?Notification
    {
        if (!$comment->user_id) {
            return null;
        }

        return $this->createForUser(
            $comment->user_id,
            Notification::TYPE_COMMENT_APPROVED,
            'Comment Approved!',
            "Your comment on '{$comment->video->title}' has been approved and is now visible.",
            [
                'comment_id' => $comment->id,
                'video_id' => $comment->video_id,
                'video_title' => $comment->video->title,
                'action_url' => "/app/watch/{$comment->video_id}"
            ],
            Notification::PRIORITY_LOW
        );
    }

    /**
     * Notify user when their comment is rejected
     */
    public function notifyCommentRejected(Comment $comment, ?string $reason = null): ?Notification
    {
        if (!$comment->user_id) {
            return null;
        }

        $message = "Your comment on '{$comment->video->title}' was not approved.";
        if ($reason) {
            $message .= " Reason: {$reason}";
        }

        return $this->createForUser(
            $comment->user_id,
            Notification::TYPE_COMMENT_REJECTED,
            'Comment Not Approved',
            $message,
            [
                'comment_id' => $comment->id,
                'video_id' => $comment->video_id,
                'video_title' => $comment->video->title,
                'reason' => $reason,
            ],
            Notification::PRIORITY_LOW
        );
    }

    /**
     * Notify admins when a new comment is posted
     */
    public function notifyNewComment(Comment $comment): int
    {
        return $this->notifyAllAdmins(
            Notification::TYPE_NEW_COMMENT,
            'New Comment Pending Review',
            "A new comment by {$comment->user->username} on '{$comment->video->title}' needs review.",
            [
                'comment_id' => $comment->id,
                'video_id' => $comment->video_id,
                'user_name' => $comment->user->username,
                'video_title' => $comment->video->title,
                'action_url' => "/admin/comments/pending"
            ],
            Notification::PRIORITY_MEDIUM
        );
    }

    /**
     * Notify user when their access is expiring
     */
    public function notifyAccessExpiring(User $user, int $daysRemaining): Notification
    {
        $priority = match (true) {
            $daysRemaining <= 1 => Notification::PRIORITY_URGENT,
            $daysRemaining <= 3 => Notification::PRIORITY_HIGH,
            $daysRemaining <= 7 => Notification::PRIORITY_MEDIUM,
            default => Notification::PRIORITY_LOW
        };

        return $this->createForUser(
            $user->id,
            Notification::TYPE_ACCESS_EXPIRING,
            'Access Expiring Soon',
            "Your access will expire in {$daysRemaining} day(s). Please contact your administrator to renew.",
            [
                'days_remaining' => $daysRemaining,
                'expires_at' => $user->access_end,
            ],
            $priority
        );
    }

    /**
     * Notify user when categories are assigned to them
     */
    public function notifyCategoriesAssigned(User $user, array $categoryNames): Notification
    {
        $categoriesList = implode(', ', $categoryNames);

        return $this->createForUser(
            $user->id,
            Notification::TYPE_CATEGORY_ASSIGNED,
            'New Categories Assigned',
            "You now have access to new learning categories: {$categoriesList}",
            [
                'categories' => $categoryNames,
                'action_url' => '/app/dashboard'
            ],
            Notification::PRIORITY_MEDIUM
        );
    }

    /**
     * Welcome notification for new users
     */
    public function sendWelcomeNotification(User $user): Notification
    {
        return $this->createForUser(
            $user->id,
            Notification::TYPE_WELCOME,
            'Welcome to the Learning Platform!',
            "Hello {$user->username}! Welcome to our e-learning platform. Start exploring your assigned courses.",
            [
                'user_name' => $user->username,
                'action_url' => '/app/dashboard'
            ],
            Notification::PRIORITY_MEDIUM
        );
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(int $notificationId, ?int $userId = null, ?int $adminId = null): bool
    {
        $query = Notification::where('id', $notificationId);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($adminId) {
            $query->where('admin_id', $adminId);
        }

        $notification = $query->first();

        if ($notification) {
            $notification->markAsRead();
            return true;
        }

        return false;
    }

    /**
     * Mark all notifications as read for a user/admin
     */
    public function markAllAsRead(?int $userId = null, ?int $adminId = null): int
    {
        $query = Notification::where('is_read', false);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($adminId) {
            $query->where('admin_id', $adminId);
        }

        return $query->update([
            'is_read' => true,
            'read_at' => now()
        ]);
    }

    /**
     * Clean up expired notifications
     */
    public function cleanupExpiredNotifications(): int
    {
        return Notification::where('expires_at', '<', now())->delete();
    }

    /**
     * Get unread notifications count
     */
    public function getUnreadCount(?int $userId = null, ?int $adminId = null): int
    {
        $query = Notification::unread()->notExpired();

        if ($userId) {
            $query->forUser($userId);
        }

        if ($adminId) {
            $query->forAdmin($adminId);
        }

        return $query->count();
    }
}
