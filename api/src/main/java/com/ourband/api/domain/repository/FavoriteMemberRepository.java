package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.FavoriteMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteMemberRepository extends JpaRepository<FavoriteMember, Long> {
    Optional<FavoriteMember> findByUser_UserIdAndTargetUser_UserId(Long userId, Long targetUserId);
    List<FavoriteMember> findByUser_UserId(Long userId);
    void deleteByUser_UserIdAndTargetUser_UserId(Long userId, Long targetUserId);
    boolean existsByUser_UserIdAndTargetUser_UserId(Long userId, Long targetUserId);
}
