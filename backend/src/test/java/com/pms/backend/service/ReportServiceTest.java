package com.pms.backend.service;

import com.pms.backend.service.impl.*;
import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dto.*;
import com.pms.backend.hibernateDao.BugReportHibernateDao;
import com.pms.backend.hibernateDao.ProductivityReportHibernateDao;
import com.pms.backend.hibernateDao.ProgressReportHibernateDao;
import com.pms.backend.model.Issue;
import com.pms.backend.model.User;
import com.pms.backend.model.WorkflowStatus;
import com.pms.backend.security.ProjectSecurity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReportServiceTest {

    @Mock
    private IssueRepository issueRepository;

    @Mock
    private ProgressReportHibernateDao progressReportHibernateDao;

    @Mock
    private ProductivityReportHibernateDao productivityReportHibernateDao;

    @Mock
    private BugReportHibernateDao bugReportHibernateDao;

    @Mock
    private ProjectSecurity projectSecurity;

    @InjectMocks
    private ReportServiceImpl reportService;

    @Test
    public void testGetProgressReport_DelegatesToDao() {
        LocalDate from = LocalDate.now().minusDays(14);
        LocalDate to = LocalDate.now();
        ProgressReportResponse mockResp = new ProgressReportResponse(
                1L, from, to, "issues", true, 10, 4, 6, false, Collections.emptyList()
        );
        when(progressReportHibernateDao.generateProgressReport(1L, from, to, "issues")).thenReturn(mockResp);

        ProgressReportResponse result = reportService.getProgressReport(1L, from, to, "issues");
        assertNotNull(result);
        assertEquals(10, result.getTotalScope());
        assertTrue(result.isHasEnoughData());
    }

    @Test
    public void testGetProductivityReport_AsPm_PassesTrue() {
        LocalDate from = LocalDate.now().minusDays(7);
        LocalDate to = LocalDate.now();
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);

        ProductivityReportResponse mockResp = new ProductivityReportResponse(
                1L, from, to, "MEMBER_DETAIL", 5, 2, 3.5, 20.0, Collections.emptyList(), Collections.emptyList()
        );
        when(productivityReportHibernateDao.generateProductivityReport(1L, from, to, true)).thenReturn(mockResp);

        ProductivityReportResponse result = reportService.getProductivityReport(1L, from, to);
        assertEquals("MEMBER_DETAIL", result.getScope());
        verify(productivityReportHibernateDao).generateProductivityReport(1L, from, to, true);
    }

    @Test
    public void testGetProductivityReport_AsMember_PassesFalse() {
        LocalDate from = LocalDate.now().minusDays(7);
        LocalDate to = LocalDate.now();
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(false);

        ProductivityReportResponse mockResp = new ProductivityReportResponse(
                1L, from, to, "PROJECT_SUMMARY", 5, 2, 3.5, 20.0, Collections.emptyList(), Collections.emptyList()
        );
        when(productivityReportHibernateDao.generateProductivityReport(1L, from, to, false)).thenReturn(mockResp);

        ProductivityReportResponse result = reportService.getProductivityReport(1L, from, to);
        assertEquals("PROJECT_SUMMARY", result.getScope());
        verify(productivityReportHibernateDao).generateProductivityReport(1L, from, to, false);
    }

    @Test
    public void testGetBugReport_DelegatesToDao() {
        LocalDate from = LocalDate.now().minusDays(30);
        LocalDate to = LocalDate.now();
        BugReportResponse mockResp = new BugReportResponse(
                1L, from, to, 8, 5, 3, 62.5, 12.0, Collections.emptyList(), Collections.emptyMap()
        );
        when(bugReportHibernateDao.generateBugReport(1L, from, to)).thenReturn(mockResp);

        BugReportResponse result = reportService.getBugReport(1L, from, to);
        assertNotNull(result);
        assertEquals(8, result.getTotalBugs());
        assertEquals(62.5, result.getResolutionRate());
    }

    @Test
    public void testGenerateProjectReport_CalculatesCounts() {
        List<Object[]> statusRows = Collections.singletonList(new Object[]{"In Progress", 1L});
        when(issueRepository.countIssuesByStatusGrouped(1L)).thenReturn(statusRows);

        List<Object[]> assigneeRows = Collections.singletonList(new Object[]{"Nguyen Van A", 1L});
        when(issueRepository.countIssuesByAssigneeGrouped(1L)).thenReturn(assigneeRows);

        ReportResponse response = reportService.generateProjectReport(1L);
        assertNotNull(response);
        assertEquals(1, response.getIssueCountByStatus().get("In Progress"));
        assertEquals(1, response.getIssueCountByAssignee().get("Nguyen Van A"));
    }
}
