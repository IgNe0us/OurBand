package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.admin.AdminReportResponseDTO;
import java.util.List;

public interface AdminReportService {
    List<AdminReportResponseDTO> getAllReports();
    void updateReportStatus(Long reportId, String status);
}
