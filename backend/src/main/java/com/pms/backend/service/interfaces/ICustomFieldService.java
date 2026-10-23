package com.pms.backend.service.interfaces;

import com.pms.backend.dto.CreateCustomFieldRequest;
import com.pms.backend.dto.CustomFieldDto;
import com.pms.backend.dto.CustomFieldValueDto;
import com.pms.backend.dto.UpdateCustomFieldRequest;
import com.pms.backend.model.Issue;
import com.pms.backend.model.User;

import java.util.List;
import java.util.Map;

public interface ICustomFieldService {
    List<CustomFieldDto> getCustomFields(Long projectId);
    CustomFieldDto createCustomField(Long projectId, CreateCustomFieldRequest request, User currentUser);
    CustomFieldDto updateCustomField(Long projectId, Long fieldId, UpdateCustomFieldRequest request, User currentUser);
    void deleteCustomField(Long projectId, Long fieldId, User currentUser);

    List<CustomFieldValueDto> getIssueCustomFields(Long issueId, Long projectId);
    void validateAndSaveIssueCustomFields(Issue issue, Map<String, String> values);
}
