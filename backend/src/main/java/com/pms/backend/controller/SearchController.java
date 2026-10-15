package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.RecentViewRepository;
import com.pms.backend.dto.IssueResponse;
import com.pms.backend.dto.IssueSearchRequest;
import com.pms.backend.enu.RoleSystem;
import com.pms.backend.hibernateDao.IssueSearchDao;
import com.pms.backend.model.Issue;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.model.RecentView;
import com.pms.backend.model.User;
import com.pms.backend.service.ExportService;
import com.pms.backend.service.UserService;
import com.pms.backend.wrapper.PageWrapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@PreAuthorize("isAuthenticated()")
public class SearchController {

    private final IssueSearchDao issueSearchDao;
    private final ExportService exportService;
    private final ProjectMemberRepository projectMemberRepository;
    private final RecentViewRepository recentViewRepository;
    private final UserService userService;

    public SearchController(IssueSearchDao issueSearchDao,
                            ExportService exportService,
                            ProjectMemberRepository projectMemberRepository,
                            RecentViewRepository recentViewRepository,
                            UserService userService) {
        this.issueSearchDao = issueSearchDao;
        this.exportService = exportService;
        this.projectMemberRepository = projectMemberRepository;
        this.recentViewRepository = recentViewRepository;
        this.userService = userService;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName());
    }

    @PostMapping({"/api/issues/search", "/issues/search", "/api/search/issues", "/search/issues"})
    public ApiResponse<PageWrapper<IssueResponse>> searchIssues(
            @RequestBody(required = false) IssueSearchRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (request == null) request = new IssueSearchRequest();

        User user = getCurrentUser();
        List<Long> accessibleProjectIds = getAccessibleProjectIds(user);
        List<Long> recentIds = getRecentlyViewedIssueIds(user);

        Pageable pageable = PageRequest.of(page, size);
        Page<Issue> pageResult = issueSearchDao.searchIssuesPage(request, accessibleProjectIds, user.getId(), recentIds, pageable);

        Page<IssueResponse> dtoPage = pageResult.map(IssueResponse::from);
        return ApiResponse.success(PageWrapper.from(dtoPage));
    }

    @PostMapping({"/api/issues/export", "/issues/export"})
    public ResponseEntity<byte[]> exportIssues(
            @RequestBody(required = false) IssueSearchRequest request,
            @RequestParam(defaultValue = "xlsx") String format
    ) {
        if (request == null) request = new IssueSearchRequest();

        User user = getCurrentUser();
        List<Long> accessibleProjectIds = getAccessibleProjectIds(user);
        List<Long> recentIds = getRecentlyViewedIssueIds(user);

        byte[] data = exportService.exportIssues(request, format, accessibleProjectIds, user.getId(), recentIds);

        String filename = "issues-export-" + LocalDate.now() + "." + format.toLowerCase();
        MediaType mediaType = "csv".equalsIgnoreCase(format)
                ? MediaType.parseMediaType("text/csv;charset=utf-8")
                : MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(data);
    }

    private List<Long> getAccessibleProjectIds(User user) {
        if (user.getSystemRole() == RoleSystem.ADMIN) {
            return null; // Admin can see all projects
        }
        return projectMemberRepository.findByUserId(user.getId())
                .stream()
                .map(pm -> pm.getProject().getId())
                .collect(Collectors.toList());
    }

    private List<Long> getRecentlyViewedIssueIds(User user) {
        return recentViewRepository.findTop20ByUserIdOrderByViewedAtDesc(user.getId())
                .stream()
                .map(rv -> rv.getIssue().getId())
                .collect(Collectors.toList());
    }
}
