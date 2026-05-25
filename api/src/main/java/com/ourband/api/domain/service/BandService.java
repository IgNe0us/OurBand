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
            posts = bandPostRepository.findByBandIdAndBoardTypeOrderByCreatedAtDesc(bandId, boardType.toUpperCase());
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
                    .likeCount(post.getLikeCount())
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
            isLikedByCurrentUser = bandPostLikeRepository.existsByPostIdAndUserId(postId, currentUserId);
        }
        
        List<com.ourband.api.domain.model.BandPostComment> commentsRaw = bandPostCommentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        List<BandPostCommentResponseDTO> comments = new ArrayList<>();
        for (com.ourband.api.domain.model.BandPostComment c : commentsRaw) {
            User cAuthor = userRepository.findById(c.getUserId()).orElse(null);
            String cAuthorName = cAuthor != null ? cAuthor.getNickname() : "알 수 없음";
            String cProfileImageUrl = null;
            if (cAuthor != null) {
                Profile cProfile = profileRepository.findByUser_UserId(cAuthor.getUserId()).orElse(null);
                if (cProfile != null) {
                    cProfileImageUrl = cProfile.getProfilePictureUrl();
                }
            }
            comments.add(BandPostCommentResponseDTO.builder()
                    .id(c.getId())
                    .postId(c.getPostId())
                    .authorId(c.getUserId())
                    .authorName(cAuthorName)
                    .authorProfileImageUrl(cProfileImageUrl)
                    .content(c.getContent())
                    .createdAt(c.getCreatedAt())
                    .build());
        }

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
                .likeCount(post.getLikeCount())
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
        if (request.getMediaUrl() != null) post.setMediaUrl(request.getMediaUrl());
        if (request.getMediaType() != null) post.setMediaType(request.getMediaType());
        if (request.getScheduleDate() != null) post.setScheduleDate(request.getScheduleDate());

        // 기존 투표 삭제
        bandPollRepository.findByPostId(postId).ifPresent(poll -> {
            List<BandPollOptions> options = bandPollOptionRepository.findByPollId(poll.getId());
            List<Long> optionIds = options.stream().map(BandPollOptions::getId).collect(Collectors.toList());
            if (!optionIds.isEmpty()) {
                bandPollVoteRepository.deleteByPollOptionIdIn(optionIds);
            }
            bandPollOptionRepository.deleteByPollId(poll.getId());
            bandPollRepository.delete(poll);
        });

        // 새 투표 생성
        if (request.getPoll() != null && request.getPoll().getTitle() != null && !request.getPoll().getTitle().isEmpty()) {
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
        
        boolean isLiked = bandPostLikeRepository.existsByPostIdAndUserId(postId, currentUserId);
        if (isLiked) {
            bandPostLikeRepository.deleteByPostIdAndUserId(postId, currentUserId);
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            return false;
        } else {
            bandPostLikeRepository.save(com.ourband.api.domain.model.BandPostLike.builder()
                    .postId(postId)
                    .userId(currentUserId)
                    .build());
            post.setLikeCount(post.getLikeCount() + 1);
            return true;
        }
    }

    /**
     * 댓글 생성
     */
    @Transactional
    public BandPostCommentResponseDTO createComment(Long postId, Long currentUserId, BandPostCommentCreateRequestDTO request) {
        BandPost post = bandPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));
        
        com.ourband.api.domain.model.BandPostComment comment = com.ourband.api.domain.model.BandPostComment.builder()
                .postId(postId)
                .userId(currentUserId)
                .content(request.getContent())
                .build();
        
        com.ourband.api.domain.model.BandPostComment saved = bandPostCommentRepository.save(comment);
        
        post.setCommentCount(post.getCommentCount() + 1);

        User author = userRepository.findById(currentUserId).orElse(null);
        String authorName = author != null ? author.getNickname() : "알 수 없음";
        String profileImageUrl = null;
        if (author != null) {
            Profile profile = profileRepository.findByUser_UserId(author.getUserId()).orElse(null);
            if (profile != null) {
                profileImageUrl = profile.getProfilePictureUrl();
            }
        }

        return BandPostCommentResponseDTO.builder()
                .id(saved.getId())
                .postId(saved.getPostId())
                .authorId(saved.getUserId())
                .authorName(authorName)
                .authorProfileImageUrl(profileImageUrl)
                .content(saved.getContent())
                .createdAt(saved.getCreatedAt())
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
}
