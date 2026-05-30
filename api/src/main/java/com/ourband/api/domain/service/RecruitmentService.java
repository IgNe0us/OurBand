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
        return mapToOfferResponse(offerRepository.save(offer));
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
        
        BandMember newMember = BandMember.builder()
                .bandId(offer.getBandId())
                .userId(userId)
                .role(offer.getPosition())
                .status("JOINED")
                .build();
        bandMemberRepository.save(newMember);
    }

    @Transactional
    public void rejectOffer(Long offerId, Long userId) {
        RecruitmentOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("제안을 찾을 수 없습니다."));
        if (!offer.getTargetUserId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        offer.reject();
    }

    private MemberSeekingPostResponseDTO mapToSeekingPostResponse(MemberSeekingPost post) {
        User author = userRepository.findById(post.getUserId()).orElse(null);
        String authorName = author != null ? author.getNickname() : "알 수 없음";
        String authorProfileImageUrl = null;
        if (author != null) {
            Profile profile = profileRepository.findByUser_UserId(author.getUserId()).orElse(null);
            if (profile != null) {
                authorProfileImageUrl = profile.getProfilePictureUrl();
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
