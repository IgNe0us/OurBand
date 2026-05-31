package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "histories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    // 카운트(조회, 좋아요, 댓글 등)
    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    @Column(name = "comment_count", nullable = false)
    private Integer commentCount = 0;

    @Column(name = "share_count", nullable = false)
    private Integer shareCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "history_id")
    @OrderBy("sortOrder ASC") 
    private List<UserHistoryMedia> mediaList = new ArrayList<>();

    /**
     * 좋아요 수 증가
     */
    public void increaseLikeCount() {
        this.likeCount = (this.likeCount == null) ? 1 : this.likeCount + 1;
    }

    /**
     * 좋아요 수 감소 (0 이하로 떨어지지 않도록 방어)
     */
    public void decreaseLikeCount() {
        if (this.likeCount != null && this.likeCount > 0) {
            this.likeCount--;
        } else {
            this.likeCount = 0;
        }
    }

    /**
     * 댓글 수 증가
     */
    public void increaseCommentCount() {
        this.commentCount = (this.commentCount == null) ? 1 : this.commentCount + 1;
    }

    /**
     * 공유 수 증가
     */
    public void increaseShareCount() {
        this.shareCount = (this.shareCount == null) ? 1 : this.shareCount + 1;
    }

    /**
     * 조회수 증가
     */
    public void increaseViewCount() {
        this.viewCount = (this.viewCount == null) ? 1 : this.viewCount + 1;
    }
}