package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.user.GearSimpleDTO;
import com.ourband.api.domain.dto.user.HistoryCommentResponse;
import com.ourband.api.domain.dto.user.HistoryRequest;
import com.ourband.api.domain.dto.user.HistoryResponse;
import com.ourband.api.domain.dto.user.MusicSimpleDTO;
import com.ourband.api.domain.dto.user.ProfileImageUpdateRequestDTO;
import com.ourband.api.domain.dto.user.UserProfileResponseDTO;
import com.ourband.api.domain.dto.user.UserProfileUpdateRequestDTO;
import com.ourband.api.domain.dto.user.UserRequestDTO;
import com.ourband.api.domain.dto.user.UserSearchResponseDTO;
import com.ourband.api.domain.model.Profile;
import com.ourband.api.domain.model.User;
import com.ourband.api.domain.model.BandMember;
import com.ourband.api.domain.service.UserService;
import com.ourband.api.domain.service.SignupConfigService;
import com.ourband.api.domain.service.MailService;
import com.ourband.api.domain.repository.BandMemberRepository;
import com.ourband.api.global.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;
import com.ourband.api.domain.dto.user.UserProfileResponseDTO;
import com.ourband.api.domain.dto.user.UserSearchResponseDTO;
import com.ourband.api.domain.service.RateLimitService;
import com.ourband.api.domain.service.CaptchaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users") 
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final BandMemberRepository bandMemberRepository;
    private final JwtUtil jwtUtil;
    private final MailService mailService;
    private final RateLimitService rateLimitService;
    private final CaptchaService captchaService;
    private final PasswordEncoder passwordEncoder;
    private final SignupConfigService signupConfigService;

    /**
     * 이메일 인증번호 발송 API
     */
    @PostMapping("/send-auth-code")
    public ResponseEntity<?> sendAuthCode(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String email = body.get("email");
        String captchaToken = body.get("captchaToken");
        
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "이메일을 입력해 주세요."));
        }

        // 1. Rate Limit 검증
        String clientIp = getClientIp(request);
        if (!rateLimitService.isAllowed(clientIp, "email_send")) {
            return ResponseEntity.status(429).body(Map.of("message", "메일 발송 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요."));
        }

        // 2. Captcha 검증
        if (!captchaService.verifyToken(captchaToken)) {
            return ResponseEntity.badRequest().body(Map.of("message", "자동 가입 방지 인증(캡차)에 실패했습니다."));
        }
        
        // 이메일 중복 체크 (회원가입 용도일 경우)
        String type = body.getOrDefault("type", "register");
        boolean userExists = userService.findUserByEmail(email).isPresent();
        
        if ("register".equals(type) && userExists) {
            return ResponseEntity.badRequest().body(Map.of("message", "이미 가입된 이메일입니다."));
        }
        if ("find-password".equals(type) && !userExists) {
            return ResponseEntity.badRequest().body(Map.of("message", "가입되지 않은 이메일입니다."));
        }

        try {
            mailService.sendAuthCode(email);
            return ResponseEntity.ok(Map.of("message", "인증번호가 발송되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 닉네임 중복 확인 API
     */
    @GetMapping("/check-nickname")
    public ResponseEntity<?> checkNickname(@RequestParam("nickname") String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "닉네임을 입력해 주세요."));
        }
        
        List<String> forbiddenWords = signupConfigService.getAllForbiddenWords();
        for (String word : forbiddenWords) {
            if (nickname.contains(word)) {
                return ResponseEntity.badRequest().body(Map.of("message", "사용할 수 없는 단어가 포함되어 있습니다."));
            }
        }
        
        boolean isDuplicate = userService.findUserByNickname(nickname).isPresent();
        if (isDuplicate) {
            return ResponseEntity.badRequest().body(Map.of("message", "이미 사용 중인 닉네임입니다."));
        }
        
        return ResponseEntity.ok(Map.of("message", "사용 가능한 닉네임입니다."));
    }

    /**
     * 이메일 인증번호 확인 API
     */
    @PostMapping("/verify-auth-code")
    public ResponseEntity<?> verifyAuthCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        
        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "이메일과 인증번호를 모두 입력해 주세요."));
        }

        try {
            boolean isVerified = mailService.verifyAuthCode(email, code);
            if (isVerified) {
                return ResponseEntity.ok(Map.of("message", "이메일 인증이 완료되었습니다."));
            } else {
                return ResponseEntity.badRequest().body(Map.of("message", "인증번호가 일치하지 않습니다."));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 아이디(이메일) 찾기 안내 메일 발송 API
     */
    @PostMapping("/find-id-send-email")
    public ResponseEntity<?> findIdSendEmail(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String nickname = body.get("nickname");
        String captchaToken = body.get("captchaToken");

        // 1. Rate Limit 검증
        String clientIp = getClientIp(request);
        if (!rateLimitService.isAllowed(clientIp, "email_send")) {
            return ResponseEntity.status(429).body(Map.of("message", "메일 발송 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요."));
        }

        // 2. Captcha 검증
        if (!captchaService.verifyToken(captchaToken)) {
            return ResponseEntity.badRequest().body(Map.of("message", "자동 가입 방지 인증(캡차)에 실패했습니다."));
        }

        // 3. 보안 정책: 닉네임 존재 여부와 무관하게 무조건 동일한 성공 메시지 반환
        try {
            userService.findUserByNickname(nickname).ifPresent(user -> {
                mailService.sendFindIdEmail(user.getEmail());
            });
            return ResponseEntity.ok(Map.of("message", "가입된 계정이 있다면 등록된 이메일로 안내 메일을 발송했습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "안내 메일 발송 중 오류가 발생했습니다."));
        }
    }

    /**
     * 비밀번호 재설정 API
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String newPassword = body.get("newPassword");
        // 이 API는 이미 이전에 인증번호를 확인한 이후에 호출되거나, 
        // 인증번호와 함께 호출되도록 설계할 수 있습니다.
        // 보안 강화를 위해 인증번호를 다시 한번 함께 받아 검증하는 것이 좋습니다.
        String code = body.get("code");

        if (email == null || newPassword == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "필수 항목이 누락되었습니다."));
        }

        try {
            // 인증번호 검증 (성공 시 바로 삭제되지 않고 유지됨)
            boolean isVerified = mailService.verifyAuthCode(email, code);
            if (!isVerified) {
                return ResponseEntity.badRequest().body(Map.of("message", "인증번호가 일치하지 않습니다."));
            }

            User user = userService.findUserByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "가입되지 않은 이메일입니다."));
            }

            // 기존 비밀번호와 동일한지 체크
            if (passwordEncoder.matches(newPassword, user.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("message", "기존에 사용하던 비밀번호로는 변경할 수 없습니다."));
            }

            // 비밀번호 변경 로직
            userService.updatePassword(email, newPassword);
            
            // 모든 과정 완료 후 인증번호 폐기
            mailService.deleteAuthCode(email);

            return ResponseEntity.ok(Map.of("message", "비밀번호가 성공적으로 변경되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

    /**
     * 로그인 API
     * 프론트엔드에서 email과 password를 UserRequestDTO에 담아 보냅니다.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserRequestDTO requestDTO, HttpServletResponse response) {
        try {
            // 서비스 로직을 통해 유저 검증
            User user = userService.login(requestDTO.getEmail(), requestDTO.getPassword());
            
            // 💡 진짜 JWT 토큰 생성 (JwtUtil 활용)
            String accessToken = jwtUtil.generateToken(user.getUserId(), user.getEmail(), user.getType());
            
            ResponseCookie cookie = ResponseCookie.from("access_token", accessToken)
                .httpOnly(true)
                .secure(true) // 운영환경 true
                .path("/")
                .maxAge(60 * 60) // 1시간
                .sameSite("Lax")
                .build();

            String refreshToken = jwtUtil.generateRefreshToken(user.getUserId());
            ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true) // 운영환경 true
                .path("/")
                .maxAge(60 * 60 * 24 * 7) // 7일
                .sameSite("Lax")
                .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("userId", user.getUserId());
            responseBody.put("nickname", user.getNickname());
            responseBody.put("type", user.getType());

            return ResponseEntity.ok(responseBody);
            
        } catch (IllegalArgumentException e) {
            // 로그인 실패 시 401 에러와 메시지 반환
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    /*
     * 로그이웃 API
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(value = "access_token", required = false) String accessToken,
            @CookieValue(value = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {

        if (accessToken != null && !accessToken.isEmpty()) {
            try {
                // 토큰 블랙리스트 추가
                jwtUtil.invalidateToken(accessToken);
            } catch (Exception e) {
                // Ignore expired token
            }
        }
        
        if (refreshToken != null && !refreshToken.isEmpty()) {
            try {
                // 리프레시 토큰 파기
                jwtUtil.deleteRefreshToken(refreshToken);
            } catch (Exception e) {
                // Ignore
            }
        }

        ResponseCookie deleteCookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .build();

        ResponseCookie deleteRefreshCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, deleteRefreshCookie.toString());

        return ResponseEntity.ok()
                .body(Map.of("message", "로그아웃 완료"));
    }

    /*
     * 토큰 재발급 API
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(value = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Refresh Token이 없습니다."));
        }

        try {
            // AuthService 혹은 별도 로직을 통해 Redis에 존재하는지 확인. 여기선 UserService 위임 혹은 직접 처리
            // 좀 더 깔끔하게 처리를 위해 UserService 에 위임하겠습니다.
            User user = userService.refreshUserToken(refreshToken);

            // 새 토큰 발급
            String newAccessToken = jwtUtil.generateToken(user.getUserId(), user.getEmail(), user.getType());
            String newRefreshToken = jwtUtil.generateRefreshToken(user.getUserId());

            ResponseCookie cookie = ResponseCookie.from("access_token", newAccessToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(60 * 60)
                .sameSite("Lax")
                .build();

            ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", newRefreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(60 * 60 * 24 * 7)
                .sameSite("Lax")
                .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            return ResponseEntity.ok(Map.of("message", "토큰 재발급 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "유효하지 않은 Refresh Token 입니다. 다시 로그인해주세요."));
        }
    }

    /**
     * 회원가입 API
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRequestDTO requestDTO) {
        try {
            if (requestDTO.getNickname() != null) {
                List<String> forbiddenWords = signupConfigService.getAllForbiddenWords();
                for (String word : forbiddenWords) {
                    if (requestDTO.getNickname().contains(word)) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "사용할 수 없는 단어가 포함되어 있습니다."));
                    }
                }
            }
            
            userService.registerUser(requestDTO);
            
            // 회원가입 완료 후 사용된 인증번호 폐기
            mailService.deleteAuthCode(requestDTO.getEmail());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "회원가입이 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 사용자 프로필 조회 API
     */
    @GetMapping("/profile/me")
    public ResponseEntity<?> getMyProfile(
            @CookieValue(value = "access_token", required = false) String accessToken) {
        
        // 1. 토큰(쿠키)이 아예 없는 경우 방어
        if (accessToken == null || accessToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }

        try {
            // 2. JWT에서 userId 추출 (💡 JwtUtil에 구현된 메서드명으로 맞춰주세요!)
            // 예: jwtUtil.getUserIdFromToken(accessToken) 등
            Long currentUserId = jwtUtil.getUserId(accessToken); 
            
            // 3. 서비스 호출하여 조립된 거대한 DTO 받아오기
            UserProfileResponseDTO profileData = userService.getUserFullProfile(currentUserId, currentUserId);
            
            return ResponseEntity.ok(profileData);

        } catch (Exception e) {
            // 토큰이 만료되었거나 변조된 경우
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "유효하지 않은 토큰입니다."));
        }
    }

    /**
     * 타인 프로필 조회 API
     */
    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getUserProfile(
            @PathVariable("userId") Long targetUserId,
            @CookieValue(value = "access_token", required = false) String accessToken) {
        try {
            Long currentUserId = null;
            if (accessToken != null && !accessToken.isEmpty()) {
                try {
                    currentUserId = jwtUtil.getUserId(accessToken);
                } catch (Exception ignored) {
                }
            }
            
            UserProfileResponseDTO profileData = userService.getUserFullProfile(currentUserId, targetUserId);
            return ResponseEntity.ok(profileData);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "사용자를 찾을 수 없습니다."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "프로필 조회 중 오류가 발생했습니다."));
        }
    }

    /**
     * [수정] 프로필 업데이트 API (하드코딩 제거)
     * 방명록, 포지션, 활동구역 3가지를 업데이트 합니다.
     */
    @PutMapping("/profile/update")
    public ResponseEntity<?> updateProfile(
            @CookieValue(value = "access_token", required = false) String accessToken,
            @RequestBody UserProfileUpdateRequestDTO requestDTO) {
        
        // 1. 로그인 여부 확인
        if (accessToken == null || accessToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }

        try {
            // 2. 하드코딩(1L) 대신 진짜 토큰에서 내 ID 꺼내기
            Long currentUserId = jwtUtil.getUserId(accessToken);
            
            // 3. 서비스 호출 (우리가 앞서 수정한 대로 DTO 자체를 넘기는 방식)
            Profile updatedProfile = userService.updateProfile(currentUserId, requestDTO);
            
            return ResponseEntity.ok(Map.of(
                "message", "프로필이 성공적으로 업데이트되었습니다.",
                "location", updatedProfile.getLocation() != null ? updatedProfile.getLocation() : "",
                "instrument", updatedProfile.getInstrument() != null ? updatedProfile.getInstrument() : "",
                "bio", updatedProfile.getBio() != null ? updatedProfile.getBio() : ""
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "권한이 없습니다."));
        }
    }

    // 유저 [프로필 이미지, 커버] 업데이트 API
    @PutMapping("/profile/image")
    public ResponseEntity<?> updateProfileImage(
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody ProfileImageUpdateRequestDTO dto) {
        
        Long userId = jwtUtil.getUserId(accessToken);
        userService.updateProfileImage(userId, dto.getImageUrl(), dto.getImageType());
        
        return ResponseEntity.ok(Map.of("message", "이미지가 업데이트되었습니다."));
    }

    // 유저 프로필 좋아하는 곡 생성 API
    @PostMapping("/favorite-music")
    public ResponseEntity<MusicSimpleDTO> addFavoriteMusic(
            @CookieValue("access_token") String accessToken,
            @RequestBody Map<String, String> request) {
        Long userId = jwtUtil.getUserId(accessToken);
        MusicSimpleDTO response = userService.addFavoriteMusic(userId, request.get("title"));
        return ResponseEntity.ok(response);
    }

    // 유저 프로필 좋아하는 곡 삭제
    @DeleteMapping("/favorite-music/{musicId}")
    public ResponseEntity<Void> deleteFavoriteMusic(
            @CookieValue("access_token") String token,
            @PathVariable("musicId") Long musicId) {
        Long userId = jwtUtil.getUserId(token);
        userService.deleteFavoriteMusic(userId, musicId);
        return ResponseEntity.noContent().build();
    }

    // 관심 멤버 찜하기/언찜하기 토글 API
    @PostMapping("/favorite-members/{targetUserId}")
    public ResponseEntity<Map<String, Boolean>> toggleFavoriteMember(
            @CookieValue("access_token") String accessToken,
            @PathVariable("targetUserId") Long targetUserId) {
        Long userId = jwtUtil.getUserId(accessToken);
        boolean isFavorite = userService.toggleFavoriteMember(userId, targetUserId);
        return ResponseEntity.ok(Map.of("isFavorite", isFavorite));
    }

    // 내 관심 멤버 ID 목록 조회 API
    @GetMapping("/favorite-members")
    public ResponseEntity<List<Long>> getFavoriteMembers(
            @CookieValue(value = "access_token", required = false) String accessToken) {
        if (accessToken == null) return ResponseEntity.ok(List.of());
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            return ResponseEntity.ok(userService.getFavoriteMemberIds(userId));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // 유저 프로필 기어 생성 API
    @PostMapping("/gear")
    public ResponseEntity<GearSimpleDTO> addGear(
            @CookieValue("access_token") String accessToken,
            @RequestBody Map<String, String> request) {
        Long userId = jwtUtil.getUserId(accessToken);
        GearSimpleDTO response = userService.addGear(userId, request.get("gearName"));
        return ResponseEntity.ok(response);
    }

    // 유저 프로필 기어 삭제
    @DeleteMapping("/gear/{gearId}")
    public ResponseEntity<Void> deleteGear(
            @CookieValue("access_token") String token,
            @PathVariable("gearId") Long gearId) {
        Long userId = jwtUtil.getUserId(token);
        userService.deleteGear(userId, gearId);
        return ResponseEntity.noContent().build();
    }

    // 유저 히스토리 글 생성
    @PostMapping("/history")
    public ResponseEntity<HistoryResponse> addHistory(
            @CookieValue("access_token") String token,
            @RequestBody HistoryRequest request) {
            
        Long userId = jwtUtil.getUserId(token);
        
        HistoryResponse response = userService.addHistory(userId, request);
        
        return ResponseEntity.ok(response);
    }

    // 유저 히스토리 글 삭제
    @DeleteMapping("/history/{historyId}")
    public ResponseEntity<Void> deleteHistory(
            @CookieValue("access_token") String token,
            @PathVariable("historyId") Long historyId) {
            
        Long userId = jwtUtil.getUserId(token);
        userService.deleteHistory(userId, historyId);
        
        return ResponseEntity.noContent().build(); // 240 No Content 반환
    }
    
    // 좋아요 토글 API
    @PostMapping("/history/{historyId}/like")
    public ResponseEntity<Integer> toggleLike(
            @PathVariable("historyId") Long historyId,
            @CookieValue("access_token") String token) {
        Long userId = jwtUtil.getUserId(token);
        int updatedLikeCount = userService.toggleLike(userId, historyId);
        return ResponseEntity.ok(updatedLikeCount);
    }

    // 댓글 조회 API
    @GetMapping("/history/{historyId}/comments")
    public ResponseEntity<List<HistoryCommentResponse>> getComments(@PathVariable("historyId") Long historyId) {
        List<HistoryCommentResponse> comments = userService.getComments(historyId);
        return ResponseEntity.ok(comments);
    }

    // 댓글 작성 API
    @PostMapping("/history/{historyId}/comments")
    public ResponseEntity<HistoryCommentResponse> addComment(
            @PathVariable("historyId") Long historyId,
            @RequestBody Map<String, Object> body,
            @CookieValue("access_token") String token) {
        Long userId = jwtUtil.getUserId(token);
        String content = (String) body.get("content");
        Long parentId = body.get("parentId") != null ? Long.valueOf(body.get("parentId").toString()) : null;
        HistoryCommentResponse response = userService.addComment(userId, historyId, content, parentId);
        return ResponseEntity.ok(response);
    }

    // 댓글 수정 API
    @PutMapping("/history/{historyId}/comments/{commentId}")
    public ResponseEntity<HistoryCommentResponse> updateComment(
            @PathVariable("historyId") Long historyId,
            @PathVariable("commentId") Long commentId,
            @RequestBody Map<String, String> body,
            @CookieValue("access_token") String token) {
        Long userId = jwtUtil.getUserId(token);
        HistoryCommentResponse response = userService.updateComment(commentId, userId, body.get("content"));
        return ResponseEntity.ok(response);
    }

    // 댓글 삭제 API
    @DeleteMapping("/history/{historyId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable("historyId") Long historyId,
            @PathVariable("commentId") Long commentId,
            @CookieValue("access_token") String token) {
        Long userId = jwtUtil.getUserId(token);
        userService.deleteComment(commentId, userId);
        return ResponseEntity.ok().build();
    }

    //게시글 공유 카운트 상승
    @PostMapping("/history/{historyId}/share")
    public ResponseEntity<Void> increaseShare(@PathVariable("historyId") Long historyId) {
        userService.increaseShareCount(historyId);
        return ResponseEntity.ok().build();
    }

    // ========================================
    // 💡 유저 검색 API
    // ========================================

    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResponseDTO>> searchUsers(
            @RequestParam("keyword") String keyword,
            @CookieValue(value = "access_token", required = false) String accessToken) {
        
        Long currentUserId = null;
        if (accessToken != null && !accessToken.isEmpty()) {
            try {
                currentUserId = jwtUtil.getUserId(accessToken);
            } catch (Exception ignored) {}
        }
        
        List<UserSearchResponseDTO> results = userService.searchUsers(keyword, currentUserId);
        return ResponseEntity.ok(results);
    }

    // ========================================
    // 💡 팔로워 / 팔로잉 목록 API
    // ========================================

    /**
     * 나를 팔로우하는 사람 목록 (팔로워 리스트)
     */
    @GetMapping("/followers")
    public ResponseEntity<?> getFollowers(
            @CookieValue(value = "access_token", required = false) String accessToken) {
        if (accessToken == null || accessToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            List<com.ourband.api.domain.dto.user.FollowUserDTO> followers = userService.getFollowers(currentUserId, currentUserId);
            return ResponseEntity.ok(followers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "유효하지 않은 토큰입니다."));
        }
    }

    /**
     * 내가 팔로우하는 사람 목록 (팔로잉 리스트)
     */
    @GetMapping("/followings")
    public ResponseEntity<?> getFollowings(
            @CookieValue(value = "access_token", required = false) String accessToken) {
        if (accessToken == null || accessToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            List<com.ourband.api.domain.dto.user.FollowUserDTO> followings = userService.getFollowings(currentUserId, currentUserId);
            return ResponseEntity.ok(followings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "유효하지 않은 토큰입니다."));
        }
    }

    /**
     * 특정 사용자를 팔로우하는 사람 목록 (타겟 팔로워 리스트)
     */
    @GetMapping("/{userId}/followers")
    public ResponseEntity<?> getUserFollowers(
            @PathVariable("userId") Long targetUserId,
            @CookieValue(value = "access_token", required = false) String accessToken) {
        try {
            Long currentUserId = null;
            if (accessToken != null && !accessToken.isEmpty()) {
                try {
                    currentUserId = jwtUtil.getUserId(accessToken);
                } catch (Exception ignored) {
                }
            }
            List<com.ourband.api.domain.dto.user.FollowUserDTO> followers = userService.getFollowers(currentUserId, targetUserId);
            return ResponseEntity.ok(followers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "오류가 발생했습니다."));
        }
    }

    /**
     * 특정 사용자가 팔로우하는 사람 목록 (타겟 팔로잉 리스트)
     */
    @GetMapping("/{userId}/followings")
    public ResponseEntity<?> getUserFollowings(
            @PathVariable("userId") Long targetUserId,
            @CookieValue(value = "access_token", required = false) String accessToken) {
        try {
            Long currentUserId = null;
            if (accessToken != null && !accessToken.isEmpty()) {
                try {
                    currentUserId = jwtUtil.getUserId(accessToken);
                } catch (Exception ignored) {
                }
            }
            List<com.ourband.api.domain.dto.user.FollowUserDTO> followings = userService.getFollowings(currentUserId, targetUserId);
            return ResponseEntity.ok(followings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "오류가 발생했습니다."));
        }
    }

    /**
     * 내 밴드 목록 조회 API
     */
    @GetMapping("/bands")
    public ResponseEntity<?> getMyBands(
            @CookieValue(value = "access_token", required = false) String accessToken) {
        if (accessToken == null || accessToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            List<com.ourband.api.domain.dto.user.BandSimpleDTO> bands = userService.getMyBands(currentUserId);
            
            // Map BandSimpleDTO to frontend MyBandData format
            List<Map<String, Object>> responseList = bands.stream().map(b -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", b.getBandId());
                map.put("name", b.getBandName());
                map.put("logoImageUrl", b.getLogoImageUrl());
                map.put("role", b.getRole());
                
                // 리더 판별 로직: 이 밴드의 멤버 중 userId가 null이 아닌 가장 작은 id를 가진 멤버가 리더
                List<BandMember> members = bandMemberRepository.findByBandId(b.getBandId());
                boolean isLeader = false;
                if (!members.isEmpty()) {
                    BandMember leader = members.stream()
                        .filter(m -> m.getUserId() != null)
                        .min(java.util.Comparator.comparing(BandMember::getId))
                        .orElse(null);
                    if (leader != null && currentUserId.equals(leader.getUserId())) {
                        isLeader = true;
                    }
                }
                
                map.put("isLeader", isLeader);
                return map;
            }).toList();
            
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "유효하지 않은 토큰입니다."));
        }
    }

    /**
     * 팔로우 / 언팔로우 토글 API
     */
    @PostMapping("/follow/{targetUserId}")
    public ResponseEntity<?> toggleFollow(
            @CookieValue(value = "access_token") String accessToken,
            @PathVariable("targetUserId") Long targetUserId) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            boolean isNowFollowing = userService.toggleFollow(currentUserId, targetUserId);
            return ResponseEntity.ok(Map.of("isFollowing", isNowFollowing));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // ========================================
    // 💡 밴드 창설 API
    // ========================================

    /**
     * 밴드 생성 API
     * 프론트에서 Cloudflare 업로드 후 로고 URL과 함께 밴드 정보를 전달합니다.
     */
    @PostMapping("/band")
    public ResponseEntity<?> createBand(
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody com.ourband.api.domain.dto.user.BandCreateRequestDTO request) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            com.ourband.api.domain.dto.user.BandSimpleDTO result = userService.createBand(currentUserId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

}