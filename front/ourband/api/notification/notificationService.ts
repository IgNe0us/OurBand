import { apiClient } from "../baseApi";

export type NotificationType = 
    | "RECRUIT_OFFER"
    | "BAND_APPLY"
    | "JAM_LIKE"
    | "JAM_COMMENT"
    | "JAM_DUET"
    | "POST_LIKE"
    | "POST_COMMENT" | "INFO";

export interface NotificationData {
    id: number;
    senderId?: number;
    senderName?: string;
    senderProfileImageUrl?: string;
    type: NotificationType;
    targetId: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}

// 1. 알림 목록 조회
export const getNotificationsApi = async (): Promise<NotificationData[]> => {
    const response = await apiClient.get('/notifications');
    return response.data;
};

// 2. 안 읽은 알림 개수 조회
export const getUnreadNotificationCountApi = async (): Promise<{ count: number }> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
};

// 3. 알림 읽음 처리
export const markNotificationAsReadApi = async (id: number): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
};

export const getNotificationSubscribeUrl = (): string => {
    const fallbackURL = typeof window !== 'undefined' 
        ? `http://${window.location.hostname}:8082/api/v1` 
        : 'http://localhost:8082/api/v1';
    const baseURL = apiClient.defaults.baseURL || fallbackURL;
    return `${baseURL}/notifications/subscribe`;
};
