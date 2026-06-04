package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.admin.AdminContentResponseDTO;
import java.util.List;

public interface AdminContentService {
    List<AdminContentResponseDTO> getAllContents();
    void deleteContent(String type, String id);
    void toggleContentVisibility(String type, String id);
}
