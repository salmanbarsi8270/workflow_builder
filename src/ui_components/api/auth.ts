import axios from 'axios';
import { API_URL } from './apiurl';

const apiClient = axios.create({
    baseURL: API_URL,
});

// Request interceptor to add token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const loginUser = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
};

export const registerUser = async (email: string, password: string, name?: string) => {
    const response = await apiClient.post('/auth/register', { email, password, name });
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
};

export default apiClient;
