package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.jam.JamPostResponseDTO;
import com.ourband.api.domain.dto.user.BandListResponseDTO;
import com.ourband.api.domain.model.*;
import com.ourband.api.domain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrendService {

    private final BandRepository bandRepository;
    private final BandPostRepository bandPostRepository;
    private final BandFollowRepository bandFollowRepository;
    private final BandMemberRepository bandMemberRepository;
    private final ProfileRepository profileRepository;

    private final JamPostRepository jamPostRepository;
    private final JamService jamService;

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String REDIS_TREND_BANDS_KEY = "trend:bands:top10";
    private static final String REDIS_TREND_JAMS_KEY = "trend:jams:top10";

    /**
     * 서버 기동 완료 후 기존 캐시 삭제 및 최신 데이터로 갱신
     */
    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    @org.springframework.transaction.annotation.Transactional
    public void initTrendsOnStartup() {
        log.info("Clearing stale trend cache and rebuilding...");
        redisTemplate.delete(REDIS_TREND_BANDS_KEY);
        redisTemplate.delete(REDIS_TREND_JAMS_KEY);
        updateTrendingBands();
        updateTrendingJams();
        log.info("Trend cache rebuilt on startup.");
    }

    /**
     * 매 시간 0분 0초에 트렌드 데이터 갱신
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void updateTrendsScheduler() {
        log.info("Starting hourly trend update...");
        updateTrendingBands();
        updateTrendingJams();
        log.info("Hourly trend update completed.");
    }

    public List<?> getTrendingBands() {
        List<?> cached = (List<?>) redisTemplate.opsForValue().get(REDIS_TREND_BANDS_KEY);
        if (cached != null && !cached.isEmpty()) {
            return cached;
        }
        return updateTrendingBands();
    }

    public List<JamPostResponseDTO> getTrendingJams() {
        Object cached = redisTemplate.opsForValue().get(REDIS_TREND_JAMS_KEY);
        if (cached instanceof List && !((List<?>) cached).isEmpty() && (((List<?>) cached).get(0) instanceof Long || ((List<?>) cached).get(0) instanceof Integer)) {
            List<Number> cachedIds = (List<Number>) cached;
            List<Long> ids = cachedIds.stream().map(Number::longValue).collect(Collectors.toList());
            List<JamPost> jams = jamPostRepository.findAllById(ids);
            Map<Long, JamPost> jamMap = jams.stream().collect(Collectors.toMap(JamPost::getId, j -> j));
            return ids.stream()
                    .map(jamMap::get)
                    .filter(Objects::nonNull)
                    .map(j -> jamService.mapToDTO(j, null))
                    .collect(Collectors.toList());
        }
        return updateTrendingJams();
    }

    public List<BandListResponseDTO> updateTrendingBands() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        // Fetch recent followers
        List<BandFollow> recentFollows = bandFollowRepository.findByCreatedAtAfter(sevenDaysAgo);
        Map<Long, Long> newFollowsByBand = recentFollows.stream()
                .collect(Collectors.groupingBy(BandFollow::getBandId, Collectors.counting()));

        // Fetch recent posts to aggregate likes and comments
        List<BandPost> recentPosts = bandPostRepository.findByIsHiddenFalseAndCreatedAtAfter(sevenDaysAgo);
        Map<Long, Integer> recentLikesByBand = recentPosts.stream()
                .collect(Collectors.groupingBy(BandPost::getBandId, Collectors.summingInt(p -> p.getLikeCount() != null ? p.getLikeCount() : 0)));
        Map<Long, Integer> recentCommentsByBand = recentPosts.stream()
                .collect(Collectors.groupingBy(BandPost::getBandId, Collectors.summingInt(p -> p.getCommentCount() != null ? p.getCommentCount() : 0)));

        // Get all bands
        List<Bands> allBands = bandRepository.findAll();

        // Calculate scores
        Map<Bands, Long> scores = new HashMap<>();
        for (Bands band : allBands) {
            Long bandId = band.getId();
            long newFollows = newFollowsByBand.getOrDefault(bandId, 0L);
            long recentLikes = recentLikesByBand.getOrDefault(bandId, 0);
            long recentComments = recentCommentsByBand.getOrDefault(bandId, 0);

            long score = (newFollows * 10) + (recentLikes * 5) + (recentComments * 3);
            if (score > 0) {
                scores.put(band, score);
            }
        }

        // Sort by score and take top 10
        List<Bands> topBands = scores.entrySet().stream()
                .sorted(Map.Entry.<Bands, Long>comparingByValue().reversed())
                .limit(10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Map to DTO
        List<BandListResponseDTO> dtos = topBands.stream()
                .map(band -> mapBandToDTO(band))
                .collect(Collectors.toList());

        redisTemplate.opsForValue().set(REDIS_TREND_BANDS_KEY, dtos);
        return dtos;
    }

    public List<JamPostResponseDTO> updateTrendingJams() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<JamPost> recentJams = jamPostRepository.findByIsHiddenFalseAndCreatedAtAfter(sevenDaysAgo);

        Map<JamPost, Double> scores = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();

        for (JamPost jam : recentJams) {
            double baseScore = (jam.getViewCount() * 1.0) + (jam.getLikeCount() * 5.0) + (jam.getCommentCount() * 10.0) + (jam.getShareCount() * 15.0);
            
            // Time decay: (score) / (hours_passed + 2)^1.5
            long hoursPassed = ChronoUnit.HOURS.between(jam.getCreatedAt(), now);
            double decayedScore = baseScore / Math.pow(hoursPassed + 2, 1.5);
            
            if (decayedScore > 0) {
                scores.put(jam, decayedScore);
            }
        }

        List<JamPost> topJams = scores.entrySet().stream()
                .sorted(Map.Entry.<JamPost, Double>comparingByValue().reversed())
                .limit(10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        List<Long> topIds = topJams.stream().map(JamPost::getId).collect(Collectors.toList());
        redisTemplate.opsForValue().set(REDIS_TREND_JAMS_KEY, topIds);

        return topJams.stream()
                .map(j -> jamService.mapToDTO(j, null))
                .collect(Collectors.toList());
    }

    private BandListResponseDTO mapBandToDTO(Bands band) {
        List<BandMember> members = bandMemberRepository.findByBandId(band.getId());
        int memberCount = (int) members.stream().filter(m -> m.getUserId() != null).count();

        List<BandListResponseDTO.RecruitingPosition> recruitingPositions = members.stream()
                .filter(m -> m.getUserId() == null)
                .map(m -> BandListResponseDTO.RecruitingPosition.builder()
                        .id(m.getId())
                        .role(m.getRole())
                        .build())
                .collect(Collectors.toList());

        boolean isRecruiting = !recruitingPositions.isEmpty();
        long followerCount = bandFollowRepository.countByBandId(band.getId());

        BandPost latestVideoPost = bandPostRepository.findFirstByBandIdAndMediaTypeAndIsHiddenFalseOrderByCreatedAtDesc(band.getId(), "VIDEO");
        String latestVideoUrl = latestVideoPost != null ? latestVideoPost.getMediaUrl() : null;

        BandMember leader = members.stream()
                .filter(m -> m.getUserId() != null)
                .min(Comparator.comparing(BandMember::getId))
                .orElse(null);

        Long leaderId = null;
        String leaderProfileImageUrl = null;
        if (leader != null) {
            leaderId = leader.getUserId();
            Profile leaderProfile = profileRepository.findByUser_UserId(leaderId).orElse(null);
            if (leaderProfile != null) {
                leaderProfileImageUrl = leaderProfile.getProfilePictureUrl();
            }
        }

        List<String> memberProfileUrls = members.stream()
                .filter(m -> m.getUserId() != null)
                .map(m -> profileRepository.findByUser_UserId(m.getUserId()).orElse(null))
                .filter(Objects::nonNull)
                .map(Profile::getProfilePictureUrl)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

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
                .isFollowed(false) // Cached data cannot know if the specific user follows it
                .followerCount(followerCount)
                .latestVideoUrl(latestVideoUrl)
                .leaderId(leaderId)
                .leaderProfileImageUrl(leaderProfileImageUrl)
                .memberProfileUrls(memberProfileUrls)
                .createdAt(band.getCreatedAt())
                .build();
    }
}
