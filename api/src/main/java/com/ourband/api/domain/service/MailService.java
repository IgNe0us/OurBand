package com.ourband.api.domain.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;
    private final StringRedisTemplate redisTemplate;

    private static final String AUTH_CODE_PREFIX = "auth_code:";
    private static final long AUTH_CODE_EXPIRATION_MINUTES = 5;

    /**
     * 인증번호 발송
     * @param email 수신자 이메일
     */
    public void sendAuthCode(String email) {
        String authCode = generateAuthCode();
        log.info("발급된 인증번호 [{}]: {}", email, authCode);

        // Redis에 5분(300초) 동안 저장
        redisTemplate.opsForValue().set(
                AUTH_CODE_PREFIX + email,
                authCode,
                AUTH_CODE_EXPIRATION_MINUTES,
                TimeUnit.MINUTES
        );

        // 실제 이메일 발송
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("wjdals1831@gmail.com");
        message.setTo(email);
        message.setSubject("[OurBand] 회원가입 이메일 인증번호입니다.");
        message.setText("안녕하세요! OurBand입니다.\n\n회원가입을 위한 인증번호는 아래와 같습니다.\n\n" 
                + authCode + "\n\n해당 인증번호는 5분간 유효합니다.");

        try {
            mailSender.send(message);
        } catch (Exception e) {
            log.error("메일 발송 실패: {}", email, e);
            throw new RuntimeException("이메일 발송에 실패했습니다.\n이메일 주소를 다시 확인해 주세요.");
        }
    }

    /**
     * 인증번호 검증
     * @param email 수신자 이메일
     * @param inputCode 사용자가 입력한 인증번호
     * @return 일치 여부
     */
    public boolean verifyAuthCode(String email, String inputCode) {
        String storedCode = redisTemplate.opsForValue().get(AUTH_CODE_PREFIX + email);
        if (storedCode == null) {
            throw new IllegalArgumentException("인증번호가 만료되었거나 존재하지 않습니다. 다시 요청해 주세요.");
        }

        if (storedCode.equals(inputCode)) {
            // 인증 성공 시 바로 삭제하지 않고 유지 (비밀번호 변경 등 후속 작업에서 재검증 필요)
            return true;
        }

        return false;
    }

    /**
     * 인증번호 강제 삭제 (비밀번호 변경 완료 후 등)
     */
    public void deleteAuthCode(String email) {
        redisTemplate.delete(AUTH_CODE_PREFIX + email);
    }

    /**
     * 6자리 랜덤 숫자 생성
     */
    private String generateAuthCode() {
        SecureRandom random = new SecureRandom();
        int num = random.nextInt(1000000);
        return String.format("%06d", num);
    }

    /**
     * 아이디 찾기 안내 메일을 발송합니다.
     * @param email 수신자 이메일
     */
    public void sendFindIdEmail(String email) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("wjdals1831@gmail.com");
        message.setTo(email);
        message.setSubject("[OurBand] 가입 안내 메일입니다.");
        message.setText("안녕하세요! OurBand입니다.\n\n" 
                + "회원님의 닉네임으로 가입된 이메일 계정은 다음과 같습니다:\n\n" 
                + "[" + email + "]\n\n"
                + "해당 이메일로 로그인해 주시기 바랍니다.\n"
                + "감사합니다.");

        try {
            mailSender.send(message);
            log.info("아이디 찾기 안내 메일 발송 완료: {}", email);
        } catch (Exception e) {
            log.error("메일 발송 실패: {}", email, e);
            throw new RuntimeException("이메일 발송에 실패했습니다.\n이메일 주소를 다시 확인해 주세요.");
        }
    }
}
