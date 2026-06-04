import { apiClient } from '../baseApi';

export interface StudioRoomData {
  id: number;
  name: string;
  size: string;
  equipment: string; // Comma separated or just free text
}

export interface StudioData {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  amenities: string;
  bookingUrl?: string | null;
  rating: number;
  reviewCount: number;
  distKm?: number;
  dist?: string;
  ownerId?: number;
  ownerNickname?: string;
  ownerProfileImageUrl?: string;
  rooms?: StudioRoomData[];
  images?: string[];
  isExternal?: boolean;
}

export interface StudioCreateData {
  name: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  amenities: string;
  bookingUrl?: string | null;
  rooms: { name: string; size: string; equipment: string }[];
}

export const getStudiosApi = async (lat: number, lng: number, radiusKm: number = 10): Promise<StudioData[]> => {
  const response = await apiClient.get(`/studios`, {
    params: { lat, lng, radius: radiusKm }
  });
  return response.data;
};

export const getStudioApi = async (id: string | number): Promise<StudioData> => {
  const response = await apiClient.get(`/studios/${id}`);
  return response.data;
};

export const createStudioApi = async (data: StudioCreateData): Promise<StudioData> => {
  const response = await apiClient.post(`/studios`, data);
  return response.data;
};

export const updateStudioApi = async (id: string | number, data: StudioCreateData): Promise<StudioData> => {
  const response = await apiClient.put(`/studios/${id}`, data);
  return response.data;
};

export const deleteStudioApi = async (id: string | number): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/studios/${id}`);
  return response.data;
};

export const reportStudioApi = async (id: string | number, reason: string): Promise<{ message: string }> => {
  const response = await apiClient.post(`/studios/${id}/report`, { reason });
  return response.data;
};

export const callEmergencySessionApi = async (position: string, location: string, detailAddress: string, datetime: string): Promise<{ message: string }> => {
  const response = await apiClient.post(`/studios/emergency-session`, {
    position,
    location,
    detailAddress,
    datetime
  });
  return response.data;
};
