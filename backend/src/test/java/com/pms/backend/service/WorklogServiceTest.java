package com.pms.backend.service;

import com.pms.backend.dao.WorklogRepository;
import com.pms.backend.hibernateDao.IssueBoardDao;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Worklog;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WorklogServiceTest {

    @Mock
    private WorklogRepository worklogRepository;

    @Mock
    private IssueBoardDao issueBoardDao;

    @InjectMocks
    private WorklogService worklogService;

    private Issue issue;
    private Worklog worklog;

    @BeforeEach
    public void setup() {
        issue = new Issue();
        issue.setId(1L);
        issue.setRemainingEstimate(10); // e.g. 10 hours

        worklog = new Worklog();
        worklog.setIssue(issue);
    }

    @Test
    public void testLogWork_UpdatesRemainingEstimate_Properly() {
        worklog.setTimeSpent(4);

        when(issueBoardDao.findIssueById(1L)).thenReturn(Optional.of(issue));
        when(worklogRepository.save(worklog)).thenReturn(worklog);

        worklogService.logWork(worklog);

        assertEquals(6, issue.getRemainingEstimate());
        verify(issueBoardDao, times(1)).saveIssue(issue);
    }

    @Test
    public void testLogWork_RemainingEstimate_DoesNotGoBelowZero() {
        worklog.setTimeSpent(12);

        when(issueBoardDao.findIssueById(1L)).thenReturn(Optional.of(issue));
        when(worklogRepository.save(worklog)).thenReturn(worklog);

        worklogService.logWork(worklog);

        assertEquals(0, issue.getRemainingEstimate());
        verify(issueBoardDao, times(1)).saveIssue(issue);
    }
}
