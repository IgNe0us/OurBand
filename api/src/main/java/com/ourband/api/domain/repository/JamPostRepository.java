package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.JamPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JamPostRepository extends JpaRepository<JamPost, Long> {
    Page<JamPost> findByUser_UserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT j FROM JamPost j WHERE " +
           "(:genre IS NULL OR :genre = '전체 장르' OR j.genre = :genre) AND " +
           "(:instrument IS NULL OR :instrument = '전체 악기' OR j.instrument = :instrument) " +
           "ORDER BY j.createdAt DESC")
    Page<JamPost> searchJamPosts(@Param("genre") String genre,
                                 @Param("instrument") String instrument,
                                 Pageable pageable);

    List<JamPost> findByCreatedAtAfter(java.time.LocalDateTime since);
}
