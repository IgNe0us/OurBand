package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.jam.JamPostCreateRequestDTO;
import com.ourband.api.domain.dto.jam.JamPostResponseDTO;
import com.ourband.api.domain.dto.jam.JamPostCommentResponseDTO;
import com.ourband.api.domain.dto.jam.JamPostCommentCreateRequestDTO;
import com.ourband.api.domain.model.JamPost;
import com.ourband.api.domain.model.JamPostLike;
import com.ourband.api.domain.model.JamPostComment;
import com.ourband.api.domain.model.Portfolio;
import com.ourband.api.domain.model.User;
import com.ourband.api.domain.model.Profile;
import com.ourband.api.domain.repository.JamPostRepository;
import com.ourband.api.domain.repository.JamPostLikeRepository;
import com.ourband.api.domain.repository.JamPostCommentRepository;
import com.ourband.api.domain.repository.PortfolioRepository;
import com.ourband.api.domain.repository.UserRepository;
import com.ourband.api.domain.repository.ProfileRepository;
import com.ourband.api.domain.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JamService {

    private final JamPostRepository jamPostRepository;
    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final JamPostLikeRepository jamPostLikeRepository;
    private final JamPostCommentRepository jamPostCommentRepository;
    private final FollowRepository followRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public JamPostResponseDTO getJamPost(Long jamId, Long currentUserId) {
        JamPost jamPost = jamPostRepository.findById(jamId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 잼 영상입니다."));
        return mapToDTO(jamPost, currentUserId);
    }

    @Transactional
    public JamPostResponseDTO createJamPost(Long userId, JamPostCreateRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Portfolio portfolio = null;
        if (request.getPortfolioId() != null) {
            portfolio = portfolioRepository.findById(request.getPortfolioId()).orElse(null);
        }

        JamPost parentJam = null;
        if (request.getParentId() != null) {
            parentJam = jamPostRepository.findById(request.getParentId()).orElse(null);
        }

        JamPost jamPost = JamPost.builder()
                .user(user)
                .portfolio(portfolio)
                .parentJam(parentJam)
                .mediaUrl(request.getMediaUrl())
                .title(request.getTitle())
                .description(request.getDescription())
                .instrument(request.getInstrument())
                .genre(request.getGenre())
                .originalVolume(request.getOriginalVolume() != null ? request.getOriginalVolume() : 1.0)
                .myVolume(request.getMyVolume() != null ? request.getMyVolume() : 1.0)
                .build();

        JamPost saved = jamPostRepository.save(jamPost);

        if (parentJam != null && parentJam.getUser() != null && !parentJam.getUser().getUserId().equals(userId)) {
            notificationService.send(
                    parentJam.getUser().getUserId(),
                    userId,
                    com.ourband.api.domain.model.NotificationType.JAM_DUET,
                    saved.getId().toString(),
                    user.getNickname() + "님이 회원님의 영상을 사용하여 듀엣을 생성했습니다."
            );
        }

        return mapToDTO(saved, userId);
    }

    @Transactional(readOnly = true)
    public Page<JamPostResponseDTO> searchJamPosts(String genre, String instrument, int page, int size, Long currentUserId) {
        Pageable pageable = PageRequest.of(page, size);
        Page<JamPost> posts = jamPostRepository.searchJamPosts(genre, instrument, pageable);
        return posts.map(post -> mapToDTO(post, currentUserId));
    }

    @Transactional(readOnly = true)
    public Page<JamPostResponseDTO> getUserJamPosts(Long targetUserId, int page, int size, Long currentUserId) {
        Pageable pageable = PageRequest.of(page, size);
        Page<JamPost> posts = jamPostRepository.findByUser_UserIdOrderByCreatedAtDesc(targetUserId, pageable);
        return posts.map(post -> mapToDTO(post, currentUserId));
    }

    @Transactional
    public void incrementViewCount(Long jamId) {
        JamPost jamPost = jamPostRepository.findById(jamId).orElse(null);
        if (jamPost != null) {
            jamPost.setViewCount(jamPost.getViewCount() + 1);
        }
    }

    @Transactional
    public void deleteJamPost(Long jamId, Long userId) {
        JamPost jamPost = jamPostRepository.findById(jamId)
                .orElseThrow(() -> new RuntimeException("Jam post not found"));
        if (!jamPost.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        jamPostRepository.delete(jamPost);
    }

    @Transactional
    public boolean toggleLike(Long userId, Long jamId) {
        JamPost jamPost = jamPostRepository.findById(jamId)
                .orElseThrow(() -> new RuntimeException("Jam post not found"));

        return jamPostLikeRepository.findByJamIdAndUserId(jamId, userId)
                .map(like -> {
                    jamPostLikeRepository.delete(like);
                    jamPost.setLikeCount(jamPost.getLikeCount() - 1);
                    return false;
                }).orElseGet(() -> {
                    jamPostLikeRepository.save(JamPostLike.builder()
                            .jamId(jamId)
                            .userId(userId)
                            .build());
                    jamPost.setLikeCount(jamPost.getLikeCount() + 1);

                    if (jamPost.getUser() != null && !jamPost.getUser().getUserId().equals(userId)) {
                        User liker = userRepository.findById(userId).orElse(null);
                        String likerName = liker != null ? liker.getNickname() : "누군가";
                        notificationService.send(
                                jamPost.getUser().getUserId(),
                                userId,
                                com.ourband.api.domain.model.NotificationType.JAM_LIKE,
                                jamPost.getId().toString(),
                                likerName + "님이 회원님의 오디오 잼에 좋아요를 눌렀습니다."
                        );
                    }

                    return true;
                });
    }

    @Transactional
    public JamPostCommentResponseDTO createComment(Long userId, Long jamId, JamPostCommentCreateRequestDTO req) {
        JamPost jamPost = jamPostRepository.findById(jamId)
                .orElseThrow(() -> new RuntimeException("Jam post not found"));

        JamPostComment comment = JamPostComment.builder()
                .jamId(jamId)
                .userId(userId)
                .content(req.getContent())
                .parentId(req.getParentId())
                .build();

        JamPostComment saved = jamPostCommentRepository.save(comment);
        jamPost.setCommentCount(jamPost.getCommentCount() + 1);

        if (jamPost.getUser() != null && !jamPost.getUser().getUserId().equals(userId)) {
            User commenter = userRepository.findById(userId).orElse(null);
            String commenterName = commenter != null ? commenter.getNickname() : "누군가";
            notificationService.send(
                    jamPost.getUser().getUserId(),
                    userId,
                    com.ourband.api.domain.model.NotificationType.JAM_COMMENT,
                    jamPost.getId().toString(),
                    commenterName + "님이 회원님의 오디오 잼에 댓글을 달았습니다."
            );
        }

        return mapCommentToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<JamPostCommentResponseDTO> getComments(Long jamId) {
        List<JamPostComment> topLevelComments = jamPostCommentRepository.findByJamIdAndParentIdIsNullOrderByCreatedAtAsc(jamId);
        return topLevelComments.stream()
                .map(comment -> {
                    JamPostCommentResponseDTO dto = mapCommentToDTO(comment);
                    List<JamPostComment> replies = jamPostCommentRepository.findByParentIdOrderByCreatedAtAsc(comment.getId());
                    dto.setReplies(replies.stream().map(this::mapCommentToDTO).collect(Collectors.toList()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public JamPostCommentResponseDTO updateComment(Long commentId, Long userId, JamPostCommentCreateRequestDTO req) {
        JamPostComment comment = jamPostCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        if (!comment.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        comment.setContent(req.getContent());
        return mapCommentToDTO(comment);
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        JamPostComment comment = jamPostCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        if (!comment.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        JamPost jamPost = jamPostRepository.findById(comment.getJamId()).orElse(null);
        if (jamPost != null) {
            jamPost.setCommentCount(jamPost.getCommentCount() - 1);
        }
        jamPostCommentRepository.delete(comment);
    }

    @Transactional
    public void incrementShareCount(Long jamId) {
        JamPost jamPost = jamPostRepository.findById(jamId).orElse(null);
        if (jamPost != null) {
            jamPost.setShareCount(jamPost.getShareCount() + 1);
        }
    }

    private JamPostCommentResponseDTO mapCommentToDTO(JamPostComment comment) {
        User user = userRepository.findById(comment.getUserId()).orElse(null);
        String authorName = user != null ? user.getNickname() : "Unknown";
        
        Profile profile = profileRepository.findByUser_UserId(comment.getUserId()).orElse(null);
        String authorProfileImageUrl = profile != null ? profile.getProfilePictureUrl() : null;

        return JamPostCommentResponseDTO.builder()
                .id(comment.getId())
                .jamId(comment.getJamId())
                .authorId(comment.getUserId())
                .authorName(authorName)
                .authorProfileImageUrl(authorProfileImageUrl)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .parentId(comment.getParentId())
                .build();
    }

    public JamPostResponseDTO mapToDTO(JamPost j, Long currentUserId) {
        Profile profile = profileRepository.findByUser_UserId(j.getUser().getUserId()).orElse(null);
        String profileImageUrl = profile != null ? profile.getProfilePictureUrl() : null;

        String originalAuthorName = null;
        if (j.getParentJam() != null && j.getParentJam().getUser() != null) {
            originalAuthorName = j.getParentJam().getUser().getNickname();
        }

        boolean isLiked = false;
        boolean isFollowing = false;
        if (currentUserId != null) {
            isLiked = jamPostLikeRepository.existsByJamIdAndUserId(j.getId(), currentUserId);
            isFollowing = followRepository.findByFollowerIdAndFollowingId(currentUserId, j.getUser().getUserId()).isPresent();
        }

        return JamPostResponseDTO.builder()
                .id(j.getId())
                .userId(j.getUser().getUserId())
                .authorName(j.getUser().getNickname())
                .authorProfileImageUrl(profileImageUrl)
                .portfolioId(j.getPortfolio() != null ? j.getPortfolio().getId() : null)
                .parentId(j.getParentJam() != null ? j.getParentJam().getId() : null)
                .originalAuthorName(originalAuthorName)
                .mediaUrl(j.getMediaUrl())
                .title(j.getTitle())
                .description(j.getDescription())
                .instrument(j.getInstrument())
                .genre(j.getGenre())
                .likeCount(j.getLikeCount())
                .commentCount(j.getCommentCount())
                .shareCount(j.getShareCount())
                .viewCount(j.getViewCount())
                .originalVolume(j.getOriginalVolume())
                .myVolume(j.getMyVolume())
                .isLiked(isLiked)
                .isFollowing(isFollowing)
                .createdAt(j.getCreatedAt())
                .build();
    }
}

