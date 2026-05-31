package com.ourband.api.domain.repository;

import com.ourband.api.domain.dto.user.BandSimpleDTO;
import com.ourband.api.domain.model.BandMember;
import com.ourband.api.domain.model.Bands;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BandMemberRepository extends JpaRepository<BandMember, Long> {

    @Query("SELECT new com.ourband.api.domain.dto.user.BandSimpleDTO(b.id, b.name, bm.role, b.logoImageUrl, b.createdAt) " +
           "FROM BandMember bm, Bands b " +
           "WHERE bm.bandId = b.id AND bm.userId = :userId AND bm.status = 'JOINED'")
    List<BandSimpleDTO> findBandDetailsByUserId(@Param("userId") Long userId);

    List<BandMember> findByBandId(Long bandId);

    boolean existsByBandIdAndUserIdAndStatus(Long bandId, Long userId, String status);
}
