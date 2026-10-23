package com.pms.backend.service;

import com.pms.backend.service.impl.*;
import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.CommentRepository;
import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.CommentResponse;
import com.pms.backend.dto.CreateCommentRequest;
import com.pms.backend.dto.UpdateCommentRequest;
import com.pms.backend.enu.NotificationType;
import com.pms.backend.exception.ForbiddenException;
import com.pms.backend.model.*;
import com.pms.backend.security.ProjectSecurity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CommentServiceTest {

    @Mock private CommentRepository commentRepository;
    @Mock private IssueRepository issueRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProjectMemberRepository projectMemberRepository;
    @Mock private ProjectSecurity projectSecurity;
    @Mock private INotificationService notificationService;
    @Mock private IWatcherService watcherService;
    @Mock private IAuditService auditService;

    @InjectMocks
    private CommentServiceImpl commentService;

    private Project project;
    private Issue issue;
    private User author;
    private User memberUser;
    private User nonMemberUser;

    @BeforeEach
    void setup() {
        project = new Project();
        project.setId(1L);
        project.setProjectKey("TEST");

        issue = new Issue();
        issue.setId(10L);
        issue.setIssueKey("TEST-1");
        issue.setProject(project);

        author = new User();
        author.setId(100L);
        author.setFullName("Author User");
        author.setEmail("author@example.com");

        memberUser = new User();
        memberUser.setId(200L);
        memberUser.setFullName("Member User");
        memberUser.setEmail("member@example.com");

        nonMemberUser = new User();
        nonMemberUser.setId(300L);
        nonMemberUser.setFullName("Non Member User");
        nonMemberUser.setEmail("nonmember@example.com");
    }

    @Test
    void testCreateComment_FiltersOutNonProjectMemberMentions() {
        CreateCommentRequest request = new CreateCommentRequest();
        request.setContent("Hello @[Member](200) and @[Outsider](300)");
        request.setMentionedUserIds(List.of(200L, 300L));

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-1")).thenReturn(Optional.of(issue));

        // Project members only contain author and memberUser
        ProjectMember pmAuthor = new ProjectMember(project, author, null);
        ProjectMember pmMember = new ProjectMember(project, memberUser, null);
        when(projectMemberRepository.findByProjectId(1L)).thenReturn(List.of(pmAuthor, pmMember));

        when(userRepository.findById(200L)).thenReturn(Optional.of(memberUser));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId(1L);
            return c;
        });

        CommentResponse response = commentService.createComment("TEST-1", request, author);

        assertNotNull(response);
        // Only memberUser (200L) should be retained
        assertEquals(1, response.getMentionedUserIds().size());
        assertTrue(response.getMentionedUserIds().contains(200L));
        assertFalse(response.getMentionedUserIds().contains(300L));

        // Check notification only sent to memberUser
        verify(notificationService, times(1)).notify(
                eq(NotificationType.MENTION),
                eq(List.of(memberUser)),
                anyString(),
                anyString(),
                anyString(),
                eq("TEST-1"),
                eq(author)
        );

        // Auto-watch called for author
        verify(watcherService, times(1)).watchIssue(issue, author);
    }

    @Test
    void testUpdateComment_NonAuthorNonPm_ThrowsForbidden() {
        Comment comment = new Comment(issue, author, "Original content");
        comment.setId(5L);

        when(commentRepository.findById(5L)).thenReturn(Optional.of(comment));
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(false);

        User stranger = new User();
        stranger.setId(999L);

        UpdateCommentRequest updateReq = new UpdateCommentRequest();
        updateReq.setContent("Hacked content");

        assertThrows(ForbiddenException.class, () ->
                commentService.updateComment("TEST-1", 5L, updateReq, stranger));
    }
}
