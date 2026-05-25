// src/services/api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// ===============================
// 💡 API Base URL 설정 (변경 없음)
// =======================================
//const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
const BASE_URL = 'http://localhost:8082/api/v1';

export const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});