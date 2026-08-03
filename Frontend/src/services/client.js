import axios from 'axios';

// Base URL configuration - adjust to match your backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Create an Axios client instance with proper configuration
 */
const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
    withCredentials: true, // needed if using cookies/auth later
});

/**
 * Request interceptor
 * - Add auth token to requests if available
 * - Handle token expiration (optional)
 */
client.interceptors.request.use(
    (config) => {
        // Get auth token from localStorage or cookie
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor
 * - Handle common errors (401, 403, 500)
 * - Optional: token refresh logic
 */
client.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error;

        if (response) {
            // Handle 401 Unauthorized - token expired or invalid
            if (response.status === 401) {
                console.error('Authentication failed - token expired or invalid');

                // Optional: clear token and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('accessToken');
                // window.location.href = '/login';
            }

            // Handle 403 Forbidden
            if (response.status === 403) {
                console.error('Access denied - insufficient permissions');
            }

            // Handle 500 Internal Server Error
            if (response.status === 500) {
                console.error('Server error - please try again later');
            }
        } else {
            console.error('Network error - please check your connection');
        }

        return Promise.reject(error);
    }
);

export default client;
