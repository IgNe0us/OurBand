package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.user.BandSimpleDTO;
import com.ourband.api.domain.dto.user.GearSimpleDTO;
import com.ourband.api.domain.dto.user.HistoryCommentResponse;
import com.ourband.api.domain.dto.user.HistoryRequest;
import com.ourband.api.domain.dto.user.HistoryResponse;
import com.ourband.api.domain.dto.user.MusicSimpleDTO;
import com.ourband.api.domain.dto.user.UserProfileResponseDTO;
import com.ourband.api.domain.dto.user.UserProfileUpdateRequestDTO;
import com.ourband.api.domain.dto.user.UserRequestDTO;
import com.ourband.api.domain.model.FavoriteMusic;
import com.ourband.api.domain.model.HistoryComment;
import com.ourband.api.domain.model.HistoryLike;
import com.ourband.api.domain.model.Profile;
import com.ourband.api.domain.model.User;
import com.ourband.api.domain.model.UserGear;
import com.ourband.api.domain.model.UserHistory;
import com.ourband.api.domain.model.UserHistoryMedia;
import com.ourband.api.domain.repository.FavoriteMusicRepository;
import com.ourband.api.domain.repository.FollowRepository;
import com.ourband.api.domain.repository.HistoryCommentRepository;
import com.ourband.api.domain.repository.HistoryLikeRepository;
import com.ourband.api.domain.repository.ProfileRepository;
import com.ourband.api.domain.repository.UserGearRepository;
import com.ourband.api.domain.repository.UserHistoryMediaRepository;
import com.ourband.api.domain.repository.UserHistoryRepository;
import com.ourband.api.domain.repository.UserRepository;
import com.ourband.api.infra.storage.R2StorageService;
import com.ourband.api.domain.repository.BandMemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    private final FollowRepository followRepository;
    private final FavoriteMusicRepository favoriteMusicRepository;
    private final UserGearRepository userGearRepository;
    private final UserHistoryRepository userHistoryRepository;
    private final BandMemberRepository bandMemberRepository;
    private final UserHistoryMediaRepository userHistoryMediaRepository;
    private final HistoryLikeRepository historyLikeRepository;
    private final HistoryCommentRepository historyCommentRepository;
    private final com.ourband.api.domain.repository.BandRepository bandRepository;

    private final R2StorageService r2StorageService; // 💡 주입 추가

    @Transactional
    public User registerUser(UserRequestDTO requestDTO) {
        // 1. 이메일 중복 검사
        if (userRepository.findByEmail(requestDTO.getEmail()).isPresent()) {
            // 없는 예외 클래스 대신 자바 표준 예외 사용
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + requestDTO.getEmail());
        }

        // 2. 비밀번호 암호화
        String hashedPassword = passwordEncoder.encode(requestDTO.getPassword());

        // 3. 사용자 엔티티 생성 및 저장 (Builder 필드명은 실제 User 엔티티에 맞게 수정 필요)
        User newUser = User.builder()
                .nickname(requestDTO.getNickname())
                .email(requestDTO.getEmail())
                .password(hashedPassword) // User 엔티티 필드가 password면 password로 변경!
                .type(requestDTO.getType())
                .businessNumber(requestDTO.getBusinessNumber())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(newUser);

        // 4. Profile 엔티티 생성 및 저장 (profile 테이블)
        Profile newProfile = Profile.builder()
                .user(savedUser) // 외래키 연결
                .instrument(requestDTO.getInstrument()) // 주 포지션 저장
                // bio, experienceLevel 등은 가입 시점이므로 null 처리됨
                .build();

        profileRepository.save(newProfile);

        log.info("성공적으로 새 사용자 등록: {}", savedUser.getNickname());
        return savedUser;
    }

    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // 💡 부사수가 빼먹은 필수 기능: ID로 유저 찾기!
    public Optional<User> findUserById(Long id) {
        return userRepository.findById(id);
    }

    @Transactional
    public Profile updateProfile(Long userId, UserProfileUpdateRequestDTO requestDTO) {
        // 1. 기존 프로필 정보 조회
        Profile existingProfile = profileRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("프로필을 찾을 수 없습니다."));

        // 2. DTO로 넘어온 새로운 값들로 덮어씌우기 (활동구역, 포지션, 설명)
        existingProfile.setLocation(requestDTO.getLocation());
        existingProfile.setInstrument(requestDTO.getInstrument());
        existingProfile.setBio(requestDTO.getBio());
        
        // @Transactional 덕분에 여기서 메서드가 끝나면 DB에 자동으로 Update 됨
        return existingProfile;
    }

    // 로그인
    public User login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));
                
        // 💡 equals 대신 matches를 써야 암호화된 비번이랑 비교가 됨!
        if (!passwordEncoder.matches(password, user.getPassword())) { 
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        
        return user;
    }

    // 유저 프로필 조회 완벽 채우기
    @Transactional(readOnly = true)
    public UserProfileResponseDTO getUserFullProfile(Long loginUserId, Long targetUserId) {
        
        // 1. 기본 정보 조회
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        Profile profile = profileRepository.findByUser_UserId(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("프로필 정보가 없습니다."));

        // 2. 각종 리스트 및 카운트 조회
        int followerCount = followRepository.countByFollowingId(targetUserId);
        int followingCount = followRepository.countByFollowerId(targetUserId);
        
        // [곡 목록] Entity -> DTO 변환
        List<MusicSimpleDTO> musics = favoriteMusicRepository.findByUserId(targetUserId).stream()
                .map(m -> new MusicSimpleDTO(m.getId(), m.getTitle()))
                .toList();

        // [기어 목록] Entity -> DTO 변환
        List<GearSimpleDTO> gears = userGearRepository.findByUserId(targetUserId).stream()
                .map(g -> new GearSimpleDTO(g.getId(), g.getGearName()))
                .toList();

        // [히스토리 목록] Entity -> DTO 변환
        List<HistoryResponse> histories = userHistoryRepository.findByUserIdOrderByCreatedAtDesc(targetUserId).stream()
                .map(h -> {
                    // 💡 getUrl(), getType() 대신 변경된 getMediaUrl(), getMediaType()을 사용합니다.
                    String firstMediaUrl = h.getMediaList().isEmpty() ? null : h.getMediaList().get(0).getMediaUrl();
                    String firstMediaType = h.getMediaList().isEmpty() ? null : h.getMediaList().get(0).getMediaType();

                    boolean likedByMe = historyLikeRepository.findByHistoryIdAndUserId(h.getId(), loginUserId).isPresent();

                    return new HistoryResponse(
                            h.getId(), 
                            h.getTitle(), 
                            h.getContent(), 
                            firstMediaUrl, 
                            firstMediaType,
                            h.getViewCount(),
                            h.getLikeCount(),
                            h.getCommentCount(),
                            h.getShareCount(),
                            likedByMe,
                            user.getNickname(),
                            profile.getProfilePictureUrl()
                    );
                })
                .toList();

        // [소속 밴드 목록] 한방 JPQL 쿼리로 DTO 리스트 즉시 가져오기
        List<BandSimpleDTO> bands = bandMemberRepository.findBandDetailsByUserId(targetUserId);
        int bandCount = bands.size(); // 소속된 밴드 개수 집계

        // 3. 하나의 거대한 DTO로 조립하여 반환
        return UserProfileResponseDTO.builder()
                .userId(user.getUserId())
                .nickname(user.getNickname())
                
                // profile 데이터 매핑
                .level(profile.getLevel())
                .potential(profile.getPotential() != null ? profile.getPotential() : java.math.BigDecimal.ZERO)
                .location(profile.getLocation())
                .instrument(profile.getInstrument())
                .bio(profile.getBio())
                .profilePictureUrl(profile.getProfilePictureUrl())
                .coverImageUrl(profile.getProfileBackgroundPictureUrl()) // DB의 배경화면 매핑
                
                // 카운트 매핑
                .followerCount(followerCount)
                .followingCount(followingCount)
                .bandCount(bandCount)
                
                // 리스트 매핑
                .favoriteMusics(musics)
                .histories(histories)
                .gears(gears)
                .bands(bands)
                .build();
    }

    // 유저 프로필 업데이트
    @Transactional
    public void updateProfileImage(Long userId, String imageUrl, String imageType) {
        Profile profile = profileRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("프로필을 찾을 수 없습니다."));

        if ("PROFILE".equals(imageType)) {
            profile.setProfilePictureUrl(imageUrl);
        } else if ("COVER".equals(imageType)) {
            profile.setProfileBackgroundPictureUrl(imageUrl);
        }
        // @Transactional에 의해 자동 저장
    }

    // 유저 프로필 좋아하는 곡 추가하기
    @Transactional
    public MusicSimpleDTO addFavoriteMusic(Long userId, String title) {
        User user = userRepository.findById(userId).orElseThrow();
        FavoriteMusic music = FavoriteMusic.builder()
                .title(title)
                .userId(user.getUserId())
                .build();
        FavoriteMusic savedMusic = favoriteMusicRepository.save(music);
        return new MusicSimpleDTO(savedMusic.getId(), savedMusic.getTitle());
    }

    // 유저 프로필 좋아하는 곡 삭제하기
    @Transactional
    public void deleteFavoriteMusic(Long userId, Long musicId) {
        // 유저 검증 후 삭제 (남의 곡을 지우는 것 방지)
        favoriteMusicRepository.deleteByIdAndUserId(musicId, userId);
    }

    // 유저 프로필 장비 추가하기
    @Transactional
    public GearSimpleDTO addGear(Long userId, String gearName) {
        User user = userRepository.findById(userId).orElseThrow();
        UserGear gear = UserGear.builder()
                .gearName(gearName)
                .userId(user.getUserId())
                .build();
        UserGear savedMusic = userGearRepository.save(gear);
        return new GearSimpleDTO(savedMusic.getId(), savedMusic.getGearName());
    }

    // 유저 프로필 장비 삭제하기
    @Transactional
    public void deleteGear(Long userId, Long gearId) {
        // 유저 검증 후 삭제 (남의 곡을 지우는 것 방지)
        userGearRepository.deleteByIdAndUserId(gearId, userId);
    }

    // 히스토리 글 작성
    @Transactional
    public HistoryResponse addHistory(Long userId, HistoryRequest request) {
        
        // 1. History 엔티티 생성 및 저장
        UserHistory history = UserHistory.builder()
                .userId(userId)
                .title(request.getTitle())
                .content(request.getContent())
                .viewCount(0)     // 💡 Builder 사용 시 기본값 누락 방지
                .likeCount(0)
                .commentCount(0)
                .shareCount(0)
                .build();
                
        UserHistory savedHistory = userHistoryRepository.save(history);

        // 2. Media 엔티티 생성 및 저장 (첨부파일이 있을 경우)
        if (request.getMediaUrl() != null && !request.getMediaUrl().isEmpty()) {
            UserHistoryMedia media = UserHistoryMedia.builder()
                    .historyId(savedHistory.getId()) // 외래키 연결
                    .mediaUrl(request.getMediaUrl())
                    .mediaType(request.getMediaType())
                    .sortOrder(1) // 첫 번째 미디어이므로 1
                    .build();
            userHistoryMediaRepository.save(media);
        }

        // 💡3. 새로 보완된 부분: 생성자에 채워줄 내(작성자) 정보 조회
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
    Profile profile = profileRepository.findByUser_UserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("프로필 정보가 없습니다."));

        // 3. 응답용 DTO(HistorySimpleDTO) 생성하여 반환
        return new HistoryResponse(
                savedHistory.getId(),
                savedHistory.getTitle(),
                savedHistory.getContent(),
                request.getMediaUrl(),
                request.getMediaType(),
                0,0,0,0,
                false,
                user.getNickname(),
                profile.getProfilePictureUrl()
        );
    }


    //유저 히스토리 글 삭제
    @Transactional
    public void deleteHistory(Long userId, Long historyId) {
        // 1. 대상 히스토리 조회 및 검증
        UserHistory history = userHistoryRepository.findById(historyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 히스토리입니다."));

        // 2. 권한 검증 (본인 글만 삭제 가능)
        if (!history.getUserId().equals(userId)) {
            throw new IllegalStateException("해당 히스토리를 삭제할 권한이 없습니다.");
        }

        // 3. 연관된 미디어 파일들을 R2 스토리지에서 먼저 청소
        List<UserHistoryMedia> mediaList = userHistoryMediaRepository.findByHistoryIdOrderBySortOrderAsc(historyId);
        for (UserHistoryMedia media : mediaList) {
            String url = media.getMediaUrl();
            if (url != null && !url.isEmpty()) {
                try {
                    // URL에서 순수 Object Key만 추출 (예: https://r2.dev/histories/video_1.mp4 -> histories/video_1.mp4)
                    String objectKey = extractObjectKey(url);
                    r2StorageService.deleteFile(objectKey);
                } catch (Exception e) {
                    // 파일 삭제 실패가 DB 롤백까지 유도하지 않도록 예외 차단 및 로깅만 수행
                    log.error("Cloudflare R2 물리 파일 삭제 실패 [URL: {}]", url, e);
                }
            }
        }

        // 4. DB 테이블 관계 데이터 완전 삭제
        userHistoryMediaRepository.deleteByHistoryId(historyId); // 미디어 매핑 데이터 삭제
        userHistoryRepository.delete(history);                   // 히스토리 본문 데이터 삭제
    }

    /**
     * 💡 전체 URL 주소에서 도메인을 제외한 R2 Object Key 값을 발라냅니다.
     */
    private String extractObjectKey(String mediaUrl) {
        java.net.URI uri = java.net.URI.create(mediaUrl);
        String path = uri.getPath();
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        return path;
    }


    // 1. 좋아요 토글 시스템 (진짜 DB 데이터 기반 제어)
    @Transactional
    public int toggleLike(Long userId, Long historyId) {
        UserHistory history = userHistoryRepository.findById(historyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));

        Optional<HistoryLike> alreadyLike = historyLikeRepository.findByHistoryIdAndUserId(historyId, userId);

        if (alreadyLike.isPresent()) {
            // 이미 좋아요를 누른 상태 -> 좋아요 취소
            historyLikeRepository.delete(alreadyLike.get());
            history.decreaseLikeCount(); // 엔티티 내에 likeCount-- 메서드 실행
        } else {
            // 좋아요를 누르지 않은 상태 -> 좋아요 생성
            HistoryLike newLike = HistoryLike.builder()
                    .historyId(historyId)
                    .userId(userId)
                    .build();
            historyLikeRepository.save(newLike);
            history.increaseLikeCount(); // 엔티티 내에 likeCount++ 메서드 실행
        }
        
        return history.getLikeCount(); // 변경된 최종 좋아요 수 반환
    }

    // 2. 댓글 작성
    @Transactional
    public HistoryCommentResponse addComment(Long userId, Long historyId, String content) {
        UserHistory history = userHistoryRepository.findById(historyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));
        
        User user = userRepository.findById(userId).orElseThrow();

        Profile profile = profileRepository.findByUser_UserId(userId).orElseThrow();

        // 댓글 저장
        HistoryComment comment = HistoryComment.builder()
                .historyId(historyId)
                .userId(userId)
                .content(content)
                .parentId(null) // 기본 댓글은 null 처리
                .build();
        HistoryComment savedComment = historyCommentRepository.save(comment);

        // 메인 게시글 댓글 카운트 증가
        history.increaseCommentCount(); 

        return new HistoryCommentResponse(
                savedComment.getId(),
                userId,
                user.getNickname(), // 유저 테이블에서 가져온 실제 닉네임 매핑
                profile.getProfilePictureUrl(),
                savedComment.getContent(),
                savedComment.getCreatedAt()
        );
    }

    // 3. 특정 히스토리의 댓글 목록 조회
    @Transactional(readOnly = true)
    public List<HistoryCommentResponse> getComments(Long historyId) {
        List<HistoryComment> comments = historyCommentRepository.findByHistoryIdOrderByCreatedAtDesc(historyId);
        
        return comments.stream().map(c -> {
            // 각각의 댓글을 순회하며 user_id로 닉네임 매핑
            String nickname = userRepository.findById(c.getUserId())
                    .map(User::getNickname)
                    .orElse("알 수 없는 사용자");

                    // 💡 댓글 작성자(c.getUserId())의 프로필 이미지 실시간 조회
        String profilePic = profileRepository.findByUser_UserId(c.getUserId())
                .map(Profile::getProfilePictureUrl)
                .orElse(null); // 프로필 사진이 없으면 null

            return new HistoryCommentResponse(c.getId(), c.getUserId(), nickname, profilePic, c.getContent(), c.getCreatedAt());
        }).toList();
    }

    // 4. 게시글 공유 시 카운트 증가
    @Transactional
    public void increaseShareCount(Long historyId) {
        UserHistory history = userHistoryRepository.findById(historyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 히스토리입니다."));
                
        history.increaseShareCount(); // 엔티티 내부의 수량 증가 메서드 호출
        // @Transactional 덕분에 함수가 끝나면 DB에 자동으로 update 쿼리가 날아갑니다.
    }

    // ========================================
    // 💡 팔로워 / 팔로잉 목록 조회 기능
    // ========================================

    /**
     * 나를 팔로우하는 사람 목록 (팔로워 리스트)
     * @param loginUserId 현재 로그인한 유저 ID (isFollowing 판별용)
     * @param targetUserId 조회 대상 유저 ID
     */
    @Transactional(readOnly = true)
    public List<com.ourband.api.domain.dto.user.FollowUserDTO> getFollowers(Long loginUserId, Long targetUserId) {
        // 나를 팔로우하는 사람들의 Follow 레코드 조회
        List<com.ourband.api.domain.model.Follow> followerRecords = followRepository.findByFollowingId(targetUserId);

        return followerRecords.stream().map(follow -> {
            Long userId = follow.getFollowerId(); // 팔로우하는 사람의 ID
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return null;

            Profile profile = profileRepository.findByUser_UserId(userId).orElse(null);

            // 내(loginUser)가 이 사람을 팔로우하고 있는지 확인
            boolean isFollowing = followRepository.findByFollowerIdAndFollowingId(loginUserId, userId).isPresent();

            return com.ourband.api.domain.dto.user.FollowUserDTO.builder()
                    .userId(user.getUserId())
                    .nickname(user.getNickname())
                    .profilePictureUrl(profile != null ? profile.getProfilePictureUrl() : null)
                    .bio(profile != null ? profile.getBio() : null)
                    .instrument(profile != null ? profile.getInstrument() : null)
                    .isFollowing(isFollowing)
                    .build();
        }).filter(dto -> dto != null).toList();
    }

    /**
     * 내가 팔로우하는 사람 목록 (팔로잉 리스트)
     * @param loginUserId 현재 로그인한 유저 ID (isFollowing 판별용)
     * @param targetUserId 조회 대상 유저 ID
     */
    @Transactional(readOnly = true)
    public List<com.ourband.api.domain.dto.user.FollowUserDTO> getFollowings(Long loginUserId, Long targetUserId) {
        // 내가 팔로우하는 사람들의 Follow 레코드 조회
        List<com.ourband.api.domain.model.Follow> followingRecords = followRepository.findByFollowerId(targetUserId);

        return followingRecords.stream().map(follow -> {
            Long userId = follow.getFollowingId(); // 팔로우 대상의 ID
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return null;

            Profile profile = profileRepository.findByUser_UserId(userId).orElse(null);

            // 내(loginUser)가 이 사람을 팔로우하고 있는지 확인
            boolean isFollowing = followRepository.findByFollowerIdAndFollowingId(loginUserId, userId).isPresent();

            return com.ourband.api.domain.dto.user.FollowUserDTO.builder()
                    .userId(user.getUserId())
                    .nickname(user.getNickname())
                    .profilePictureUrl(profile != null ? profile.getProfilePictureUrl() : null)
                    .bio(profile != null ? profile.getBio() : null)
                    .instrument(profile != null ? profile.getInstrument() : null)
                    .isFollowing(isFollowing)
                    .build();
        }).filter(dto -> dto != null).toList();
    }

    // ========================================
    // 💡 팔로우 / 언팔로우 토글 기능
    // ========================================

    /**
     * 팔로우 토글 (팔로우 중이면 언팔로우, 아니면 팔로우)
     * @param loginUserId 현재 로그인한 유저 ID (팔로우를 하는 사람)
     * @param targetUserId 팔로우 대상 유저 ID (팔로우를 받는 사람)
     * @return true: 팔로우됨, false: 언팔로우됨
     */
    @Transactional
    public boolean toggleFollow(Long loginUserId, Long targetUserId) {
        if (loginUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("자기 자신을 팔로우할 수 없습니다.");
        }

        Optional<com.ourband.api.domain.model.Follow> existing = followRepository.findByFollowerIdAndFollowingId(loginUserId, targetUserId);

        if (existing.isPresent()) {
            // 이미 팔로우 중 → 언팔로우
            followRepository.delete(existing.get());
            return false;
        } else {
            // 팔로우하지 않은 상태 → 팔로우
            com.ourband.api.domain.model.Follow newFollow = com.ourband.api.domain.model.Follow.builder()
                    .followerId(loginUserId)
                    .followingId(targetUserId)
                    .build();
            followRepository.save(newFollow);
            return true;
        }
    }

    // ========================================
    // 💡 밴드 창설 기능
    // ========================================

    /**
     * 밴드 창설 - bands 테이블에 밴드 생성 + band_members에 창설자 자동 등록
     */
    @Transactional
    public BandSimpleDTO createBand(Long userId, com.ourband.api.domain.dto.user.BandCreateRequestDTO request) {
        // 1. 창설자의 포지션(악기) 정보 조회
        Profile profile = profileRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("프로필 정보가 없습니다."));

        // 2. Band 엔티티 생성 및 저장
        com.ourband.api.domain.model.Bands band = com.ourband.api.domain.model.Bands.builder()
                .name(request.getName())
                .location(request.getLocation())
                .genre(request.getGenre())
                .description(request.getDescription())
                .logoImageUrl(request.getLogoImageUrl())
                .build();
        com.ourband.api.domain.model.Bands savedBand = bandRepository.save(band);

        // 3. 창설자를 band_members에 자동 등록 (role = 프로필의 instrument, status = JOINED)
        String role = profile.getInstrument() != null ? profile.getInstrument() : "member";
        com.ourband.api.domain.model.BandMember member = com.ourband.api.domain.model.BandMember.builder()
                .bandId(savedBand.getId())
                .userId(userId)
                .role(role)
                .status("JOINED")
                .build();
        bandMemberRepository.save(member);

        // 4. 응답 DTO 반환
        return new BandSimpleDTO(
                savedBand.getId(),
                savedBand.getName(),
                role,
                savedBand.getLogoImageUrl(),
                savedBand.getCreatedAt()
        );
    }

}