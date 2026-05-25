package com.ourband.api.infra.storage;

import com.amazonaws.services.s3.AmazonS3;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class R2StorageService {

    private final AmazonS3 amazonS3;

    @Value("${cloud.cloudflare.r2.bucket-name}") // application.yml에 등록된 버킷명
    private String bucketName;

    /**
     * 💡 Object Key를 받아 R2 저장소에서 파일을 영구 삭제합니다.
     */
    public void deleteFile(String objectKey) {
        if (amazonS3.doesObjectExist(bucketName, objectKey)) {
            amazonS3.deleteObject(bucketName, objectKey);
        }
    }
}