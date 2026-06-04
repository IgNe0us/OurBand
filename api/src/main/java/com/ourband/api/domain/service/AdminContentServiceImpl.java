package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.admin.AdminContentResponseDTO;
import com.ourband.api.domain.model.JamPost;
import com.ourband.api.domain.model.CommunityPost;
import com.ourband.api.domain.model.BandPost;
import com.ourband.api.domain.model.UserHistory;
import com.ourband.api.domain.model.User;
import com.ourband.api.domain.repository.JamPostRepository;
import com.ourband.api.domain.repository.CommunityPostRepository;
import com.ourband.api.domain.repository.BandPostRepository;
import com.ourband.api.domain.repository.UserHistoryRepository;
import com.ourband.api.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminContentServiceImpl implements AdminContentService {

    private final JamPostRepository jamPostRepository;
    private final CommunityPostRepository communityPostRepository;
    private final BandPostRepository bandPostRepository;
    private final UserHistoryRepository userHistoryRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Override
    @Transactional(readOnly = true)
    public List<AdminContentResponseDTO> getAllContents() {
        List<AdminContentResponseDTO> allContents = new ArrayList<>();

        // Fetch JamPosts
        List<JamPost> jams = jamPostRepository.findAll();
        for (JamPost jam : jams) {
            String authorName = jam.getUser() != null ? jam.getUser().getNickname() : "Unknown";
            String date = jam.getCreatedAt() != null ? jam.getCreatedAt().format(formatter) : "Unknown";
            allContents.add(AdminContentResponseDTO.builder()
                    .id(String.valueOf(jam.getId()))
                    .board("오디오잼")
                    .title(jam.getTitle() != null ? jam.getTitle() : "Untitled")
                    .author(authorName)
                    .date(date)
                    .hidden(jam.isHidden())
                    .type("jam")
                    .build());
        }

        // Fetch CommunityPosts
        List<CommunityPost> comms = communityPostRepository.findAll();
        for (CommunityPost comm : comms) {
            String authorName = "Unknown";
            if (comm.getUserId() != null) {
                authorName = userRepository.findById(comm.getUserId()).map(User::getNickname).orElse("Unknown");
            }
            String date = comm.getCreatedAt() != null ? comm.getCreatedAt().format(formatter) : "Unknown";
            allContents.add(AdminContentResponseDTO.builder()
                    .id(String.valueOf(comm.getId()))
                    .board("커뮤니티 - " + (comm.getBoardType() != null ? comm.getBoardType() : ""))
                    .title(comm.getTitle() != null ? comm.getTitle() : "Untitled")
                    .author(authorName)
                    .date(date)
                    .hidden(comm.isHidden())
                    .type("community")
                    .build());
        }

        // Fetch UserHistory
        List<UserHistory> histories = userHistoryRepository.findAll();
        for (UserHistory history : histories) {
            String authorName = "Unknown";
            if (history.getUserId() != null) {
                authorName = userRepository.findById(history.getUserId()).map(User::getNickname).orElse("Unknown");
            }
            String date = history.getCreatedAt() != null ? history.getCreatedAt().format(formatter) : "Unknown";
            allContents.add(AdminContentResponseDTO.builder()
                    .id(String.valueOf(history.getId()))
                    .board("히스토리")
                    .title(history.getTitle() != null ? history.getTitle() : "Untitled")
                    .author(authorName)
                    .date(date)
                    .hidden(history.isHidden())
                    .type("history")
                    .build());
        }

        // Fetch BandPosts
        List<BandPost> bandPosts = bandPostRepository.findAll();
        for (BandPost bandPost : bandPosts) {
            String authorName = "Unknown";
            if (bandPost.getAuthorId() != null) {
                authorName = userRepository.findById(bandPost.getAuthorId()).map(User::getNickname).orElse("Unknown");
            }
            String date = bandPost.getCreatedAt() != null ? bandPost.getCreatedAt().format(formatter) : "Unknown";
            allContents.add(AdminContentResponseDTO.builder()
                    .id(String.valueOf(bandPost.getId()))
                    .board("밴드 게시판 - " + (bandPost.getBoardType() != null ? bandPost.getBoardType() : ""))
                    .title(bandPost.getTitle() != null ? bandPost.getTitle() : "Untitled")
                    .author(authorName)
                    .date(date)
                    .hidden(bandPost.isHidden())
                    .type("band")
                    .build());
        }
        
        return allContents;
    }

    @Override
    @Transactional
    public void deleteContent(String type, String id) {
        Long contentId = Long.parseLong(id);
        if ("jam".equalsIgnoreCase(type)) {
            jamPostRepository.deleteById(contentId);
        } else if ("community".equalsIgnoreCase(type)) {
            communityPostRepository.deleteById(contentId);
        } else if ("band".equalsIgnoreCase(type)) {
            bandPostRepository.deleteById(contentId);
        } else if ("history".equalsIgnoreCase(type)) {
            userHistoryRepository.deleteById(contentId);
        }
    }

    @Override
    @Transactional
    public void toggleContentVisibility(String type, String id) {
        Long contentId = Long.parseLong(id);
        if ("jam".equalsIgnoreCase(type)) {
            JamPost post = jamPostRepository.findById(contentId).orElse(null);
            if (post != null) {
                post.setHidden(!post.isHidden());
                jamPostRepository.save(post);
            }
        } else if ("community".equalsIgnoreCase(type)) {
            CommunityPost post = communityPostRepository.findById(contentId).orElse(null);
            if (post != null) {
                post.setHidden(!post.isHidden());
                communityPostRepository.save(post);
            }
        } else if ("band".equalsIgnoreCase(type)) {
            BandPost post = bandPostRepository.findById(contentId).orElse(null);
            if (post != null) {
                post.setHidden(!post.isHidden());
                bandPostRepository.save(post);
            }
        } else if ("history".equalsIgnoreCase(type)) {
            UserHistory post = userHistoryRepository.findById(contentId).orElse(null);
            if (post != null) {
                post.setHidden(!post.isHidden());
                userHistoryRepository.save(post);
            }
        }
    }
}
