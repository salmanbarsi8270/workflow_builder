import axios from 'axios';
import { AI_URL } from './apiurl';

const aiClient = axios.create({
    baseURL: AI_URL,
});

// Request interceptor for authorization if needed
aiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default aiClient;
