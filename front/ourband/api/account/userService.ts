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

// 히스토리 상세 유저 댓글 기능
export const addHistoryCommentApi = async (historyId: string | number, content: string) => {
  const response = await apiClient.post(`/users/history/${historyId}/comments`, { content });
  return response.data;
};

// 히스토리 상세 유저 좋아요 기능
export const increaseHistoryShareApi = async (historyId: string | number) => {
  await apiClient.post(`/users/history/${historyId}/share`, {});
};