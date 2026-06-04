package com.ourband.api.domain.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ourband.api.domain.dto.admin.SiteSettingDTO;
import com.ourband.api.domain.model.SiteSetting;
import com.ourband.api.domain.repository.SiteSettingRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SiteSettingsService {

    private final SiteSettingRepository siteSettingRepository;
    private final ObjectMapper objectMapper;

    // 초기 데이터 삽입
    @PostConstruct
    @Transactional
    public void initDefaultSettings() {
        if (siteSettingRepository.count() == 0) {
            Map<String, String> defaults = new HashMap<>();
            defaults.put("maintenance_mode", "false");
            defaults.put("global_notice", "");
            defaults.put("home_banner_url", "");
            defaults.put("home_banner_link", "");
            defaults.put("seo_title", "OurBand - 글로벌 밴드 커뮤니티");
            defaults.put("seo_description", "전 세계의 뮤지션들과 함께 음악을 만들고 밴드를 결성해보세요.");
            defaults.put("seo_og_image", "");
            defaults.put("terms_of_service", "이용약관 내용을 입력해주세요.");
            defaults.put("privacy_policy", "개인정보처리방침 내용을 입력해주세요.");


            defaults.forEach((key, value) -> {
                siteSettingRepository.save(SiteSetting.builder()
                        .settingKey(key)
                        .settingValue(value)
                        .description("Default setting for " + key)
                        .build());
            });
        }
    }

    @Transactional(readOnly = true)
    public List<SiteSettingDTO> getAllSettings() {
        return siteSettingRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, String> getPublicSettings() {
        List<SiteSetting> settings = siteSettingRepository.findAll();
        return settings.stream()
                .collect(Collectors.toMap(SiteSetting::getSettingKey, setting -> setting.getSettingValue() != null ? setting.getSettingValue() : ""));
    }

    @Transactional
    public SiteSettingDTO updateSetting(String key, String value) {
        SiteSetting setting = siteSettingRepository.findById(key).orElseGet(() -> 
                SiteSetting.builder().settingKey(key).build()
        );
        setting.setSettingValue(value);
        setting = siteSettingRepository.save(setting);
        return toDTO(setting);
    }

    @Transactional
    public void updateMultipleSettings(Map<String, String> updates) {
        updates.forEach((key, value) -> {
            SiteSetting setting = siteSettingRepository.findById(key).orElseGet(() -> 
                    SiteSetting.builder().settingKey(key).description("").build()
            );
            setting.setSettingValue(value);
            siteSettingRepository.save(setting);
        });
    }

    @Transactional(readOnly = true)
    public boolean isMaintenanceMode() {
        return siteSettingRepository.findById("maintenance_mode")
                .map(setting -> "true".equalsIgnoreCase(setting.getSettingValue()))
                .orElse(false);
    }

    private SiteSettingDTO toDTO(SiteSetting setting) {
        return SiteSettingDTO.builder()
                .settingKey(setting.getSettingKey())
                .settingValue(setting.getSettingValue())
                .description(setting.getDescription())
                .build();
    }
}
