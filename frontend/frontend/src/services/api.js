// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000'; // Your backend server URL

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to attach JWT token to every outgoing request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Assuming you store the token in localStorage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// You can add more specific API calls here, or use 'api' directly in your components
const API = {
    // Auth
    register: (userData) => api.post('/register', userData),
    login: (credentials) => api.post('/login', credentials),

    // Tools
    getTools: () => api.get('/tools'),
    checkoutTool: (tool_id) => api.post('/checkout', { tool_id }),
    returnTool: (tool_id) => api.post('/return', { tool_id }),
    addTool: (toolData) => api.post('/tools', toolData),
    updateTool: (id, toolData) => api.put(`/tools/${id}`, toolData),
    deleteTool: (id) => api.delete(`/tools/${id}`),

    // History
    getHistory: () => api.get('/history'),

    // Users (Super Admin)
    getUsers: () => api.get('/users'),
    addUser: (userData) => api.post('/users', userData),
    updateUser: (id, userData) => api.put(`/users/${id}`, userData),
    deleteUser: (id) => api.delete(`/users/${id}`),
};

export default API;
