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

    @Transactional(readOnly = true)
    public Page<CommunityPostResponseDTO> searchPosts(String boardType, String category, String part, String keyword, Pageable pageable, Long currentUserId, Boolean isPopular) {
        boolean popular = isPopular != null ? isPopular : false;
        LocalDateTime popularSince = LocalDateTime.now().minusDays(7);
        Page<CommunityPost> posts = postRepository.searchPosts(boardType, category, part, keyword, popular, popularSince, pageable);
        return posts.map(post -> mapToPostResponseDTO(post, currentUserId));
    }

    @Transactional
    public CommunityPostResponseDTO getPost(Long postId, Long currentUserId) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        post.setViewCount(post.getViewCount() + 1);
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

    @Transactional
    public boolean toggleLike(Long postId, Long currentUserId) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        boolean isLiked = likeRepository.existsByPostIdAndUserId(postId, currentUserId);
        if (isLiked) {
            CommunityPostLike like = likeRepository.findByPostIdAndUserId(postId, currentUserId).get();
            likeRepository.delete(like);
            post.setLikeCount(post.getLikeCount() - 1);
            return false;
        } else {
            likeRepository.save(CommunityPostLike.builder().postId(postId).userId(currentUserId).build());
            post.setLikeCount(post.getLikeCount() + 1);
            return true;
        }
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

    @Transactional
    public void createReport(Long currentUserId, ReportCreateRequestDTO request) {
        Report report = Report.builder()
                .reporterId(currentUserId)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .reason(request.getReason())
                .build();
        reportRepository.save(report);
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

        boolean isLiked = currentUserId != null && likeRepository.existsByPostIdAndUserId(post.getId(), currentUserId);

        // Comments
        List<CommunityPostComment> comments = commentRepository.findByPostId(post.getId());
        List<CommunityPostCommentResponseDTO> commentDTOs = new ArrayList<>();
        for (CommunityPostComment c : comments) {
            if (c.getParentId() == null) {
                CommunityPostCommentResponseDTO cDTO = mapToCommentResponseDTO(c);
                cDTO = CommunityPostCommentResponseDTO.builder()
                        .id(cDTO.getId()).postId(cDTO.getPostId()).userId(cDTO.getUserId())
                        .authorName(cDTO.getAuthorName()).authorProfileImageUrl(cDTO.getAuthorProfileImageUrl())
                        .content(cDTO.getContent()).createdAt(cDTO.getCreatedAt()).updatedAt(cDTO.getUpdatedAt())
                        .parentId(null)
                        .replies(comments.stream()
                                .filter(reply -> c.getId().equals(reply.getParentId()))
                                .map(this::mapToCommentResponseDTO)
                                .collect(Collectors.toList()))
                        .build();
                commentDTOs.add(cDTO);
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
                .title(post.getTitle())
                .content(post.getContent())
                .mediaUrl(post.getMediaUrl())
                .mediaType(post.getMediaType())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .viewCount(post.getViewCount())
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
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .parentId(comment.getParentId())
                .replies(new ArrayList<>())
                .build();
    }
}
