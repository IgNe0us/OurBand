package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.admin.AdminUserResponseDTO;
import com.ourband.api.domain.model.User;
import com.ourband.api.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateUserStatus(Long userId, String status, Integer suspendDays, String suspendReason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        boolean isActive = "active".equalsIgnoreCase(status);
        user.setIsActive(isActive);
        
        if (!isActive) {
            user.setSuspendedUntil(suspendDays != null ? java.time.LocalDateTime.now().plusDays(suspendDays) : java.time.LocalDateTime.now().plusYears(100)); // default permanent if null
            user.setSuspendReason(suspendReason);
        } else {
            user.setSuspendedUntil(null);
            user.setSuspendReason(null);
        }
    }

    @Override
    @Transactional
    public void updateUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        user.setType(role);
    }

    private AdminUserResponseDTO mapToDTO(User user) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        String joinedDate = user.getCreatedAt() != null ? user.getCreatedAt().format(formatter) : "Unknown";
        String status = Boolean.TRUE.equals(user.getIsActive()) ? "active" : "banned";
        
        String suspendedUntil = user.getSuspendedUntil() != null ? user.getSuspendedUntil().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : null;
        
        return AdminUserResponseDTO.builder()
                .id(String.valueOf(user.getUserId()))
                .username(user.getNickname())
                .email(user.getEmail())
                .joined(joinedDate)
                .status(status)
                .role(user.getType() != null ? user.getType() : "user")
                .reports(0) // TODO: Implement report count logic if needed
                .suspendedUntil(suspendedUntil)
                .suspendReason(user.getSuspendReason())
                .build();
    }
}
