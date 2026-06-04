package com.ourband.api.domain.service;

import com.ourband.api.domain.model.DailyVisitor;
import com.ourband.api.domain.repository.DailyVisitorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class VisitorService {

    private final DailyVisitorRepository dailyVisitorRepository;
    
    // 하루 동안 방문한 userId 또는 IP를 메모리에 기록하여 중복 카운팅 방지
    private final Set<String> visitedToday = ConcurrentHashMap.newKeySet();
    private LocalDate lastClearedDate = LocalDate.now();

    @Transactional
    public void incrementVisitor(String identifier) {
        LocalDate today = LocalDate.now();
        
        // 날짜가 바뀌었으면 Set 초기화
        if (!today.equals(lastClearedDate)) {
            visitedToday.clear();
            lastClearedDate = today;
        }

        // 오늘 이미 집계된 식별자면 무시
        if (identifier != null && !visitedToday.add(identifier)) {
            return;
        }

        Optional<DailyVisitor> visitorOpt = dailyVisitorRepository.findByVisitDate(today);

        if (visitorOpt.isPresent()) {
            DailyVisitor visitor = visitorOpt.get();
            visitor.setDau(visitor.getDau() + 1);
            // MAU 로직 (단순히 일일 누적으로 간주하거나 1달 단위 통계 활용)
            visitor.setMau(visitor.getMau() + 1);
            dailyVisitorRepository.save(visitor);
        } else {
            // 새 일자 데이터 생성 (어제자 데이터에서 MAU 롤오버 또는 새로 계산 가능)
            int currentMau = calculateCurrentMonthMau(today);
            
            DailyVisitor newVisitor = DailyVisitor.builder()
                    .visitDate(today)
                    .dau(1)
                    .mau(currentMau + 1)
                    .build();
            dailyVisitorRepository.save(newVisitor);
        }
    }

    private int calculateCurrentMonthMau(LocalDate date) {
        // 실제로는 이번 달 1일부터 어제까지의 DAU를 합산하거나 별도 로직
        // 간단한 구현을 위해 0으로 시작 (실제론 어제 날짜 데이터를 가져와 MAU 복사 등)
        LocalDate yesterday = date.minusDays(1);
        return dailyVisitorRepository.findByVisitDate(yesterday)
                .map(DailyVisitor::getMau)
                .orElse(0);
    }

    @Transactional(readOnly = true)
    public List<com.ourband.api.domain.dto.admin.DailyVisitorResponseDTO> getVisitorTrends() {
        List<DailyVisitor> latest = dailyVisitorRepository.findTop7ByOrderByVisitDateDesc();
        
        // 데이터가 7일치가 안될 경우 빈 날짜를 채워줌
        java.util.List<com.ourband.api.domain.dto.admin.DailyVisitorResponseDTO> result = new java.util.ArrayList<>();
        LocalDate today = LocalDate.now();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MM/dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate targetDate = today.minusDays(i);
            DailyVisitor visitor = latest.stream()
                    .filter(v -> v.getVisitDate().equals(targetDate))
                    .findFirst()
                    .orElse(null);

            result.add(com.ourband.api.domain.dto.admin.DailyVisitorResponseDTO.builder()
                    .name(targetDate.format(formatter)) // "05/30"
                    .dau(visitor != null ? visitor.getDau() : 0)
                    .mau(visitor != null ? visitor.getMau() : 0)
                    .build());
        }

        return result;
    }
}
