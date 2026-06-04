import { apiClient } from '../baseApi';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  joined: string;
  status: string;
  reports: number;
  role: string;
  lastIp: string;
  suspendedUntil?: string;
  suspendReason?: string;
}

export const getAdminUsersApi = async (): Promise<AdminUser[]> => {
  const response = await apiClient.get('/admin/users');
  return response.data;
};

export const updateAdminUserStatusApi = async (userId: string, status: string, suspendDays?: number, suspendReason?: string): Promise<void> => {
  await apiClient.put(`/admin/users/${userId}/status`, { status, suspendDays, suspendReason });
};

export const updateAdminUserRoleApi = async (userId: string, role: string): Promise<void> => {
  await apiClient.put(`/admin/users/${userId}/role`, { role });
};

// --- Contents ---

export interface AdminContent {
  id: string;
  board: string;
  title: string;
  author: string;
  date: string;
  hidden: boolean;
  type: string;
}

export const getAdminContentsApi = async (): Promise<AdminContent[]> => {
  const response = await apiClient.get('/admin/contents');
  return response.data;
};

export const deleteAdminContentApi = async (type: string, id: string): Promise<void> => {
  await apiClient.delete(`/admin/contents/${type}/${id}`);
};

export const toggleAdminContentVisibilityApi = async (type: string, id: string): Promise<void> => {
  await apiClient.put(`/admin/contents/${type}/${id}/visibility`);
};

// --- Reports ---

export interface AdminReport {
  id: string;
  type: string;
  url: string;
  author: string;
  reason: string;
  date: string;
  status: string;
  content: string;
}

export const getAdminReportsApi = async (): Promise<AdminReport[]> => {
  const response = await apiClient.get('/admin/reports');
  return response.data;
};

export const updateAdminReportStatusApi = async (reportId: string, status: string): Promise<void> => {
  await apiClient.put(`/admin/reports/${reportId}/status`, { status });
};

// --- Statistics ---

export interface AdminStatistics {
  totalUsers: number;
  newUsersToday: number;
  activeUsersToday: number;
  totalBands: number;
  newBandsToday: number;
  totalJams: number;
  totalCommunityPosts: number;
  cpuUsage?: number;
  ramUsage?: number;
  storageUsage?: number;
  pendingReports?: number;
}

export const getAdminStatisticsApi = async (): Promise<AdminStatistics> => {
  const response = await apiClient.get('/admin/statistics');
  return response.data;
};

export interface DailyVisitorResponse {
  name: string; // e.g., "05/30"
  dau: number;
  mau: number;
}

export const getVisitorTrendsApi = async (): Promise<DailyVisitorResponse[]> => {
  const response = await apiClient.get('/admin/visitor-trends');
  return response.data;
};
