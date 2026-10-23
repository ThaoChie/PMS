package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.AuditLogRepository;
import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dto.DashboardResponse;
import com.pms.backend.dto.IssueResponse;
import com.pms.backend.dto.SavedFilterResponse;
import com.pms.backend.enu.StatusCategory;
import com.pms.backend.model.AuditLog;
import com.pms.backend.model.Issue;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.model.User;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements IDashboardService {

    private final IssueRepository issueRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final AuditLogRepository auditLogRepository;
    private final IWatcherService watcherService;
    private final ISavedFilterService savedFilterService;

    public DashboardServiceImpl(IssueRepository issueRepository,
                            ProjectMemberRepository projectMemberRepository,
                            AuditLogRepository auditLogRepository,
                            IWatcherService watcherService,
                            ISavedFilterService savedFilterService) {
        this.issueRepository = issueRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.auditLogRepository = auditLogRepository;
        this.watcherService = watcherService;
        this.savedFilterService = savedFilterService;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(User currentUser) {
        DashboardResponse response = new DashboardResponse();

        // 1. User projects
        List<ProjectMember> memberships = projectMemberRepository.findByUserId(currentUser.getId());
        List<Long> userProjectIds = memberships.stream()
                .map(pm -> pm.getProject().getId())
                .collect(Collectors.toList());

        // 2. Assigned Issues (not DONE, limit 10)
        if (!userProjectIds.isEmpty()) {
            List<Issue> assigned = issueRepository.findTopAssignedIssues(
                    currentUser.getId(),
                    userProjectIds,
                    StatusCategory.DONE,
                    PageRequest.of(0, 10)
            );
            response.setAssignedIssues(assigned.stream().map(IssueResponse::from).collect(Collectors.toList()));
        }

        // 3. Watching issues (limit 10)
        List<Issue> watched = watcherService.getWatchedIssues(currentUser).stream()
                .filter(i -> userProjectIds.contains(i.getProject().getId()))
                .limit(10)
                .collect(Collectors.toList());
        response.setWatchingIssues(watched.stream().map(IssueResponse::from).collect(Collectors.toList()));

        // 4. Recent activities (top 20)
        if (!userProjectIds.isEmpty()) {
            List<AuditLog> recentLogs = auditLogRepository.findRecentActivitiesForProjects(userProjectIds, PageRequest.of(0, 20));
            DateTimeFormatter dtf = DateTimeFormatter.ISO_DATE_TIME;

            List<DashboardResponse.DashboardActivityDto> activities = new ArrayList<>();
            for (AuditLog log : recentLogs) {
                String issueKey = "ISSUE".equalsIgnoreCase(log.getEntityType()) && log.getBeforeState() != null ?
                        log.getBeforeState() : ("#" + log.getEntityId());
                activities.add(new DashboardResponse.DashboardActivityDto(
                        String.valueOf(log.getId()),
                        log.getAction(),
                        log.getUserEmail() != null ? log.getUserEmail() : "Hệ thống",
                        issueKey,
                        log.getAfterState() != null ? log.getAfterState() : log.getAction(),
                        log.getCreatedAt() != null ? log.getCreatedAt().format(dtf) : ""
                ));
            }
            response.setRecentActivities(activities);
        }

        // 5. Saved filters
        List<SavedFilterResponse> filters = savedFilterService.getAccessibleFilters(currentUser);
        response.setSavedFilters(filters);

        return response;
    }
}
