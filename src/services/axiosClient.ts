import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

axiosClient.interceptors.request.use(
  (config) => {
    console.log(`➡️ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      data: config.data,
      headers: config.headers
    });
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔑 Adding auth token: ${token.substring(0, 20)}...`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    console.log(`⬅️ ${response.status} ${response.config.url}`, {
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error(`❌ Response error ${error.response?.status}:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // Only clear auth data on authentication validation endpoints
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthValidationEndpoint = url.includes('/me') || url.includes('/login');
      
      if (isAuthValidationEndpoint) {
        console.log('🔒 Auth validation failed - clearing auth data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authType');
        
        // Redirect to login only if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/MedicareClinic/login';
        }
      } else {
        // For other 401 errors, just log - these might be permission issues
        console.warn('⚠️ 401 error on non-auth endpoint:', url, 'This might be a permission or route guard issue');
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