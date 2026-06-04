package com.ourband.api.domain.service;

import com.ourband.api.domain.model.ForbiddenWord;
import com.ourband.api.domain.model.PositionCategory;
import com.ourband.api.domain.repository.ForbiddenWordRepository;
import com.ourband.api.domain.repository.PositionCategoryRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SignupConfigService {

    private final ForbiddenWordRepository forbiddenWordRepository;
    private final PositionCategoryRepository positionCategoryRepository;

    @PostConstruct
    @Transactional
    public void initDefaultConfig() {
        if (forbiddenWordRepository.count() == 0) {
            String[] defaults = {"시발", "씨발", "병신", "새끼", "지랄", "존나", "개새끼", "도박", "바카라", "토토", "카지노", "섹스", "야동"};
            for (String word : defaults) {
                forbiddenWordRepository.save(ForbiddenWord.builder().word(word).build());
            }
        }
        
        if (positionCategoryRepository.count() == 0) {
            String[] defaults = {"보컬", "기타", "베이스", "드럼", "건반 / 피아노", "작곡 / 미디", "기타 악기"};
            for (String pos : defaults) {
                positionCategoryRepository.save(PositionCategory.builder().positionName(pos).build());
            }
        }
    }

    @Transactional(readOnly = true)
    public List<String> getAllForbiddenWords() {
        return forbiddenWordRepository.findAll().stream()
                .map(ForbiddenWord::getWord)
                .collect(Collectors.toList());
    }

    @Transactional
    public void addForbiddenWord(String word) {
        if (word != null && !word.trim().isEmpty() && !forbiddenWordRepository.existsByWord(word.trim())) {
            forbiddenWordRepository.save(ForbiddenWord.builder().word(word.trim()).build());
        }
    }

    @Transactional
    public void deleteForbiddenWord(String word) {
        forbiddenWordRepository.findByWord(word).ifPresent(forbiddenWordRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<String> getAllPositions() {
        return positionCategoryRepository.findAll().stream()
                .map(PositionCategory::getPositionName)
                .collect(Collectors.toList());
    }

    @Transactional
    public void addPosition(String positionName) {
        if (positionName != null && !positionName.trim().isEmpty() && !positionCategoryRepository.existsByPositionName(positionName.trim())) {
            positionCategoryRepository.save(PositionCategory.builder().positionName(positionName.trim()).build());
        }
    }

    @Transactional
    public void deletePosition(String positionName) {
        positionCategoryRepository.findByPositionName(positionName).ifPresent(positionCategoryRepository::delete);
    }
}
