package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.UserHistoryMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserHistoryMediaRepository extends JpaRepository<UserHistoryMedia, Long> {

    /**
     * 💡 특정 히스토리의 미디어 목록을 sort_order 오름차순으로 조회합니다.
     * 나중에 여러 장의 사진/영상을 순서대로 프론트엔드에 전달할 때 아주 유용합니다.
     */
    List<UserHistoryMedia> findByHistoryIdOrderBySortOrderAsc(Long historyId);

    /**
     * 💡 특정 히스토리 데이터를 삭제할 때 연관된 미디어 데이터를 한 번에 삭제합니다.
     * @Modifying과 @Query를 사용하여 개별 삭제보다 훨씬 빠른 속도로 벌크 삭제를 수행합니다.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM UserHistoryMedia m WHERE m.historyId = :historyId")
    void deleteByHistoryId(@Param("historyId") Long historyId);
}