package com.pms.backend.service;

import com.pms.backend.dao.CommentRepository;
import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.CommentResponse;
import com.pms.backend.dto.CreateCommentRequest;
import com.pms.backend.dto.UpdateCommentRequest;
import com.pms.backend.dto.UserResponse;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.NotificationType;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.enu.RoleSystem;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ForbiddenException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.model.Comment;
import com.pms.backend.model.Issue;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.model.User;
import com.pms.backend.security.ProjectSecurity;
import com.pms.backend.util.HtmlSanitizer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectSecurity projectSecurity;
    private final NotificationService notificationService;
    private final WatcherService watcherService;
    private final AuditService auditService;

    public CommentService(CommentRepository commentRepository,
                          IssueRepository issueRepository,
                          UserRepository userRepository,
                          ProjectMemberRepository projectMemberRepository,
                          ProjectSecurity projectSecurity,
                          NotificationService notificationService,
                          WatcherService watcherService,
                          AuditService auditService) {
        this.commentRepository = commentRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.projectSecurity = projectSecurity;
        this.notificationService = notificationService;
        this.watcherService = watcherService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(String issueKey) {
        return commentRepository.findByIssueKeyOrderByCreatedAtAsc(issueKey)
                .stream()
                .map(CommentResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse createComment(String issueKey, CreateCommentRequest request, User currentUser) {
        Issue issue = issueRepository.findByIssueKeyAndDeletedAtIsNull(issueKey)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found: " + issueKey));

        projectSecurity.assertProjectWritable(issue.getProject());

        String sanitizedContent = HtmlSanitizer.sanitize(request.getContent());
        if (sanitizedContent == null || sanitizedContent.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Nội dung bình luận không được để trống");
        }

        Comment comment = new Comment(issue, currentUser, sanitizedContent);

        // Filter mentions: only members of this project are allowed (BR-COL-02)
        Set<User> validMentions = new HashSet<>();
        if (request.getMentionedUserIds() != null && !request.getMentionedUserIds().isEmpty()) {
            List<ProjectMember> projectMembers = projectMemberRepository.findByProjectId(issue.getProject().getId());
            Set<Long> memberUserIds = projectMembers.stream()
                    .map(pm -> pm.getUser().getId())
                    .collect(Collectors.toSet());

            for (Long userId : request.getMentionedUserIds()) {
                if (memberUserIds.contains(userId)) {
                    userRepository.findById(userId).ifPresent(validMentions::add);
                }
            }
        }
        comment.setMentions(validMentions);

        Comment saved = commentRepository.save(comment);

        // Hook auto-watch: author watches issue (T3.07)
        watcherService.watchIssue(issue, currentUser);

        // Send MENTION notifications and emails
        if (!validMentions.isEmpty()) {
            List<User> mentionRecipients = validMentions.stream()
                    .filter(u -> !u.getId().equals(currentUser.getId()))
                    .collect(Collectors.toList());

            if (!mentionRecipients.isEmpty()) {
                String title = currentUser.getFullName() + " đã nhắc đến bạn trong một bình luận ở " + issue.getIssueKey();
                String message = sanitizedContent.replaceAll("<[^>]*>", "");
                if (message.length() > 120) message = message.substring(0, 117) + "...";
                String link = "/projects/" + issue.getProject().getId() + "/issues/" + issue.getIssueKey();

                notificationService.notify(
                        NotificationType.MENTION,
                        mentionRecipients,
                        title,
                        message,
                        link,
                        issue.getIssueKey(),
                        currentUser
                );
            }
        }

        auditService.log("ADD_COMMENT", "ISSUE", issue.getId(), issue.getProject().getId(), issue.getIssueKey(),
                "Thêm bình luận trên " + issue.getIssueKey());

        return CommentResponse.from(saved);
    }

    @Transactional
    public CommentResponse updateComment(String issueKey, Long commentId, UpdateCommentRequest request, User currentUser) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + commentId));

        Issue issue = comment.getIssue();
        projectSecurity.assertProjectWritable(issue.getProject());

        // Permission: only author or PM/Admin
        boolean isAuthor = comment.getUser().getId().equals(currentUser.getId());
        boolean isPmOrAdmin = projectSecurity.isPmOrAdmin(issue.getProject().getId());

        if (!isAuthor && !isPmOrAdmin) {
            throw new ForbiddenException("Chỉ tác giả bình luận hoặc Quản trị viên mới có quyền sửa");
        }

        String sanitized = HtmlSanitizer.sanitize(request.getContent());
        if (sanitized == null || sanitized.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Nội dung bình luận không được để trống");
        }

        comment.setContent(sanitized);
        comment.setUpdatedAt(LocalDateTime.now());
        Comment saved = commentRepository.save(comment);

        auditService.log("UPDATE_COMMENT", "ISSUE", issue.getId(), issue.getProject().getId(), issue.getIssueKey(),
                "Cập nhật bình luận #" + commentId);

        return CommentResponse.from(saved);
    }

    @Transactional
    public void deleteComment(String issueKey, Long commentId, User currentUser) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + commentId));

        Issue issue = comment.getIssue();
        projectSecurity.assertProjectWritable(issue.getProject());

        boolean isAuthor = comment.getUser().getId().equals(currentUser.getId());
        boolean isPmOrAdmin = projectSecurity.isPmOrAdmin(issue.getProject().getId());

        if (!isAuthor && !isPmOrAdmin) {
            throw new ForbiddenException("Chỉ tác giả bình luận hoặc Quản trị viên mới có quyền xoá");
        }

        commentRepository.delete(comment);

        auditService.log("DELETE_COMMENT", "ISSUE", issue.getId(), issue.getProject().getId(), issue.getIssueKey(),
                "Xoá bình luận #" + commentId);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> searchProjectUsers(Long projectId, String query, User currentUser) {
        if (projectId != null) {
            List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
            String q = query != null ? query.toLowerCase().trim() : "";
            return members.stream()
                    .map(ProjectMember::getUser)
                    .filter(u -> q.isEmpty() ||
                            (u.getFullName() != null && u.getFullName().toLowerCase().contains(q)) ||
                            (u.getEmail() != null && u.getEmail().toLowerCase().contains(q)))
                    .map(UserResponse::from)
                    .collect(Collectors.toList());
        }

        // Global search fallback
        return userRepository.findAll().stream()
                .filter(u -> query == null || query.isBlank() ||
                        (u.getFullName() != null && u.getFullName().toLowerCase().contains(query.toLowerCase())) ||
                        (u.getEmail() != null && u.getEmail().toLowerCase().contains(query.toLowerCase())))
                .limit(20)
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }
}
