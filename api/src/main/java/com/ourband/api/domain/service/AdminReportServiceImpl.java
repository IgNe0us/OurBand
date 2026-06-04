package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.admin.AdminReportResponseDTO;
import com.ourband.api.domain.model.*;
import com.ourband.api.domain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminReportServiceImpl implements AdminReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final CommunityPostRepository communityPostRepository;
    private final CommunityPostCommentRepository communityPostCommentRepository;
    private final BandPostRepository bandPostRepository;
    private final BandPostCommentRepository bandPostCommentRepository;
    private final JamPostRepository jamPostRepository;
    private final JamPostCommentRepository jamPostCommentRepository;
    private final UserHistoryRepository userHistoryRepository;
    private final HistoryCommentRepository historyCommentRepository;
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    @Transactional(readOnly = true)
    public List<AdminReportResponseDTO> getAllReports() {
        return reportRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateReportStatus(Long reportId, String status) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));
        
        String upperStatus = status.toUpperCase();
        report.setStatus(upperStatus);

        boolean isHidden = upperStatus.equals("IN_PROGRESS");
        boolean isDeleted = upperStatus.equals("RESOLVED");
        // REJECTED sets both to false

        switch (report.getTargetType()) {
            case "COMMUNITY_POST":
                communityPostRepository.findById(report.getTargetId()).ifPresent(p -> {
                    p.setHidden(isHidden); p.setDeleted(isDeleted); communityPostRepository.save(p);
                });
                break;
            case "COMMUNITY_COMMENT":
                communityPostCommentRepository.findById(report.getTargetId()).ifPresent(c -> {
                    c.setHidden(isHidden); c.setDeleted(isDeleted); communityPostCommentRepository.save(c);
                });
                break;
            case "BAND_POST":
                bandPostRepository.findById(report.getTargetId()).ifPresent(p -> {
                    p.setHidden(isHidden); p.setDeleted(isDeleted); bandPostRepository.save(p);
                });
                break;
            case "BAND_COMMENT":
                bandPostCommentRepository.findById(report.getTargetId()).ifPresent(c -> {
                    c.setHidden(isHidden); c.setDeleted(isDeleted); bandPostCommentRepository.save(c);
                });
                break;
            case "JAM_POST":
                jamPostRepository.findById(report.getTargetId()).ifPresent(p -> {
                    p.setHidden(isHidden); p.setDeleted(isDeleted); jamPostRepository.save(p);
                });
                break;
            case "JAM_COMMENT":
                jamPostCommentRepository.findById(report.getTargetId()).ifPresent(c -> {
                    c.setHidden(isHidden); c.setDeleted(isDeleted); jamPostCommentRepository.save(c);
                });
                break;
            case "HISTORY_POST":
                userHistoryRepository.findById(report.getTargetId()).ifPresent(p -> {
                    p.setHidden(isHidden); p.setDeleted(isDeleted); userHistoryRepository.save(p);
                });
                break;
            case "HISTORY_COMMENT":
                historyCommentRepository.findById(report.getTargetId()).ifPresent(c -> {
                    c.setHidden(isHidden); c.setDeleted(isDeleted); historyCommentRepository.save(c);
                });
                break;
        }
    }

    private AdminReportResponseDTO mapToDTO(Report report) {
        String reporterName = userRepository.findById(report.getReporterId())
                .map(User::getNickname)
                .orElse("Unknown");

        String typeStr = report.getTargetType() != null ? report.getTargetType() : "UNKNOWN";
        String url = "";
        
        // 프론트엔드 라우팅 구조에 맞게 URL 맵핑
        switch (typeStr) {
            case "COMMUNITY_POST":
            case "COMMUNITY_COMMENT":
                url = "/community/post/" + report.getTargetId();
                break;
            case "BAND_POST":
            case "BAND_COMMENT":
                url = "/post/" + report.getTargetId();
                break;
            case "JAM_POST":
            case "JAM_COMMENT":
                url = "/jam?id=" + report.getTargetId();
                break;
            case "HISTORY_POST":
            case "HISTORY_COMMENT":
                url = "/profile?historyId=" + report.getTargetId();
                break;
            default:
                url = "/" + typeStr.toLowerCase() + "/" + report.getTargetId();
                break;
        }

        String statusStr = report.getStatus() != null ? report.getStatus().toLowerCase() : "pending";

        return AdminReportResponseDTO.builder()
                .id(String.valueOf(report.getId()))
                .type(typeStr)
                .url(url)
                .author(reporterName)
                .reason(report.getReason())
                .date(report.getCreatedAt() != null ? report.getCreatedAt().format(formatter) : "")
                .status(statusStr)
                .content(report.getReason()) // Provide reason as content preview for now
                .build();
    }
}
