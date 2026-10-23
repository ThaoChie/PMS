package com.pms.backend.service;

import com.pms.backend.config.AppProperties;
import com.pms.backend.dao.*;
import com.pms.backend.dto.*;
import com.pms.backend.enu.*;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.exception.ValidationException;
import com.pms.backend.model.*;
import com.pms.backend.security.ProjectSecurity;
import com.pms.backend.util.DurationParser;
import com.pms.backend.util.HtmlSanitizer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class IssueService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository memberRepository;
    private final WorkflowStatusRepository statusRepository;
    private final LabelRepository labelRepository;
    private final IssueLinkRepository linkRepository;
    private final IssueAttachmentRepository attachmentRepository;
    private final IssueStatusHistoryRepository historyRepository;
    private final IssueKeyGenerator keyGenerator;
    private final WorkflowService workflowService;
    private final ProjectSecurity projectSecurity;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final FileStorageService fileStorageService;
    private final AppProperties appProperties;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private WatcherService watcherService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private RecentViewService recentViewService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private MailService mailService;

    public IssueService(IssueRepository issueRepository,
                        ProjectRepository projectRepository,
                        UserRepository userRepository,
                        ProjectMemberRepository memberRepository,
                        WorkflowStatusRepository statusRepository,
                        LabelRepository labelRepository,
                        IssueLinkRepository linkRepository,
                        IssueAttachmentRepository attachmentRepository,
                        IssueStatusHistoryRepository historyRepository,
                        IssueKeyGenerator keyGenerator,
                        WorkflowService workflowService,
                        ProjectSecurity projectSecurity,
                        NotificationService notificationService,
                        AuditService auditService,
                        FileStorageService fileStorageService,
                        AppProperties appProperties) {
        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.statusRepository = statusRepository;
        this.labelRepository = labelRepository;
        this.linkRepository = linkRepository;
        this.attachmentRepository = attachmentRepository;
        this.historyRepository = historyRepository;
        this.keyGenerator = keyGenerator;
        this.workflowService = workflowService;
        this.projectSecurity = projectSecurity;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.fileStorageService = fileStorageService;
        this.appProperties = appProperties;
    }

    @Transactional
    public IssueResponse createIssue(Long projectId, CreateIssueRequest request, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        projectSecurity.assertProjectWritable(project);

        if (request.getSummary() == null || request.getSummary().isBlank()) {
            throw new ValidationException("Summary is required");
        }
        if (request.getType() == null) {
            throw new ValidationException("Issue type is required");
        }

        // Parse estimates
        int origEst = request.getOriginalEstimateMin() != null ? request.getOriginalEstimateMin() : 0;
        int remEst = request.getRemainingEstimateMin() != null ? request.getRemainingEstimateMin() : 0;
        if (request.getEstimates() != null && !request.getEstimates().isBlank()) {
            int parsed = DurationParser.parseToMinutes(request.getEstimates());
            if (origEst == 0) origEst = parsed;
            if (remEst == 0) remEst = parsed;
        }

        // Rule BR-ISS-03: Remaining <= Original
        if (origEst > 0 && remEst > origEst) {
            throw new BusinessException(ErrorCode.ESTIMATE_INVALID, "Remaining estimate cannot exceed original estimate");
        }

        // Rule A-15: Due Date >= today when setting
        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDate.now())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Due date cannot be in the past");
        }

        Issue issue = new Issue();
        issue.setProject(project);
        issue.setSummary(request.getSummary().trim());
        issue.setDescription(HtmlSanitizer.sanitize(request.getDescription()));
        issue.setType(request.getType());
        issue.setPriority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM);
        issue.setReporter(currentUser);
        issue.setOriginalEstimateMin(origEst);
        issue.setRemainingEstimateMin(remEst);
        issue.setDueDate(request.getDueDate());
        issue.setEnvironment(request.getEnvironment());

        // Assignee
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
            if (!memberRepository.existsByProjectIdAndUserId(projectId, assignee.getId())) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "Assignee must be a member of the project");
            }
            issue.setAssignee(assignee);
        }

        // Initial Workflow Status
        WorkflowStatus initialStatus = statusRepository.findByProjectIdAndIsInitialTrue(projectId)
                .orElseGet(() -> {
                    List<WorkflowStatus> list = statusRepository.findByProjectIdOrderByPositionAsc(projectId);
                    return list.isEmpty() ? null : list.get(0);
                });
        issue.setStatus(initialStatus);

        // Subtask / Parent check (BR-ISS-05)
        if (request.getParentId() != null) {
            Issue parent = issueRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent issue not found"));
            if (parent.getType() == IssueType.SUB_TASK) {
                throw new BusinessException(ErrorCode.SUBTASK_NESTING_NOT_ALLOWED, "Sub-task cannot be nested under another sub-task");
            }
            issue.setParent(parent);
            issue.setType(IssueType.SUB_TASK);
        }

        // Epic link check
        if (request.getEpicId() != null) {
            Issue epic = issueRepository.findById(request.getEpicId())
                    .orElseThrow(() -> new ResourceNotFoundException("Epic not found"));
            if (epic.getType() != IssueType.EPIC) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Selected epic issue is not of type EPIC");
            }
            issue.setEpic(epic);
        }

        // Generate consecutive atomic key
        String key = keyGenerator.generateNextKey(projectId, project.getProjectKey());
        issue.setIssueKey(key);

        // Labels
        if (request.getLabels() != null && !request.getLabels().isEmpty()) {
            Set<Label> labelSet = new HashSet<>();
            for (String lblName : request.getLabels()) {
                String trimmed = lblName.trim();
                if (!trimmed.isEmpty()) {
                    Label label = labelRepository.findByProjectIdAndName(projectId, trimmed)
                            .orElseGet(() -> labelRepository.save(new Label(project, trimmed)));
                    labelSet.add(label);
                }
            }
            issue.setLabels(labelSet);
        }

        Issue saved = issueRepository.save(issue);

        // Record initial status history
        if (initialStatus != null) {
            historyRepository.save(new IssueStatusHistory(saved, null, initialStatus, currentUser, "Issue created"));
        }

        auditService.log("CREATE_ISSUE", "ISSUE", saved.getId(), projectId, null, "Created issue " + saved.getIssueKey());

        // Notify assignee if not self
        if (saved.getAssignee() != null && !saved.getAssignee().getId().equals(currentUser.getId())) {
            notificationService.notify(
                    NotificationType.ASSIGNED,
                    List.of(saved.getAssignee()),
                    "Bạn được giao Issue: " + saved.getIssueKey(),
                    "Bạn đã được " + currentUser.getFullName() + " giao Issue " + saved.getIssueKey() + ": " + saved.getSummary(),
                    "/projects/" + project.getProjectKey() + "/issues/" + saved.getIssueKey(),
                    saved.getIssueKey(),
                    currentUser
            );
        }

        // Auto-watch hook (T3.07)
        if (watcherService != null) {
            watcherService.watchIssue(saved, currentUser);
        }

        return IssueResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<IssueResponse> getProjectIssues(Long projectId, IssueType type, Priority priority, Long statusId, Long assigneeId, Pageable pageable) {
        Page<Issue> page = issueRepository.findFilteredIssues(projectId, type, priority, statusId, assigneeId, pageable);
        return page.map(IssueResponse::from);
    }

    private Issue findIssue(String issueKeyOrId) {
        if (issueKeyOrId == null || issueKeyOrId.isBlank()) {
            throw new ResourceNotFoundException("Issue not found");
        }
        Optional<Issue> issueOpt = issueRepository.findByIssueKeyAndDeletedAtIsNull(issueKeyOrId);
        if (issueOpt.isEmpty() && issueKeyOrId.matches("^\\d+$")) {
            try {
                issueOpt = issueRepository.findById(Long.parseLong(issueKeyOrId))
                        .filter(i -> i.getDeletedAt() == null);
            } catch (Exception ignored) {}
        }
        return issueOpt.orElseThrow(() -> new ResourceNotFoundException("Issue not found: " + issueKeyOrId));
    }

    @Transactional
    public IssueResponse getIssueDetail(String issueKey, User currentUser) {
        Issue issue = findIssue(issueKey);

        if (recentViewService != null && currentUser != null) {
            recentViewService.recordView(issue, currentUser);
        }

        IssueResponse res = IssueResponse.from(issue);
        if (watcherService != null && currentUser != null) {
            res.setIsWatching(watcherService.isWatching(issue.getId(), currentUser.getId()));
        }

        // Linked issues
        List<IssueLink> links = linkRepository.findAllLinksForIssue(issue.getId());
        List<LinkedIssueResponse> linkedResponses = links.stream()
                .map(l -> LinkedIssueResponse.from(l, issue.getId()))
                .collect(Collectors.toList());
        res.setLinkedIssues(linkedResponses);

        // Available transitions for this user
        List<TransitionOptionResponse> transitions = workflowService.getTransitionsForIssue(issue.getIssueKey(), currentUser);
        res.setAvailableTransitions(transitions);

        return res;
    }

    @Transactional
    public IssueResponse updateIssue(String issueKey, UpdateIssueRequest request, User currentUser) {
        Issue issue = findIssue(issueKey);

        projectSecurity.assertProjectWritable(issue.getProject());

        // Optimistic locking check
        if (request.getVersion() != null && !request.getVersion().equals(issue.getVersion())) {
            throw new BusinessException(ErrorCode.CONCURRENT_MODIFICATION,
                    "Issue has been modified by another user (expected version " + request.getVersion() + ", actual version " + issue.getVersion() + ")");
        }

        // Check estimates
        if (request.getOriginalEstimateMin() != null) {
            issue.setOriginalEstimateMin(request.getOriginalEstimateMin());
        }
        if (request.getRemainingEstimateMin() != null) {
            if (issue.getOriginalEstimateMin() > 0 && request.getRemainingEstimateMin() > issue.getOriginalEstimateMin()) {
                throw new BusinessException(ErrorCode.ESTIMATE_INVALID, "Remaining estimate cannot exceed original estimate");
            }
            issue.setRemainingEstimateMin(request.getRemainingEstimateMin());
        }
        if (request.getEstimates() != null) {
            if (request.getEstimates().isBlank()) {
                issue.setRemainingEstimateMin(0);
            } else {
                int parsed = DurationParser.parseToMinutes(request.getEstimates());
                issue.setRemainingEstimateMin(parsed);
            }
        }

        if (request.getSummary() != null && !request.getSummary().isBlank()) {
            issue.setSummary(request.getSummary().trim());
        }
        if (request.getDescription() != null) {
            issue.setDescription(HtmlSanitizer.sanitize(request.getDescription()));
        }
        if (request.getType() != null) {
            issue.setType(request.getType());
        }
        if (request.getPriority() != null) {
            issue.setPriority(request.getPriority());
        }
        if (Boolean.TRUE.equals(request.getClearDueDate())) {
            issue.setDueDate(null);
        } else if (request.getDueDate() != null) {
            issue.setDueDate(request.getDueDate());
        }
        if (request.getEnvironment() != null) {
            issue.setEnvironment(request.getEnvironment().isBlank() ? null : request.getEnvironment().trim());
        }
        if (request.getResolution() != null) {
            issue.setResolution(request.getResolution());
        }

        // Assignee change
        if (Boolean.TRUE.equals(request.getClearAssignee()) || (request.getAssigneeId() != null && request.getAssigneeId() <= 0)) {
            issue.setAssignee(null);
        } else if (request.getAssigneeId() != null && request.getAssigneeId() > 0) {
            User newAssignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            if (!memberRepository.existsByProjectIdAndUserId(issue.getProject().getId(), newAssignee.getId())) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "Assignee must be a project member");
            }
            User oldAssignee = issue.getAssignee();
            issue.setAssignee(newAssignee);

            if (!newAssignee.getId().equals(currentUser.getId()) && (oldAssignee == null || !oldAssignee.getId().equals(newAssignee.getId()))) {
                notificationService.notify(
                        NotificationType.ASSIGNED,
                        List.of(newAssignee),
                        "Bạn được giao Issue: " + issue.getIssueKey(),
                        "Bạn đã được " + currentUser.getFullName() + " giao Issue " + issue.getIssueKey() + ": " + issue.getSummary(),
                        "/projects/" + issue.getProject().getProjectKey() + "/issues/" + issue.getIssueKey(),
                        issue.getIssueKey(),
                        currentUser
                );
            }
        }

        // Labels
        if (request.getLabels() != null) {
            Set<Label> labelSet = new HashSet<>();
            for (String lblName : request.getLabels()) {
                String trimmed = lblName.trim();
                if (!trimmed.isEmpty()) {
                    Label label = labelRepository.findByProjectIdAndName(issue.getProject().getId(), trimmed)
                            .orElseGet(() -> labelRepository.save(new Label(issue.getProject(), trimmed)));
                    labelSet.add(label);
                }
            }
            issue.setLabels(labelSet);
        }

        Issue saved = issueRepository.save(issue);
        auditService.log("UPDATE_ISSUE", "ISSUE", saved.getId(), saved.getProject().getId(), null, "Updated issue " + saved.getIssueKey());

        return IssueResponse.from(saved);
    }

    @Transactional
    public void deleteIssue(String issueKey, User currentUser) {
        Issue issue = findIssue(issueKey);

        projectSecurity.assertProjectWritable(issue.getProject());

        LocalDateTime now = LocalDateTime.now();
        issue.setDeletedAt(now);

        // Cascade soft delete to subtasks (A-11)
        List<Issue> subtasks = issueRepository.findByParentIdAndDeletedAtIsNull(issue.getId());
        for (Issue st : subtasks) {
            st.setDeletedAt(now);
            issueRepository.save(st);
        }

        issueRepository.save(issue);
        auditService.log("DELETE_ISSUE", "ISSUE", issue.getId(), issue.getProject().getId(), issue.getIssueKey(), "Soft deleted issue and " + subtasks.size() + " subtasks");
    }

    @Transactional
    public void assignIssue(String issueKey, Long assigneeId, User currentUser) {
        Issue issue = findIssue(issueKey);

        projectSecurity.assertProjectWritable(issue.getProject());

        if (assigneeId == null || assigneeId <= 0) {
            issue.setAssignee(null);
        } else {
            User assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            if (!memberRepository.existsByProjectIdAndUserId(issue.getProject().getId(), assignee.getId())) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "Assignee must be a project member");
            }
            issue.setAssignee(assignee);

            if (!assignee.getId().equals(currentUser.getId())) {
                notificationService.notify(
                        NotificationType.ASSIGNED,
                        List.of(assignee),
                        "Bạn được giao Issue: " + issue.getIssueKey(),
                        "Bạn đã được " + currentUser.getFullName() + " giao Issue " + issue.getIssueKey() + ": " + issue.getSummary(),
                        "/projects/" + issue.getProject().getProjectKey() + "/issues/" + issue.getIssueKey(),
                        issue.getIssueKey(),
                        currentUser
                );
            }
            if (watcherService != null) {
                watcherService.watchIssue(issue, assignee);
            }
        }

        issueRepository.save(issue);
        auditService.log("ASSIGN_ISSUE", "ISSUE", issue.getId(), issue.getProject().getId(), null, "Assigned to user ID: " + assigneeId);
    }

    @Transactional
    public void linkIssue(String issueKey, String targetKey, String relation, User currentUser) {
        if (issueKey.equalsIgnoreCase(targetKey)) {
            throw new ValidationException("Cannot link an issue to itself");
        }

        Issue source = findIssue(issueKey);
        Issue target = findIssue(targetKey);

        // Must be member of target project
        if (!projectSecurity.isMember(target.getProject().getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Cannot link to an issue in an inaccessible project");
        }

        LinkType linkType;
        try {
            linkType = LinkType.valueOf(relation.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            linkType = switch (relation.toLowerCase()) {
                case "blocks" -> LinkType.BLOCKS;
                case "duplicates" -> LinkType.DUPLICATES;
                default -> LinkType.RELATES_TO;
            };
        }

        IssueLink link = new IssueLink(source, target, linkType);
        linkRepository.save(link);

        auditService.log("LINK_ISSUE", "ISSUE", source.getId(), source.getProject().getId(), null, "Linked " + source.getIssueKey() + " -> " + target.getIssueKey() + " (" + linkType + ")");
    }

    @Transactional
    public void removeLink(String issueKey, Long linkId, User currentUser) {
        IssueLink link = linkRepository.findById(linkId)
                .orElseThrow(() -> new ResourceNotFoundException("Link not found"));
        linkRepository.delete(link);
    }

    @Transactional
    public void setEpic(String issueKey, String epicKey, User currentUser) {
        Issue issue = findIssue(issueKey);

        projectSecurity.assertProjectWritable(issue.getProject());

        if (epicKey == null || epicKey.isBlank()) {
            issue.setEpic(null);
        } else {
            if (epicKey.equalsIgnoreCase(issueKey)) {
                throw new BusinessException(ErrorCode.EPIC_LINK_CYCLE, "An issue cannot be its own Epic");
            }
            Issue epic = findIssue(epicKey);

            if (epic.getType() != IssueType.EPIC) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Target issue is not of type EPIC");
            }
            if (epic.getEpic() != null) {
                throw new BusinessException(ErrorCode.EPIC_LINK_CYCLE, "Epic cannot have an Epic link (no hierarchical nesting of Epics)");
            }

            issue.setEpic(epic);
        }

        issueRepository.save(issue);
        auditService.log("SET_EPIC", "ISSUE", issue.getId(), issue.getProject().getId(), null, "Set epic to: " + epicKey);
    }

    @Transactional
    public SubtaskResponse createSubtask(String issueKey, String summary, Long assigneeId, User currentUser) {
        Issue parent = findIssue(issueKey);

        projectSecurity.assertProjectWritable(parent.getProject());

        if (parent.getType() == IssueType.SUB_TASK) {
            throw new BusinessException(ErrorCode.SUBTASK_NESTING_NOT_ALLOWED, "Sub-tasks cannot have sub-tasks");
        }

        CreateIssueRequest req = new CreateIssueRequest();
        req.setSummary(summary);
        req.setType(IssueType.SUB_TASK);
        req.setParentId(parent.getId());
        req.setAssigneeId(assigneeId);

        IssueResponse res = createIssue(parent.getProject().getId(), req, currentUser);
        SubtaskResponse stRes = new SubtaskResponse();
        stRes.setId(res.getId());
        stRes.setKey(res.getKey());
        stRes.setSummary(res.getSummary());
        stRes.setStatus(res.getStatus());
        stRes.setAssignee(res.getAssignee());
        return stRes;
    }

    @Transactional
    public AttachmentResponse uploadAttachment(String issueKey, MultipartFile file, User currentUser) {
        Issue issue = findIssue(issueKey);

        projectSecurity.assertProjectWritable(issue.getProject());

        if (file.isEmpty()) {
            throw new ValidationException("Cannot upload an empty file");
        }

        // Check file size (BR-ISS-04)
        long maxFileSize = appProperties.getUpload().getMaxFileSize();
        if (file.getSize() > maxFileSize) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE, "File size exceeds allowed limit of " + (maxFileSize / 1024 / 1024) + "MB");
        }

        // Check total issue attachment size
        long currentTotalSize = attachmentRepository.calculateTotalAttachmentSizeForIssue(issue.getId());
        long maxIssueSize = appProperties.getUpload().getMaxIssueSize();
        if (currentTotalSize + file.getSize() > maxIssueSize) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE, "Total attachments size for this issue exceeds limit of " + (maxIssueSize / 1024 / 1024) + "MB");
        }

        // Store file
        String fileUrl = fileStorageService.uploadFile(file);

        IssueAttachment attachment = new IssueAttachment();
        attachment.setIssue(issue);
        attachment.setFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment");
        attachment.setFileUrl(fileUrl);
        attachment.setFileSize(file.getSize());
        attachment.setContentType(file.getContentType());
        attachment.setUploadedBy(currentUser);

        IssueAttachment saved = attachmentRepository.save(attachment);
        auditService.log("UPLOAD_ATTACHMENT", "ISSUE", issue.getId(), issue.getProject().getId(), null, "Uploaded attachment: " + saved.getFileName());

        return AttachmentResponse.from(saved);
    }

    @Transactional
    public void deleteAttachment(String issueKey, Long attachmentId, User currentUser) {
        IssueAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));

        projectSecurity.assertProjectWritable(attachment.getIssue().getProject());

        attachmentRepository.delete(attachment);
        auditService.log("DELETE_ATTACHMENT", "ISSUE", attachment.getIssue().getId(), attachment.getIssue().getProject().getId(), null, "Deleted attachment: " + attachment.getFileName());
    }

    @Transactional(readOnly = true)
    public List<IssueStatusHistoryResponse> getIssueHistory(String issueKey) {
        Issue issue = findIssue(issueKey);

        List<IssueStatusHistory> list = historyRepository.findByIssueIdOrderByChangedAtAsc(issue.getId());
        return list.stream().map(IssueStatusHistoryResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public void convertToSubtask(String issueKey, String parentKey, User currentUser) {
        if (issueKey.equalsIgnoreCase(parentKey)) {
            throw new ValidationException("Cannot convert issue to subtask of itself");
        }

        Issue issue = findIssue(issueKey);

        projectSecurity.assertProjectWritable(issue.getProject());

        Issue parent = findIssue(parentKey);

        if (parent.getType() == IssueType.SUB_TASK) {
            throw new BusinessException(ErrorCode.SUBTASK_NESTING_NOT_ALLOWED, "Sub-task cannot have sub-tasks");
        }

        // Check if issue is an Epic with child issues (BR-COL-03)
        if (issue.getType() == IssueType.EPIC) {
            List<Issue> epicChildren = issueRepository.findByEpicIdAndDeletedAtIsNull(issue.getId());
            if (!epicChildren.isEmpty()) {
                throw new BusinessException(ErrorCode.UNPROCESSABLE_ENTITY, "Không thể chuyển Epic có chứa issue con thành Sub-task");
            }
        }

        // Unlink epic_id and inappropriate links in same transaction (BR-COL-03)
        issue.setEpic(null);
        linkRepository.deleteBySourceIssueIdOrTargetIssueId(issue.getId(), parent.getId());
        linkRepository.deleteBySourceIssueIdOrTargetIssueId(parent.getId(), issue.getId());

        issue.setType(IssueType.SUB_TASK);
        issue.setParent(parent);
        issueRepository.save(issue);

        auditService.log("CONVERT_TO_SUBTASK", "ISSUE", issue.getId(), issue.getProject().getId(), issueKey,
                "Converted " + issueKey + " to subtask of " + parentKey);
    }

    @Transactional
    public ShareIssueResponse shareIssue(String issueKey, ShareIssueRequest request, User currentUser) {
        Issue issue = findIssue(issueKey);

        List<String> warnings = new ArrayList<>();
        if (request.getRecipients() == null || request.getRecipients().isEmpty()) {
            return new ShareIssueResponse(warnings);
        }

        String note = request.getNote() != null ? request.getNote() : "";
        String link = "/projects/" + issue.getProject().getProjectKey() + "/issues/" + issue.getIssueKey();

        for (String recipient : request.getRecipients()) {
            if (recipient == null || recipient.isBlank()) continue;
            String recTrimmed = recipient.trim();

            Optional<User> userOpt = Optional.empty();
            if (recTrimmed.matches("^\\d+$")) {
                userOpt = userRepository.findById(Long.parseLong(recTrimmed));
            }
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByEmail(recTrimmed);
            }

            if (userOpt.isPresent()) {
                User internalUser = userOpt.get();
                // Check project membership warning (BR-COL-06)
                if (!memberRepository.existsByProjectIdAndUserId(issue.getProject().getId(), internalUser.getId())) {
                    warnings.add("Người dùng " + internalUser.getEmail() + " không có quyền truy cập vào dự án này");
                }

                // Notify in-app + email
                notificationService.notify(
                        NotificationType.MENTION,
                        List.of(internalUser),
                        currentUser.getFullName() + " đã chia sẻ một Issue với bạn: " + issue.getIssueKey(),
                        (note.isBlank() ? "Bạn được chia sẻ Issue " : (note + " - ")) + issue.getIssueKey() + ": " + issue.getSummary(),
                        link,
                        issue.getIssueKey(),
                        currentUser
                );
            } else if (recTrimmed.contains("@") && mailService != null) {
                // External recipient email
                mailService.sendMailAsync(
                        recTrimmed,
                        "[EPMS] " + currentUser.getFullName() + " đã chia sẻ Issue " + issue.getIssueKey(),
                        "notification",
                        Map.of(
                                "recipientName", recTrimmed,
                                "title", currentUser.getFullName() + " đã chia sẻ Issue: " + issue.getIssueKey(),
                                "message", (note.isBlank() ? "Nội dung công việc: " : (note + "\n\n")) + issue.getSummary(),
                                "link", link
                        )
                );
            }
        }

        auditService.log("SHARE_ISSUE", "ISSUE", issue.getId(), issue.getProject().getId(), issue.getIssueKey(),
                "Chia sẻ Issue " + issue.getIssueKey() + " tới " + request.getRecipients().size() + " người nhận");

        return new ShareIssueResponse(warnings);
    }
}
