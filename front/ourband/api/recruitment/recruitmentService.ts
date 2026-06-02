import { apiClient } from '../baseApi';

export type MemberSeekingPostData = {
  id: number;
  userId: number;
  authorName: string;
  authorProfileImageUrl: string | null;
  title: string;
  content: string;
  position: string;
  location: string;
  genreStyle: string;
  mediaUrl: string | null;
  mediaType: string | null;
  status: string;
  potential?: number;
  createdAt: string;
  updatedAt: string;
};

export type MemberSeekingPostCreateData = {
  title: string;
  content: string;
  position: string;
  location: string;
  genreStyle: string;
  mediaUrl: string | null;
  mediaType: string | null;
  status: string;
};

export type RecruitmentOfferData = {
  id: number;
  bandId: number;
  bandName: string;
  bandLogoUrl: string | null;
  senderUserId: number;
  targetUserId: number;
  seekingPostId: number;
  position: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type RecruitmentOfferRequestData = {
  bandId: number;
  targetUserId: number;
  seekingPostId: number;
  position: string;
  message: string;
};

// 1. 개인 구직 게시글 목록 조회
export const getSeekingPostsApi = async (): Promise<MemberSeekingPostData[]> => {
  const response = await apiClient.get('/recruitments/seekings');
  return response.data;
};

// 2. 개인 구직 게시글 단일 조회
export const getSeekingPostApi = async (id: number | string): Promise<MemberSeekingPostData> => {
  const response = await apiClient.get(`/recruitments/seekings/${id}`);
  return response.data;
};

// 3. 개인 구직 게시글 생성
export const createSeekingPostApi = async (data: MemberSeekingPostCreateData): Promise<MemberSeekingPostData> => {
  const response = await apiClient.post('/recruitments/seekings', data);
  return response.data;
};

// 4. 개인 구직 게시글 수정
export const updateSeekingPostApi = async (id: number | string, data: MemberSeekingPostCreateData): Promise<MemberSeekingPostData> => {
  const response = await apiClient.put(`/recruitments/seekings/${id}`, data);
  return response.data;
};

// 5. 개인 구직 게시글 삭제
export const deleteSeekingPostApi = async (id: number | string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/recruitments/seekings/${id}`);
  return response.data;
};

// 6. 영입 제안 보내기
export const sendOfferApi = async (data: RecruitmentOfferRequestData): Promise<RecruitmentOfferData> => {
  const response = await apiClient.post('/recruitments/offers', data);
  return response.data;
};

// 7. 받은 영입 제안 목록 조회
export const getReceivedOffersApi = async (): Promise<RecruitmentOfferData[]> => {
  const response = await apiClient.get('/recruitments/offers/received');
  return response.data;
};

// 8. 영입 제안 수락
export const acceptOfferApi = async (id: number | string): Promise<{ message: string }> => {
  const response = await apiClient.patch(`/recruitments/offers/${id}/accept`);
  return response.data;
};

// 9. 영입 제안 거절
export const rejectOfferApi = async (id: number | string): Promise<{ message: string }> => {
  const response = await apiClient.patch(`/recruitments/offers/${id}/reject`);
  return response.data;
};
