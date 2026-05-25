import { apiClient } from '../baseApi';

// 타입 정의
export type UserApiData = {
    nickname: string;
    email: string;
    password: string;
};

// ❌ export const userService = { ... } 상자 제거!
// ✅ 함수마다 직접 export const를 붙여서 개별 수출!

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
    
    // 성공 시 토큰을 로컬 스토리지에 저장
    localStorage.setItem('authToken', response.data.token); 
    return response.data; 
};

/**
 * 사용자 프로필 업데이트 API 호출
 */
export const updateProfileApi = async (bio: string | null, profileUrl: string | null) => {
    console.log("Attempting to update profile via API...");
    const response = await apiClient.put<any>('/users/profile/update', {
        bio: bio,
        profilePictureUrl: profileUrl
    });
    return response.data;
};