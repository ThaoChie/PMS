package com.pms.backend.hibernateDao;

import com.pms.backend.dto.MemberProductivityDto;
import com.pms.backend.dto.ProductivityPointDto;
import com.pms.backend.dto.ProductivityReportResponse;
import com.pms.backend.enu.StatusCategory;
import com.pms.backend.model.*;
import jakarta.persistence.criteria.*;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Repository
public class ProductivityReportHibernateDao extends BaseHibernateDao {

    public ProductivityReportResponse generateProductivityReport(Long projectId, LocalDate from, LocalDate to, boolean isPmOrAdmin) {
        if (from == null) {
            from = LocalDate.now().minusDays(30);
        }
        if (to == null) {
            to = LocalDate.now();
        }
        if (from.isAfter(to)) {
            LocalDate tmp = from;
            from = to;
            to = tmp;
        }

        LocalDateTime startOfFrom = from.atStartOfDay();
        LocalDateTime endOfTo = to.atTime(23, 59, 59);

        // 1. Fetch project members
        CriteriaBuilder cb = em().getCriteriaBuilder();
        CriteriaQuery<ProjectMember> pmQuery = cb.createQuery(ProjectMember.class);
        Root<ProjectMember> pmRoot = pmQuery.from(ProjectMember.class);
        pmRoot.fetch("user", JoinType.INNER);
        pmQuery.select(pmRoot).where(cb.equal(pmRoot.get("project").get("id"), projectId));
        List<ProjectMember> members = em().createQuery(pmQuery).getResultList();

        Map<Long, User> userMap = new LinkedHashMap<>();
        for (ProjectMember pm : members) {
            if (pm.getUser() != null) {
                userMap.put(pm.getUser().getId(), pm.getUser());
            }
        }

        // 2. Fetch issues in project
        CriteriaQuery<Issue> issueQuery = cb.createQuery(Issue.class);
        Root<Issue> issueRoot = issueQuery.from(Issue.class);
        issueRoot.fetch("assignee", JoinType.LEFT);
        issueRoot.fetch("status", JoinType.LEFT);
        issueQuery.select(issueRoot).where(
                cb.equal(issueRoot.get("project").get("id"), projectId),
                cb.isNull(issueRoot.get("deletedAt"))
        );
        List<Issue> issues = em().createQuery(issueQuery).getResultList();

        // 3. Fetch status history to calculate first time entering DONE (A-10)
        CriteriaQuery<IssueStatusHistory> histQuery = cb.createQuery(IssueStatusHistory.class);
        Root<IssueStatusHistory> histRoot = histQuery.from(IssueStatusHistory.class);
        histRoot.fetch("toStatus", JoinType.LEFT);
        histRoot.fetch("issue", JoinType.LEFT);
        histQuery.select(histRoot).where(
                cb.equal(histRoot.get("issue").get("project").get("id"), projectId)
        ).orderBy(cb.asc(histRoot.get("changedAt")));
        List<IssueStatusHistory> histories = em().createQuery(histQuery).getResultList();

        Map<Long, LocalDateTime> firstDoneTimeByIssue = new HashMap<>();
        for (IssueStatusHistory h : histories) {
            if (h.getIssue() != null && h.getToStatus() != null && h.getToStatus().getCategory() == StatusCategory.DONE) {
                firstDoneTimeByIssue.putIfAbsent(h.getIssue().getId(), h.getChangedAt());
            }
        }

        // 4. Fetch worklogs for this project in date range
        CriteriaQuery<Worklog> worklogQuery = cb.createQuery(Worklog.class);
        Root<Worklog> wlRoot = worklogQuery.from(Worklog.class);
        wlRoot.fetch("user", JoinType.LEFT);
        worklogQuery.select(wlRoot).where(
                cb.equal(wlRoot.get("issue").get("project").get("id"), projectId),
                cb.between(wlRoot.get("workDate"), from, to)
        );
        List<Worklog> worklogs = em().createQuery(worklogQuery).getResultList();

        Map<Long, Integer> loggedMinutesByUser = new HashMap<>();
        int totalLoggedMinAll = 0;
        for (Worklog wl : worklogs) {
            int spent = (wl.getTimeSpentMin() != null) ? wl.getTimeSpentMin() : 0;
            totalLoggedMinAll += spent;
            if (wl.getUser() != null) {
                loggedMinutesByUser.put(
                        wl.getUser().getId(),
                        loggedMinutesByUser.getOrDefault(wl.getUser().getId(), 0) + spent
                );
            }
        }

        // 5. Aggregate stats
        int totalCompletedAll = 0;
        int totalInProgressAll = 0;
        List<Double> allResolutionHours = new ArrayList<>();

        Map<Long, Integer> completedByUser = new HashMap<>();
        Map<Long, Integer> inProgressByUser = new HashMap<>();
        Map<Long, List<Double>> resolutionHoursByUser = new HashMap<>();

        for (Issue issue : issues) {
            StatusCategory category = (issue.getStatus() != null && issue.getStatus().getCategory() != null)
                    ? issue.getStatus().getCategory() : StatusCategory.TODO;

            Long assigneeId = (issue.getAssignee() != null) ? issue.getAssignee().getId() : null;

            if (category == StatusCategory.DONE) {
                totalCompletedAll++;
                if (assigneeId != null) {
                    completedByUser.put(assigneeId, completedByUser.getOrDefault(assigneeId, 0) + 1);
                }

                // calculate resolution time
                LocalDateTime doneTime = firstDoneTimeByIssue.get(issue.getId());
                LocalDateTime createdAt = issue.getCreatedAt();
                if (doneTime != null && createdAt != null && !doneTime.isBefore(createdAt)) {
                    double hours = Duration.between(createdAt, doneTime).toMinutes() / 60.0;
                    allResolutionHours.add(hours);
                    if (assigneeId != null) {
                        resolutionHoursByUser.computeIfAbsent(assigneeId, k -> new ArrayList<>()).add(hours);
                    }
                }
            } else {
                totalInProgressAll++;
                if (assigneeId != null) {
                    inProgressByUser.put(assigneeId, inProgressByUser.getOrDefault(assigneeId, 0) + 1);
                }
            }
        }

        Double avgResolutionTimeAll = allResolutionHours.isEmpty() ? null :
                Math.round(allResolutionHours.stream().mapToDouble(Double::doubleValue).average().orElse(0) * 10.0) / 10.0;
        Double totalLoggedHoursAll = Math.round((totalLoggedMinAll / 60.0) * 10.0) / 10.0;

        String scope = isPmOrAdmin ? "MEMBER_DETAIL" : "PROJECT_SUMMARY";
        List<MemberProductivityDto> memberDtos = new ArrayList<>();
        List<ProductivityPointDto> points = new ArrayList<>();

        if (isPmOrAdmin) {
            for (Map.Entry<Long, User> entry : userMap.entrySet()) {
                Long uId = entry.getKey();
                User user = entry.getValue();

                int completed = completedByUser.getOrDefault(uId, 0);
                int inProgress = inProgressByUser.getOrDefault(uId, 0);
                int loggedMin = loggedMinutesByUser.getOrDefault(uId, 0);
                Double loggedHours = Math.round((loggedMin / 60.0) * 10.0) / 10.0;

                List<Double> userResHours = resolutionHoursByUser.get(uId);
                Double avgResHours = (userResHours == null || userResHours.isEmpty()) ? null :
                        Math.round(userResHours.stream().mapToDouble(Double::doubleValue).average().orElse(0) * 10.0) / 10.0;

                MemberProductivityDto dto = new MemberProductivityDto(
                        uId,
                        user.getFullName() != null ? user.getFullName() : user.getEmail(),
                        user.getEmail(),
                        user.getAvatarUrl(),
                        completed,
                        inProgress,
                        avgResHours,
                        loggedHours
                );
                memberDtos.add(dto);

                points.add(new ProductivityPointDto(
                        dto.getFullName(),
                        completed,
                        inProgress,
                        completed
                ));
            }
            // Sort by completed desc
            memberDtos.sort((a, b) -> Integer.compare(b.getCompletedIssues(), a.getCompletedIssues()));
            points.sort((a, b) -> Integer.compare(b.getCompleted(), a.getCompleted()));
        }

        return new ProductivityReportResponse(
                projectId, from, to, scope,
                totalCompletedAll, totalInProgressAll,
                avgResolutionTimeAll, totalLoggedHoursAll,
                memberDtos, points
        );
    }
}
