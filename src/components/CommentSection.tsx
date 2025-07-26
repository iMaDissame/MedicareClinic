import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Comment } from '../types';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

interface CommentSectionProps {
  courseId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ courseId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const savedComments = localStorage.getItem(`comments_${courseId}`);
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }
  }, [courseId]);

  const saveComments = (updatedComments: Comment[]) => {
    setComments(updatedComments);
    localStorage.setItem(`comments_${courseId}`, JSON.stringify(updatedComments));
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: Date.now().toString(),
      courseId,
      userId: user.id,
      username: user.username,
      content: newComment.trim(),
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };

    const updatedComments = [comment, ...comments];
    saveComments(updatedComments);
    setNewComment('');
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Discussion ({comments.length})
        </h3>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this course..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end mt-2">
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim()}
              >
                <Send className="h-3 w-3 mr-1" />
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900">{comment.username}</span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimeAgo(comment.timestamp)}
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default CommentSection;