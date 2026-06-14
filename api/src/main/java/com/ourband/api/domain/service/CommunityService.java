package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.community.*;
import com.ourband.api.domain.dto.user.PollOptionResponseDTO;
import com.ourband.api.domain.dto.user.PollResponseDTO;
import com.ourband.api.domain.model.*;
import com.ourband.api.domain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityPostRepository postRepository;
    private final CommunityPostCommentRepository commentRepository;
    private final CommunityPostLikeRepository likeRepository;
    private final CommunityPollRepository pollRepository;
    private final CommunityPollOptionRepository pollOptionRepository;
    private final CommunityPollVoteRepository pollVoteRepository;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final LikeViewCacheService likeViewCacheService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<CommunityPostResponseDTO> searchPosts(String boardType, String category, String part, String keyword, Pageable pageable, Long currentUserId, Boolean isPopular) {
        boolean popular = isPopular != null ? isPopular : false;
        LocalDateTime popularSince = LocalDateTime.now().minusDays(7);
        Page<CommunityPost> posts = postRepository.searchPosts(boardType, category, part, keyword, popular, popularSince, pageable);
        return posts.map(post -> mapToPostResponseDTO(post, currentUserId));
    }

    @Transactional(readOnly = true)
    public CommunityPostResponseDTO getPost(Long postId, Long currentUserId) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        if (post.isHidden() || post.isDeleted()) {
            throw new com.ourband.api.global.exception.ContentHiddenException("관리자에 의해 숨겨진 페이지입니다.");
        }

        // 조회수 증가 (Redis Write-Behind)
        likeViewCacheService.incrementViewCount("community", postId, currentUserId);
        
        return mapToPostResponseDTO(post, currentUserId);
    }

    @Transactional
    public CommunityPostResponseDTO createPost(Long currentUserId, CommunityPostCreateRequestDTO request) {
        CommunityPost post = CommunityPost.builder()
                .userId(currentUserId)
                .boardType(request.getBoardType())
                .category(request.getCategory())
                .part(request.getPart())
                .title(request.getTitle())
                .content(request.getContent())
                .mediaUrl(request.getMediaUrl())
                .mediaType(request.getMediaType())
                .build();
        post = postRepository.save(post);

        if (request.getPoll() != null && request.getPoll().getOptions() != null && !request.getPoll().getOptions().isEmpty()) {
            CommunityPoll poll = CommunityPoll.builder()
                    .postId(post.getId())
                    .title(request.getPoll().getTitle())
                    .isMultipleChoice(request.getPoll().getIsMultipleChoice() != null ? request.getPoll().getIsMultipleChoice() : false)
                    .build();
            poll = pollRepository.save(poll);

            int order = 1;
            for (String optionContent : request.getPoll().getOptions()) {
                CommunityPollOption option = CommunityPollOption.builder()
                        .pollId(poll.getId())
                        .content(optionContent)
                        .sortOrder(order++)
                        .build();
                pollOptionRepository.save(option);
            }
        }

        return mapToPostResponseDTO(post, currentUserId);
    }

    @Transactional
    public CommunityPostResponseDTO updatePost(Long postId, Long currentUserId, CommunityPostCreateRequestDTO request) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        checkPermission(post.getUserId(), currentUserId);

        post.setBoardType(request.getBoardType());
        post.setCategory(request.getCategory());
        post.setPart(request.getPart());
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setMediaUrl(request.getMediaUrl());
        post.setMediaType(request.getMediaType());

        boolean[] keepExistingPoll = {false};

        CommunityPoll existingPoll = pollRepository.findByPostId(post.getId()).orElse(null);
        if (existingPoll != null) {
            List<CommunityPollOption> options = pollOptionRepository.findByPollId(existingPoll.getId());
            List<Long> optionIds = options.stream().map(CommunityPollOption::getId).collect(Collectors.toList());
            
            boolean hasVotes = false;
            if (!optionIds.isEmpty()) {
                List<CommunityPollVote> votes = pollVoteRepository.findByPollOptionIdIn(optionIds);
                if (votes != null && !votes.isEmpty()) {
                    hasVotes = true;
                }
            }
            
            if (hasVotes) {
                keepExistingPoll[0] = true;
            } else {
                if (!optionIds.isEmpty()) {
                    List<CommunityPollVote> votes = pollVoteRepository.findByPollOptionIdIn(optionIds);
                    pollVoteRepository.deleteAll(votes);
                }
                pollOptionRepository.deleteAll(options);
                pollRepository.delete(existingPoll);
            }
        }

        if (!keepExistingPoll[0] && request.getPoll() != null && request.getPoll().getTitle() != null && !request.getPoll().getTitle().isEmpty()) {
            CommunityPoll poll = CommunityPoll.builder()
                    .postId(post.getId())
                    .title(request.getPoll().getTitle())
                    .isMultipleChoice(request.getPoll().getIsMultipleChoice() != null ? request.getPoll().getIsMultipleChoice() : false)
                    .build();
            poll = pollRepository.save(poll);

            int order = 1;
            for (String optionContent : request.getPoll().getOptions()) {
                CommunityPollOption option = CommunityPollOption.builder()
                        .pollId(poll.getId())
                        .content(optionContent)
                        .sortOrder(order++)
                        .build();
                pollOptionRepository.save(option);
            }
        }

        return mapToPostResponseDTO(post, currentUserId);
    }

    @Transactional
    public void deletePost(Long postId, Long currentUserId) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        checkPermission(post.getUserId(), currentUserId);

        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    public boolean toggleLike(Long postId, Long currentUserId) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        boolean currentDbStatus = likeRepository.existsByPostIdAndUserId(postId, currentUserId);
        
        boolean isNowLiked = likeViewCacheService.toggleLike("community", postId, currentUserId, currentDbStatus);
        
        if (isNowLiked && !post.getUserId().equals(currentUserId)) {
            User liker = userRepository.findById(currentUserId).orElse(null);
            String likerName = liker != null ? liker.getNickname() : "누군가";
            notificationService.send(
                    post.getUserId(),
                    currentUserId,
                    com.ourband.api.domain.model.NotificationType.POST_LIKE,
                    postId.toString(),
                    likerName + "님이 회원님의 커뮤니티 게시글에 좋아요를 눌렀습니다."
            );
        }
        
        return isNowLiked;
    }

    @Transactional
    public CommunityPostCommentResponseDTO createComment(Long postId, Long currentUserId, CommunityPostCommentCreateRequestDTO request) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        CommunityPostComment comment = CommunityPostComment.builder()
                .postId(postId)
                .userId(currentUserId)
                .content(request.getContent())
                .parentId(request.getParentId())
                .build();
        comment = commentRepository.save(comment);

        post.setCommentCount(post.getCommentCount() + 1);

        if (!post.getUserId().equals(currentUserId)) {
            User commenter = userRepository.findById(currentUserId).orElse(null);
            String commenterName = commenter != null ? commenter.getNickname() : "누군가";
            notificationService.send(
                    post.getUserId(),
                    currentUserId,
                    com.ourband.api.domain.model.NotificationType.POST_COMMENT,
                    postId.toString(),
                    commenterName + "님이 회원님의 커뮤니티 게시글에 댓글을 달았습니다."
            );
        }

        return mapToCommentResponseDTO(comment);
    }

    @Transactional
    public CommunityPostCommentResponseDTO updateComment(Long commentId, Long currentUserId, CommunityPostCommentCreateRequestDTO request) {
        CommunityPostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        checkPermission(comment.getUserId(), currentUserId);

        comment.setContent(request.getContent());
        return mapToCommentResponseDTO(comment);
    }

    @Transactional
    public void deleteComment(Long commentId, Long currentUserId) {
        CommunityPostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        checkPermission(comment.getUserId(), currentUserId);

        CommunityPost post = postRepository.findById(comment.getPostId()).orElse(null);
        if (post != null) {
            post.setCommentCount(post.getCommentCount() - 1);
        }
        commentRepository.delete(comment);
    }

    @Transactional
    public void votePoll(Long pollId, Long optionId, Long currentUserId) {
        CommunityPoll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new IllegalArgumentException("투표를 찾을 수 없습니다."));
        
        CommunityPollOption option = pollOptionRepository.findById(optionId)
                .orElseThrow(() -> new IllegalArgumentException("옵션을 찾을 수 없습니다."));
        
        if (!option.getPollId().equals(poll.getId())) {
            throw new IllegalArgumentException("해당 투표의 옵션이 아닙니다.");
        }

        List<CommunityPollOption> options = pollOptionRepository.findByPollId(pollId);
        List<Long> optionIds = options.stream().map(CommunityPollOption::getId).collect(Collectors.toList());

        CommunityPollVote existingVote = pollVoteRepository.findByPollOptionIdInAndUserId(optionIds, currentUserId).orElse(null);
        if (existingVote != null) {
            if (existingVote.getPollOptionId().equals(optionId)) {
                pollVoteRepository.delete(existingVote);
                return;
            } else {
                existingVote.setPollOptionId(optionId);
                return;
            }
        }

        pollVoteRepository.save(CommunityPollVote.builder()
                .pollOptionId(optionId)
                .userId(currentUserId)
                .build());
    }

    private void checkPermission(Long resourceOwnerId, Long currentUserId) {
        if (resourceOwnerId.equals(currentUserId)) {
            return;
        }
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (!"ADMIN".equals(user.getType())) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
    }

    private CommunityPostResponseDTO mapToPostResponseDTO(CommunityPost post, Long currentUserId) {
        User author = userRepository.findById(post.getUserId()).orElse(null);
        String authorName = author != null ? author.getNickname() : "Unknown";
        String authorProfileImageUrl = null;

        if (author != null) {
            Profile profile = profileRepository.findByUser_UserId(author.getUserId()).orElse(null);
            if (profile != null) {
                authorProfileImageUrl = profile.getProfilePictureUrl();
            }
        }

        boolean isLiked = currentUserId != null && likeViewCacheService.isLiked("community", post.getId(), currentUserId, 
            likeRepository.existsByPostIdAndUserId(post.getId(), currentUserId));

        // Comments
        List<CommunityPostComment> comments = commentRepository.findByPostId(post.getId());
        java.util.Map<Long, CommunityPostCommentResponseDTO> commentDtoMap = comments.stream()
                .collect(Collectors.toMap(CommunityPostComment::getId, this::mapToCommentResponseDTO));
        
        List<CommunityPostCommentResponseDTO> commentDTOs = new ArrayList<>();
        for (CommunityPostComment c : comments) {
            CommunityPostCommentResponseDTO dto = commentDtoMap.get(c.getId());
            if (c.getParentId() == null) {
                commentDTOs.add(dto);
            } else {
                CommunityPostCommentResponseDTO parentDto = commentDtoMap.get(c.getParentId());
                if (parentDto != null) {
                    parentDto.getReplies().add(dto);
                }
            }
        }

        // Poll
        PollResponseDTO pollDTO = null;
        CommunityPoll poll = pollRepository.findByPostId(post.getId()).orElse(null);
        if (poll != null) {
            List<CommunityPollOption> options = pollOptionRepository.findByPollId(poll.getId());
            List<Long> optionIds = options.stream().map(CommunityPollOption::getId).collect(Collectors.toList());
            List<CommunityPollVote> votes = optionIds.isEmpty() ? new ArrayList<>() : pollVoteRepository.findByPollOptionIdIn(optionIds);
            
            Long myVotedOptionId = null;
            if (currentUserId != null) {
                myVotedOptionId = votes.stream()
                        .filter(v -> v.getUserId().equals(currentUserId))
                        .map(CommunityPollVote::getPollOptionId)
                        .findFirst().orElse(null);
            }
            
            List<PollOptionResponseDTO> optionDTOs = options.stream().map(opt -> {
                long count = votes.stream().filter(v -> v.getPollOptionId().equals(opt.getId())).count();
                return PollOptionResponseDTO.builder()
                        .id(opt.getId())
                        .content(opt.getContent())
                        .voteCount(count)
                        .build();
            }).collect(Collectors.toList());

            pollDTO = PollResponseDTO.builder()
                    .id(poll.getId())
                    .title(poll.getTitle())
                    .isMultipleChoice(poll.getIsMultipleChoice())
                    .options(optionDTOs)
                    .totalVotes((long) votes.size())
                    .myVotedOptionId(myVotedOptionId)
                    .build();
        }

        return CommunityPostResponseDTO.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .authorName(authorName)
                .authorProfileImageUrl(authorProfileImageUrl)
                .boardType(post.getBoardType())
                .category(post.getCategory())
                .part(post.getPart())
                .title(post.isDeleted() ? "관리자에 의해 삭제된 게시글입니다." : (post.isHidden() ? "관리자에 의해 숨김처리된 게시글 입니다." : post.getTitle()))
                .content(post.isDeleted() ? "관리자에 의해 삭제된 게시글입니다." : (post.isHidden() ? "관리자에 의해 숨김처리된 게시글 입니다." : post.getContent()))
                .mediaUrl((post.isDeleted() || post.isHidden()) ? null : post.getMediaUrl())
                .mediaType((post.isDeleted() || post.isHidden()) ? null : post.getMediaType())
                .likeCount(likeViewCacheService.getCachedLikeCount("community", post.getId(), post.getLikeCount()))
                .commentCount(post.getCommentCount())
                .viewCount(likeViewCacheService.getCachedViewCount("community", post.getId(), post.getViewCount()))
                .isLikedByCurrentUser(isLiked)
                .createdAt(post.getCreatedAt())
                .comments(commentDTOs)
                .poll(pollDTO)
                .build();
    }

    private CommunityPostCommentResponseDTO mapToCommentResponseDTO(CommunityPostComment comment) {
        User author = userRepository.findById(comment.getUserId()).orElse(null);
        String authorName = author != null ? author.getNickname() : "Unknown";
        String authorProfileImageUrl = null;

        if (author != null) {
            Profile profile = profileRepository.findByUser_UserId(author.getUserId()).orElse(null);
            if (profile != null) {
                authorProfileImageUrl = profile.getProfilePictureUrl();
            }
        }

        return CommunityPostCommentResponseDTO.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .userId(comment.getUserId())
                .authorName(authorName)
                .authorProfileImageUrl(authorProfileImageUrl)
                .content(comment.isDeleted() ? "관리자에 의해 삭제 처리된 댓글입니다." : (comment.isHidden() ? "관리자에 의해 숨김 처리 된 댓글입니다." : comment.getContent()))
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .parentId(comment.getParentId())
                .replies(new ArrayList<>())
                .build();
    }
}
