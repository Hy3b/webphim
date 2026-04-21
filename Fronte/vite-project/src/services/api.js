import axios from 'axios';

// Ưu tiên chạy URL từ .env, nếu không có thì mặc định dùng public API của Cloudflare
const baseURL = import.meta.env?.VITE_API_BASE_URL || 'https://backe-live.hanhfine.id.vn/api';

const api = axios.create({
    baseURL: baseURL,
    timeout: 10000,
    withCredentials: true, // Gửi cookie JWT
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor (e.g., for adding token)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor (e.g., for handling global errors)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle global errors (e.g., 401 Unauthorized)
        return Promise.reject(error);
    }
);

export default api;
