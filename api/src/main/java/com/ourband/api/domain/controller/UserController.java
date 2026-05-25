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
import com.ourband.api.domain.model.Profile;
import com.ourband.api.domain.model.User;
import com.ourband.api.domain.service.UserService;
import com.ourband.api.global.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;
import com.ourband.api.domain.dto.user.UserProfileResponseDTO;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users") 
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

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
                .secure(false) // 개발환경 false
                .path("/")
                .maxAge(60 * 60 * 24)
                .sameSite("Lax")
                .build();

            response.addHeader("Set-Cookie", cookie.toString());

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
        public ResponseEntity<?> logout() {

            ResponseCookie deleteCookie = ResponseCookie.from("access_token", "")
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .maxAge(0)
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                    .body(Map.of("message", "로그아웃 완료"));
        }

    /**
     * 회원가입 API
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRequestDTO requestDTO) {
        try {
            userService.registerUser(requestDTO);
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
                    .body(Map.of("message", "유효하지 않은 토큰입니다. 다시 로그인해주세요."));
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
            @PathVariable Long musicId) {
        Long userId = jwtUtil.getUserId(token);
        userService.deleteFavoriteMusic(userId, musicId);
        return ResponseEntity.noContent().build();
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
            @PathVariable Long gearId) {
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
            @PathVariable Long historyId) {
            
        Long userId = jwtUtil.getUserId(token);
        userService.deleteHistory(userId, historyId);
        
        return ResponseEntity.noContent().build(); // 240 No Content 반환
    }
    
    // 좋아요 토글 API
    @PostMapping("/history/{historyId}/like")
    public ResponseEntity<Integer> toggleLike(
            @PathVariable Long historyId,
            @CookieValue("access_token") String token) {
        Long userId = jwtUtil.getUserId(token);
        int updatedLikeCount = userService.toggleLike(userId, historyId);
        return ResponseEntity.ok(updatedLikeCount);
    }

    // 댓글 조회 API
    @GetMapping("/history/{historyId}/comments")
    public ResponseEntity<List<HistoryCommentResponse>> getComments(@PathVariable Long historyId) {
        List<HistoryCommentResponse> comments = userService.getComments(historyId);
        return ResponseEntity.ok(comments);
    }

    // 댓글 작성 API
    @PostMapping("/history/{historyId}/comments")
    public ResponseEntity<HistoryCommentResponse> addComment(
            @PathVariable Long historyId,
            @RequestBody Map<String, String> body,
            @CookieValue("access_token") String token) {
        Long userId = jwtUtil.getUserId(token);
        HistoryCommentResponse response = userService.addComment(userId, historyId, body.get("content"));
        return ResponseEntity.ok(response);
    }

    //게시글 공유 카운트 상승
    @PostMapping("/history/{historyId}/share")
    public ResponseEntity<Void> increaseShare(@PathVariable Long historyId) {
        userService.increaseShareCount(historyId);
        return ResponseEntity.ok().build();
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
     * 팔로우 / 언팔로우 토글 API
     */
    @PostMapping("/follow/{targetUserId}")
    public ResponseEntity<?> toggleFollow(
            @CookieValue(value = "access_token") String accessToken,
            @PathVariable Long targetUserId) {
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