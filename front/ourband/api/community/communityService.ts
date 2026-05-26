import { apiClient } from '../baseApi';

export interface CommunityPollOptionData {
  id: number;
  content: string;
  voteCount: number;
}

export interface CommunityPollData {
  id: number;
  title: string;
  isMultipleChoice: boolean;
  options: CommunityPollOptionData[];
  totalVotes: number;
  myVotedOptionId: number | null;
}

export interface CommunityPostCommentData {
  id: number;
  content: string;
  userId?: number;
  authorName: string;
  authorProfileImageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: number | null;
  replies?: CommunityPostCommentData[];
}

export interface CommunityPostData {
  id?: string | number;
  userId?: string | number;
  authorName?: string;
  boardType?: string; // e.g., "FREE", "INFO", "MARKET"
  category?: string; 
  part?: string; // "일반", "보컬", "기타", etc.
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string; // "VIDEO", "IMAGE"
  createdAt?: string;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  isLikedByCurrentUser?: boolean;
  authorProfileImageUrl?: string;
  poll?: CommunityPollData;
  comments?: CommunityPostCommentData[];
}

// 1. 게시글 목록 조회
export const getCommunityPostsApi = async (
  boardType?: string, 
  category?: string, 
  part?: string, 
  keyword?: string, 
  page?: number,
  isPopular?: boolean
): Promise<CommunityPostData[]> => {
  const response = await apiClient.get('/community/posts', {
    params: { boardType, category, part, keyword, page, isPopular }
  });
  return response.data.content || response.data || [];
};

// 2. 단일 게시글 상세 조회
export const getCommunityPostApi = async (postId: string | number): Promise<CommunityPostData> => {
  const response = await apiClient.get(`/community/posts/${postId}`);
  return response.data;
};

// 3. 게시글 등록
export const createCommunityPostApi = async (data: Omit<CommunityPostData, 'id'>): Promise<CommunityPostData> => {
  const response = await apiClient.post('/community/posts', data);
  return response.data;
};

// 4. 게시글 수정
export const updateCommunityPostApi = async (postId: string | number, data: Omit<CommunityPostData, 'id'>): Promise<CommunityPostData> => {
  const response = await apiClient.put(`/community/posts/${postId}`, data);
  return response.data;
};

// 5. 게시글 삭제
export const deleteCommunityPostApi = async (postId: string | number): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/community/posts/${postId}`);
  return response.data;
};

// 6. 게시글 댓글 달기
export const createCommunityCommentApi = async (
  postId: string | number, 
  data: { content: string; parentId?: number | null }
): Promise<CommunityPostCommentData> => {
  const response = await apiClient.post(`/community/posts/${postId}/comments`, data);
  return response.data;
};

// 7. 댓글 수정
export const updateCommunityCommentApi = async (
  postId: string | number, 
  commentId: string | number, 
  data: { content: string }
): Promise<CommunityPostCommentData> => {
  const response = await apiClient.put(`/community/posts/${postId}/comments/${commentId}`, data);
  return response.data;
};

// 8. 댓글 삭제
export const deleteCommunityCommentApi = async (
  postId: string | number, 
  commentId: string | number
): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/community/posts/${postId}/comments/${commentId}`);
  return response.data;
};

// 9. 좋아요 토글
export const toggleCommunityLikeApi = async (postId: string | number): Promise<{ isLiked: boolean }> => {
  const response = await apiClient.post(`/community/posts/${postId}/likes`);
  return response.data;
};

// 10. 투표하기
export const voteCommunityPollApi = async (
  postId: string | number, 
  pollId: string | number, 
  optionId: string | number
): Promise<{ message: string }> => {
  const response = await apiClient.post(`/community/posts/${postId}/polls/${pollId}/vote?optionId=${optionId}`);
  return response.data;
};

// 11. 신고하기
export const createReportApi = async (
  postId: string | number, 
  reason: string
): Promise<{ message: string }> => {
  const response = await apiClient.post(`/community/posts/${postId}/report`, { reason });
  return response.data;
};

// 12. 파일 업로드 API
export const uploadFileApi = async (file: File): Promise<{ url: string, mediaType: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
