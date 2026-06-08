"use server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { cookies } from "next/headers";

const s3 = new S3Client({
  region: "auto",
  endpoint: "https://83e0979d430a4d0e5e34e0977fc3ef9d.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || "",
    secretAccessKey: process.env.R2_SECRET_KEY || "",
  },
});

// 메모리 기반 Rate Limiter (1분에 최대 5회 업로드 허용)
const uploadRateMap = new Map<string, { count: number; resetTime: number }>();
const MAX_UPLOADS_PER_MINUTE = 5;
const RATE_WINDOW_MS = 60 * 1000; // 1분

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = uploadRateMap.get(userId);

  if (!entry || now > entry.resetTime) {
    // 새 윈도우 시작
    uploadRateMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_UPLOADS_PER_MINUTE) {
    return false; // 속도 제한 초과
  }

  entry.count++;
  return true;
}

// 오래된 Rate Limit 엔트리 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of uploadRateMap.entries()) {
    if (now > entry.resetTime) {
      uploadRateMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // 5분마다 정리

export const uploadFileAction = async (formData: FormData): Promise<string> => {
  // 1. 로그인 검증: HttpOnly 쿠키에서 access_token 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token");
  if (!accessToken || !accessToken.value) {
    throw new Error("인증이 필요합니다. 로그인 후 다시 시도해주세요.");
  }

  // 2. Rate Limit 검증: 토큰 값을 키로 사용하여 1분에 5회 제한
  const rateLimitKey = accessToken.value.substring(0, 32); // 토큰 앞 32자를 유저 식별자로 사용
  if (!checkRateLimit(rateLimitKey)) {
    throw new Error("업로드 횟수가 초과되었습니다. 1분 후 다시 시도해주세요.");
  }

  // 3. 파일 검증
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const fileName = `profiles/${Date.now()}_${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const command = new PutObjectCommand({
    Bucket: "ourband-media",
    Key: fileName,
    Body: uint8Array,
    ContentType: file.type,
  });

  try {
    await s3.send(command);
    return `https://pub-7182cb8a63b442d99599c60ce1f02ba7.r2.dev/${fileName}`; 
  } catch (error) {
    console.error("업로드 실패:", error);
    throw new Error("Failed to upload to Cloudflare");
  }
};
