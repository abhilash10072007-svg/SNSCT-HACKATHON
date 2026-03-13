import axios from 'axios';
export const findSimilarDoubts = (data) => API.post('/doubts/similar', data);
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (data) => API.post('/auth/register', data);
export const verifyEmail = (data) => API.post('/auth/verify-email', data);
export const login = (data) => API.post('/auth/login', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);
export const resendOTP = (data) => API.post('/auth/resend-otp', data);
export const getMe = () => API.get('/auth/me');

// Doubts
export const getDoubts = (params) => API.get('/doubts', { params });
export const getDoubt = (id) => API.get(`/doubts/${id}`);
export const createDoubt = (data) => API.post('/doubts', data);
export const addAnswer = (id, data) => API.post(`/doubts/${id}/answers`, data);
export const upvoteDoubt = (id) => API.put(`/doubts/${id}/upvote`);
export const upvoteAnswer = (doubtId, answerId) => API.put(`/doubts/${doubtId}/answers/${answerId}/upvote`);
export const acceptAnswer = (doubtId, answerId) => API.put(`/doubts/${doubtId}/answers/${answerId}/accept`);
export const updateDoubtStatus = (id, status) => API.put(`/doubts/${id}/status`, { status });
export const getSubjects = () => API.get('/doubts/meta/subjects');
export const getPopularTags = () => API.get('/doubts/meta/tags');

// Users
export const getProfile = () => API.get('/users/profile');
export const updateProfile = (data) => API.put('/users/profile', data);
export const changePassword = (data) => API.put('/users/change-password', data);
export const getPublicProfile = (id) => API.get(`/users/${id}`);
export const getNotifications = () => API.get('/users/notifications/all');
export const markAllRead = () => API.put('/users/notifications/read-all');
export const getLeaderboard = () => API.get('/users/leaderboard/top');
export const getMyDoubts = () => API.get('/users/my/doubts');

export default API;
