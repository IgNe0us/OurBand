package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.admin.AdminStatisticsResponseDTO;
import com.ourband.api.domain.repository.UserRepository;
import com.ourband.api.domain.repository.BandRepository;
import com.ourband.api.domain.repository.JamPostRepository;
import com.ourband.api.domain.repository.CommunityPostRepository;
import com.ourband.api.domain.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.lang.management.ManagementFactory;
import com.sun.management.OperatingSystemMXBean;

@Service
@RequiredArgsConstructor
public class AdminStatisticsServiceImpl implements AdminStatisticsService {

    private final UserRepository userRepository;
    private final BandRepository bandRepository;
    private final JamPostRepository jamPostRepository;
    private final CommunityPostRepository communityPostRepository;
    private final ReportRepository reportRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminStatisticsResponseDTO getStatistics() {
        // System Metrics
        int cpuUsage = 0;
        int ramUsage = 0;
        int storageUsage = 0;

        try {
            OperatingSystemMXBean osBean = ManagementFactory.getPlatformMXBean(OperatingSystemMXBean.class);
            // CPU Load (0.0 - 1.0) -> Percentage
            double systemCpuLoad = osBean.getCpuLoad();
            if (systemCpuLoad >= 0) {
                cpuUsage = (int) (systemCpuLoad * 100);
            }

            // RAM
            long totalRam = osBean.getTotalMemorySize();
            long freeRam = osBean.getFreeMemorySize();
            if (totalRam > 0) {
                ramUsage = (int) (((double) (totalRam - freeRam) / totalRam) * 100);
            }

            // Storage (Root drive or working directory)
            File root = new File("/");
            long totalSpace = root.getTotalSpace();
            long freeSpace = root.getFreeSpace();
            if (totalSpace > 0) {
                storageUsage = (int) (((double) (totalSpace - freeSpace) / totalSpace) * 100);
            }
        } catch (Exception e) {
            // Ignored, fallback to 0
        }

        // Pending reports
        int pendingReports = reportRepository.countByStatus("PENDING");

        return AdminStatisticsResponseDTO.builder()
                .totalUsers(userRepository.count())
                .newUsersToday(0) // Requires date filtering query in repository, stub for now
                .activeUsersToday(0) 
                .totalBands(bandRepository.count())
                .newBandsToday(0)
                .totalJams(jamPostRepository.count())
                .totalCommunityPosts(communityPostRepository.count())
                .cpuUsage(cpuUsage)
                .ramUsage(ramUsage)
                .storageUsage(storageUsage)
                .pendingReports(pendingReports)
                .build();
    }
}
