package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);
    int countByReceiverIdAndIsReadFalse(Long receiverId);
}
