import axios from 'axios';

const axiosClient = axios.create({
  baseURL:import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only clear auth data on authentication validation endpoints
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthValidationEndpoint = url.includes('/me') || url.includes('/login');
      
      if (isAuthValidationEndpoint) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authType');
        
        // Redirect to login only if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Chat API functions
export const getChats = () => axiosClient.get('/chats');
export const startChat = (adminId: string) => axiosClient.post('/chats/start', { admin_id: adminId });
export const getChatMessages = (chatId: string) => axiosClient.get(`/chats/${chatId}`);
export const sendChatMessage = (chatId: string, message: string) =>
  axiosClient.post(`/chats/${chatId}/messages`, { message });

export default axiosClient;