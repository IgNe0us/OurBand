import { apiClient } from '../baseApi';

export interface JamPostData {
  id: number;
  userId: number;
  authorName: string;
  authorProfileImageUrl?: string;
  portfolioId?: number;
  parentId?: number;
  originalAuthorName?: string;
  mediaUrl: string;
  title: string;
  description?: string;
  instrument?: string;
  genre?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  originalVolume: number;
  myVolume: number;
  isLiked?: boolean;
  isFollowing?: boolean;
  createdAt: string;
}

export type JamPostCommentData = {
  id: number;
  jamId: number;
  authorId?: number;
  authorName: string;
  authorProfileImageUrl?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: number | null;
  replies?: JamPostCommentData[];
};

export const createJamPostApi = async (data: Partial<JamPostData>): Promise<JamPostData> => {
  const response = await apiClient.post('/jams', data);
  return response.data;
};

export const deleteJamPostApi = async (jamId: number): Promise<void> => {
  await apiClient.delete(`/jams/${jamId}`);
};

export const getJamPostApi = async (jamId: number): Promise<JamPostData> => {
  const response = await apiClient.get(`/jams/${jamId}`);
  return response.data;
};

export const searchJamPostsApi = async (genre?: string, instrument?: string, page: number = 0, size: number = 10) => {
  const params: any = { page, size };
  if (genre) params.genre = genre;
  if (instrument) params.instrument = instrument;
  const response = await apiClient.get('/jams', { params });
  return response.data;
};

export const getUserJamPostsApi = async (targetUserId: number, page: number = 0, size: number = 10) => {
  const response = await apiClient.get(`/jams/users/${targetUserId}`, {
    params: { page, size }
  });
  return response.data;
};

export const incrementJamViewCountApi = async (jamId: number): Promise<void> => {
  await apiClient.post(`/jams/${jamId}/view`);
};

export const toggleJamLikeApi = async (jamId: number): Promise<{ isLiked: boolean }> => {
  const response = await apiClient.post(`/jams/${jamId}/like`);
  return response.data;
};

export const getJamCommentsApi = async (jamId: number): Promise<JamPostCommentData[]> => {
  const response = await apiClient.get(`/jams/${jamId}/comments`);
  return response.data;
};

export const createJamCommentApi = async (jamId: number, data: { content: string, parentId?: number | null }): Promise<JamPostCommentData> => {
  const response = await apiClient.post(`/jams/${jamId}/comments`, data);
  return response.data;
};

export const incrementJamShareApi = async (jamId: number): Promise<void> => {
  await apiClient.post(`/jams/${jamId}/share`);
};

export const updateJamCommentApi = async (jamId: number, commentId: number, data: { content: string }): Promise<JamPostCommentData> => {
  const response = await apiClient.put(`/jams/${jamId}/comments/${commentId}`, data);
  return response.data;
};

export const deleteJamCommentApi = async (jamId: number, commentId: number): Promise<void> => {
  await apiClient.delete(`/jams/${jamId}/comments/${commentId}`);
};
