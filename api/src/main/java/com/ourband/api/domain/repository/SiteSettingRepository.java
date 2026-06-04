package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.SiteSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SiteSettingRepository extends JpaRepository<SiteSetting, String> {
    Optional<SiteSetting> findBySettingKey(String settingKey);
}
