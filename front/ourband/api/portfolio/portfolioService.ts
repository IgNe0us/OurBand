import { apiClient } from '../baseApi';

export interface PortfolioData {
  id: number;
  userId: number;
  mediaUrl: string;
  title: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
}

export const createPortfolioApi = async (data: Partial<PortfolioData>): Promise<PortfolioData> => {
  const response = await apiClient.post('/portfolios', data);
  return response.data;
};

export const getUserPortfoliosApi = async (targetUserId: number, page: number = 0, size: number = 10) => {
  const response = await apiClient.get(`/portfolios/users/${targetUserId}`, {
    params: { page, size }
  });
  return response.data; // Page object
};

export const deletePortfolioApi = async (portfolioId: number): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/portfolios/${portfolioId}`);
  return response.data;
};
