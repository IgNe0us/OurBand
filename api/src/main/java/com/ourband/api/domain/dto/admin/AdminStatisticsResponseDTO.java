package com.ourband.api.domain.dto.admin;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatisticsResponseDTO {
    private long totalUsers;
    private long newUsersToday;
    private long activeUsersToday;
    private long totalBands;
    private long newBandsToday;
    private long totalJams;
    private long totalCommunityPosts;
    
    // System Metrics
    private int cpuUsage; // 0-100 percentage
    private int ramUsage; // 0-100 percentage
    private int storageUsage; // 0-100 percentage
    
    // Admin To-Do
    private int pendingReports;
}
