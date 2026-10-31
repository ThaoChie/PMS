package com.pms.backend.service;

import com.pms.backend.dao.IssueCustomFieldValueRepository;
import com.pms.backend.dao.ProjectCustomFieldRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.dto.CreateCustomFieldRequest;
import com.pms.backend.dto.CustomFieldDto;
import com.pms.backend.dto.UpdateCustomFieldRequest;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ValidationException;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectCustomField;
import com.pms.backend.model.User;
import com.pms.backend.security.ProjectSecurity;
import com.pms.backend.service.impl.CustomFieldServiceImpl;
import com.pms.backend.service.interfaces.IAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CustomFieldServiceTest {

    @Mock
    private ProjectCustomFieldRepository customFieldRepository;

    @Mock
    private IssueCustomFieldValueRepository customFieldValueRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectSecurity projectSecurity;

    @Mock
    private IAuditService auditService;

    @InjectMocks
    private CustomFieldServiceImpl customFieldService;

    private Project project;
    private User pmUser;

    @BeforeEach
    public void setup() {
        project = new Project();
        project.setId(1L);
        project.setName("Test Project");

        pmUser = new User();
        pmUser.setId(10L);
        pmUser.setFullName("PM User");
    }

    @Test
    public void testCreateCustomField_InvalidType_ThrowsValidationException() {
        CreateCustomFieldRequest req = new CreateCustomFieldRequest();
        req.setName("Invalid Field");
        req.setType("UNKNOWN_TYPE");

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        assertThrows(ValidationException.class, () -> {
            customFieldService.createCustomField(1L, req, pmUser);
        });
    }

    @Test
    public void testCreateCustomField_DropdownMissingOptions_ThrowsValidationException() {
        CreateCustomFieldRequest req = new CreateCustomFieldRequest();
        req.setName("Dropdown Field");
        req.setType("DROPDOWN");
        req.setOptions(""); // Empty options

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        assertThrows(ValidationException.class, () -> {
            customFieldService.createCustomField(1L, req, pmUser);
        });
    }

    @Test
    public void testCreateCustomField_DuplicateKey_ThrowsConflict() {
        CreateCustomFieldRequest req = new CreateCustomFieldRequest();
        req.setName("Existing Field");
        req.setFieldKey("existing_key");
        req.setType("TEXT");

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(customFieldRepository.existsByProjectIdAndFieldKey(1L, "existing_key")).thenReturn(true);

        assertThrows(BusinessException.class, () -> {
            customFieldService.createCustomField(1L, req, pmUser);
        });
    }

    @Test
    public void testCreateCustomField_ValidDropdown_Success() {
        CreateCustomFieldRequest req = new CreateCustomFieldRequest();
        req.setName("Environment");
        req.setFieldKey("env");
        req.setType("DROPDOWN");
        req.setOptions("Dev, Staging, Prod");
        req.setRequired(true);

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(customFieldRepository.existsByProjectIdAndFieldKey(1L, "env")).thenReturn(false);

        ProjectCustomField saved = new ProjectCustomField(
                project, "Environment", "env", "DROPDOWN", true, "Dev, Staging, Prod", null, null, 0
        );
        saved.setId(100L);

        when(customFieldRepository.save(any(ProjectCustomField.class))).thenReturn(saved);

        CustomFieldDto result = customFieldService.createCustomField(1L, req, pmUser);

        assertNotNull(result);
        assertEquals("Environment", result.getName());
        assertEquals("DROPDOWN", result.getType());
        assertEquals("Dev, Staging, Prod", result.getOptions());
        assertTrue(result.getRequired());
        verify(auditService, times(1)).log(eq("CREATE_CUSTOM_FIELD"), eq("PROJECT"), eq(1L), eq(1L), any(), any());
    }

    @Test
    public void testUpdateCustomField_InvalidType_ThrowsValidationException() {
        UpdateCustomFieldRequest req = new UpdateCustomFieldRequest();
        req.setName("Updated Field");
        req.setType("INVALID_TYPE");

        ProjectCustomField existing = new ProjectCustomField();
        existing.setId(50L);
        existing.setProject(project);
        existing.setName("Old Name");
        existing.setType("TEXT");

        when(customFieldRepository.findById(50L)).thenReturn(Optional.of(existing));

        assertThrows(ValidationException.class, () -> {
            customFieldService.updateCustomField(1L, 50L, req, pmUser);
        });
    }

    @Test
    public void testValidateAndSaveIssueCustomFields_CheckboxInvalidValue_ThrowsValidationException() {
        Issue issue = new Issue();
        issue.setId(200L);
        issue.setProject(project);

        ProjectCustomField checkboxField = new ProjectCustomField();
        checkboxField.setId(10L);
        checkboxField.setFieldKey("is_blocking");
        checkboxField.setName("Is Blocking");
        checkboxField.setType("CHECKBOX");

        when(customFieldRepository.findByProjectIdOrderByPositionAscIdAsc(1L))
                .thenReturn(List.of(checkboxField));

        assertThrows(ValidationException.class, () -> {
            customFieldService.validateAndSaveIssueCustomFields(issue, Map.of("is_blocking", "not_a_boolean"));
        });
    }

    @Test
    public void testValidateAndSaveIssueCustomFields_DropdownInvalidOption_ThrowsValidationException() {
        Issue issue = new Issue();
        issue.setId(200L);
        issue.setProject(project);

        ProjectCustomField dropdownField = new ProjectCustomField();
        dropdownField.setId(11L);
        dropdownField.setFieldKey("severity");
        dropdownField.setName("Severity");
        dropdownField.setType("DROPDOWN");
        dropdownField.setOptions("Low, Medium, High");

        when(customFieldRepository.findByProjectIdOrderByPositionAscIdAsc(1L))
                .thenReturn(List.of(dropdownField));

        assertThrows(ValidationException.class, () -> {
            customFieldService.validateAndSaveIssueCustomFields(issue, Map.of("severity", "Extreme"));
        });
    }

    @Test
    public void testValidateAndSaveIssueCustomFields_NumberInvalid_ThrowsValidationException() {
        Issue issue = new Issue();
        issue.setId(200L);
        issue.setProject(project);

        ProjectCustomField numberField = new ProjectCustomField();
        numberField.setId(12L);
        numberField.setFieldKey("score");
        numberField.setName("Score");
        numberField.setType("NUMBER");

        when(customFieldRepository.findByProjectIdOrderByPositionAscIdAsc(1L))
                .thenReturn(List.of(numberField));

        assertThrows(ValidationException.class, () -> {
            customFieldService.validateAndSaveIssueCustomFields(issue, Map.of("score", "abc"));
        });
    }
}

