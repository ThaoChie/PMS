package com.pms.backend.service;

import com.pms.backend.service.impl.*;
import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dao.WorklogRepository;
import com.pms.backend.dto.CreateWorklogRequest;
import com.pms.backend.dto.WorklogResponse;
import com.pms.backend.exception.ForbiddenException;
import com.pms.backend.exception.ValidationException;
import com.pms.backend.hibernateDao.IssueBoardDao;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Project;
import com.pms.backend.model.User;
import com.pms.backend.model.Worklog;
import com.pms.backend.security.ProjectSecurity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WorklogServiceTest {

    @Mock private WorklogRepository worklogRepository;
    @Mock private IssueRepository issueRepository;
    @Mock private IssueBoardDao issueBoardDao;
    @Mock private ProjectSecurity projectSecurity;
    @Mock private IWatcherService watcherService;
    @Mock private IAuditService auditService;

    @InjectMocks
    private WorklogServiceImpl worklogService;

    private Issue issue;
    private Worklog worklog;
    private User assignee;
    private User otherUser;
    private Project project;

    @BeforeEach
    public void setup() {
        project = new Project();
        project.setId(1L);

        assignee = new User();
        assignee.setId(10L);
        assignee.setFullName("Assignee User");

        otherUser = new User();
        otherUser.setId(20L);
        otherUser.setFullName("Other User");

        issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-1");
        issue.setProject(project);
        issue.setAssignee(assignee);
        issue.setRemainingEstimateMin(180); // 3 hours
        issue.setTimeSpentMin(60); // 1 hour

        worklog = new Worklog();
        worklog.setIssue(issue);
    }

    @Test
    public void testLogWork_UpdatesRemainingEstimate_Properly() {
        worklog.setTimeSpent(4);

        when(issueBoardDao.findIssueById(1L)).thenReturn(Optional.of(issue));
        when(worklogRepository.save(worklog)).thenReturn(worklog);

        worklogService.logWork(worklog);

        assertEquals(176, issue.getRemainingEstimate());
        verify(issueBoardDao, times(1)).saveIssue(issue);
    }

    @Test
    public void testLogWork_RemainingEstimate_DoesNotGoBelowZero() {
        worklog.setTimeSpent(200);

        when(issueBoardDao.findIssueById(1L)).thenReturn(Optional.of(issue));
        when(worklogRepository.save(worklog)).thenReturn(worklog);

        worklogService.logWork(worklog);

        assertEquals(0, issue.getRemainingEstimate());
        verify(issueBoardDao, times(1)).saveIssue(issue);
    }

    @Test
    public void testLogWork_NotAssignee_ThrowsForbidden() {
        CreateWorklogRequest request = new CreateWorklogRequest();
        request.setTimeSpent("2h");
        request.setDate(LocalDate.now());

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-1")).thenReturn(Optional.of(issue));

        assertThrows(ForbiddenException.class, () ->
                worklogService.logWork("TEST-1", request, otherUser));
    }

    @Test
    public void testLogWork_FutureDate_ThrowsValidationException() {
        CreateWorklogRequest request = new CreateWorklogRequest();
        request.setTimeSpent("1h");
        request.setDate(LocalDate.now().plusDays(2));

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-1")).thenReturn(Optional.of(issue));

        assertThrows(ValidationException.class, () ->
                worklogService.logWork("TEST-1", request, assignee));
    }

    @Test
    public void testLogWork_Success_AdjustsRemainingAndSpent() {
        CreateWorklogRequest request = new CreateWorklogRequest();
        request.setTimeSpent("1h 30m"); // 90m
        request.setDate(LocalDate.now());
        request.setComment("Worked on task");

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-1")).thenReturn(Optional.of(issue));
        when(worklogRepository.save(any(Worklog.class))).thenAnswer(inv -> {
            Worklog w = inv.getArgument(0);
            w.setId(100L);
            return w;
        });

        WorklogResponse res = worklogService.logWork("TEST-1", request, assignee);

        assertNotNull(res);
        assertEquals(90, res.getTimeSpentMinutes());
        // Remaining: 180 - 90 = 90
        assertEquals(90, issue.getRemainingEstimateMin());
        // Spent: 60 + 90 = 150
        assertEquals(150, issue.getTimeSpentMin());

        verify(issueRepository, times(1)).save(issue);
        verify(watcherService, times(1)).watchIssue(issue, assignee);
    }
}
