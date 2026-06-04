package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.admin.AdminUserResponseDTO;
import java.util.List;

public interface AdminUserService {
    List<AdminUserResponseDTO> getAllUsers();
    void updateUserStatus(Long userId, String status, Integer suspendDays, String suspendReason);
    void updateUserRole(Long userId, String role);
}
