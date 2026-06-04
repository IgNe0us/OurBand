FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace/app

COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# 실행 권한 부여
RUN chmod +x ./gradlew

# 소스코드 복사
COPY src src

# 테스트를 제외하고 빌드 (메모리 및 시간 절약)
RUN ./gradlew build -x test --no-daemon

# --- 실행 스테이지 ---
FROM eclipse-temurin:21-jre
WORKDIR /app

# 빌드 스테이지에서 생성된 jar 파일을 복사
COPY --from=build /workspace/app/build/libs/*-SNAPSHOT.jar app.jar

# 포트 개방
EXPOSE 8082

# 애플리케이션 실행 (prod 프로필 활성화)
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
