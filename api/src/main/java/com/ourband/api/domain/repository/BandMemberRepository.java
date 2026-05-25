package com.ourband.api.domain.repository;

import com.ourband.api.domain.dto.user.BandSimpleDTO;
import com.ourband.api.domain.model.BandMember;
import com.ourband.api.domain.model.Band;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BandMemberRepository extends JpaRepository<BandMember, Long> {

    // 💡 4번째 인자인 b.createdAt을 쿼리 맨 뒤에 추가해 줍니다!
    @Query("SELECT new com.ourband.api.domain.dto.user.BandSimpleDTO(b.id, b.name, bm.role, b.logoImageUrl, b.createdAt) " +
           "FROM BandMember bm " +
           "JOIN Band b ON bm.bandId = b.id " +
           "WHERE bm.userId = :userId AND bm.status = 'JOINED'")
    List<BandSimpleDTO> findBandDetailsByUserId(@Param("userId") Long userId);
}