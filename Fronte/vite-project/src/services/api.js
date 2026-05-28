import axios from 'axios';

// [FIX LOG] Đã bỏ dấu `?.` ở import.meta.env
// Lý do: Trình biên dịch của Vite không nhận dạng được `?.` khi thay thế biến môi trường nội bộ.
// Nếu giữ `?.`, biến sẽ đọc thất bại và luôn fallback về URL Production, khiến web tìm nhầm Database.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://www.dxhiep.id.vn/api';

export const getImageUrl = (path) => {
    if (!path) return '';

    // Xử lý trường hợp URL bị lưu cứng domain cũ trong DB (như localhost:8080)
    let normalizedPath = path;
    if (normalizedPath.startsWith('http://localhost:8080')) {
        normalizedPath = normalizedPath.replace('http://localhost:8080', '');
    } else if (normalizedPath.startsWith('https://www.dxhiep.id.vn')) {
        normalizedPath = normalizedPath.replace('https://www.dxhiep.id.vn', '');
    } else if (normalizedPath.startsWith('https://payment.dvanlong1102.id.vn')) {
        normalizedPath = normalizedPath.replace('https://payment.dvanlong1102.id.vn', '');
    }

    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
        return normalizedPath;
    }

    // relative path
    const isProd = import.meta.env.PROD;
    const backendHost = isProd ? 'https://www.dxhiep.id.vn' : '';
    return `${backendHost}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
};

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
