import { apiClient } from '../baseApi';

export type UserApiData = {
    nickname: string;
    email: string;
    password: string;
    type: string;
    instrument: string;
    businessNumber?: string;
};

/**
 * 회원가입 API 호출
 */
export const registerUserApi = async (data: UserApiData) => {
    console.log("[SERVICE] Calling Register API...");
    const response = await apiClient.post<any>('/users/register', data);
    return response.data;
};

/**
 * 사용자 로그인 API 호출
 */
export const loginUserApi = async (data: { email: string; password: string }) => {
    console.log("[SERVICE] Calling Login API...");
    const response = await apiClient.post<any>('/users/login', data);
    return response.data; 
};

/**
 * 사용자 프로필 업데이트 API 호출
 */
export const updateProfileApi = async (bio: string | null, instrument: string | null, location: string | null) => {
    const response = await apiClient.put<any>('/users/profile/update', {
        bio: bio,
        instrument: instrument,
        location: location
    });
    return response.data;
};

/*
 * 사용자 로그아웃 API 호출
 */
export const logoutApi = async () => {
    await apiClient.post('/users/logout');
};

// 사용자 유저 프로필 정보 가져오는 API 호출
export const getUserInfoApi = async () => {
    const response = await apiClient.get('/users/profile/me');
    return response.data;
};

// 특정 사용자 프로필 정보 가져오는 API 호출
export const getUserProfileApi = async (userId: number) => {
    const response = await apiClient.get(`/users/profile/${userId}`);
    return response.data;
};

// 유저 프로필 업데이트 API 호출
export const updateProfileImageApi = async (imageUrl: string, imageType: "PROFILE" | "COVER") => {
  return await apiClient.put('/users/profile/image', { 
    imageUrl,
    imageType
    }
  );
};

// 유저 프로필 좋아하는 곡 추가 API 호출
export const addFavoriteMusicApi = async (title: string) => {
    const response = await apiClient.post('/users/favorite-music', { title })
  return response.data;
};

// 유저 프로필 좋아하는 곡 삭제 API 호출
export const deleteFavoriteMusicApi = async (musicId: number) => {
  return await apiClient.delete(`/users/favorite-music/${musicId}`);
};

// 관심 멤버 찜하기 토글 API 호출
export const toggleFavoriteMemberApi = async (targetUserId: number): Promise<{ isFavorite: boolean }> => {
  const response = await apiClient.post(`/users/favorite-members/${targetUserId}`);
  return response.data;
};

// 내 관심 멤버 목록 조회 API 호출
export const getFavoriteMembersApi = async (): Promise<number[]> => {
  const response = await apiClient.get('/users/favorite-members');
  return response.data;
};

// 유저 장비 추가 API 호출
export const addGearApi = async (gearName: string) => {
    const response = await apiClient.post('/users/gear', { gearName })
  return response.data;
};

// 유저 장비 삭제 API 호출
export const deleteGearApi = async (gearId: number) => {
  return await apiClient.delete(`/users/gear/${gearId}`);
};

// 유저 히스토리 글 작성
export const addHistoryApi = async (data: { title: string, content: string, mediaUrl: string, mediaType: string }) => {
  const response = await apiClient.post('/users/history', data);
  return response.data;
};

// 유저 히스토리 글 삭제
export const deleteHistoryApi = async (historyId: number): Promise<void> => {
  await apiClient.delete(`/users/history/${historyId}`);
};

// 히스토리 상세 유저 좋아요 기능
export const toggleHistoryLikeApi = async (historyId: string | number, isLike: boolean) => {
  await apiClient.post(`/users/history/${historyId}/like?status=${isLike ? 'like' : 'unlike'}`, {});
};

// 히스토리 상세 유저 댓글 기능 (대댓글 지원)
export const addHistoryCommentApi = async (historyId: string | number, content: string, parentId?: string | number | null) => {
  const response = await apiClient.post(`/users/history/${historyId}/comments`, { content, parentId });
  return response.data;
};

// 히스토리 댓글 수정
export const updateHistoryCommentApi = async (historyId: string | number, commentId: string | number, content: string) => {
  const response = await apiClient.put(`/users/history/${historyId}/comments/${commentId}`, { content });
  return response.data;
};

// 히스토리 댓글 삭제
export const deleteHistoryCommentApi = async (historyId: string | number, commentId: string | number) => {
  await apiClient.delete(`/users/history/${historyId}/comments/${commentId}`);
};

// 히스토리 상세 유저 좋아요 기능
export const increaseHistoryShareApi = async (historyId: string | number) => {
  await apiClient.post(`/users/history/${historyId}/share`, {});
};

// ========================================
// 💡 팔로워 / 팔로잉 API
// ========================================

export type FollowUser = {
  userId: number;
  nickname: string;
  profilePictureUrl: string | null;
  bio: string | null;
  instrument: string | null;
  isFollowing: boolean; // 내가 이 유저를 팔로우하고 있는지 여부 (following 필드명이 JSON에서 isFollowing이 아닌 following으로 올 수 있음)
};

// 나를 팔로우하는 사람 목록 (팔로워)
export const getFollowersApi = async (): Promise<FollowUser[]> => {
  const response = await apiClient.get('/users/followers');
  return response.data;
};

// 내가 팔로우하는 사람 목록 (팔로잉)
export const getFollowingsApi = async (): Promise<FollowUser[]> => {
  const response = await apiClient.get('/users/followings');
  return response.data;
};

// 특정 사용자 팔로우하는 사람 목록
export const getUserFollowersApi = async (userId: number): Promise<FollowUser[]> => {
  const response = await apiClient.get(`/users/${userId}/followers`);
  return response.data;
};

// 특정 사용자가 팔로우하는 사람 목록
export const getUserFollowingsApi = async (userId: number): Promise<FollowUser[]> => {
  const response = await apiClient.get(`/users/${userId}/followings`);
  return response.data;
};

// 팔로우 / 언팔로우 토글
export const toggleFollowApi = async (targetUserId: number): Promise<{ isFollowing: boolean }> => {
  const response = await apiClient.post(`/users/follow/${targetUserId}`);
  return response.data;
};

// ========================================
// 💡 밴드 창설 API
// ========================================

export type BandCreateRequest = {
  name: string;
  location: string;
  genre: string;
  description: string;
  logoImageUrl: string;
};

export const createBandApi = async (data: BandCreateRequest) => {
  const response = await apiClient.post('/users/band', data);
  return response.data;
};

// ========================================
// 💡 뮤지션 검색 API
// ========================================

export type UserSearchResult = {
  userId: number;
  nickname: string;
  profilePictureUrl: string | null;
  instrument: string | null;
  location: string | null;
  isFollowing: boolean;
};

export const searchUsersApi = async (keyword: string): Promise<UserSearchResult[]> => {
  const response = await apiClient.get(`/users/search?keyword=${encodeURIComponent(keyword)}`);
  return response.data;
};