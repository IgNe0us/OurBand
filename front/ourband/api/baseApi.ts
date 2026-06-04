// src/services/api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// ===============================
// 💡 API Base URL 설정 (변경 없음)
// =======================================
//const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
const BASE_URL = typeof window !== 'undefined' 
    ? `http://${window.location.hostname}:8082/api/v1` 
    : 'http://localhost:8082/api/v1';

export const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

let isRefreshing = false;
let failedQueue: any[] = [];

const getIsRedirectingToMaintenance = () => {
    if (typeof window !== 'undefined') {
        return (window as any).isRedirectingToMaintenance === true;
    }
    return false;
};

const setIsRedirectingToMaintenance = (val: boolean) => {
    if (typeof window !== 'undefined') {
        (window as any).isRedirectingToMaintenance = val;
    }
};

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (getIsRedirectingToMaintenance()) {
            return Promise.reject(error);
        }

        const originalRequest = error.config;

        // 점검 모드 에러 처리 (503 MAINTENANCE)
        if (error.response?.status === 503 && error.response?.data?.errorCode === 'MAINTENANCE') {
            setIsRedirectingToMaintenance(true);
            if (typeof window !== 'undefined') {
                const path = window.location.pathname;
                if (path !== '/maintenance' && !path.startsWith('/login') && !path.startsWith('/admin')) {
                    axios.post(`${BASE_URL}/users/logout`, {}, { withCredentials: true })
                        .finally(() => {
                            window.location.href = '/maintenance';
                        });
                }
            }
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            // 방어 코드: 무한 루프 방지 및 refresh 엔드포인트 자체 401 무시
            if (originalRequest.url.includes('/users/refresh') || originalRequest.url.includes('/users/login')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // 쿠키에 담긴 refresh_token을 이용해 재발급 요청 (withCredentials)
                await axios.post(`${BASE_URL}/users/refresh`, {}, { withCredentials: true });
                
                isRefreshing = false;
                processQueue(null);
                
                // 재발급된 access_token으로 원래 요청 다시 시도
                return apiClient(originalRequest);
            } catch (err) {
                isRefreshing = false;
                processQueue(err, null);
                // 리프레시 토큰마저 만료된 경우 (로그아웃 처리)
                if (typeof window !== 'undefined') {
                    const path = window.location.pathname;
                    const isPublicPage = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/find-account');
                    
                    if (!getIsRedirectingToMaintenance() && path !== '/maintenance' && !isPublicPage) {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);