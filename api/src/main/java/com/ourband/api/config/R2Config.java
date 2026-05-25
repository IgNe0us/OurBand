package com.ourband.api.config;

import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class R2Config {

    @Value("${cloud.cloudflare.r2.endpoint}")
    private String endpoint;

    @Value("${cloud.cloudflare.r2.access-key}")
    private String accessKey;

    @Value("${cloud.cloudflare.r2.secret-key}")
    private String secretKey;

    @Bean
    public AmazonS3 amazonS3() {
        // 1. 자격 증명 객체 생성
        AWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);

        // 2. AWS S3 빌더를 사용하되, 엔드포인트를 Cloudflare R2로 커스텀 설정
        return AmazonS3ClientBuilder.standard()
                .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(endpoint, "us-east-1")) // R2는 리전값으로 아무 문자열이나 넣어도 되지만 보통 기본값인 us-east-1이나 auto를 씁니다.
                .withCredentials(new AWSStaticCredentialsProvider(credentials))
                .build();
    }
}