import { apiClient } from '../baseApi';

export const getTrendingBandsApi = async () => {
    const response = await apiClient.get('/trends/bands');
    return response.data;
};

export const getTrendingJamsApi = async () => {
    const response = await apiClient.get('/trends/jams');
    return response.data;
};
