package com.pms.backend.service.impl;

import com.pms.backend.dao.IssueCustomFieldValueRepository;
import com.pms.backend.dao.ProjectCustomFieldRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.dto.CreateCustomFieldRequest;
import com.pms.backend.dto.CustomFieldDto;
import com.pms.backend.dto.CustomFieldValueDto;
import com.pms.backend.dto.UpdateCustomFieldRequest;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.exception.ValidationException;
import com.pms.backend.model.Issue;
import com.pms.backend.model.IssueCustomFieldValue;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectCustomField;
import com.pms.backend.model.User;
import com.pms.backend.security.ProjectSecurity;
import com.pms.backend.service.interfaces.IAuditService;
import com.pms.backend.service.interfaces.ICustomFieldService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CustomFieldServiceImpl implements ICustomFieldService {

    private final ProjectCustomFieldRepository customFieldRepository;
    private final IssueCustomFieldValueRepository customFieldValueRepository;
    private final ProjectRepository projectRepository;
    private final ProjectSecurity projectSecurity;
    private final IAuditService auditService;

    public CustomFieldServiceImpl(ProjectCustomFieldRepository customFieldRepository,
                                  IssueCustomFieldValueRepository customFieldValueRepository,
                                  ProjectRepository projectRepository,
                                  ProjectSecurity projectSecurity,
                                  IAuditService auditService) {
        this.customFieldRepository = customFieldRepository;
        this.customFieldValueRepository = customFieldValueRepository;
        this.projectRepository = projectRepository;
        this.projectSecurity = projectSecurity;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomFieldDto> getCustomFields(Long projectId) {
        return customFieldRepository.findByProjectIdOrderByPositionAscIdAsc(projectId).stream()
                .map(CustomFieldDto::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CustomFieldDto createCustomField(Long projectId, CreateCustomFieldRequest request, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        projectSecurity.assertProjectWritable(project);

        String fieldKey = request.getFieldKey();
        if (!StringUtils.hasText(fieldKey)) {
            fieldKey = generateFieldKey(request.getName());
        } else {
            fieldKey = fieldKey.trim().toLowerCase();
        }

        if (customFieldRepository.existsByProjectIdAndFieldKey(projectId, fieldKey)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Mã trường '" + fieldKey + "' đã tồn tại trong dự án");
        }

        ProjectCustomField field = new ProjectCustomField(
                project,
                request.getName().trim(),
                fieldKey,
                request.getType() != null ? request.getType().toUpperCase() : "TEXT",
                request.getRequired() != null ? request.getRequired() : false,
                request.getOptions(),
                request.getDefaultValue(),
                request.getDescription(),
                request.getPosition() != null ? request.getPosition() : 0
        );

        ProjectCustomField saved = customFieldRepository.save(field);
        auditService.log("CREATE_CUSTOM_FIELD", "PROJECT", projectId, projectId, null,
                "Tạo trường tùy chỉnh: " + saved.getName() + " (" + saved.getFieldKey() + ")");

        return CustomFieldDto.from(saved);
    }

    @Override
    @Transactional
    public CustomFieldDto updateCustomField(Long projectId, Long fieldId, UpdateCustomFieldRequest request, User currentUser) {
        projectSecurity.assertProjectWritable(projectId);

        ProjectCustomField field = customFieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Custom field not found: " + fieldId));

        if (!field.getProject().getId().equals(projectId)) {
            throw new ValidationException("Field does not belong to project " + projectId);
        }

        field.setName(request.getName().trim());
        if (request.getType() != null) {
            field.setType(request.getType().toUpperCase());
        }
        if (request.getRequired() != null) {
            field.setRequired(request.getRequired());
        }
        field.setOptions(request.getOptions());
        field.setDefaultValue(request.getDefaultValue());
        field.setDescription(request.getDescription());
        if (request.getPosition() != null) {
            field.setPosition(request.getPosition());
        }

        ProjectCustomField saved = customFieldRepository.save(field);
        auditService.log("UPDATE_CUSTOM_FIELD", "PROJECT", projectId, projectId, null,
                "Cập nhật trường tùy chỉnh: " + saved.getName() + " (" + saved.getFieldKey() + ")");

        return CustomFieldDto.from(saved);
    }

    @Override
    @Transactional
    public void deleteCustomField(Long projectId, Long fieldId, User currentUser) {
        projectSecurity.assertProjectWritable(projectId);

        ProjectCustomField field = customFieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Custom field not found: " + fieldId));

        if (!field.getProject().getId().equals(projectId)) {
            throw new ValidationException("Field does not belong to project " + projectId);
        }

        customFieldRepository.delete(field);
        auditService.log("DELETE_CUSTOM_FIELD", "PROJECT", projectId, projectId, null,
                "Xoá trường tùy chỉnh: " + field.getName() + " (" + field.getFieldKey() + ")");
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomFieldValueDto> getIssueCustomFields(Long issueId, Long projectId) {
        List<ProjectCustomField> definitions = customFieldRepository.findByProjectIdOrderByPositionAscIdAsc(projectId);
        if (definitions.isEmpty()) {
            return Collections.emptyList();
        }

        List<IssueCustomFieldValue> values = customFieldValueRepository.findByIssueId(issueId);
        Map<Long, String> valueMap = values.stream()
                .collect(Collectors.toMap(v -> v.getField().getId(), IssueCustomFieldValue::getFieldValue, (v1, v2) -> v1));

        List<CustomFieldValueDto> result = new ArrayList<>();
        for (ProjectCustomField def : definitions) {
            String val = valueMap.get(def.getId());
            if (val == null && StringUtils.hasText(def.getDefaultValue())) {
                val = def.getDefaultValue();
            }
            result.add(new CustomFieldValueDto(
                    def.getId(),
                    def.getFieldKey(),
                    def.getName(),
                    def.getType(),
                    def.getRequired(),
                    def.getOptions(),
                    val
            ));
        }
        return result;
    }

    @Override
    @Transactional
    public void validateAndSaveIssueCustomFields(Issue issue, Map<String, String> values) {
        if (issue == null || issue.getProject() == null) return;
        Long projectId = issue.getProject().getId();
        List<ProjectCustomField> definitions = customFieldRepository.findByProjectIdOrderByPositionAscIdAsc(projectId);
        if (definitions.isEmpty()) return;

        Map<String, String> safeValues = values != null ? values : Collections.emptyMap();

        for (ProjectCustomField def : definitions) {
            String submittedVal = safeValues.get(def.getFieldKey());
            if (submittedVal == null) {
                submittedVal = safeValues.get(String.valueOf(def.getId()));
            }

            // Validation rules
            if (Boolean.TRUE.equals(def.getRequired())) {
                if (!StringUtils.hasText(submittedVal)) {
                    // Check if already has value in DB
                    Optional<IssueCustomFieldValue> existing = customFieldValueRepository.findByIssueIdAndFieldId(issue.getId(), def.getId());
                    if (existing.isEmpty() || !StringUtils.hasText(existing.get().getFieldValue())) {
                        throw new ValidationException("Trường '" + def.getName() + "' là bắt buộc");
                    }
                }
            }

            if (StringUtils.hasText(submittedVal)) {
                String trimmed = submittedVal.trim();
                // Validate data type
                if ("NUMBER".equalsIgnoreCase(def.getType())) {
                    try {
                        Double.parseDouble(trimmed);
                    } catch (NumberFormatException e) {
                        throw new ValidationException("Trường '" + def.getName() + "' phải là giá trị số hợp lệ");
                    }
                } else if ("DATE".equalsIgnoreCase(def.getType())) {
                    try {
                        LocalDate.parse(trimmed);
                    } catch (Exception e) {
                        throw new ValidationException("Trường '" + def.getName() + "' phải có định dạng ngày hợp lệ (YYYY-MM-DD)");
                    }
                } else if ("DROPDOWN".equalsIgnoreCase(def.getType()) && StringUtils.hasText(def.getOptions())) {
                    List<String> options = Arrays.stream(def.getOptions().split(","))
                            .map(String::trim)
                            .filter(StringUtils::hasText)
                            .collect(Collectors.toList());
                    if (!options.isEmpty() && !options.contains(trimmed)) {
                        throw new ValidationException("Giá trị '" + trimmed + "' không nằm trong danh sách lựa chọn của trường " + def.getName());
                    }
                }

                // Upsert
                Optional<IssueCustomFieldValue> existingOpt = customFieldValueRepository.findByIssueIdAndFieldId(issue.getId(), def.getId());
                if (existingOpt.isPresent()) {
                    IssueCustomFieldValue existing = existingOpt.get();
                    existing.setFieldValue(trimmed);
                    customFieldValueRepository.save(existing);
                } else {
                    customFieldValueRepository.save(new IssueCustomFieldValue(issue, def, trimmed));
                }
            } else if (safeValues.containsKey(def.getFieldKey()) || safeValues.containsKey(String.valueOf(def.getId()))) {
                // Explicit null or empty -> clear value
                customFieldValueRepository.findByIssueIdAndFieldId(issue.getId(), def.getId())
                        .ifPresent(customFieldValueRepository::delete);
            }
        }
    }

    private String generateFieldKey(String name) {
        if (!StringUtils.hasText(name)) {
            return "field_" + System.currentTimeMillis() % 10000;
        }
        String slug = java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9_]+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
        if (slug.length() < 2) {
            slug = slug + "_field";
        }
        if (slug.length() > 50) {
            slug = slug.substring(0, 50);
        }
        return slug;
    }
}
