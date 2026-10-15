package com.pms.backend.security;

import com.pms.backend.dao.IssueRepository;
import com.pms.backend.enu.RoleSystem;
import com.pms.backend.model.Issue;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("issueSecurity")
public class IssueSecurity {

    private final IssueRepository issueRepository;
    private final ProjectSecurity projectSecurity;

    public IssueSecurity(IssueRepository issueRepository, ProjectSecurity projectSecurity) {
        this.issueRepository = issueRepository;
        this.projectSecurity = projectSecurity;
    }

    private AuthUserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUserPrincipal principal) {
            return principal;
        }
        return null;
    }

    public boolean canView(String issueKey) {
        AuthUserPrincipal user = getCurrentUser();
        if (user == null) return false;
        if (user.getSystemRole() == RoleSystem.ADMIN) return true;

        Optional<Issue> issueOpt = issueRepository.findByIssueKey(issueKey);
        if (issueOpt.isEmpty()) return false;

        Long projectId = issueOpt.get().getProject().getId();
        return projectSecurity.isMember(projectId);
    }

    public boolean canEdit(String issueKey) {
        AuthUserPrincipal user = getCurrentUser();
        if (user == null) return false;
        if (user.getSystemRole() == RoleSystem.ADMIN) return true;

        Optional<Issue> issueOpt = issueRepository.findByIssueKey(issueKey);
        if (issueOpt.isEmpty()) return false;

        Issue issue = issueOpt.get();
        Long projectId = issue.getProject().getId();

        // PM of project can always edit
        if (projectSecurity.isPmOrAdmin(projectId)) {
            return true;
        }

        // Reporter or Assignee can edit (BR-COL-01)
        Long userId = user.getId();
        boolean isReporter = issue.getReporter() != null && userId.equals(issue.getReporter().getId());
        boolean isAssignee = issue.getAssignee() != null && userId.equals(issue.getAssignee().getId());

        return isReporter || isAssignee;
    }
}
