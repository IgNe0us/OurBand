package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.portfolio.PortfolioCreateRequestDTO;
import com.ourband.api.domain.dto.portfolio.PortfolioResponseDTO;
import com.ourband.api.domain.model.Portfolio;
import com.ourband.api.domain.model.User;
import com.ourband.api.domain.repository.PortfolioRepository;
import com.ourband.api.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;

    @Transactional
    public PortfolioResponseDTO createPortfolio(Long userId, PortfolioCreateRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Portfolio portfolio = Portfolio.builder()
                .user(user)
                .mediaUrl(request.getMediaUrl())
                .title(request.getTitle())
                .description(request.getDescription())
                .isPublic(request.isPublic())
                .build();

        Portfolio saved = portfolioRepository.save(portfolio);
        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public Page<PortfolioResponseDTO> getUserPortfolios(Long targetUserId, Long currentUserId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Portfolio> portfolios;

        if (targetUserId.equals(currentUserId)) {
            // Can see both public and private
            portfolios = portfolioRepository.findByUser_UserIdOrderByCreatedAtDesc(targetUserId, pageable);
        } else {
            // Can only see public
            portfolios = portfolioRepository.findByUser_UserIdAndIsPublicTrueOrderByCreatedAtDesc(targetUserId, pageable);
        }

        return portfolios.map(this::mapToDTO);
    }

    @Transactional
    public void deletePortfolio(Long userId, Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new RuntimeException("Portfolio not found"));
        
        if (!portfolio.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        
        portfolioRepository.delete(portfolio);
    }

    private PortfolioResponseDTO mapToDTO(Portfolio p) {
        return PortfolioResponseDTO.builder()
                .id(p.getId())
                .userId(p.getUser().getUserId())
                .mediaUrl(p.getMediaUrl())
                .title(p.getTitle())
                .description(p.getDescription())
                .isPublic(p.isPublic())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
