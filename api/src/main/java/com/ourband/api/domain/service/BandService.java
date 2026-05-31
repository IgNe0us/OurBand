package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.user.*;
import com.ourband.api.domain.model.BandMember;
import com.ourband.api.domain.model.BandPost;
import com.ourband.api.domain.model.Bands;
import com.ourband.api.domain.model.User;
import com.ourband.api.domain.repository.BandMemberRepository;
import com.ourband.api.domain.repository.BandPostRepository;
import com.ourband.api.domain.repository.BandRepository;
import com.ourband.api.domain.repository.UserRepository;
import com.ourband.api.domain.repository.ProfileRepository;
import com.ourband.api.domain.model.Profile;
import com.ourband.api.domain.model.BandPolls;
import com.ourband.api.domain.model.BandPollOptions;
import com.ourband.api.domain.model.BandPollVotes;
import com.ourband.api.domain.repository.BandPollRepository;
import com.ourband.api.domain.repository.BandPollOptionRepository;
import com.ourband.api.domain.repository.BandPollVoteRepository;
import com.ourband.api.domain.repository.BandApplicationRepository;
import com.ourband.api.domain.model.BandFollow;
import com.ourband.api.domain.repository.BandFollowRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BandService {

    private final BandRepository bandRepository;
    private final BandMemberRepository bandMemberRepository;
    private final UserRepository userRepository;
    private final BandPostRepository bandPostRepository;
    private final ProfileRepository profileRepository;
    private final com.ourband.api.domain.repository.BandPostLikeRepository bandPostLikeRepository;
    private final com.ourband.api.domain.repository.BandPostCommentRepository bandPostCommentRepository;
    private final BandPollRepository bandPollRepository;
    private final BandPollOptionRepository bandPollOptionRepository;
    private final BandPollVoteRepository bandPollVoteRepository;
    private final BandApplicationRepository bandApplicationRepository;
    private final BandFollowRepository bandFollowRepository;
    private final LikeViewCacheService likeViewCacheService;
    private final NotificationService notificationService;

    /**
     * 밴드 상세 정보 및 포지션 멤버 조회
     */
    public BandProfileResponseDTO getBandProfile(Long bandId, Long currentUserId) {
        Bands band = bandRepository.findById(bandId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 밴드입니다."));

        List<BandMember> members = bandMemberRepository.findByBandId(bandId);

        // 💡 방장 판단 기준: 첫 번째 멤버 (또는 최저 ID 멤버)
        boolean isLeader = false;
        if (!members.isEmpty()) {
            BandMember leader = members.get(0);
            if (leader.getUserId() != null && leader.getUserId().equals(currentUserId)) {
                isLeader = true;
            }
        }

        List<BandPositionDTO> positions = new ArrayList<>();
        for (BandMember member : members) {
            String memberName = "";
            String profileImageUrl = null;
            boolean isRecruiting = member.getUserId() == null;

            if (!isRecruiting) {
                User user = userRepository.findById(member.getUserId()).orElse(null);
                if (user != null) {
                    memberName = user.getNickname();
                    Profile profile = profileRepository.findByUser_UserId(user.getUserId()).orElse(null);
                    if (profile != null) {
                        profileImageUrl = profile.getProfilePictureUrl();
                    }
                }
            }

            positions.add(BandPositionDTO.builder()
                    .id(member.getId())
                    .role(member.getRole())
                    .memberName(memberName)
                    .isRecruiting(isRecruiting)
                    .userId(member.getUserId())
                    .profileImageUrl(profileImageUrl)
                    .build());
        }

        return BandProfileResponseDTO.builder()
                .id(band.getId())
                .name(band.getName())
                .genre(band.getGenre())
                .location(band.getLocation())
                .frequency(band.getMeetingSchedule())
                .description(band.getDescription())
                .coverImage(band.getCoverImageUrl())
                .logoImage(band.getLogoImageUrl())
                .historyJson(band.getHistoryJson())
                .positions(positions)
                .isLeader(isLeader)
                .build();
    }

    /**
     * 밴드 프로필, 멤버 포지션 및 연혁 정보 업데이트
     */
    @Transactional
    public BandProfileResponseDTO updateBandProfile(Long bandId, Long currentUserId, BandProfileUpdateRequestDTO request) {
        Bands band = bandRepository.findById(bandId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 밴드입니다."));

        List<BandMember> members = bandMemberRepository.findByBandId(bandId);
        if (members.isEmpty()) {
            throw new IllegalArgumentException("밴드 멤버 정보가 없습니다.");
        }

        // 방장 권한 체크 (최저 ID 멤버)
        BandMember leader = members.stream()
                .min(java.util.Comparator.comparing(BandMember::getId))
                .orElse(members.get(0));
        if (leader.getUserId() == null || !leader.getUserId().equals(currentUserId)) {
            throw new IllegalArgumentException("방장만 프로필을 관리할 수 있습니다.");
        }

        // 1. 밴드 기본 프로필 업데이트
        band.updateProfile(
                request.getName(),
                request.getDescription(),
                request.getGenre(),
                request.getFrequency(),
                request.getLocation(),
                request.getLogoImage(),
                request.getCoverImage(),
                request.getHistoryJson()
        );
        bandRepository.save(band);

        // 2. 멤버 포지션 동기화 (기존 포지션과 매핑)
        List<BandPositionUpdateDTO> requestPositions = request.getPositions();
        if (requestPositions != null) {
            // 요청된 포지션들의 ID 목록
            List<Long> requestIds = requestPositions.stream()
                    .map(BandPositionUpdateDTO::getId)
                    .filter(id -> id != null)
                    .collect(Collectors.toList());

            // 삭제할 포지션 제거 (단, 방장 포지션은 절대 제거 불가)
            for (BandMember member : members) {
                if (!member.getId().equals(leader.getId()) && !requestIds.contains(member.getId())) {
                    bandMemberRepository.delete(member);
                }
            }

            // 추가 및 수정 처리
            for (BandPositionUpdateDTO posUpdate : requestPositions) {
                if (posUpdate.getId() != null) {
                    // 기존 포지션 수정
                    Optional<BandMember> existingOpt = bandMemberRepository.findById(posUpdate.getId());
                    if (existingOpt.isPresent()) {
                        BandMember existing = existingOpt.get();
                        
                        // 방장 본인의 ID는 수정 불가
                        if (existing.getId().equals(leader.getId())) {
                            // 방장도 포지션 역할명(role)은 변경 가능
                            BandMember updatedLeader = BandMember.builder()
                                    .id(existing.getId())
                                    .bandId(existing.getBandId())
                                    .userId(existing.getUserId())
                                    .role(posUpdate.getRole())
                                    .status(existing.getStatus())
                                    .build();
                            bandMemberRepository.save(updatedLeader);
                            continue;
                        }

                        Long targetUserId = null;
                        if (!posUpdate.isRecruiting() && posUpdate.getMemberName() != null && !posUpdate.getMemberName().trim().isEmpty()) {
                            User user = userRepository.findByNickname(posUpdate.getMemberName()).orElse(null);
                            if (user != null) {
                                targetUserId = user.getUserId();
                            }
                        }

                        BandMember updated = BandMember.builder()
                                .id(existing.getId())
                                .bandId(existing.getBandId())
                                .userId(targetUserId)
                                .role(posUpdate.getRole())
                                .status(existing.getStatus())
                                .build();
                        bandMemberRepository.save(updated);
                    }
                } else {
                    // 신규 포지션 추가
                    Long targetUserId = null;
                    if (!posUpdate.isRecruiting() && posUpdate.getMemberName() != null && !posUpdate.getMemberName().trim().isEmpty()) {
                        User user = userRepository.findByNickname(posUpdate.getMemberName()).orElse(null);
                        if (user != null) {
                            targetUserId = user.getUserId();
                        }
                    }

                    BandMember newMember = BandMember.builder()
                            .bandId(bandId)
                            .userId(targetUserId)
                            .role(posUpdate.getRole())
                            .status("JOINED")
                            .build();
                    bandMemberRepository.save(newMember);
                }
            }
        }

        return getBandProfile(bandId, currentUserId);
    }

    // ========================================
    // 💡 밴드 게시글 CRUD (공지, 자유, 일정, 합주)
    // ========================================

    /**
     * 밴드 카테고리(boardType)별 게시글 목록 조회
     */
    public List<BandPostResponseDTO> getBandPosts(Long bandId, String boardType) {
        List<BandPost> posts;
        if (boardType == null || boardType.trim().isEmpty() || boardType.equalsIgnoreCase("전체")) {
            posts = bandPostRepository.findByBandIdOrderByCreatedAtDesc(bandId);
        } else {
            String upper = boardType.toUpperCase();
            List<String> types = new java.util.ArrayList<>();
            types.add(upper);
            if (upper.equals("FREE")) types.add("자유게시판");
            if (upper.equals("NOTICE")) types.add("공지사항");
            if (upper.equals("SCHEDULE")) { types.add("합주 일정"); types.add("일정"); }
            if (upper.equals("REHEARSAL")) { types.add("합주"); types.add("합주 영상"); }
            
            posts = bandPostRepository.findByBandIdAndBoardTypeInOrderByCreatedAtDesc(bandId, types);
        }

        List<BandMember> members = bandMemberRepository.findByBandId(bandId);
        Long leaderUserId = null;
        if (!members.isEmpty()) {
            BandMember leader = members.stream()
                    .min(java.util.Comparator.comparing(BandMember::getId))
                    .orElse(members.get(0));
            leaderUserId = leader.getUserId();
        }

        List<BandPostResponseDTO> result = new ArrayList<>();
        for (BandPost post : posts) {
            User author = userRepository.findById(post.getAuthorId()).orElse(null);
            String authorName = author != null ? author.getNickname() : "알 수 없음";

            // 작성자의 밴드 내 역할 산출
            String authorRole = "멤버";
            if (post.getAuthorId().equals(leaderUserId)) {
                authorRole = "방장";
            } else {
                for (BandMember m : members) {
                    if (m.getUserId() != null && m.getUserId().equals(post.getAuthorId())) {
                        authorRole = m.getRole();
                        break;
                    }
                }
            }

            PollResponseDTO pollResponse = null;
            Optional<BandPolls> pollOpt = bandPollRepository.findByPostId(post.getId());
            if (pollOpt.isPresent()) {
                BandPolls poll = pollOpt.get();
                pollResponse = PollResponseDTO.builder()
                        .id(poll.getId())
                        .title(poll.getTitle())
                        .build();
            }

            result.add(BandPostResponseDTO.builder()
                    .id(post.getId())
                    .bandId(post.getBandId())
                    .authorId(post.getAuthorId())
                    .authorName(authorName)
                    .authorRole(authorRole)
                    .boardType(post.getBoardType())
                    .category(post.getCategory())
                    .title(post.getTitle())
                    .content(post.getContent())
                    .mediaUrl(post.getMediaUrl())
                    .mediaType(post.getMediaType())
                    .scheduleDate(post.getScheduleDate())
                    .scheduleDetails(post.getScheduleDetails())
                    .createdAt(post.getCreatedAt())
                    .likeCount(likeViewCacheService.getCachedLikeCount("band", post.getId(), post.getLikeCount()))
                    .commentCount(post.getCommentCount())
                    .poll(pollResponse)
                    .build());
        }

        return result;
    }

    /**
     * 밴드 게시글 상세 조회
     */
    @Transactional(readOnly = true)
    public BandPostResponseDTO getBandPost(Long postId, Long currentUserId) {
        BandPost post = bandPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));

        List<BandMember> members = bandMemberRepository.findByBandId(post.getBandId());
        Long leaderUserId = null;
        if (!members.isEmpty()) {
            BandMember leader = members.stream()
                    .min(java.util.Comparator.comparing(BandMember::getId))
                    .orElse(members.get(0));
            leaderUserId = leader.getUserId();
        }

        User author = userRepository.findById(post.getAuthorId()).orElse(null);
        String authorName = author != null ? author.getNickname() : "알 수 없음";
        
        String authorProfileImageUrl = null;
        if (author != null) {
            Profile profile = profileRepository.findByUser_UserId(author.getUserId()).orElse(null);
            if (profile != null) {
                authorProfileImageUrl = profile.getProfilePictureUrl();
            }
        }

        String authorRole = "멤버";
        if (post.getAuthorId().equals(leaderUserId)) {
            authorRole = "방장";
        } else {
            for (BandMember m : members) {
                if (m.getUserId() != null && m.getUserId().equals(post.getAuthorId())) {
                    authorRole = m.getRole();
                    break;
                }
            }
        }
        
        boolean isLikedByCurrentUser = false;
        if (currentUserId != null) {
            isLikedByCurrentUser = likeViewCacheService.isLiked("band", postId, currentUserId,
                    bandPostLikeRepository.existsByPostIdAndUserId(postId, currentUserId));
        }
        
        List<com.ourband.api.domain.model.BandPostComment> topLevelComments = bandPostCommentRepository.findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(postId);
        List<BandPostCommentResponseDTO> comments = topLevelComments.stream()
                .map(this::mapCommentToDTO)
                .toList();

        // 투표 조회 - DB에 poll_id가 votes에 없으므로 option을 통해 조회
        PollResponseDTO pollResponse = null;
        Optional<BandPolls> pollOpt = bandPollRepository.findByPostId(postId);
        if (pollOpt.isPresent()) {
            BandPolls poll = pollOpt.get();
            List<BandPollOptions> options = bandPollOptionRepository.findByPollIdOrderBySortOrderAsc(poll.getId());
            
            // option ID 목록으로 votes 조회
            List<Long> optionIds = options.stream().map(BandPollOptions::getId).collect(Collectors.toList());
            List<BandPollVotes> votes = optionIds.isEmpty() ? new ArrayList<>() : bandPollVoteRepository.findByPollOptionIdIn(optionIds);
            
            Long myVotedOptionId = null;
            if (currentUserId != null) {
                myVotedOptionId = votes.stream()
                        .filter(v -> v.getUserId().equals(currentUserId))
                        .map(BandPollVotes::getPollOptionId)
                        .findFirst().orElse(null);
            }
            
            List<PollOptionResponseDTO> optionDTOs = options.stream().map(opt -> {
                long count = votes.stream().filter(v -> v.getPollOptionId().equals(opt.getId())).count();
                return PollOptionResponseDTO.builder()
                        .id(opt.getId())
                        .content(opt.getContent())
                        .voteCount(count)
                        .build();
            }).toList();
            
            pollResponse = PollResponseDTO.builder()
                    .id(poll.getId())
                    .title(poll.getTitle())
                    .isMultipleChoice(poll.getIsMultipleChoice())
                    .options(optionDTOs)
                    .totalVotes((long) votes.size())
                    .myVotedOptionId(myVotedOptionId)
                    .build();
        }

        return BandPostResponseDTO.builder()
                .id(post.getId())
                .bandId(post.getBandId())
                .authorId(post.getAuthorId())
                .authorName(authorName)
                .authorProfileImageUrl(authorProfileImageUrl)
                .authorRole(authorRole)
                .boardType(post.getBoardType())
                .category(post.getCategory())
                .title(post.getTitle())
                .content(post.getContent())
                .mediaUrl(post.getMediaUrl())
                .mediaType(post.getMediaType())
                .scheduleDate(post.getScheduleDate())
                .scheduleDetails(post.getScheduleDetails())
                .createdAt(post.getCreatedAt())
                .likeCount(likeViewCacheService.getCachedLikeCount("band", post.getId(), post.getLikeCount()))
                .commentCount(post.getCommentCount())
                .isLikedByCurrentUser(isLikedByCurrentUser)
                .comments(comments)
                .poll(pollResponse)
                .build();
    }

    /**
     * 밴드 게시글 생성
     */
    @Transactional
    public BandPostResponseDTO createBandPost(Long bandId, Long authorId, BandPostCreateRequestDTO request) {
        BandPost post = BandPost.builder()
                .bandId(bandId)
                .authorId(authorId)
                .boardType(request.getBoardType().toUpperCase())
                .category(request.getCategory())
                .title(request.getTitle())
                .content(request.getContent())
                .mediaUrl(request.getMediaUrl())
                .mediaType(request.getMediaType())
                .scheduleDate(request.getScheduleDate())
                .scheduleDetails(request.getScheduleDetails())
                .build();

        BandPost savedPost = bandPostRepository.save(post);
        
        // 투표 생성 로직
        if (request.getPoll() != null && request.getPoll().getTitle() != null && !request.getPoll().getTitle().isEmpty()) {
            BandPolls poll = BandPolls.builder()
                    .postId(savedPost.getId())
                    .title(request.getPoll().getTitle())
                    .isMultipleChoice(request.getPoll().getIsMultipleChoice() != null ? request.getPoll().getIsMultipleChoice() : false)
                    .build();
            BandPolls savedPoll = bandPollRepository.save(poll);
            
            if (request.getPoll().getOptions() != null && !request.getPoll().getOptions().isEmpty()) {
                int sortOrder = 0;
                for (String optionContent : request.getPoll().getOptions()) {
                    bandPollOptionRepository.save(BandPollOptions.builder()
                            .pollId(savedPoll.getId())
                            .content(optionContent)
                            .sortOrder(sortOrder++)
                            .build());
                }
            }
        }
        
        // 💡 생성된 게시글을 Response DTO 포맷에 맞춰 리턴
        List<BandMember> members = bandMemberRepository.findByBandId(bandId);
        Long leaderUserId = null;
        if (!members.isEmpty()) {
            BandMember leader = members.stream()
                    .min(java.util.Comparator.comparing(BandMember::getId))
                    .orElse(members.get(0));
            leaderUserId = leader.getUserId();
        }
        User author = userRepository.findById(authorId).orElse(null);
        String authorName = author != null ? author.getNickname() : "알 수 없음";
        
        String authorRole = "멤버";
        if (authorId.equals(leaderUserId)) {
            authorRole = "방장";
        } else {
            for (BandMember m : members) {
                if (m.getUserId() != null && m.getUserId().equals(authorId)) {
                    authorRole = m.getRole();
                    break;
                }
            }
        }

        return BandPostResponseDTO.builder()
                .id(savedPost.getId())
                .bandId(savedPost.getBandId())
                .authorId(savedPost.getAuthorId())
                .authorName(authorName)
                .authorRole(authorRole)
                .boardType(savedPost.getBoardType())
                .category(savedPost.getCategory())
                .title(savedPost.getTitle())
                .content(savedPost.getContent())
                .mediaUrl(savedPost.getMediaUrl())
                .mediaType(savedPost.getMediaType())
                .scheduleDate(savedPost.getScheduleDate())
                .scheduleDetails(savedPost.getScheduleDetails())
                .createdAt(savedPost.getCreatedAt())
                .build();
    }

    /**
     * 밴드 게시글 삭제
     */
    @Transactional
    public void deleteBandPost(Long bandId, Long postId, Long currentUserId) {
        BandPost post = bandPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));

        if (!post.getBandId().equals(bandId)) {
            throw new IllegalArgumentException("해당 밴드의 게시글이 아닙니다.");
        }

        // 방장 여부 조회
        List<BandMember> members = bandMemberRepository.findByBandId(bandId);
        boolean isLeader = false;
        if (!members.isEmpty()) {
            BandMember leader = members.stream()
                    .min(java.util.Comparator.comparing(BandMember::getId))
                    .orElse(members.get(0));
            if (leader.getUserId() != null && leader.getUserId().equals(currentUserId)) {
                isLeader = true;
            }
        }

        // 작성자 본인 또는 방장만 삭제 가능
        if (!post.getAuthorId().equals(currentUserId) && !isLeader) {
            throw new IllegalArgumentException("삭제 권한이 없습니다.");
        }

        // 투표 관련 데이터 삭제
        bandPollRepository.findByPostId(postId).ifPresent(poll -> {
            List<BandPollOptions> options = bandPollOptionRepository.findByPollId(poll.getId());
            List<Long> optionIds = options.stream().map(BandPollOptions::getId).collect(Collectors.toList());
            if (!optionIds.isEmpty()) {
                bandPollVoteRepository.deleteByPollOptionIdIn(optionIds);
            }
            bandPollOptionRepository.deleteByPollId(poll.getId());
            bandPollRepository.delete(poll);
        });

        // 연관 데이터 삭제
        bandPostLikeRepository.deleteAllByPostId(postId);
        bandPostCommentRepository.deleteAllByPostId(postId);
        bandPostRepository.delete(post);
    }

    /**
     * 밴드 게시글 수정
     */
    @Transactional
    public BandPostResponseDTO updateBandPost(Long bandId, Long postId, Long currentUserId, BandPostCreateRequestDTO request) {
        BandPost post = bandPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));

        if (!post.getBandId().equals(bandId)) {
            throw new IllegalArgumentException("해당 밴드의 게시글이 아닙니다.");
        }

        if (!post.getAuthorId().equals(currentUserId)) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        post.setBoardType(request.getBoardType().toUpperCase());
        post.setCategory(request.getCategory());
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        if (request.getMediaUrl() != null) {
            post.setMediaUrl(request.getMediaUrl().isEmpty() ? null : request.getMediaUrl());
            post.setMediaType(request.getMediaType() == null || request.getMediaType().isEmpty() ? null : request.getMediaType());
        }
        if (request.getScheduleDate() != null) post.setScheduleDate(request.getScheduleDate());

        boolean[] keepExistingPoll = {false};

        // 기존 투표 삭제 또는 유지
        bandPollRepository.findByPostId(postId).ifPresent(poll -> {
            List<BandPollOptions> options = bandPollOptionRepository.findByPollId(poll.getId());
            List<Long> optionIds = options.stream().map(BandPollOptions::getId).collect(Collectors.toList());
            
            boolean hasVotes = false;
            if (!optionIds.isEmpty()) {
                List<BandPollVotes> votes = bandPollVoteRepository.findByPollOptionIdIn(optionIds);
                if (votes != null && !votes.isEmpty()) {
                    hasVotes = true;
                }
            }
            
            if (hasVotes) {
                // 이미 투표가 진행 중이므로 기존 투표를 유지
                keepExistingPoll[0] = true;
            } else {
                // 투표가 진행되지 않았으므로 삭제
                if (!optionIds.isEmpty()) {
                    bandPollVoteRepository.deleteByPollOptionIdIn(optionIds);
                }
                bandPollOptionRepository.deleteByPollId(poll.getId());
                bandPollRepository.delete(poll);
            }
        });

        // 새 투표 생성
        if (!keepExistingPoll[0] && request.getPoll() != null && request.getPoll().getTitle() != null && !request.getPoll().getTitle().isEmpty()) {
            BandPolls poll = BandPolls.builder()
                    .postId(postId)
                    .title(request.getPoll().getTitle())
                    .isMultipleChoice(request.getPoll().getIsMultipleChoice() != null ? request.getPoll().getIsMultipleChoice() : false)
                    .build();
            BandPolls savedPoll = bandPollRepository.save(poll);
            
            if (request.getPoll().getOptions() != null && !request.getPoll().getOptions().isEmpty()) {
                int sortOrder = 0;
                for (String optionContent : request.getPoll().getOptions()) {
                    bandPollOptionRepository.save(BandPollOptions.builder()
                            .pollId(savedPoll.getId())
                            .content(optionContent)
                            .sortOrder(sortOrder++)
                            .build());
                }
            }
        }

        return getBandPost(postId, currentUserId);
    }

    /**
     * 좋아요 토글
     */
    @Transactional
    public boolean toggleLike(Long postId, Long currentUserId) {
        BandPost post = bandPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));
        
        boolean currentDbStatus = bandPostLikeRepository.existsByPostIdAndUserId(postId, currentUserId);
        
        boolean isNowLiked = likeViewCacheService.toggleLike("band", postId, currentUserId, currentDbStatus);
        
        if (isNowLiked && !post.getAuthorId().equals(currentUserId)) {
            User liker = userRepository.findById(currentUserId).orElse(null);
            String likerName = liker != null ? liker.getNickname() : "누군가";
            notificationService.send(
                    post.getAuthorId(),
                    currentUserId,
                    com.ourband.api.domain.model.NotificationType.POST_LIKE,
                    postId.toString(),
                    likerName + "님이 회원님의 밴드 게시글에 좋아요를 눌렀습니다."
            );
        }
        
        return isNowLiked;
    }

    /**
     * 댓글 생성
     */
    @Transactional
    public BandPostCommentResponseDTO createComment(Long postId, Long currentUserId, BandPostCommentCreateRequestDTO request) {
        BandPost post = bandPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));
        
        // 대댓글인 경우 부모 댓글 검증
        if (request.getParentId() != null) {
            com.ourband.api.domain.model.BandPostComment parentComment = bandPostCommentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 부모 댓글입니다."));
            if (!parentComment.getPostId().equals(postId)) {
                throw new IllegalArgumentException("부모 댓글이 해당 게시글에 속하지 않습니다.");
            }
        }

        com.ourband.api.domain.model.BandPostComment comment = com.ourband.api.domain.model.BandPostComment.builder()
                .postId(postId)
                .userId(currentUserId)
                .content(request.getContent())
                .parentId(request.getParentId())
                .build();
        
        com.ourband.api.domain.model.BandPostComment saved = bandPostCommentRepository.save(comment);
        
        post.setCommentCount(post.getCommentCount() + 1);

        if (!post.getAuthorId().equals(currentUserId)) {
            User commenter = userRepository.findById(currentUserId).orElse(null);
            String commenterName = commenter != null ? commenter.getNickname() : "누군가";
            notificationService.send(
                    post.getAuthorId(),
                    currentUserId,
                    com.ourband.api.domain.model.NotificationType.POST_COMMENT,
                    postId.toString(),
                    commenterName + "님이 회원님의 밴드 게시글에 댓글을 달았습니다."
            );
        }

        return mapCommentToDTO(saved);
    }

    /**
     * 댓글 수정 (작성자 본인만 가능)
     */
    @Transactional
    public BandPostCommentResponseDTO updateComment(Long commentId, Long currentUserId, String content) {
        com.ourband.api.domain.model.BandPostComment comment = bandPostCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글입니다."));

        if (!comment.getUserId().equals(currentUserId)) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        comment.setContent(content);
        bandPostCommentRepository.save(comment);

        return mapCommentToDTO(comment);
    }

    /**
     * 댓글 삭제 (작성자 본인만 가능)
     */
    @Transactional
    public void deleteComment(Long commentId, Long currentUserId) {
        com.ourband.api.domain.model.BandPostComment comment = bandPostCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글입니다."));

        if (!comment.getUserId().equals(currentUserId)) {
            throw new IllegalArgumentException("삭제 권한이 없습니다.");
        }

        BandPost post = bandPostRepository.findById(comment.getPostId()).orElse(null);
        if (post != null) {
            post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
        }

        bandPostCommentRepository.delete(comment);
    }

    /**
     * 댓글 → DTO 변환 헬퍼 (대댓글 재귀 포함)
     */
    private BandPostCommentResponseDTO mapCommentToDTO(com.ourband.api.domain.model.BandPostComment c) {
        User cAuthor = userRepository.findById(c.getUserId()).orElse(null);
        String cAuthorName = cAuthor != null ? cAuthor.getNickname() : "알 수 없음";
        String cProfileImageUrl = null;
        if (cAuthor != null) {
            Profile cProfile = profileRepository.findByUser_UserId(cAuthor.getUserId()).orElse(null);
            if (cProfile != null) {
                cProfileImageUrl = cProfile.getProfilePictureUrl();
            }
        }

        List<com.ourband.api.domain.model.BandPostComment> replyEntities = bandPostCommentRepository.findByParentIdOrderByCreatedAtAsc(c.getId());
        List<BandPostCommentResponseDTO> replies = replyEntities.stream()
                .map(this::mapCommentToDTO)
                .toList();

        return BandPostCommentResponseDTO.builder()
                .id(c.getId())
                .postId(c.getPostId())
                .authorId(c.getUserId())
                .authorName(cAuthorName)
                .authorProfileImageUrl(cProfileImageUrl)
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .parentId(c.getParentId())
                .replies(replies)
                .build();
    }
    /**
     * 투표하기 / 투표취소
     * DB에 poll_id 컬럼이 없고 poll_option_id만 있으므로,
     * vote는 option을 통해서만 poll과 연결됨
     */
    @Transactional
    public void votePoll(Long pollId, Long optionId, Long currentUserId) {
        BandPolls poll = bandPollRepository.findById(pollId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 투표입니다."));
        
        // 선택한 옵션이 해당 poll에 속하는지 검증
        BandPollOptions option = bandPollOptionRepository.findById(optionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 투표 항목입니다."));
        if (!option.getPollId().equals(pollId)) {
            throw new IllegalArgumentException("해당 투표의 항목이 아닙니다.");
        }
        
        // 해당 poll의 모든 option ID 목록
        List<BandPollOptions> allOptions = bandPollOptionRepository.findByPollId(pollId);
        List<Long> allOptionIds = allOptions.stream().map(BandPollOptions::getId).collect(Collectors.toList());
        
        // 현재 유저의 기존 투표 찾기 (모든 option에 대해)
        List<BandPollVotes> existingVotes = bandPollVoteRepository.findByPollOptionIdInAndUserId(allOptionIds, currentUserId);
        
        if (!existingVotes.isEmpty()) {
            BandPollVotes existingVote = existingVotes.get(0);
            if (existingVote.getPollOptionId().equals(optionId)) {
                // 이미 같은 항목에 투표했다면 취소
                bandPollVoteRepository.delete(existingVote);
            } else {
                // 다른 항목으로 변경
                existingVote.setPollOptionId(optionId);
                bandPollVoteRepository.save(existingVote);
            }
        } else {
            // 새로 투표
            bandPollVoteRepository.save(BandPollVotes.builder()
                    .pollOptionId(optionId)
                    .userId(currentUserId)
                    .build());
        }
    }

    // ========================================
    // 💡 밴드 가입 신청 관리
    // ========================================

    @Transactional
    public BandApplicationResponseDTO createApplication(Long bandId, Long currentUserId, BandApplicationRequestDTO request) {
        if (bandApplicationRepository.existsByApplicantUserIdAndBandMemberIdAndStatus(currentUserId, request.getBandMemberId(), "PENDING")) {
            throw new IllegalArgumentException("이미 대기 중인 신청이 있습니다.");
        }
        
        com.ourband.api.domain.model.BandApplication app = com.ourband.api.domain.model.BandApplication.builder()
                .bandId(bandId)
                .bandMemberId(request.getBandMemberId())
                .applicantUserId(currentUserId)
                .message(request.getMessage())
                .status("PENDING")
                .build();
                
        com.ourband.api.domain.model.BandApplication savedApp = bandApplicationRepository.save(app);

        // 밴드 리더(최저 ID 멤버)에게 알림 발송
        List<BandMember> members = bandMemberRepository.findByBandId(bandId);
        if (!members.isEmpty()) {
            BandMember leader = members.stream()
                    .filter(m -> m.getUserId() != null)
                    .min(java.util.Comparator.comparing(BandMember::getId))
                    .orElse(null);
            if (leader != null && leader.getUserId() != null) {
                Bands band = bandRepository.findById(bandId).orElse(null);
                String bandName = band != null ? band.getName() : "우리 밴드";
                notificationService.send(
                        leader.getUserId(),
                        currentUserId,
                        com.ourband.api.domain.model.NotificationType.BAND_APPLY,
                        bandId.toString(),
                        bandName + "에 새로운 가입 신청이 도착했습니다."
                );
            }
        }
                
        return mapToAppResponse(savedApp);
    }

    @Transactional(readOnly = true)
    public List<BandApplicationResponseDTO> getMyApplications(Long currentUserId) {
        return bandApplicationRepository.findByApplicantUserIdOrderByCreatedAtDesc(currentUserId).stream()
                .map(this::mapToAppResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BandApplicationResponseDTO> getBandApplications(Long bandId, Long currentUserId) {
        // 밴드 멤버 권한 확인
        List<BandMember> members = bandMemberRepository.findByBandId(bandId);
        if (members.isEmpty()) {
            throw new IllegalArgumentException("밴드 멤버 정보가 없습니다.");
        }
        boolean isMember = members.stream()
                .anyMatch(m -> m.getUserId() != null && m.getUserId().equals(currentUserId));
        if (!isMember) {
            throw new IllegalArgumentException("밴드 멤버만 신청 목록을 볼 수 있습니다.");
        }

        return bandApplicationRepository.findByBandIdOrderByCreatedAtDesc(bandId).stream()
                .map(this::mapToAppResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void acceptApplication(Long applicationId, Long currentUserId) {
        com.ourband.api.domain.model.BandApplication app = bandApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("신청 내역을 찾을 수 없습니다."));
                
        // 방장 권한 확인
        List<BandMember> members = bandMemberRepository.findByBandId(app.getBandId());
        BandMember leader = members.stream()
                .filter(m -> m.getUserId() != null)
                .min(java.util.Comparator.comparing(BandMember::getId))
                .orElse(null);
        if (leader == null || !leader.getUserId().equals(currentUserId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        
        app.accept();
        
        // 밴드 멤버 테이블의 해당 빈자리 user_id 채우기
        BandMember memberSlot = bandMemberRepository.findById(app.getBandMemberId())
                .orElseThrow(() -> new IllegalArgumentException("해당 모집 포지션이 존재하지 않습니다."));
                
        if (memberSlot.getUserId() != null) {
            throw new IllegalArgumentException("이미 채워진 포지션입니다.");
        }
        
        BandMember updatedSlot = BandMember.builder()
                .id(memberSlot.getId())
                .bandId(memberSlot.getBandId())
                .userId(app.getApplicantUserId())
                .role(memberSlot.getRole())
                .status("JOINED")
                .build();
        bandMemberRepository.save(updatedSlot);

        // 지원자에게 가입 수락 알림 발송
        Bands band = bandRepository.findById(app.getBandId()).orElse(null);
        String bandName = band != null ? band.getName() : "우리 밴드";
        notificationService.send(
                app.getApplicantUserId(),
                currentUserId,
                com.ourband.api.domain.model.NotificationType.INFO,
                app.getBandId().toString(),
                bandName + "에 가입 되었습니다."
        );
    }

    @Transactional
    public void rejectApplication(Long applicationId, Long currentUserId, String reason) {
        com.ourband.api.domain.model.BandApplication app = bandApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("신청 내역을 찾을 수 없습니다."));
                
        // 방장 권한 확인
        List<BandMember> members = bandMemberRepository.findByBandId(app.getBandId());
        BandMember leader = members.stream()
                .filter(m -> m.getUserId() != null)
                .min(java.util.Comparator.comparing(BandMember::getId))
                .orElse(null);
        if (leader == null || !leader.getUserId().equals(currentUserId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        
        app.reject(reason);

        // 지원자에게 가입 거절 알림 발송
        Bands band = bandRepository.findById(app.getBandId()).orElse(null);
        String bandName = band != null ? band.getName() : "우리 밴드";
        notificationService.send(
                app.getApplicantUserId(),
                currentUserId,
                com.ourband.api.domain.model.NotificationType.INFO,
                app.getBandId().toString(),
                bandName + "에 가입되지 못했습니다."
        );
    }

    private BandApplicationResponseDTO mapToAppResponse(com.ourband.api.domain.model.BandApplication app) {
        Bands band = bandRepository.findById(app.getBandId()).orElse(null);
        String bandName = band != null ? band.getName() : "알 수 없는 밴드";
        String bandLogoUrl = band != null ? band.getLogoImageUrl() : null;
        
        BandMember memberSlot = bandMemberRepository.findById(app.getBandMemberId()).orElse(null);
        String position = memberSlot != null ? memberSlot.getRole() : "알 수 없음";

        User applicant = userRepository.findById(app.getApplicantUserId()).orElse(null);
        String applicantName = applicant != null ? applicant.getNickname() : "알 수 없음";
        
        String applicantProfileImageUrl = null;
        if (applicant != null) {
            Profile profile = profileRepository.findByUser_UserId(applicant.getUserId()).orElse(null);
            if (profile != null) {
                applicantProfileImageUrl = profile.getProfilePictureUrl();
            }
        }

        return BandApplicationResponseDTO.builder()
                .id(app.getId())
                .bandId(app.getBandId())
                .bandName(bandName)
                .bandLogoUrl(bandLogoUrl)
                .bandMemberId(app.getBandMemberId())
                .position(position)
                .applicantUserId(app.getApplicantUserId())
                .applicantName(applicantName)
                .applicantProfileImageUrl(applicantProfileImageUrl)
                .message(app.getMessage())
                .status(app.getStatus())
                .rejectReason(app.getRejectReason())
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .build();
    }

    /**
     * 밴드 목록 검색
     */
    public Page<BandListResponseDTO> searchBands(String genre, String location, String keyword,
                                                  Boolean recruitingOnly, Boolean followedOnly,
                                                  Long currentUserId, Pageable pageable) {
        // Normalize filter params
        String genreParam = (genre != null && !genre.isEmpty() && !genre.equals("전체 장르")) ? genre : null;
        String locationParam = (location != null && !location.isEmpty() && !location.equals("전국") && !location.equals("전체 지역")) ? location : null;
        String keywordParam = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        Page<Bands> bandsPage = bandRepository.searchBands(genreParam, locationParam, keywordParam, pageable);

        // Get followed band IDs for current user
        List<Long> followedBandIds = new ArrayList<>();
        if (currentUserId != null) {
            followedBandIds = bandFollowRepository.findByUserId(currentUserId).stream()
                    .map(BandFollow::getBandId)
                    .toList();
        }

        final List<Long> finalFollowedIds = followedBandIds;

        Page<BandListResponseDTO> result = bandsPage.map(band -> {
            List<BandMember> members = bandMemberRepository.findByBandId(band.getId());

            int memberCount = (int) members.stream().filter(m -> m.getUserId() != null).count();

            List<BandListResponseDTO.RecruitingPosition> recruitingPositions = members.stream()
                    .filter(m -> m.getUserId() == null)
                    .map(m -> BandListResponseDTO.RecruitingPosition.builder()
                            .id(m.getId())
                            .role(m.getRole())
                            .build())
                    .toList();

            boolean isRecruiting = !recruitingPositions.isEmpty();
            boolean isFollowed = currentUserId != null && finalFollowedIds.contains(band.getId());
            long followerCount = bandFollowRepository.countByBandId(band.getId());

            return BandListResponseDTO.builder()
                    .id(band.getId())
                    .name(band.getName())
                    .genre(band.getGenre())
                    .location(band.getLocation())
                    .description(band.getDescription())
                    .logoImageUrl(band.getLogoImageUrl())
                    .coverImageUrl(band.getCoverImageUrl())
                    .meetingSchedule(band.getMeetingSchedule())
                    .memberCount(memberCount)
                    .recruitingPositions(recruitingPositions)
                    .isRecruiting(isRecruiting)
                    .isFollowed(isFollowed)
                    .followerCount(followerCount)
                    .createdAt(band.getCreatedAt())
                    .build();
        });

        // Apply post-query filters
        if (Boolean.TRUE.equals(recruitingOnly)) {
            List<BandListResponseDTO> filtered = result.getContent().stream()
                    .filter(BandListResponseDTO::isRecruiting)
                    .toList();
            return new org.springframework.data.domain.PageImpl<>(filtered, pageable, filtered.size());
        }
        if (Boolean.TRUE.equals(followedOnly) && currentUserId != null) {
            List<BandListResponseDTO> filtered = result.getContent().stream()
                    .filter(BandListResponseDTO::isFollowed)
                    .toList();
            return new org.springframework.data.domain.PageImpl<>(filtered, pageable, filtered.size());
        }

        return result;
    }

    /**
     * 밴드 팔로우 토글
     */
    @Transactional
    public boolean toggleFollow(Long bandId, Long currentUserId) {
        Bands band = bandRepository.findById(bandId)
                .orElseThrow(() -> new IllegalArgumentException("밴드를 찾을 수 없습니다."));

        Optional<BandFollow> existing = bandFollowRepository.findByUserIdAndBandId(currentUserId, bandId);
        if (existing.isPresent()) {
            bandFollowRepository.delete(existing.get());
            return false;
        } else {
            bandFollowRepository.save(BandFollow.builder()
                    .userId(currentUserId)
                    .bandId(bandId)
                    .build());
            return true;
        }
    }

    @Transactional
    public void leaveBand(Long bandId, Long currentUserId) {
        List<BandMember> members = bandMemberRepository.findByBandId(bandId);
        BandMember leader = members.stream()
                .min(java.util.Comparator.comparing(BandMember::getId))
                .orElseThrow(() -> new IllegalArgumentException("밴드 정보가 올바르지 않습니다."));

        if (leader.getUserId() != null && leader.getUserId().equals(currentUserId)) {
            throw new IllegalArgumentException("방장은 밴드를 탈퇴할 수 없습니다. 대신 밴드 해체를 이용해주세요.");
        }

        BandMember me = members.stream()
                .filter(m -> m.getUserId() != null && m.getUserId().equals(currentUserId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 밴드의 멤버가 아닙니다."));

        me.leave();
        bandMemberRepository.save(me);

        User leaver = userRepository.findById(currentUserId).orElse(null);
        String leaverName = leaver != null ? leaver.getNickname() : "누군가";
        
        members.stream()
                .filter(m -> m.getUserId() != null && !m.getUserId().equals(currentUserId))
                .forEach(m -> {
                    notificationService.send(
                            m.getUserId(),
                            currentUserId,
                            com.ourband.api.domain.model.NotificationType.INFO,
                            bandId.toString(),
                            leaverName + "님이 밴드를 탈퇴했습니다."
                    );
                });
    }

    @Transactional
    public void deleteBand(Long bandId, Long currentUserId) {
        List<BandMember> members = bandMemberRepository.findByBandId(bandId);
        BandMember leader = members.stream()
                .min(java.util.Comparator.comparing(BandMember::getId))
                .orElseThrow(() -> new IllegalArgumentException("밴드 정보가 올바르지 않습니다."));

        if (leader.getUserId() == null || !leader.getUserId().equals(currentUserId)) {
            throw new IllegalArgumentException("방장만 밴드를 해체할 수 있습니다.");
        }

        // 고아 방지를 위해 수동 삭제 (실제 서비스에서는 상태 플래그 변경이 더 권장됨)
        // 1. 밴드 관련 포스트 삭제 (댓글, 좋아요 등은 cascade 또는 별도 처리가 필요할 수 있으나 생략)
        bandPostRepository.findByBandIdOrderByCreatedAtDesc(bandId).forEach(post -> {
            bandPostCommentRepository.deleteAllByPostId(post.getId());
            bandPostLikeRepository.deleteAllByPostId(post.getId());
            bandPostRepository.delete(post);
        });

        // 2. 가입 신청 삭제
        bandApplicationRepository.findByBandIdOrderByCreatedAtDesc(bandId)
                .forEach(bandApplicationRepository::delete);

        // 3. 밴드 팔로우 삭제
        bandFollowRepository.deleteAllByBandId(bandId);

        // 4. 멤버 삭제
        bandMemberRepository.deleteAll(members);

        // 5. 밴드 삭제
        bandRepository.deleteById(bandId);
    }
}
