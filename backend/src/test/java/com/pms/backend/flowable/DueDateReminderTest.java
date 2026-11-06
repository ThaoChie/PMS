package com.pms.backend.flowable;

import com.pms.backend.config.ApprovalProperties;
import com.pms.backend.dao.DueIssueReminderRepository;
import com.pms.backend.dao.ReminderLogRepository;
import com.pms.backend.delegate.ScanDueIssuesDelegate;
import com.pms.backend.enu.NotificationType;
import com.pms.backend.enu.Priority;
import com.pms.backend.enu.StatusCategory;
import com.pms.backend.model.*;
import com.pms.backend.service.interfaces.INotificationService;
import org.flowable.engine.ProcessEngine;
import org.flowable.engine.ProcessEngineConfiguration;
import org.flowable.engine.repository.ProcessDefinition;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.spring.SpringProcessEngineConfiguration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.support.GenericApplicationContext;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DueDateReminderTest {

    @Mock
    private DueIssueReminderRepository dueIssueRepo;

    @Mock
    private ReminderLogRepository reminderLogRepo;

    @Mock
    private INotificationService notificationService;

    private ApprovalProperties approvalProperties;
    private ScanDueIssuesDelegate delegate;
    private ProcessEngine processEngine;

    private Project testProject;
    private WorkflowStatus todoStatus;
    private WorkflowStatus doneStatus;
    private User testAssignee;
    private Issue testIssue;

    @BeforeEach
    void setUp() {
        approvalProperties = new ApprovalProperties();
        approvalProperties.setDueDateReminderHoursBefore(24);

        delegate = new ScanDueIssuesDelegate(dueIssueRepo, reminderLogRepo, notificationService, approvalProperties);

        testProject = new Project();
        testProject.setId(10L);
        testProject.setName("Test Project");

        todoStatus = new WorkflowStatus();
        todoStatus.setId(1L);
        todoStatus.setName("In Progress");
        todoStatus.setCategory(StatusCategory.IN_PROGRESS);

        doneStatus = new WorkflowStatus();
        doneStatus.setId(2L);
        doneStatus.setName("Done");
        doneStatus.setCategory(StatusCategory.DONE);

        testAssignee = new User();
        testAssignee.setId(100L);
        testAssignee.setEmail("assignee@epms.com");
        testAssignee.setFullName("Assignee User");

        testIssue = new Issue();
        testIssue.setId(501L);
        testIssue.setIssueKey("PRJ-501");
        testIssue.setSummary("Critical Security Patch");
        testIssue.setProject(testProject);
        testIssue.setStatus(todoStatus);
        testIssue.setAssignee(testAssignee);
        testIssue.setDueDate(LocalDate.now().plusDays(1));
        testIssue.setPriority(Priority.HIGH);
    }

    @AfterEach
    void tearDown() {
        if (processEngine != null) {
            processEngine.close();
        }
    }

    @Test
    @DisplayName("4.1 BPMN: Nạp quy trình due-date-reminder.bpmn thành công vào ProcessEngine")
    void testBpmnDeployment() {
        String dbName = "flowable_reminder_test_" + UUID.randomUUID().toString().replace("-", "");
        processEngine = ProcessEngineConfiguration
                .createStandaloneInMemProcessEngineConfiguration()
                .setJdbcUrl("jdbc:h2:mem:" + dbName + ";DB_CLOSE_DELAY=-1")
                .setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE)
                .buildProcessEngine();

        processEngine.getRepositoryService().createDeployment()
                .addClasspathResource("bpmn/due-date-reminder.bpmn")
                .name("test-due-date-reminder-deployment")
                .deploy();

        ProcessDefinition def = processEngine.getRepositoryService().createProcessDefinitionQuery()
                .processDefinitionKey("due-date-reminder")
                .latestVersion()
                .singleResult();

        assertThat(def).isNotNull();
        assertThat(def.getKey()).isEqualTo("due-date-reminder");
    }

    @Test
    @DisplayName("4.2 & 4.3: Gửi thông báo và ghi reminder_log khi Issue sắp đến hạn và chưa hoàn thành")
    void testScanDueIssues_ShouldSendNotificationAndLog_WhenIssueIsDueAndNotDone() {
        LocalDate today = LocalDate.now();
        when(dueIssueRepo.findDueIssuesBefore(eq(StatusCategory.DONE), any(LocalDate.class)))
                .thenReturn(List.of(testIssue));
        when(reminderLogRepo.existsByTypeAndRefIdAndSentOn(ScanDueIssuesDelegate.REMINDER_TYPE_ISSUE_DUE_DATE, 501L, today))
                .thenReturn(false);

        delegate.execute(null);

        // Xác nhận gửi thông báo với loại ASSIGNED tới đúng người được giao
        verify(notificationService, times(1)).notify(
                eq(NotificationType.ASSIGNED),
                eq(List.of(testAssignee)),
                contains("PRJ-501"),
                contains("Critical Security Patch"),
                eq("/projects/10/issues/501"),
                isNull(),
                isNull()
        );

        // Xác nhận ghi log vào bảng reminder_log với ngày hôm nay
        ArgumentCaptor<ReminderLog> logCaptor = ArgumentCaptor.forClass(ReminderLog.class);
        verify(reminderLogRepo, times(1)).save(logCaptor.capture());
        ReminderLog savedLog = logCaptor.getValue();
        assertThat(savedLog.getType()).isEqualTo("ISSUE_DUE_DATE");
        assertThat(savedLog.getRefId()).isEqualTo(501L);
        assertThat(savedLog.getSentOn()).isEqualTo(today);
    }

    @Test
    @DisplayName("4.3: Không gửi lặp lại trong cùng ngày nếu đã có bản ghi trong reminder_log")
    void testScanDueIssues_ShouldNotSendDuplicate_WhenAlreadyRemindedToday() {
        LocalDate today = LocalDate.now();
        when(dueIssueRepo.findDueIssuesBefore(eq(StatusCategory.DONE), any(LocalDate.class)))
                .thenReturn(List.of(testIssue));
        when(reminderLogRepo.existsByTypeAndRefIdAndSentOn(ScanDueIssuesDelegate.REMINDER_TYPE_ISSUE_DUE_DATE, 501L, today))
                .thenReturn(true);

        delegate.execute(null);

        // Không gửi thông báo và không ghi thêm log
        verify(notificationService, never()).notify(any(), any(), any(), any(), any(), any(), any());
        verify(reminderLogRepo, never()).save(any());
    }

    @Test
    @DisplayName("4.3: Bỏ qua Issue không có Assignee")
    void testScanDueIssues_ShouldSkip_WhenIssueHasNoAssignee() {
        testIssue.setAssignee(null);
        when(dueIssueRepo.findDueIssuesBefore(eq(StatusCategory.DONE), any(LocalDate.class)))
                .thenReturn(List.of(testIssue));

        delegate.execute(null);

        verify(notificationService, never()).notify(any(), any(), any(), any(), any(), any(), any());
        verify(reminderLogRepo, never()).save(any());
    }

    @Test
    @DisplayName("4.3: Tuyệt đối KHÔNG thay đổi trạng thái hoặc dữ liệu của Issue")
    void testScanDueIssues_ShouldNotModifyIssueStateOrData() {
        LocalDate initialDueDate = testIssue.getDueDate();
        WorkflowStatus initialStatus = testIssue.getStatus();
        String initialSummary = testIssue.getSummary();
        Priority initialPriority = testIssue.getPriority();

        when(dueIssueRepo.findDueIssuesBefore(eq(StatusCategory.DONE), any(LocalDate.class)))
                .thenReturn(List.of(testIssue));
        when(reminderLogRepo.existsByTypeAndRefIdAndSentOn(any(), any(), any()))
                .thenReturn(false);

        delegate.execute(null);

        // Xác nhận mọi thuộc tính của Issue được giữ nguyên 100%
        assertThat(testIssue.getDueDate()).isEqualTo(initialDueDate);
        assertThat(testIssue.getStatus()).isEqualTo(initialStatus);
        assertThat(testIssue.getSummary()).isEqualTo(initialSummary);
        assertThat(testIssue.getPriority()).isEqualTo(initialPriority);
    }

    @Test
    @DisplayName("4.1: Chạy quy trình Flowable hoàn chỉnh gọi scanDueIssuesDelegate thành công")
    void testFlowableProcessExecution() {
        GenericApplicationContext springContext = new GenericApplicationContext();
        springContext.registerBean("scanDueIssuesDelegate", ScanDueIssuesDelegate.class, () -> delegate);
        springContext.refresh();

        String dbName = "flowable_exec_test_" + UUID.randomUUID().toString().replace("-", "");
        com.zaxxer.hikari.HikariDataSource ds = new com.zaxxer.hikari.HikariDataSource();
        ds.setJdbcUrl("jdbc:h2:mem:" + dbName + ";DB_CLOSE_DELAY=-1");
        ds.setDriverClassName("org.h2.Driver");
        ds.setUsername("sa");
        ds.setPassword("");

        org.springframework.jdbc.datasource.DataSourceTransactionManager tm =
                new org.springframework.jdbc.datasource.DataSourceTransactionManager(ds);

        SpringProcessEngineConfiguration cfg = new SpringProcessEngineConfiguration();
        cfg.setDataSource(ds);
        cfg.setTransactionManager(tm);
        cfg.setApplicationContext(springContext);
        cfg.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE);
        processEngine = cfg.buildProcessEngine();

        processEngine.getRepositoryService().createDeployment()
                .addClasspathResource("bpmn/due-date-reminder.bpmn")
                .deploy();

        when(dueIssueRepo.findDueIssuesBefore(eq(StatusCategory.DONE), any(LocalDate.class)))
                .thenReturn(List.of(testIssue));
        when(reminderLogRepo.existsByTypeAndRefIdAndSentOn(any(), any(), any()))
                .thenReturn(false);

        // Kích hoạt instance của process due-date-reminder
        ProcessInstance instance = processEngine.getRuntimeService()
                .startProcessInstanceByKey("due-date-reminder");

        assertThat(instance).isNotNull();

        // Delegate được thực thi và process hoàn tất tới End Event
        verify(notificationService, times(1)).notify(
                eq(NotificationType.ASSIGNED),
                anyList(),
                contains("PRJ-501"),
                anyString(),
                anyString(),
                isNull(),
                isNull()
        );
        verify(reminderLogRepo, times(1)).save(any(ReminderLog.class));
    }
}
