package com.pms.backend.service;

import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.dto.*;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.WorkloadLevel;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ForbiddenException;
import com.pms.backend.hibernateDao.BugReportHibernateDao;
import com.pms.backend.hibernateDao.ProductivityReportHibernateDao;
import com.pms.backend.hibernateDao.ProgressReportHibernateDao;
import com.pms.backend.model.Project;
import com.pms.backend.model.User;
import com.pms.backend.security.ProjectSecurity;
import com.pms.backend.service.impl.ReportServiceImpl;
import com.pms.backend.service.interfaces.IExportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

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

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private IExportService exportService;

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
    public void testGetProductivityReport_WithFilter_AsPm_Success() {
        ProductivityFilterRequest filter = new ProductivityFilterRequest();
        filter.setFrom(LocalDate.now().minusDays(14));
        filter.setTo(LocalDate.now());
        filter.setMemberIds(List.of(10L));
        filter.setRoles(List.of("DEVELOPER"));

        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        when(projectMemberRepository.existsByProjectIdAndUserId(1L, 10L)).thenReturn(true);

        MemberProductivityDto member = new MemberProductivityDto();
        member.setUserId(10L);
        member.setFullName("Nguyen Van B");
        member.setProjectRole("DEVELOPER");
        member.setAssignedIssues(8);
        member.setCompletedIssues(5);
        member.setInProgressIssues(2);
        member.setTodoIssues(1);
        member.setOnTimeCompletedCount(4);
        member.setOnTimeRate(80.0);
        member.setOverdueIssues(1);
        member.setEstimatedHours(30.0);
        member.setTotalLoggedHours(28.0);
        member.setVariancePercentage(-6.7);
        member.setAvgResolutionTimeHours(14.2);
        member.setBugsAssigned(2);
        member.setBugsResolved(2);
        member.setBugsReopened(0);
        member.setWorkloadLevel(WorkloadLevel.BALANCED);
        member.setWorkloadRatio(0.85);

        ProductivityReportResponse mockResp = new ProductivityReportResponse();
        mockResp.setProjectId(1L);
        mockResp.setFrom(filter.getFrom());
        mockResp.setTo(filter.getTo());
        mockResp.setScope("MEMBER_DETAIL");
        mockResp.setTotalAssigned(8);
        mockResp.setTotalCompleted(5);
        mockResp.setTotalInProgress(2);
        mockResp.setTotalTodo(1);
        mockResp.setTotalOverdue(1);
        mockResp.setOverallOnTimeRate(80.0);
        mockResp.setTotalEstimatedHours(30.0);
        mockResp.setTotalLoggedHours(28.0);
        mockResp.setAvgResolutionTimeHours(14.2);
        mockResp.setTotalBugsAssigned(2);
        mockResp.setTotalBugsResolved(2);
        mockResp.setTotalBugsReopened(0);
        mockResp.setMembers(List.of(member));

        when(productivityReportHibernateDao.generateProductivityReport(1L, filter, true)).thenReturn(mockResp);

        ProductivityReportResponse result = reportService.getProductivityReport(1L, filter);

        assertNotNull(result);
        assertEquals(8, result.getTotalAssigned());
        assertEquals(5, result.getTotalCompleted());
        assertEquals(2, result.getTotalInProgress());
        assertEquals(1, result.getTotalTodo());
        assertEquals(1, result.getTotalOverdue());
        assertEquals(80.0, result.getOverallOnTimeRate());
        assertEquals(30.0, result.getTotalEstimatedHours());
        assertEquals(28.0, result.getTotalLoggedHours());
        assertEquals(2, result.getTotalBugsAssigned());
        assertEquals(2, result.getTotalBugsResolved());
        assertEquals(0, result.getTotalBugsReopened());

        assertEquals(1, result.getMembers().size());
        MemberProductivityDto m = result.getMembers().get(0);
        assertEquals(10L, m.getUserId());
        assertEquals("DEVELOPER", m.getProjectRole());
        assertEquals(WorkloadLevel.BALANCED, m.getWorkloadLevel());
        assertEquals(80.0, m.getOnTimeRate());
        assertEquals(-6.7, m.getVariancePercentage());
    }

    @Test
    public void testGetProductivityReport_WithFilter_AsMember_Throws403() {
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(false);
        ProductivityFilterRequest filter = new ProductivityFilterRequest();

        ForbiddenException ex = assertThrows(ForbiddenException.class, () -> {
            reportService.getProductivityReport(1L, filter);
        });
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    public void testGetProductivityReport_InvalidDates_FromAfterTo_ThrowsValidation() {
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        ProductivityFilterRequest filter = new ProductivityFilterRequest();
        filter.setFrom(LocalDate.now());
        filter.setTo(LocalDate.now().minusDays(5));

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            reportService.getProductivityReport(1L, filter);
        });
        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
    }

    @Test
    public void testGetProductivityReport_Exceeds366Days_ThrowsValidation() {
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        ProductivityFilterRequest filter = new ProductivityFilterRequest();
        filter.setFrom(LocalDate.of(2025, 1, 1));
        filter.setTo(LocalDate.of(2026, 2, 10)); // > 366 days

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            reportService.getProductivityReport(1L, filter);
        });
        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
    }

    @Test
    public void testGetProductivityReport_MemberNotInProject_ThrowsValidation() {
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        ProductivityFilterRequest filter = new ProductivityFilterRequest();
        filter.setMemberIds(List.of(999L));

        when(projectMemberRepository.existsByProjectIdAndUserId(1L, 999L)).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            reportService.getProductivityReport(1L, filter);
        });
        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("999"));
    }

    @Test
    public void testGetProductivityReport_UnassignedMemberId0_DoesNotThrowValidation() {
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        ProductivityFilterRequest filter = new ProductivityFilterRequest();
        filter.setMemberIds(List.of(0L));

        ProductivityReportResponse mockResp = new ProductivityReportResponse();
        mockResp.setTotalAssigned(2);
        when(productivityReportHibernateDao.generateProductivityReport(1L, filter, true)).thenReturn(mockResp);

        assertDoesNotThrow(() -> {
            ProductivityReportResponse res = reportService.getProductivityReport(1L, filter);
            assertNotNull(res);
            assertEquals(2, res.getTotalAssigned());
        });
    }

    @Test
    public void testGetMemberProductivityDetail_AsPm_Success() {
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        ProductivityFilterRequest filter = new ProductivityFilterRequest();

        MemberDetailProductivityResponse mockDetail = new MemberDetailProductivityResponse();
        mockDetail.setProjectId(1L);
        mockDetail.setUserId(10L);
        mockDetail.setMember(new MemberProductivityDto(10L, "Dev", "dev@pms.com", null, 3, 1, 10.0, 15.0));
        mockDetail.setTotalIssues(4);
        mockDetail.setTotalWorklogs(2);
        mockDetail.setTotalLoggedHours(15.0);

        when(productivityReportHibernateDao.getMemberProductivityDetail(1L, 10L, filter)).thenReturn(mockDetail);

        MemberDetailProductivityResponse resp = reportService.getMemberProductivityDetail(1L, 10L, filter);
        assertNotNull(resp);
        assertEquals(10L, resp.getUserId());
        assertEquals(4, resp.getTotalIssues());
        assertEquals(15.0, resp.getTotalLoggedHours());
    }

    @Test
    public void testGetMemberProductivityDetail_AsMember_Throws403() {
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(false);
        ProductivityFilterRequest filter = new ProductivityFilterRequest();

        ForbiddenException ex = assertThrows(ForbiddenException.class, () -> {
            reportService.getMemberProductivityDetail(1L, 10L, filter);
        });
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    public void testExportProductivityReport_AsPm_Success() {
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        ProductivityFilterRequest filter = new ProductivityFilterRequest();
        User currentUser = new User();
        currentUser.setFullName("PM User");

        Project project = new Project();
        project.setId(1L);
        project.setName("Test Project");
        project.setProjectKey("TEST");

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(productivityReportHibernateDao.generateProductivityReport(1L, filter, true)).thenReturn(new ProductivityReportResponse());
        when(productivityReportHibernateDao.fetchIssuesForExport(1L, filter)).thenReturn(Collections.emptyList());
        when(productivityReportHibernateDao.fetchWorklogsForExport(1L, filter)).thenReturn(Collections.emptyList());
        when(exportService.generateProductivityExcel(eq(project), any(), any(), any(), eq(filter), eq(currentUser))).thenReturn(new byte[]{1, 2, 3});

        byte[] result = reportService.exportProductivityReport(1L, filter, currentUser);
        assertNotNull(result);
        assertEquals(3, result.length);
    }

    @Test
    public void testExportProductivityReport_AsMember_Throws403() {
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(false);
        ProductivityFilterRequest filter = new ProductivityFilterRequest();

        ForbiddenException ex = assertThrows(ForbiddenException.class, () -> {
            reportService.exportProductivityReport(1L, filter, new User());
        });
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
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
