import { apiClient } from '@/api/baseApi';

export interface SignupConfigDTO {
    forbiddenWords: string[];
    positions: string[];
}

// Public API
export const getSignupConfigApi = async (): Promise<SignupConfigDTO> => {
    const response = await apiClient.get<SignupConfigDTO>('/public/signup-config');
    return response.data;
};

// Admin APIs for Forbidden Words
export const addForbiddenWordApi = async (word: string): Promise<void> => {
    await apiClient.post(`/admin/signup-config/forbidden-words?word=${encodeURIComponent(word)}`);
};

export const deleteForbiddenWordApi = async (word: string): Promise<void> => {
    await apiClient.delete(`/admin/signup-config/forbidden-words?word=${encodeURIComponent(word)}`);
};

// Admin APIs for Positions
export const addPositionApi = async (positionName: string): Promise<void> => {
    await apiClient.post(`/admin/signup-config/positions?positionName=${encodeURIComponent(positionName)}`);
};

export const deletePositionApi = async (positionName: string): Promise<void> => {
    await apiClient.delete(`/admin/signup-config/positions?positionName=${encodeURIComponent(positionName)}`);
};
