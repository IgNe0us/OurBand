"use server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: "https://83e0979d430a4d0e5e34e0977fc3ef9d.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || "",
    secretAccessKey: process.env.R2_SECRET_KEY || "",
  },
});

export const uploadFileAction = async (formData: FormData): Promise<string> => {
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
