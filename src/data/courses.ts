import { Course } from '../types';

export const defaultCourses: Course[] = [
  {
    id: '1',
    title: 'React Fundamentals',
    description: 'Learn the core concepts of React including components, props, state, and hooks.',
    thumbnail: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=500',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '45:30',
    category: 'Frontend',
    isPublished: true,
    publishedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    title: 'TypeScript Mastery',
    description: 'Master TypeScript from basics to advanced concepts with practical examples.',
    thumbnail: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=500',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '38:15',
    category: 'Programming',
    isPublished: true,
    publishedAt: '2024-01-20T10:00:00Z',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '3',
    title: 'Node.js Backend Development',
    description: 'Build scalable backend applications with Node.js, Express, and databases.',
    thumbnail: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=500',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '52:45',
    category: 'Backend',
    isPublished: false,
    createdAt: '2024-01-25T10:00:00Z'
  },
  {
    id: '4',
    title: 'Modern CSS Techniques',
    description: 'Explore advanced CSS features including Grid, Flexbox, and CSS animations.',
    thumbnail: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=500',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: '41:20',
    category: 'Design',
    isPublished: true,
    publishedAt: '2024-01-30T10:00:00Z',
    createdAt: '2024-01-28T10:00:00Z'
  }
];

export const getCourses = (): Course[] => {
  const savedCourses = localStorage.getItem('courses');
  if (savedCourses) {
    return JSON.parse(savedCourses);
  }
  localStorage.setItem('courses', JSON.stringify(defaultCourses));
  return defaultCourses;
};

export const saveCourses = (courses: Course[]) => {
  localStorage.setItem('courses', JSON.stringify(courses));
};

export const getPublishedCourses = (): Course[] => {
  return getCourses().filter(course => course.isPublished);
};