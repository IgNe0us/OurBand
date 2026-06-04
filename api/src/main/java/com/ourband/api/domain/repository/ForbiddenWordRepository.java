package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.ForbiddenWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ForbiddenWordRepository extends JpaRepository<ForbiddenWord, Long> {
    Optional<ForbiddenWord> findByWord(String word);
    boolean existsByWord(String word);
}
