import { apiClient } from '@/api/baseApi';

export interface SiteSettingDTO {
  settingKey: string;
  settingValue: string;
  description?: string;
}

/**
 * 전역 퍼블릭 설정 가져오기 (비로그인 허용)
 */
export const getPublicSettingsApi = async (): Promise<Record<string, string>> => {
  const response = await apiClient.get('/settings/public');
  return response.data;
};

/**
 * 전체 사이트 설정 조회 (관리자용)
 */
export const getAllAdminSettingsApi = async (): Promise<SiteSettingDTO[]> => {
  const response = await apiClient.get('/admin/settings');
  return response.data;
};

/**
 * 여러 개의 설정을 한 번에 업데이트 (관리자용)
 */
export const updateAdminSettingsApi = async (updates: Record<string, string>): Promise<void> => {
  const response = await apiClient.post('/admin/settings', updates);
  return response.data;
};
