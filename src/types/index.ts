export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  accessStart: string;
  accessEnd: string;
  isActive: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  category: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

export interface UserProgress {
  userId: string;
  courseId: string;
  progress: number;
  lastWatched: string;
  completed: boolean;
  timeSpent: number;
}

export interface Comment {
  id: string;
  courseId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}