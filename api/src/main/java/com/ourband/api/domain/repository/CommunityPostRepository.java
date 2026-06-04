package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    @Query("SELECT p FROM CommunityPost p WHERE p.boardType = :boardType AND p.isHidden = false " +
           "AND (:category IS NULL OR :category = '전체' OR p.category = :category) " +
           "AND (:part IS NULL OR :part = '전체' OR p.part = :part) " +
           "AND (:keyword IS NULL OR :keyword = '' OR p.title LIKE CONCAT('%', :keyword, '%') OR p.content LIKE CONCAT('%', :keyword, '%')) " +
           "AND (:isPopular = false OR (p.createdAt >= :popularSince AND (p.likeCount >= 5 OR p.commentCount >= 5)))")
    Page<CommunityPost> searchPosts(@Param("boardType") String boardType, 
                                    @Param("category") String category, 
                                    @Param("part") String part, 
                                    @Param("keyword") String keyword, 
                                    @Param("isPopular") boolean isPopular,
                                    @Param("popularSince") java.time.LocalDateTime popularSince,
                                    Pageable pageable);
}
