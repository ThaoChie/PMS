package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.model.Issue;
import com.pms.backend.service.IssueService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.pms.backend.service.UserService;
import com.pms.backend.model.User;

import java.util.List;

@RestController
@RequestMapping({"/api/issues", "/issues"})
public class IssueController {

    private final IssueService issueService;
    private final UserService userService;

    public IssueController(IssueService issueService, UserService userService) {
        this.issueService = issueService;
        this.userService = userService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PM', 'MEMBER')")
    public ApiResponse<Issue> createIssue(@RequestBody Issue issue) {
        return ApiResponse.success(issueService.createIssue(issue));
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('PM', 'MEMBER', 'VIEWER')")
    public ApiResponse<List<Issue>> getProjectIssues(@PathVariable Long projectId) {
        return ApiResponse.success(issueService.getIssuesByProject(projectId));
    }
    
    @GetMapping("/my-board")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<Issue>> getMyBoardIssues(@RequestParam(required = false) Long projectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(authentication.getName());
        return ApiResponse.success(issueService.getIssuesForUserBoard(user.getId(), projectId));
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Issue> getIssueById(@PathVariable Long id) {
        return ApiResponse.success(issueService.getIssue(id));
    }
    
    @PutMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Issue> updateStatus(@PathVariable Long id, @RequestParam Long statusId, @RequestParam(required = false) String rejectReason) {
        return ApiResponse.success(issueService.changeStatus(id, statusId, rejectReason));
    }
}
