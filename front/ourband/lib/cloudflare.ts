// utils/cloudflare.ts
import { uploadFileAction } from "./uploadAction";

export const uploadToCloudflare = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  
  try {
    const url = await uploadFileAction(formData);
    return url;
  } catch (error) {
    console.error("업로드 실패:", error);
    throw error;
  }
};