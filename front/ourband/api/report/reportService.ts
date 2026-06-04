import { apiClient } from "@/api/baseApi";

/**
 * 범용 신고 API
 * @param targetType 신고 대상 타입 (예: COMMUNITY_POST, BAND_COMMENT 등)
 * @param targetId 신고 대상 ID
 * @param reason 신고 사유
 */
export const createReportApi = async (
  targetType: string,
  targetId: number | string,
  reason: string
): Promise<{ message: string }> => {
  const response = await apiClient.post("/reports", {
    targetType,
    targetId: Number(targetId),
    reason,
  });
  return response.data;
};
