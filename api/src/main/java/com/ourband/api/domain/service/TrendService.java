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

        // 1. 최근 7일 활동 데이터 (부스트용)
        List<BandFollow> recentFollows = bandFollowRepository.findByCreatedAtAfter(sevenDaysAgo);
        Map<Long, Long> recentFollowsByBand = recentFollows.stream()
                .collect(Collectors.groupingBy(BandFollow::getBandId, Collectors.counting()));

        List<BandPost> recentPosts = bandPostRepository.findByIsHiddenFalseAndCreatedAtAfter(sevenDaysAgo);
        Map<Long, Integer> recentLikesByBand = recentPosts.stream()
                .collect(Collectors.groupingBy(BandPost::getBandId, Collectors.summingInt(p -> p.getLikeCount() != null ? p.getLikeCount() : 0)));
        Map<Long, Integer> recentCommentsByBand = recentPosts.stream()
                .collect(Collectors.groupingBy(BandPost::getBandId, Collectors.summingInt(p -> p.getCommentCount() != null ? p.getCommentCount() : 0)));

        // 2. 전체 게시물 데이터 (누적 점수용)
        List<BandPost> allPosts = bandPostRepository.findByIsHiddenFalse();
        Map<Long, Integer> totalLikesByBand = allPosts.stream()
                .collect(Collectors.groupingBy(BandPost::getBandId, Collectors.summingInt(p -> p.getLikeCount() != null ? p.getLikeCount() : 0)));
        Map<Long, Integer> totalCommentsByBand = allPosts.stream()
                .collect(Collectors.groupingBy(BandPost::getBandId, Collectors.summingInt(p -> p.getCommentCount() != null ? p.getCommentCount() : 0)));

        // 3. 전체 밴드 대상 점수 계산
        List<Bands> allBands = bandRepository.findAll();
        Map<Bands, Double> scores = new HashMap<>();

        for (Bands band : allBands) {
            Long bandId = band.getId();

            // 누적 점수: 전체 팔로워 + 전체 좋아요 + 전체 댓글 (절대 0이 되지 않음)
            long totalFollowers = bandFollowRepository.countByBandId(bandId);
            long totalLikes = totalLikesByBand.getOrDefault(bandId, 0);
            long totalComments = totalCommentsByBand.getOrDefault(bandId, 0);
            double baseScore = (totalFollowers * 3.0) + (totalLikes * 2.0) + (totalComments * 1.0);

            // 최근 7일 부스트: 최근 활동에 3배 가중치
            long recentNewFollows = recentFollowsByBand.getOrDefault(bandId, 0L);
            long recentLikes = recentLikesByBand.getOrDefault(bandId, 0);
            long recentComments = recentCommentsByBand.getOrDefault(bandId, 0);
            double recentBoost = ((recentNewFollows * 10) + (recentLikes * 5) + (recentComments * 3)) * 3.0;

            double finalScore = baseScore + recentBoost;
            if (finalScore > 0) {
                scores.put(band, finalScore);
            }
        }

        List<Bands> topBands;
        if (scores.isEmpty()) {
            // Fallback: 점수가 있는 밴드가 없으면 최신 생성순 10개
            log.info("No scored bands found, falling back to newest bands.");
            topBands = allBands.stream()
                    .sorted(Comparator.comparing(Bands::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .limit(10)
                    .collect(Collectors.toList());
        } else {
            topBands = scores.entrySet().stream()
                    .sorted(Map.Entry.<Bands, Double>comparingByValue().reversed())
                    .limit(10)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());
        }

        List<BandListResponseDTO> dtos = topBands.stream()
                .map(band -> mapBandToDTO(band))
                .collect(Collectors.toList());

        redisTemplate.opsForValue().set(REDIS_TREND_BANDS_KEY, dtos);
        return dtos;
    }

    public List<JamPostResponseDTO> updateTrendingJams() {
        // 전체 잼 대상 (7일 제한 제거 → 절대 사라지지 않음)
        List<JamPost> allJams = jamPostRepository.findByIsHiddenFalse();

        Map<JamPost, Double> scores = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();

        for (JamPost jam : allJams) {
            double baseScore = (jam.getViewCount() * 1.0) + (jam.getLikeCount() * 5.0) + (jam.getCommentCount() * 10.0) + (jam.getShareCount() * 15.0);
            
            // 완만한 시간 감쇠: 일(day) 단위, 지수 0.8 → 오래된 인기 영상도 천천히 밀려남
            long daysPassed = ChronoUnit.DAYS.between(jam.getCreatedAt(), now);
            double decayedScore = baseScore / Math.pow(daysPassed + 1, 0.8);
            
            if (decayedScore > 0) {
                scores.put(jam, decayedScore);
            }
        }

        List<JamPost> topJams;
        if (scores.isEmpty()) {
            // Fallback: 점수 있는 잼이 없으면 최신순 10개
            log.info("No scored jams found, falling back to newest jams.");
            topJams = jamPostRepository.findTop10ByIsHiddenFalseOrderByCreatedAtDesc();
        } else {
            topJams = scores.entrySet().stream()
                    .sorted(Map.Entry.<JamPost, Double>comparingByValue().reversed())
                    .limit(10)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());
        }

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
