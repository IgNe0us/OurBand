import { apiClient } from '../baseApi';

export interface ChatRoomResponseDTO {
  roomId: number;
  targetUserId: number;
  targetUserName: string;
  targetUserProfileUrl: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface ChatMessageResponseDTO {
  messageId: number;
  roomId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// 1. 내 채팅방 목록 조회
export const getMyChatRoomsApi = async (): Promise<ChatRoomResponseDTO[]> => {
  const response = await apiClient.get('/chat/rooms');
  return response.data;
};

// 2. 채팅방 생성 또는 기존 방 ID 반환
export const createOrGetRoomApi = async (targetUserId: number): Promise<number> => {
  const response = await apiClient.post(`/chat/rooms?targetUserId=${targetUserId}`);
  return response.data;
};

// 3. 특정 채팅방의 메시지 내역 조회
export const getChatMessagesApi = async (roomId: number): Promise<ChatMessageResponseDTO[]> => {
  const response = await apiClient.get(`/chat/rooms/${roomId}/messages`);
  return response.data;
};

// 4. 메시지 전송
export const sendChatMessageApi = async (roomId: number, content: string): Promise<ChatMessageResponseDTO> => {
  const response = await apiClient.post(`/chat/rooms/${roomId}/messages`, { content });
  return response.data;
};

// 5. 방의 메시지 읽음 처리
export const markRoomAsReadApi = async (roomId: number): Promise<void> => {
  try {
    await apiClient.patch(`/chat/rooms/${roomId}/read`);
  } catch (error: any) {
    console.error("markRoomAsReadApi Error:", error.response?.data || error.message);
    throw error;
  }
};
