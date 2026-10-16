package com.pms.backend.security;

import com.pms.backend.dao.IssueRepository;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Project;
import com.pms.backend.model.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class IssueSecurityTest {

    @Mock private IssueRepository issueRepository;
    @Mock private ProjectSecurity projectSecurity;

    @InjectMocks
    private IssueSecurity issueSecurity;

    private Project projectA;
    private Issue issueA;
    private User user;

    @BeforeEach
    public void setup() {
        projectA = new Project();
        projectA.setId(100L);
        projectA.setProjectKey("PROJA");

        issueA = new Issue();
        issueA.setId(1L);
        issueA.setIssueKey("PROJA-1");
        issueA.setProject(projectA);

        user = new User();
        user.setId(5L);
        user.setEmail("user5@test.com");
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(Long userId) {
        AuthUserPrincipal principal = new AuthUserPrincipal(userId, "user" + userId + "@test.com", "pass", true, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList())
        );
    }

    @Test
    public void testCanView_MemberOfProject_ReturnsTrue() {
        authenticate(5L);
        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("PROJA-1")).thenReturn(Optional.of(issueA));
        when(projectSecurity.isMember(100L)).thenReturn(true);

        assertTrue(issueSecurity.canView("PROJA-1"));
    }

    @Test
    public void testCanView_NonMemberOfProject_IdorBlocked_ReturnsFalse() {
        authenticate(6L);
        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("PROJA-1")).thenReturn(Optional.of(issueA));
        when(projectSecurity.isMember(100L)).thenReturn(false);

        // Accessing issue from project user is not a member of is blocked
        assertFalse(issueSecurity.canView("PROJA-1"));
    }

    @Test
    public void testCanEdit_ReporterOrAssignee_ReturnsTrue() {
        authenticate(5L);
        issueA.setReporter(user);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("PROJA-1")).thenReturn(Optional.of(issueA));
        when(projectSecurity.isPmOrAdmin(100L)).thenReturn(false);

        assertTrue(issueSecurity.canEdit("PROJA-1"));
    }

    @Test
    public void testCanEdit_OtherMember_ReturnsFalse() {
        authenticate(8L);
        issueA.setReporter(user); // reporter is 5L, current user is 8L

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("PROJA-1")).thenReturn(Optional.of(issueA));
        when(projectSecurity.isPmOrAdmin(100L)).thenReturn(false);

        assertFalse(issueSecurity.canEdit("PROJA-1"));
    }
}
