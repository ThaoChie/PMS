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
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private IDefaultWorkflowSeeder defaultWorkflowSeeder;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private IMailService mailService;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.pms.backend.config.AppProperties appProperties;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    public WorkflowServiceImpl(WorkflowStatusRepository statusRepository,
                           WorkflowTransitionRepository transitionRepository,
                           IssueRepository issueRepository,
                           ProjectRepository projectRepository,
                           ProjectMemberRepository memberRepository,
                           IssueStatusHistoryRepository historyRepository,
                           ProjectSecurity projectSecurity,
                           INotificationService notificationService,
                           IAuditService auditService,
                           @org.springframework.beans.factory.annotation.Autowired(required = false) IMailService mailService,
                           @org.springframework.beans.factory.annotation.Autowired(required = false) com.pms.backend.config.AppProperties appProperties) {
        this.statusRepository = statusRepository;
        this.transitionRepository = transitionRepository;
        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.historyRepository = historyRepository;
        this.projectSecurity = projectSecurity;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.mailService = mailService;
        this.appProperties = appProperties;
    }

    @Transactional
    public WorkflowResponse getWorkflow(Long projectId) {
        List<WorkflowStatus> statuses = statusRepository.findByProjectIdOrderByPositionAsc(projectId);
        List<WorkflowTransition> transitions = transitionRepository.findByProjectId(projectId);

        // Auto-seed default workflow if project has no statuses yet
        if (statuses.isEmpty() && defaultWorkflowSeeder != null) {
            Project project = projectRepository.findById(projectId).orElse(null);
            if (project != null) {
                defaultWorkflowSeeder.seedDefaultWorkflow(project);
                statuses = statusRepository.findByProjectIdOrderByPositionAsc(projectId);
                transitions = transitionRepository.findByProjectId(projectId);
            }
        }

        // Deduplicate statuses by normalized name
        Map<String, WorkflowStatus> uniqueStatusMap = new LinkedHashMap<>();
        for (WorkflowStatus s : statuses) {
            if (s.getName() != null) {
                String key = s.getName().trim().toLowerCase();
                uniqueStatusMap.putIfAbsent(key, s);
            }
        }
        List<WorkflowStatus> dedupStatuses = new ArrayList<>(uniqueStatusMap.values());
        for (int i = 0; i < dedupStatuses.size(); i++) {
            dedupStatuses.get(i).setPosition(i);
        }

        List<WorkflowStatusDto> statusDtos = dedupStatuses.stream()
                .map(WorkflowStatusDto::from)
                .collect(Collectors.toList());

        Set<String> validNames = dedupStatuses.stream()
                .map(s -> s.getName().trim().toLowerCase())
                .collect(Collectors.toSet());

        // Deduplicate and sanitize transitions so from/to status names are always valid and non-null
        Map<String, WorkflowTransitionDto> uniqueTransMap = new LinkedHashMap<>();
        for (WorkflowTransition t : transitions) {
            if (t.getFromStatus() != null && t.getToStatus() != null
                    && t.getFromStatus().getName() != null && t.getToStatus().getName() != null) {
                String fromName = t.getFromStatus().getName().trim();
                String toName = t.getToStatus().getName().trim();
                String fromKey = fromName.toLowerCase();
                String toKey = toName.toLowerCase();
                if (validNames.contains(fromKey) && validNames.contains(toKey)) {
                    String pairKey = fromKey + "->" + toKey;
                    if (!uniqueTransMap.containsKey(pairKey)) {
                        WorkflowTransitionDto dto = WorkflowTransitionDto.from(t);
                        dto.setFrom(fromName);
                        dto.setTo(toName);
                        uniqueTransMap.put(pairKey, dto);
                    } else {
                        WorkflowTransitionDto existing = uniqueTransMap.get(pairKey);
                        if (Boolean.TRUE.equals(t.getType() == TransitionType.APPROVE || t.getType() == TransitionType.REJECT)) {
                            existing.setIsApprovalStep(true);
                            existing.setType(t.getType());
                        }
                    }
                }
            }
        }
        List<WorkflowTransitionDto> transitionDtos = new ArrayList<>(uniqueTransMap.values());

        List<String> warnings = findOrphanStatusWarnings(dedupStatuses, transitions);

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
        Map<String, WorkflowStatus> currentByName = new HashMap<>();
        List<WorkflowStatus> extraDuplicates = new ArrayList<>();
        for (WorkflowStatus curr : currentStatuses) {
            if (curr.getName() != null) {
                String key = curr.getName().trim().toLowerCase();
                if (!currentByName.containsKey(key)) {
                    currentByName.put(key, curr);
                } else {
                    extraDuplicates.add(curr);
                }
            }
        }
        Set<String> incomingNamesLower = newStatuses.stream()
                .map(s -> s.getName().trim().toLowerCase())
                .collect(Collectors.toSet());

        List<WorkflowStatus> statusesToDelete = new ArrayList<>();
        for (WorkflowStatus curr : currentStatuses) {
            if (extraDuplicates.contains(curr)) {
                continue;
            }
            boolean keptById = incomingStatusIds.contains(curr.getId());
            boolean keptByName = curr.getName() != null
                    && incomingNamesLower.contains(curr.getName().trim().toLowerCase());
            if (!keptById && !keptByName) {
                long activeCount = issueRepository.countByStatusIdAndDeletedAtIsNull(curr.getId());
                if (activeCount > 0) {
                    throw new BusinessException(ErrorCode.CONFLICT,
                            "Cannot delete status '" + curr.getName() + "' because it has " + activeCount + " active issue(s)");
                }
                if (entityManager != null && curr.getId() != null) {
                    Long historyRefs = entityManager.createQuery(
                                    "SELECT COUNT(h) FROM IssueStatusHistory h WHERE h.fromStatus.id = :sid OR h.toStatus.id = :sid",
                                    Long.class)
                            .setParameter("sid", curr.getId())
                            .getSingleResult();
                    if (historyRefs != null && historyRefs > 0) {
                        throw new BusinessException(ErrorCode.CONFLICT,
                                "Cannot delete status '" + curr.getName() + "' because it is referenced in issue history");
                    }
                }
                statusesToDelete.add(curr);
            }
        }

        // Clean up any extra duplicate statuses in database
        for (WorkflowStatus dup : extraDuplicates) {
            WorkflowStatus canonical = currentByName.get(dup.getName().trim().toLowerCase());
            if (canonical != null && entityManager != null && dup.getId() != null) {
                entityManager.createQuery("UPDATE Issue i SET i.status = :canon WHERE i.status.id = :sid")
                        .setParameter("canon", canonical)
                        .setParameter("sid", dup.getId())
                        .executeUpdate();
                entityManager.createQuery("UPDATE IssueStatusHistory h SET h.fromStatus = :canon WHERE h.fromStatus.id = :sid")
                        .setParameter("canon", canonical)
                        .setParameter("sid", dup.getId())
                        .executeUpdate();
                entityManager.createQuery("UPDATE IssueStatusHistory h SET h.toStatus = :canon WHERE h.toStatus.id = :sid")
                        .setParameter("canon", canonical)
                        .setParameter("sid", dup.getId())
                        .executeUpdate();
            }
            statusesToDelete.add(dup);
        }

        // Delete existing transitions before removing unused statuses
        transitionRepository.deleteByProjectId(projectId);
        transitionRepository.flush();
        if (!statusesToDelete.isEmpty()) {
            if (entityManager != null) {
                for (WorkflowStatus del : statusesToDelete) {
                    if (del.getId() != null) {
                        entityManager.createQuery(
                                        "UPDATE Issue i SET i.status = NULL WHERE i.status.id = :sid AND i.deletedAt IS NOT NULL")
                                .setParameter("sid", del.getId())
                                .executeUpdate();
                    }
                }
            }
            statusRepository.deleteAll(statusesToDelete);
            statusRepository.flush();
        }

        // Map existing statuses or create new ones (enforce at most one initial status per project)
        Map<String, WorkflowStatus> statusMapByName = new HashMap<>();
        Map<Long, WorkflowStatus> statusMapById = new HashMap<>();

        // Clear any existing initial flags first when switching or normalizing initial status to avoid partial unique index conflicts
        Set<WorkflowStatus> deletedSet = new HashSet<>(statusesToDelete);
        boolean clearedInitial = false;
        for (WorkflowStatus curr : currentStatuses) {
            if (!deletedSet.contains(curr) && curr.isInitial()) {
                curr.setInitial(false);
                statusRepository.save(curr);
                clearedInitial = true;
            }
        }
        if (clearedInitial) {
            statusRepository.flush();
        }

        boolean assignedInitial = false;
        for (int i = 0; i < newStatuses.size(); i++) {
            WorkflowStatusDto dto = newStatuses.get(i);
            WorkflowStatus status = null;
            if (dto.getId() != null) {
                status = statusRepository.findById(dto.getId())
                        .filter(st -> st.getProject() == null || Objects.equals(st.getProject().getId(), projectId))
                        .orElse(null);
            }
            if (status == null && dto.getName() != null) {
                status = currentByName.get(dto.getName().trim().toLowerCase());
            }
            if (status == null) {
                status = new WorkflowStatus();
            }
            boolean isInitial = Boolean.TRUE.equals(dto.getIsInitial()) && !assignedInitial;
            if (isInitial) {
                assignedInitial = true;
            }
            status.setProject(project);
            status.setName(dto.getName().trim());
            status.setCategory(dto.getCategory() != null ? dto.getCategory() : StatusCategory.TODO);
            status.setPosition(i);
            status.setInitial(isInitial);
            dto.setPosition(i);
            dto.setIsInitial(isInitial);

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
                    TransitionType transType;
                    if (Boolean.FALSE.equals(tDto.getIsApprovalStep())) {
                        transType = TransitionType.NORMAL;
                    } else if (Boolean.TRUE.equals(tDto.getIsApprovalStep())) {
                        transType = (tDto.getType() == TransitionType.REJECT) ? TransitionType.REJECT : TransitionType.APPROVE;
                    } else if (tDto.getType() != null) {
                        transType = tDto.getType();
                    } else {
                        transType = TransitionType.NORMAL;
                    }
                    transition.setType(transType);
                    String reqFields = tDto.getRequiresField() != null ? tDto.getRequiresField() : tDto.getRequiredFields();
                    if (reqFields != null && reqFields.isBlank()) {
                        reqFields = null;
                    }
                    transition.setRequiredFields(reqFields != null ? reqFields.trim() : null);
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
        Set<Long> hasIncoming = transitions.stream()
                .filter(t -> t.getToStatus() != null && t.getToStatus().getId() != null)
                .map(t -> t.getToStatus().getId())
                .collect(Collectors.toSet());
        Set<Long> hasOutgoing = transitions.stream()
                .filter(t -> t.getFromStatus() != null && t.getFromStatus().getId() != null)
                .map(t -> t.getFromStatus().getId())
                .collect(Collectors.toSet());

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
    public Issue executeTransition(String issueKey, Long transitionId, Map<String, Object> fields, String comment, Boolean sendEmail, User currentUser) {
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
                if (fieldName.isEmpty()) continue;

                // Case-insensitive lookup in fields map
                Object val = null;
                if (fields != null) {
                    for (Map.Entry<String, Object> entry : fields.entrySet()) {
                        if (entry.getKey() != null && entry.getKey().trim().equalsIgnoreCase(fieldName)) {
                            val = entry.getValue();
                            break;
                        }
                    }
                }

                if (val == null || val.toString().trim().isEmpty()) {
                    throw new BusinessException(ErrorCode.REQUIRED_FIELD_MISSING, "Required field is missing: " + fieldName);
                }

                // If field is resolution, update issue resolution
                if (fieldName.equalsIgnoreCase("resolution")) {
                    issue.setResolution(val.toString().trim());
                }
            }
        }

        WorkflowStatus fromStatus = issue.getStatus();
        WorkflowStatus toStatus = transition.getToStatus();
        issue.setStatus(toStatus);
        Issue savedIssue = issueRepository.save(issue);

        // Record history with all required fields & optional comment
        StringBuilder historyCommentBuilder = new StringBuilder();
        if (fields != null && !fields.isEmpty()) {
            for (Map.Entry<String, Object> entry : fields.entrySet()) {
                if (entry.getValue() != null && !entry.getValue().toString().trim().isEmpty()) {
                    String key = entry.getKey().trim();
                    if ("resolution".equalsIgnoreCase(key)) {
                        key = "Kết quả xử lý (Resolution)";
                    }
                    historyCommentBuilder.append(key).append(": ").append(entry.getValue().toString().trim()).append("\n");
                }
            }
        }
        if (comment != null && !comment.trim().isEmpty()) {
            if (historyCommentBuilder.length() > 0) {
                historyCommentBuilder.append("Ghi chú chuyển đổi trạng thái: ").append(comment.trim());
            } else {
                historyCommentBuilder.append(comment.trim());
            }
        }
        String finalHistoryComment = historyCommentBuilder.length() > 0 ? historyCommentBuilder.toString().trim() : null;

        IssueStatusHistory history = new IssueStatusHistory(savedIssue, fromStatus, toStatus, currentUser, finalHistoryComment);
        historyRepository.save(history);

        // Audit log
        auditService.log("CHANGE_STATUS", "ISSUE", savedIssue.getId(), savedIssue.getProject().getId(),
                fromStatus.getName(), toStatus.getName());

        // Notifications: Only notify for approval actions or transitions into approval statuses
        if (transition.getType() == TransitionType.APPROVE) {
            List<User> recipients = new ArrayList<>();
            if (savedIssue.getAssignee() != null) recipients.add(savedIssue.getAssignee());
            if (savedIssue.getReporter() != null && !recipients.contains(savedIssue.getReporter())) {
                recipients.add(savedIssue.getReporter());
            }
            if (watcherService != null) {
                for (User w : watcherService.getWatchers(savedIssue.getId())) {
                    if (!recipients.contains(w)) recipients.add(w);
                }
            }
            recipients.removeIf(u -> u.getId().equals(currentUser.getId()));

            if (!recipients.isEmpty()) {
                notificationService.notify(
                        NotificationType.APPROVAL_RESULT,
                        recipients,
                        "Công việc đã được phê duyệt: " + savedIssue.getIssueKey(),
                        "Công việc " + savedIssue.getIssueKey() + " (" + savedIssue.getSummary() + ") đã được phê duyệt chuyển sang trạng thái '" + toStatus.getName() + "' bởi " + currentUser.getFullName() + (comment != null && !comment.isBlank() ? " (" + comment + ")" : ""),
                        "/projects/" + savedIssue.getProject().getProjectKey() + "/issues/" + savedIssue.getIssueKey(),
                        savedIssue.getIssueKey(),
                        currentUser
                );
            }
        } else if (transition.getType() == TransitionType.REJECT) {
            List<User> recipients = new ArrayList<>();
            if (savedIssue.getAssignee() != null) recipients.add(savedIssue.getAssignee());
            if (savedIssue.getReporter() != null && !recipients.contains(savedIssue.getReporter())) {
                recipients.add(savedIssue.getReporter());
            }
            if (watcherService != null) {
                for (User w : watcherService.getWatchers(savedIssue.getId())) {
                    if (!recipients.contains(w)) recipients.add(w);
                }
            }
            recipients.removeIf(u -> u.getId().equals(currentUser.getId()));

            if (!recipients.isEmpty()) {
                notificationService.notify(
                        NotificationType.APPROVAL_RESULT,
                        recipients,
                        "Công việc bị từ chối phê duyệt: " + savedIssue.getIssueKey(),
                        "Công việc " + savedIssue.getIssueKey() + " (" + savedIssue.getSummary() + ") đã bị từ chối và chuyển về trạng thái '" + toStatus.getName() + "'" + (comment != null && !comment.isBlank() ? ". Lý do: " + comment : ""),
                        "/projects/" + savedIssue.getProject().getProjectKey() + "/issues/" + savedIssue.getIssueKey(),
                        savedIssue.getIssueKey(),
                        currentUser
                );
            }
        } else {
            // Check if toStatus is an approval status
            boolean isApprovalStatus = toStatus.getName().equalsIgnoreCase("Pending Approval")
                    || toStatus.getName().equalsIgnoreCase("Chờ xác nhận")
                    || toStatus.getName().toLowerCase().contains("approval")
                    || toStatus.getName().toLowerCase().contains("chờ duyệt")
                    || toStatus.getName().toLowerCase().contains("phê duyệt")
                    || transitionRepository.findByFromStatusId(toStatus.getId()).stream()
                            .anyMatch(t -> t.getType() == TransitionType.APPROVE || t.getType() == TransitionType.REJECT);

            if (isApprovalStatus) {
                List<ProjectMember> approverMembers = memberRepository.findByProjectId(savedIssue.getProject().getId())
                        .stream()
                        .filter(m -> m.getRole() == ProjectRole.PM || m.getRole() == ProjectRole.QA)
                        .collect(Collectors.toList());

                List<User> approverUsers = new ArrayList<>(approverMembers.stream().map(ProjectMember::getUser).distinct().toList());
                if (savedIssue.getProject().getCreatedBy() != null && !approverUsers.contains(savedIssue.getProject().getCreatedBy())) {
                    approverUsers.add(savedIssue.getProject().getCreatedBy());
                }
                approverUsers.removeIf(u -> u.getId().equals(currentUser.getId()));

                if (!approverUsers.isEmpty()) {
                    notificationService.notify(
                            NotificationType.APPROVAL_REQUESTED,
                            approverUsers,
                            "Yêu cầu phê duyệt: " + savedIssue.getIssueKey(),
                            "Công việc " + savedIssue.getIssueKey() + " (" + savedIssue.getSummary() + ") đã chuyển sang trạng thái '" + toStatus.getName() + "' và đang chờ phê duyệt",
                            "/projects/" + savedIssue.getProject().getProjectKey() + "/issues/" + savedIssue.getIssueKey(),
                            savedIssue.getIssueKey(),
                            currentUser
                    );
                }
            }
        }

        // Dedicated approval feedback email to assignee only when PM/Admin executes an APPROVE or REJECT transition
        boolean isApprovalOrReject = transition.getType() == TransitionType.APPROVE
                || transition.getType() == TransitionType.REJECT;
        if (Boolean.TRUE.equals(sendEmail)
                && isApprovalOrReject
                && projectSecurity.isPmOrAdmin(savedIssue.getProject().getId())) {
            sendApprovalFeedbackEmail(savedIssue, toStatus, fields, comment, currentUser);
        }

        return savedIssue;
    }

    @Override
    @Transactional
    public Issue executeTransition(String issueKey, Long transitionId, Map<String, Object> fields, String comment, User currentUser) {
        return executeTransition(issueKey, transitionId, fields, comment, false, currentUser);
    }

    @Transactional
    public Issue approveIssue(String issueKey, String comment, Boolean sendEmail, User currentUser) {
        Issue issue = issueRepository.findByIssueKeyAndDeletedAtIsNull(issueKey)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        if (!projectSecurity.isPmOrAdmin(issue.getProject().getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Only Project Managers or Admins can approve issues");
        }

        projectSecurity.assertProjectWritable(issue.getProject());

        if (issue.getStatus() == null) {
            throw new BusinessException(ErrorCode.INVALID_TRANSITION, "Issue has no current status");
        }

        // Must have an explicit APPROVE transition or a transition to a DONE status from the current status
        List<WorkflowTransition> transitions = transitionRepository.findByFromStatusId(issue.getStatus().getId());
        WorkflowTransition approveTrans = transitions.stream()
                .filter(t -> t.getType() == TransitionType.APPROVE)
                .findFirst()
                .or(() -> transitions.stream()
                        .filter(t -> t.getToStatus() != null && t.getToStatus().getCategory() == StatusCategory.DONE)
                        .findFirst())
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.INVALID_TRANSITION,
                        "Không có luồng phê duyệt hợp lệ từ trạng thái '" + issue.getStatus().getName() + "' sang trạng thái hoàn thành"
                ));

        WorkflowStatus doneStatus = approveTrans.getToStatus();

        WorkflowStatus fromStatus = issue.getStatus();
        issue.setStatus(doneStatus);
        Issue saved = issueRepository.save(issue);

        IssueStatusHistory history = new IssueStatusHistory(saved, fromStatus, doneStatus, currentUser, comment != null ? comment : "Approved");
        historyRepository.save(history);

        auditService.log("APPROVE_ISSUE", "ISSUE", saved.getId(), saved.getProject().getId(), fromStatus.getName(), doneStatus.getName());

        List<User> recipients = new ArrayList<>();
        if (saved.getAssignee() != null) recipients.add(saved.getAssignee());
        if (saved.getReporter() != null && !recipients.contains(saved.getReporter())) {
            recipients.add(saved.getReporter());
        }
        if (watcherService != null) {
            for (User w : watcherService.getWatchers(saved.getId())) {
                if (!recipients.contains(w)) recipients.add(w);
            }
        }
        recipients.removeIf(u -> u.getId().equals(currentUser.getId()));

        if (!recipients.isEmpty()) {
            notificationService.notify(
                    NotificationType.APPROVAL_RESULT,
                    recipients,
                    "Công việc đã được phê duyệt: " + saved.getIssueKey(),
                    "Công việc " + saved.getIssueKey() + " (" + saved.getSummary() + ") đã được phê duyệt chuyển sang trạng thái '" + doneStatus.getName() + "' bởi " + currentUser.getFullName() + (comment != null && !comment.isBlank() && !comment.equals("Approved") ? " (" + comment + ")" : ""),
                    "/projects/" + saved.getProject().getProjectKey() + "/issues/" + saved.getIssueKey(),
                    saved.getIssueKey(),
                    currentUser
            );
        }

        if (Boolean.TRUE.equals(sendEmail)) {
            sendApprovalFeedbackEmail(saved, doneStatus, null, comment, currentUser);
        }

        return saved;
    }

    @Override
    @Transactional
    public Issue approveIssue(String issueKey, String comment, User currentUser) {
        return approveIssue(issueKey, comment, false, currentUser);
    }

    @Transactional
    public Issue rejectIssue(String issueKey, String reason, Boolean sendEmail, User currentUser) {
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

        List<User> recipients = new ArrayList<>();
        if (saved.getAssignee() != null) recipients.add(saved.getAssignee());
        if (saved.getReporter() != null && !recipients.contains(saved.getReporter())) {
            recipients.add(saved.getReporter());
        }
        if (watcherService != null) {
            for (User w : watcherService.getWatchers(saved.getId())) {
                if (!recipients.contains(w)) recipients.add(w);
            }
        }
        recipients.removeIf(u -> u.getId().equals(currentUser.getId()));

        if (!recipients.isEmpty()) {
            notificationService.notify(
                    NotificationType.APPROVAL_RESULT,
                    recipients,
                    "Công việc bị từ chối phê duyệt: " + saved.getIssueKey(),
                    "Công việc " + saved.getIssueKey() + " (" + saved.getSummary() + ") đã bị từ chối và chuyển về trạng thái '" + inProgressStatus.getName() + "'. Lý do: " + reason,
                    "/projects/" + saved.getProject().getProjectKey() + "/issues/" + saved.getIssueKey(),
                    saved.getIssueKey(),
                    currentUser
            );
        }

        if (Boolean.TRUE.equals(sendEmail)) {
            Map<String, Object> fields = Map.of("Lý do từ chối", reason);
            sendApprovalFeedbackEmail(saved, inProgressStatus, fields, null, currentUser);
        }

        return saved;
    }

    @Override
    @Transactional
    public Issue rejectIssue(String issueKey, String reason, User currentUser) {
        return rejectIssue(issueKey, reason, false, currentUser);
    }

    private void sendApprovalFeedbackEmail(Issue issue, WorkflowStatus toStatus, Map<String, Object> fields, String comment, User currentUser) {
        if (mailService == null || issue.getAssignee() == null || issue.getAssignee().getEmail() == null || issue.getAssignee().getEmail().isBlank()) {
            return;
        }

        String roleLabel = "PM";
        String emailSubject = "Phản hồi của " + roleLabel + " về công việc của bạn";

        StringBuilder msgBuilder = new StringBuilder();
        msgBuilder.append("Công việc: ").append(issue.getIssueKey()).append(" - ").append(issue.getSummary()).append("\n");
        msgBuilder.append("Trạng thái sau khi duyệt: ").append(toStatus != null ? toStatus.getName() : "Không xác định").append("\n");
        msgBuilder.append("Người duyệt: ").append(currentUser != null && currentUser.getFullName() != null ? currentUser.getFullName() : (currentUser != null ? currentUser.getEmail() : "")).append(" (").append(roleLabel).append(")\n\n");

        if (fields != null && !fields.isEmpty()) {
            for (Map.Entry<String, Object> entry : fields.entrySet()) {
                String fieldLabel = entry.getKey();
                if ("resolution".equalsIgnoreCase(fieldLabel)) {
                    fieldLabel = "Kết quả xử lý (Resolution)";
                }
                msgBuilder.append(fieldLabel).append(": ").append(entry.getValue() != null ? entry.getValue() : "").append("\n");
            }
            msgBuilder.append("\n");
        }

        if (comment != null && !comment.isBlank()) {
            msgBuilder.append("Ghi chú chuyển đổi trạng thái:\n");
            msgBuilder.append(comment.trim()).append("\n");
        }

        String frontendBase = appProperties != null && appProperties.getFrontendUrl() != null 
                ? appProperties.getFrontendUrl().replaceAll("/+$", "") 
                : "https://pms-chi-self.vercel.app";
        String link = frontendBase + "/projects/" + (issue.getProject() != null ? issue.getProject().getProjectKey() : "") + "/issues/" + issue.getIssueKey();

        mailService.sendMailAsync(
                issue.getAssignee().getEmail(),
                emailSubject,
                "notification",
                Map.of(
                        "recipientName", issue.getAssignee().getFullName() != null ? issue.getAssignee().getFullName() : issue.getAssignee().getEmail(),
                        "title", emailSubject,
                        "message", msgBuilder.toString(),
                        "link", link,
                        "buttonText", "Xem chi tiết công việc",
                        "footerNote", "* Lưu ý: Vui lòng đăng nhập hệ thống EPMS để xem chi tiết phản hồi và tiếp tục xử lý công việc."
                )
        );
    }
}
