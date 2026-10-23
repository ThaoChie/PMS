package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.*;
import com.pms.backend.dto.*;
import com.pms.backend.enu.*;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.exception.ValidationException;
import com.pms.backend.model.*;
import com.pms.backend.security.ProjectSecurity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class WorkflowServiceImpl implements IWorkflowService {

    private final WorkflowStatusRepository statusRepository;
    private final WorkflowTransitionRepository transitionRepository;
    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final IssueStatusHistoryRepository historyRepository;
    private final ProjectSecurity projectSecurity;
    private final INotificationService notificationService;
    private final IAuditService auditService;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private IWatcherService watcherService;

    public WorkflowServiceImpl(WorkflowStatusRepository statusRepository,
                           WorkflowTransitionRepository transitionRepository,
                           IssueRepository issueRepository,
                           ProjectRepository projectRepository,
                           ProjectMemberRepository memberRepository,
                           IssueStatusHistoryRepository historyRepository,
                           ProjectSecurity projectSecurity,
                           INotificationService notificationService,
                           IAuditService auditService) {
        this.statusRepository = statusRepository;
        this.transitionRepository = transitionRepository;
        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.historyRepository = historyRepository;
        this.projectSecurity = projectSecurity;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public WorkflowResponse getWorkflow(Long projectId) {
        List<WorkflowStatus> statuses = statusRepository.findByProjectIdOrderByPositionAsc(projectId);
        List<WorkflowTransition> transitions = transitionRepository.findByProjectId(projectId);

        List<WorkflowStatusDto> statusDtos = statuses.stream()
                .map(WorkflowStatusDto::from)
                .collect(Collectors.toList());

        List<WorkflowTransitionDto> transitionDtos = transitions.stream()
                .map(WorkflowTransitionDto::from)
                .collect(Collectors.toList());

        List<String> warnings = findOrphanStatusWarnings(statuses, transitions);

        return new WorkflowResponse(statusDtos, transitionDtos, warnings);
    }

    @Transactional
    public WorkflowResponse updateWorkflow(Long projectId, SaveWorkflowRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        projectSecurity.assertProjectWritable(project);

        List<WorkflowStatusDto> newStatuses = request.getStatuses();
        if (newStatuses == null || newStatuses.isEmpty()) {
            throw new ValidationException("Workflow must have at least one status");
        }

        // Rule 1: Must have at least 1 initial status
        boolean hasInitial = newStatuses.stream().anyMatch(s -> Boolean.TRUE.equals(s.getIsInitial()));
        if (!hasInitial) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Workflow must contain an initial status");
        }

        // Rule 2: Must have at least 1 status with category DONE
        boolean hasDone = newStatuses.stream().anyMatch(s -> s.getCategory() == StatusCategory.DONE);
        if (!hasDone) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Workflow must contain at least one status in DONE category");
        }

        // Rule 3: No duplicate status names
        Set<String> names = new HashSet<>();
        for (WorkflowStatusDto s : newStatuses) {
            if (s.getName() == null || s.getName().isBlank()) {
                throw new ValidationException("Status name cannot be empty");
            }
            if (!names.add(s.getName().trim().toLowerCase())) {
                throw new BusinessException(ErrorCode.CONFLICT, "Duplicate status name: " + s.getName());
            }
        }

        // Check deleted statuses for active issues
        List<WorkflowStatus> currentStatuses = statusRepository.findByProjectIdOrderByPositionAsc(projectId);
        Set<Long> incomingStatusIds = newStatuses.stream()
                .map(WorkflowStatusDto::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        for (WorkflowStatus curr : currentStatuses) {
            if (!incomingStatusIds.contains(curr.getId())) {
                long activeCount = issueRepository.countByStatusIdAndDeletedAtIsNull(curr.getId());
                if (activeCount > 0) {
                    throw new BusinessException(ErrorCode.CONFLICT,
                            "Cannot delete status '" + curr.getName() + "' because it has " + activeCount + " active issue(s)");
                }
            }
        }

        // Delete existing transitions
        transitionRepository.deleteByProjectId(projectId);

        // Map existing statuses or create new ones
        Map<String, WorkflowStatus> statusMapByName = new HashMap<>();
        Map<Long, WorkflowStatus> statusMapById = new HashMap<>();

        for (int i = 0; i < newStatuses.size(); i++) {
            WorkflowStatusDto dto = newStatuses.get(i);
            WorkflowStatus status;
            if (dto.getId() != null) {
                status = statusRepository.findById(dto.getId()).orElse(new WorkflowStatus());
            } else {
                status = new WorkflowStatus();
            }
            status.setProject(project);
            status.setName(dto.getName().trim());
            status.setCategory(dto.getCategory() != null ? dto.getCategory() : StatusCategory.TODO);
            status.setPosition(dto.getPosition() != null ? dto.getPosition() : i);
            status.setInitial(Boolean.TRUE.equals(dto.getIsInitial()));

            status = statusRepository.save(status);
            statusMapByName.put(status.getName().toLowerCase(), status);
            statusMapById.put(status.getId(), status);
        }

        // Save transitions
        List<WorkflowTransition> savedTransitions = new ArrayList<>();
        if (request.getTransitions() != null) {
            for (WorkflowTransitionDto tDto : request.getTransitions()) {
                WorkflowStatus from = null;
                WorkflowStatus to = null;

                if (tDto.getFromStatusId() != null) from = statusMapById.get(tDto.getFromStatusId());
                if (from == null && tDto.getFrom() != null) from = statusMapByName.get(tDto.getFrom().trim().toLowerCase());

                if (tDto.getToStatusId() != null) to = statusMapById.get(tDto.getToStatusId());
                if (to == null && tDto.getTo() != null) to = statusMapByName.get(tDto.getTo().trim().toLowerCase());

                if (from != null && to != null) {
                    WorkflowTransition transition = new WorkflowTransition();
                    transition.setProject(project);
                    transition.setFromStatus(from);
                    transition.setToStatus(to);
                    transition.setName(tDto.getName() != null && !tDto.getName().isBlank() ? tDto.getName().trim() : to.getName());
                    transition.setType(tDto.getType() != null ? tDto.getType() : (Boolean.TRUE.equals(tDto.getIsApprovalStep()) ? TransitionType.APPROVE : TransitionType.NORMAL));
                    transition.setRequiredFields(tDto.getRequiredFields() != null ? tDto.getRequiredFields() : tDto.getRequiresField());
                    savedTransitions.add(transitionRepository.save(transition));
                }
            }
        }

        List<WorkflowStatus> updatedStatuses = statusRepository.findByProjectIdOrderByPositionAsc(projectId);
        List<WorkflowStatusDto> resStatuses = updatedStatuses.stream().map(WorkflowStatusDto::from).collect(Collectors.toList());
        List<WorkflowTransitionDto> resTransitions = savedTransitions.stream().map(WorkflowTransitionDto::from).collect(Collectors.toList());
        List<String> warnings = findOrphanStatusWarnings(updatedStatuses, savedTransitions);

        auditService.log("UPDATE_WORKFLOW", "PROJECT", projectId, projectId, null, "Updated workflow: " + resStatuses.size() + " statuses, " + resTransitions.size() + " transitions");

        return new WorkflowResponse(resStatuses, resTransitions, warnings);
    }

    private List<String> findOrphanStatusWarnings(List<WorkflowStatus> statuses, List<WorkflowTransition> transitions) {
        List<String> warnings = new ArrayList<>();
        Set<Long> hasIncoming = transitions.stream().map(t -> t.getToStatus().getId()).collect(Collectors.toSet());
        Set<Long> hasOutgoing = transitions.stream().map(t -> t.getFromStatus().getId()).collect(Collectors.toSet());

        for (WorkflowStatus s : statuses) {
            boolean isInitial = s.isInitial();
            boolean isDone = s.getCategory() == StatusCategory.DONE;
            if (!isInitial && !hasIncoming.contains(s.getId())) {
                warnings.add("Trạng thái '" + s.getName() + "' không có luồng chuyển vào (mồ côi)");
            }
            if (!isDone && !hasOutgoing.contains(s.getId())) {
                warnings.add("Trạng thái '" + s.getName() + "' không có luồng chuyển tiếp (điểm nghẽn)");
            }
        }
        return warnings;
    }

    @Transactional(readOnly = true)
    public List<TransitionOptionResponse> getTransitionsForIssue(String issueKey, User currentUser) {
        Issue issue = issueRepository.findByIssueKeyAndDeletedAtIsNull(issueKey)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        if (issue.getStatus() == null) {
            return Collections.emptyList();
        }

        Long projectId = issue.getProject().getId();
        boolean isPmOrAdmin = projectSecurity.isPmOrAdmin(projectId);

        List<WorkflowTransition> transitions = transitionRepository.findByFromStatusId(issue.getStatus().getId());

        return transitions.stream()
                .filter(t -> {
                    // PM/Admin can perform APPROVE and REJECT transitions; members cannot
                    if (t.getType() == TransitionType.APPROVE || t.getType() == TransitionType.REJECT) {
                        return isPmOrAdmin;
                    }
                    return true;
                })
                .map(TransitionOptionResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public Issue executeTransition(String issueKey, Long transitionId, Map<String, Object> fields, String comment, User currentUser) {
        Issue issue = issueRepository.findByIssueKeyAndDeletedAtIsNull(issueKey)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        projectSecurity.assertProjectWritable(issue.getProject());

        WorkflowTransition transition = transitionRepository.findById(transitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transition not found"));

        // Validate transition is from current status
        if (issue.getStatus() == null || !transition.getFromStatus().getId().equals(issue.getStatus().getId())) {
            throw new BusinessException(ErrorCode.INVALID_TRANSITION, "Transition is not valid from the current status");
        }

        // Validate permissions for APPROVE / REJECT
        if (transition.getType() == TransitionType.APPROVE || transition.getType() == TransitionType.REJECT) {
            if (!projectSecurity.isPmOrAdmin(issue.getProject().getId())) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "Only Project Managers or Admins can approve or reject");
            }
        }

        // Validate required fields
        if (transition.getRequiredFields() != null && !transition.getRequiredFields().isBlank()) {
            String[] reqFields = transition.getRequiredFields().split(",");
            for (String f : reqFields) {
                String fieldName = f.trim();
                if ("resolution".equalsIgnoreCase(fieldName)) {
                    Object resVal = fields != null ? fields.get("resolution") : null;
                    if (resVal == null || resVal.toString().isBlank()) {
                        throw new BusinessException(ErrorCode.REQUIRED_FIELD_MISSING, "Resolution is required for this transition");
                    }
                    issue.setResolution(resVal.toString().trim());
                }
            }
        }

        WorkflowStatus fromStatus = issue.getStatus();
        WorkflowStatus toStatus = transition.getToStatus();
        issue.setStatus(toStatus);
        Issue savedIssue = issueRepository.save(issue);

        // Record history
        IssueStatusHistory history = new IssueStatusHistory(savedIssue, fromStatus, toStatus, currentUser, comment);
        historyRepository.save(history);

        // Audit log
        auditService.log("CHANGE_STATUS", "ISSUE", savedIssue.getId(), savedIssue.getProject().getId(),
                fromStatus.getName(), toStatus.getName());

        // Notifications
        List<User> recipients = new ArrayList<>();
        if (savedIssue.getReporter() != null) recipients.add(savedIssue.getReporter());
        if (savedIssue.getAssignee() != null) recipients.add(savedIssue.getAssignee());
        if (watcherService != null) {
            recipients.addAll(watcherService.getWatchers(savedIssue.getId()));
        }

        String issueTitle = savedIssue.getIssueKey() + ": " + savedIssue.getSummary();
        notificationService.notify(
                NotificationType.STATUS_CHANGED,
                recipients,
                "Trạng thái Issue thay đổi: " + savedIssue.getIssueKey(),
                "Trạng thái đã chuyển sang '" + toStatus.getName() + "'" + (comment != null ? " (" + comment + ")" : ""),
                "/projects/" + savedIssue.getProject().getProjectKey() + "/issues/" + savedIssue.getIssueKey(),
                savedIssue.getIssueKey(),
                currentUser
        );

        // If moved to "Pending Approval" status, notify all PMs
        if (toStatus.getName().equalsIgnoreCase("Pending Approval") || toStatus.getName().equalsIgnoreCase("Chờ xác nhận")) {
            List<ProjectMember> pmMembers = memberRepository.findByProjectId(savedIssue.getProject().getId())
                    .stream()
                    .filter(m -> m.getRole() == ProjectRole.PM)
                    .collect(Collectors.toList());

            List<User> pmUsers = pmMembers.stream().map(ProjectMember::getUser).collect(Collectors.toList());
            notificationService.notify(
                    NotificationType.APPROVAL_REQUESTED,
                    pmUsers,
                    "Yêu cầu phê duyệt: " + savedIssue.getIssueKey(),
                    "Issue " + issueTitle + " đang chờ phê duyệt",
                    "/projects/" + savedIssue.getProject().getProjectKey() + "/issues/" + savedIssue.getIssueKey(),
                    savedIssue.getIssueKey(),
                    currentUser
            );
        }

        return savedIssue;
    }

    @Transactional
    public Issue approveIssue(String issueKey, String comment, User currentUser) {
        Issue issue = issueRepository.findByIssueKeyAndDeletedAtIsNull(issueKey)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        if (!projectSecurity.isPmOrAdmin(issue.getProject().getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Only Project Managers or Admins can approve issues");
        }

        projectSecurity.assertProjectWritable(issue.getProject());

        // Find approve transition or DONE status
        List<WorkflowTransition> transitions = transitionRepository.findByFromStatusId(issue.getStatus().getId());
        WorkflowTransition approveTrans = transitions.stream()
                .filter(t -> t.getType() == TransitionType.APPROVE || t.getToStatus().getCategory() == StatusCategory.DONE)
                .findFirst()
                .orElse(null);

        WorkflowStatus doneStatus = approveTrans != null ? approveTrans.getToStatus() :
                statusRepository.findByProjectIdOrderByPositionAsc(issue.getProject().getId()).stream()
                        .filter(s -> s.getCategory() == StatusCategory.DONE)
                        .findFirst()
                        .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TRANSITION, "No DONE status found in workflow"));

        WorkflowStatus fromStatus = issue.getStatus();
        issue.setStatus(doneStatus);
        Issue saved = issueRepository.save(issue);

        IssueStatusHistory history = new IssueStatusHistory(saved, fromStatus, doneStatus, currentUser, comment != null ? comment : "Approved");
        historyRepository.save(history);

        auditService.log("APPROVE_ISSUE", "ISSUE", saved.getId(), saved.getProject().getId(), fromStatus.getName(), doneStatus.getName());

        if (saved.getAssignee() != null) {
            notificationService.notify(
                    NotificationType.APPROVAL_RESULT,
                    List.of(saved.getAssignee()),
                    "Issue đã được phê duyệt: " + saved.getIssueKey(),
                    "Issue " + saved.getIssueKey() + " đã được phê duyệt bởi " + currentUser.getFullName(),
                    "/projects/" + saved.getProject().getProjectKey() + "/issues/" + saved.getIssueKey(),
                    saved.getIssueKey(),
                    currentUser
            );
        }

        return saved;
    }

    @Transactional
    public Issue rejectIssue(String issueKey, String reason, User currentUser) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new ValidationException("Reject reason is mandatory");
        }

        Issue issue = issueRepository.findByIssueKeyAndDeletedAtIsNull(issueKey)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        if (!projectSecurity.isPmOrAdmin(issue.getProject().getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Only Project Managers or Admins can reject issues");
        }

        projectSecurity.assertProjectWritable(issue.getProject());

        // Find reject transition or IN_PROGRESS status
        List<WorkflowTransition> transitions = transitionRepository.findByFromStatusId(issue.getStatus().getId());
        WorkflowTransition rejectTrans = transitions.stream()
                .filter(t -> t.getType() == TransitionType.REJECT)
                .findFirst()
                .orElse(null);

        WorkflowStatus inProgressStatus = rejectTrans != null ? rejectTrans.getToStatus() :
                statusRepository.findByProjectIdOrderByPositionAsc(issue.getProject().getId()).stream()
                        .filter(s -> s.getCategory() == StatusCategory.IN_PROGRESS && !s.getName().equalsIgnoreCase("Pending Approval") && !s.getName().equalsIgnoreCase("Chờ xác nhận"))
                        .findFirst()
                        .orElse(issue.getStatus());

        WorkflowStatus fromStatus = issue.getStatus();
        issue.setStatus(inProgressStatus);
        Issue saved = issueRepository.save(issue);

        IssueStatusHistory history = new IssueStatusHistory(saved, fromStatus, inProgressStatus, currentUser, "Rejected: " + reason);
        historyRepository.save(history);

        auditService.log("REJECT_ISSUE", "ISSUE", saved.getId(), saved.getProject().getId(), fromStatus.getName(), inProgressStatus.getName());

        if (saved.getAssignee() != null) {
            notificationService.notify(
                    NotificationType.APPROVAL_RESULT,
                    List.of(saved.getAssignee()),
                    "Issue bị từ chối phê duyệt: " + saved.getIssueKey(),
                    "Lý do: " + reason,
                    "/projects/" + saved.getProject().getProjectKey() + "/issues/" + saved.getIssueKey(),
                    saved.getIssueKey(),
                    currentUser
            );
        }

        return saved;
    }
}
