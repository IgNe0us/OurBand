package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.Bands;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BandRepository extends JpaRepository<Bands, Long> {

    @Query("SELECT b FROM Bands b WHERE " +
           "(:genre IS NULL OR b.genre LIKE CONCAT('%', :genre, '%')) AND " +
           "(:location IS NULL OR b.location LIKE CONCAT('%', :location, '%')) AND " +
           "(:keyword IS NULL OR b.name LIKE CONCAT('%', :keyword, '%') OR b.description LIKE CONCAT('%', :keyword, '%')) " +
           "ORDER BY b.createdAt DESC")
    Page<Bands> searchBands(@Param("genre") String genre,
                            @Param("location") String location,
                            @Param("keyword") String keyword,
                            Pageable pageable);

    List<Bands> findByIdIn(List<Long> ids);
}
