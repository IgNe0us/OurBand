import { apiClient } from '../baseApi';

export type BandPositionData = {
  id?: number | string;
  role: string;
  memberName: string;
  isRecruiting: boolean;
  userId?: number;
  profileImageUrl?: string;
};

export type BandHistory = {
  id: string;
  date: string;
  title: string;
};

export type BandProfileData = {
  id?: number;
  name: string;
  genre: string;
  location: string;
  frequency: string;
  description: string;
  coverImage: string;
  logoImage: string;
  historyJson?: string;
  history?: BandHistory[];
  positions: BandPositionData[];
  isLeader?: boolean;
};

export interface PollOptionData {
  id: number;
  content: string;
  voteCount: number;
}

export interface PollData {
  id: number;
  title: string;
  isMultipleChoice: boolean;
  options: PollOptionData[];
  totalVotes: number;
  myVotedOptionId: number | null;
}

export type BandPostCommentData = {
  id: number;
  content: string;
  authorName: string;
  authorProfileImageUrl?: string;
  createdAt: string;
};

export interface BandPostData {
  id?: string | number;
  bandId?: string | number;
  authorId?: string | number;
  authorName?: string;
  authorRole?: string;
  boardType: string; // "NOTICE", "FREE", "SCHEDULE", "REHEARSAL"
  category: string;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string; // "VIDEO", "IMAGE"
  scheduleDate?: string;
  scheduleDetails?: string;
  createdAt?: string;
  likeCount?: number;
  commentCount?: number;
  isLikedByCurrentUser?: boolean;
  authorProfileImageUrl?: string;
  poll?: PollData;
  comments?: BandPostCommentData[];
};

// 1. 밴드 프로필 조회 API
export const getBandProfileApi = async (bandId: string | number): Promise<BandProfileData> => {
  const response = await apiClient.get(`/bands/${bandId}`);
  return response.data;
};

// 2. 밴드 프로필 수정 API
export const updateBandProfileApi = async (bandId: string | number, data: BandProfileData): Promise<BandProfileData> => {
  const response = await apiClient.put(`/bands/${bandId}`, data);
  return response.data;
};

// 3. 밴드 게시글 목록 조회 API
export const getBandPostsApi = async (bandId: string | number, boardType: string): Promise<BandPostData[]> => {
  const response = await apiClient.get(`/bands/${bandId}/posts`, {
    params: { boardType }
  });
  return response.data;
};

// 4. 밴드 게시글 등록 API
export const createBandPostApi = async (bandId: string | number, data: Omit<BandPostData, 'bandId'>): Promise<BandPostData> => {
  const response = await apiClient.post(`/bands/${bandId}/posts`, data);
  return response.data;
};

// 5. 밴드 게시글 삭제 API
export const deleteBandPostApi = async (bandId: string | number, postId: string | number): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/bands/${bandId}/posts/${postId}`);
  return response.data;
};

// 5-1. 밴드 게시글 수정 API
export const updateBandPostApi = async (bandId: string | number, postId: string | number, data: Omit<BandPostData, 'bandId'>): Promise<BandPostData> => {
  const response = await apiClient.put(`/bands/${bandId}/posts/${postId}`, data);
  return response.data;
};

// 9. 게시글 댓글 달기 API
export const createBandPostCommentApi = async (bandId: string | number, postId: string | number, data: { content: string }): Promise<BandPostCommentData> => {
  const response = await apiClient.post(`/bands/${bandId}/posts/${postId}/comments`, data);
  return response.data;
};

// 10. 투표하기 API
export const votePollApi = async (bandId: string | number, postId: string | number, pollId: string | number, optionId: string | number): Promise<{ message: string }> => {
  const response = await apiClient.post(`/bands/${bandId}/posts/${postId}/polls/${pollId}/vote?optionId=${optionId}`);
  return response.data;
};

// 6. 밴드 단일 게시글 상세 조회 API
export const getBandPostApi = async (postId: string | number): Promise<BandPostData> => {
  const response = await apiClient.get(`/bands/posts/${postId}`);
  return response.data;
};

// 7. 게시글 좋아요 토글 API
export const toggleLikeApi = async (postId: string | number): Promise<{ isLiked: boolean }> => {
  const response = await apiClient.post(`/bands/posts/${postId}/likes`);
  return response.data;
};

// 8. 게시글 댓글 작성 API
export const createCommentApi = async (postId: string | number, content: string): Promise<any> => {
  const response = await apiClient.post(`/bands/posts/${postId}/comments`, { content });
  return response.data;
};
