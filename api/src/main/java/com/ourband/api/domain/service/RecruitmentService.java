package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.recruitment.MemberSeekingPostCreateRequestDTO;
import com.ourband.api.domain.dto.recruitment.MemberSeekingPostResponseDTO;
import com.ourband.api.domain.dto.recruitment.RecruitmentOfferRequestDTO;
import com.ourband.api.domain.dto.recruitment.RecruitmentOfferResponseDTO;
import com.ourband.api.domain.model.BandMember;
import com.ourband.api.domain.model.Bands;
import com.ourband.api.domain.model.MemberSeekingPost;
import com.ourband.api.domain.model.Profile;
import com.ourband.api.domain.model.RecruitmentOffer;
import com.ourband.api.domain.model.User;
import com.ourband.api.domain.repository.BandMemberRepository;
import com.ourband.api.domain.repository.BandRepository;
import com.ourband.api.domain.repository.MemberSeekingPostRepository;
import com.ourband.api.domain.repository.ProfileRepository;
import com.ourband.api.domain.repository.RecruitmentOfferRepository;
import com.ourband.api.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecruitmentService {

    private final MemberSeekingPostRepository seekingPostRepository;
    private final RecruitmentOfferRepository offerRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final BandRepository bandRepository;
    private final BandMemberRepository bandMemberRepository;
    private final NotificationService notificationService;
    private final com.ourband.api.domain.service.chat.ChatService chatService;

    @Transactional
    public MemberSeekingPostResponseDTO createSeekingPost(Long userId, MemberSeekingPostCreateRequestDTO request) {
        MemberSeekingPost post = MemberSeekingPost.builder()
                .userId(userId)
                .title(request.getTitle())
                .content(request.getContent())
                .position(request.getPosition())
                .location(request.getLocation())
                .genreStyle(request.getGenreStyle())
                .mediaUrl(request.getMediaUrl())
                .mediaType(request.getMediaType())
                .status("OPEN")
                .build();

        MemberSeekingPost saved = seekingPostRepository.save(post);
        return mapToSeekingPostResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<MemberSeekingPostResponseDTO> getSeekingPosts() {
        return seekingPostRepository.findByStatusOrderByCreatedAtDesc("OPEN").stream()
                .map(this::mapToSeekingPostResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MemberSeekingPostResponseDTO getSeekingPost(Long id) {
        MemberSeekingPost post = seekingPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        return mapToSeekingPostResponse(post);
    }

    @Transactional
    public MemberSeekingPostResponseDTO updateSeekingPost(Long id, Long userId, MemberSeekingPostCreateRequestDTO request) {
        MemberSeekingPost post = seekingPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        post.update(request.getTitle(), request.getContent(), request.getPosition(), request.getLocation(), request.getGenreStyle(), request.getMediaUrl(), request.getMediaType(), request.getStatus());
        return mapToSeekingPostResponse(post);
    }

    @Transactional
    public void deleteSeekingPost(Long id, Long userId) {
        MemberSeekingPost post = seekingPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        seekingPostRepository.delete(post);
    }

    @Transactional
    public RecruitmentOfferResponseDTO sendOffer(Long senderUserId, RecruitmentOfferRequestDTO request) {
        if (bandMemberRepository.existsByBandIdAndUserIdAndStatus(request.getBandId(), request.getTargetUserId(), "JOINED")) {
            throw new IllegalArgumentException("이미 해당 밴드에 가입되어 있는 유저입니다.");
        }
        
        if (offerRepository.existsByTargetUserIdAndSeekingPostIdAndStatus(request.getTargetUserId(), request.getSeekingPostId(), "PENDING")) {
            throw new IllegalArgumentException("이미 대기 중인 제안이 있습니다.");
        }
        RecruitmentOffer offer = RecruitmentOffer.builder()
                .bandId(request.getBandId())
                .senderUserId(senderUserId)
                .targetUserId(request.getTargetUserId())
                .seekingPostId(request.getSeekingPostId())
                .position(request.getPosition())
                .message(request.getMessage())
                .status("PENDING")
                .build();
        RecruitmentOffer savedOffer = offerRepository.save(offer);

        // 1:1 채팅방 생성 (이미 존재하면 기존 방 반환)
        Long roomId = chatService.getOrCreateRoom(senderUserId, request.getTargetUserId());

        Bands band = bandRepository.findById(request.getBandId()).orElse(null);
        String bandName = band != null ? band.getName() : "알 수 없는 밴드";

        // 알림 발송
        notificationService.send(
                request.getTargetUserId(),
                senderUserId,
                com.ourband.api.domain.model.NotificationType.RECRUIT_OFFER,
                roomId.toString() + "?type=offer&targetId=" + savedOffer.getId(),
                bandName + "에서 영입 제안이 왔습니다."
        );

        return mapToOfferResponse(savedOffer);
    }

    @Transactional(readOnly = true)
    public List<RecruitmentOfferResponseDTO> getReceivedOffers(Long userId) {
        return offerRepository.findByTargetUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToOfferResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void acceptOffer(Long offerId, Long userId) {
        RecruitmentOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("제안을 찾을 수 없습니다."));
        if (!offer.getTargetUserId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        offer.accept();
        
        // 해당 밴드에 동일한 포지션(role)으로 비어있는(userId가 null인) 슬롯이 있는지 확인
        List<com.ourband.api.domain.model.BandMember> emptySlots = bandMemberRepository.findByBandId(offer.getBandId()).stream()
                .filter(m -> m.getUserId() == null && m.getRole().equals(offer.getPosition()))
                .collect(Collectors.toList());

        if (!emptySlots.isEmpty()) {
            com.ourband.api.domain.model.BandMember slot = emptySlots.get(0);
            com.ourband.api.domain.model.BandMember updatedSlot = com.ourband.api.domain.model.BandMember.builder()
                    .id(slot.getId())
                    .bandId(slot.getBandId())
                    .userId(userId)
                    .role(slot.getRole())
                    .status("JOINED")
                    .build();
            bandMemberRepository.save(updatedSlot);
        } else {
            com.ourband.api.domain.model.BandMember newMember = com.ourband.api.domain.model.BandMember.builder()
                    .bandId(offer.getBandId())
                    .userId(userId)
                    .role(offer.getPosition())
                    .status("JOINED")
                    .build();
            bandMemberRepository.save(newMember);
        }

        // 제안자(방장)에게 알림 발송
        User targetUser = userRepository.findById(userId).orElse(null);
        String targetName = targetUser != null ? targetUser.getNickname() : "알 수 없음";
        Bands band = bandRepository.findById(offer.getBandId()).orElse(null);
        String bandName = band != null ? band.getName() : "우리 밴드";
        
        notificationService.send(
                offer.getSenderUserId(),
                userId,
                com.ourband.api.domain.model.NotificationType.INFO, // General info notification
                offer.getBandId().toString(),
                targetName + "님이 " + offer.getPosition() + " 포지션으로 " + bandName + "에 가입 되었습니다."
        );
    }

    @Transactional
    public void rejectOffer(Long offerId, Long userId) {
        RecruitmentOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("제안을 찾을 수 없습니다."));
        if (!offer.getTargetUserId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        offer.reject();

        // 제안자(방장)에게 알림 발송
        User targetUser = userRepository.findById(userId).orElse(null);
        String targetName = targetUser != null ? targetUser.getNickname() : "알 수 없음";
        
        notificationService.send(
                offer.getSenderUserId(),
                userId,
                com.ourband.api.domain.model.NotificationType.INFO,
                offer.getBandId().toString(),
                targetName + "님이 영입 제안을 거절하였습니다."
        );
    }

    private MemberSeekingPostResponseDTO mapToSeekingPostResponse(MemberSeekingPost post) {
        User author = userRepository.findById(post.getUserId()).orElse(null);
        String authorName = author != null ? author.getNickname() : "알 수 없음";
        String authorProfileImageUrl = null;
        java.math.BigDecimal potential = java.math.BigDecimal.ZERO;
        if (author != null) {
            Profile profile = profileRepository.findByUser_UserId(author.getUserId()).orElse(null);
            if (profile != null) {
                authorProfileImageUrl = profile.getProfilePictureUrl();
                if (profile.getPotential() != null) {
                    potential = profile.getPotential();
                }
            }
        }

        return MemberSeekingPostResponseDTO.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .authorName(authorName)
                .authorProfileImageUrl(authorProfileImageUrl)
                .title(post.getTitle())
                .content(post.getContent())
                .position(post.getPosition())
                .location(post.getLocation())
                .genreStyle(post.getGenreStyle())
                .mediaUrl(post.getMediaUrl())
                .mediaType(post.getMediaType())
                .status(post.getStatus())
                .potential(potential)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private RecruitmentOfferResponseDTO mapToOfferResponse(RecruitmentOffer offer) {
        Bands band = bandRepository.findById(offer.getBandId()).orElse(null);
        String bandName = band != null ? band.getName() : "알 수 없는 밴드";
        String bandLogoUrl = band != null ? band.getLogoImageUrl() : null;

        return RecruitmentOfferResponseDTO.builder()
                .id(offer.getId())
                .bandId(offer.getBandId())
                .bandName(bandName)
                .bandLogoUrl(bandLogoUrl)
                .senderUserId(offer.getSenderUserId())
                .targetUserId(offer.getTargetUserId())
                .seekingPostId(offer.getSeekingPostId())
                .position(offer.getPosition())
                .message(offer.getMessage())
                .status(offer.getStatus())
                .createdAt(offer.getCreatedAt())
                .updatedAt(offer.getUpdatedAt())
                .build();
    }
}
