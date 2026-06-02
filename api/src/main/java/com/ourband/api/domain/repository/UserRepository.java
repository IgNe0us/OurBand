package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 이메일을 통해 사용자 정보를 조회합니다. (UNIQUE 제약조건을 활용하여 조회)
     * @param email 검색할 이메일
     * @return Optional<User> 사용자 엔티티
     */
    Optional<User> findByEmail(String email);

    /**
     * 닉네임으로 사용자를 조회합니다.
     * @param nickname 검색할 닉네임
     * @return Optional<User> 사용자 엔티티
     */
    Optional<User> findByNickname(String nickname);

    /**
     * 닉네임으로 사용자 목록을 검색합니다. (부분 일치 검색)
     * @param keyword 검색어
     * @return List<User> 검색된 사용자 목록
     */
    java.util.List<User> findByNicknameContainingIgnoreCase(String keyword);
}