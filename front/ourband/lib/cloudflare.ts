// utils/cloudflare.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: "https://83e0979d430a4d0e5e34e0977fc3ef9d.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "3eabc10348b2a6c94aef117fbdf9d472",
    secretAccessKey: "bb553467afddf97c7915a25a734182495e96881bad049b9f0ccd02dd22bdbe2c",
  },
});

export const uploadToCloudflare = async (file: File): Promise<string> => {
  const fileName = `profiles/${Date.now()}_${file.name}`;
  
  // 💡 핵심: File을 ArrayBuffer로 읽은 뒤 Uint8Array로 변환합니다.
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const command = new PutObjectCommand({
    Bucket: "ourband-media", // 본인의 버킷 이름으로 정확히 적어주세요
    Key: fileName,
    Body: uint8Array, // 💡 File 대신 uint8Array를 Body에 넣습니다.
    ContentType: file.type,
  });

  try {
    await s3.send(command);
    
    // 업로드 성공 후 Cloudflare Public URL 반환
    return `https://pub-7182cb8a63b442d99599c60ce1f02ba7.r2.dev/${fileName}`; 
  } catch (error) {
    console.error("업로드 실패:", error);
    throw error;
  }
};