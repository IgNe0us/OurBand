package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.report.ReportCreateRequestDTO;
import com.ourband.api.domain.model.Report;
import com.ourband.api.domain.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;

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
}
