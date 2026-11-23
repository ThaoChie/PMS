package com.pms.backend.hibernateDao;

import com.pms.backend.config.AppProperties;
import com.pms.backend.dto.*;
import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.enu.StatusCategory;
import com.pms.backend.enu.WorkloadLevel;
import com.pms.backend.model.*;
import jakarta.persistence.criteria.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Repository
public class ProductivityReportHibernateDao extends BaseHibernateDao {

    private final AppProperties appProperties;

    public ProductivityReportHibernateDao() {
        this.appProperties = new AppProperties();
    }

    @Autowired
    public ProductivityReportHibernateDao(AppProperties appProperties) {
        this.appProperties = appProperties != null ? appProperties : new AppProperties();
    }

    public ProductivityReportResponse generateProductivityReport(Long projectId, LocalDate from, LocalDate to, boolean isPmOrAdmin) {
        ProductivityFilterRequest filter = new ProductivityFilterRequest();
        filter.setFrom(from);
        filter.setTo(to);
        return generateProductivityReport(projectId, filter, isPmOrAdmin);
    }

    public ProductivityReportResponse generateProductivityReport(Long projectId, ProductivityFilterRequest filter, boolean isPmOrAdmin) {
        LocalDate from = filter.getFrom();
        LocalDate to = filter.getTo();

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

        LocalDateTime endOfTo = to.atTime(23, 59, 59);

        // 1. Fetch project members
        CriteriaBuilder cb = em().getCriteriaBuilder();
        CriteriaQuery<ProjectMember> pmQuery = cb.createQuery(ProjectMember.class);
        Root<ProjectMember> pmRoot = pmQuery.from(ProjectMember.class);
        pmRoot.fetch("user", JoinType.INNER);

        List<Predicate> pmPreds = new ArrayList<>();
        pmPreds.add(cb.equal(pmRoot.get("project").get("id"), projectId));

        if (filter.getMemberIds() != null && !filter.getMemberIds().isEmpty()) {
            List<Long> memberIdsWithoutZero = filter.getMemberIds().stream()
                    .filter(id -> id != null && id != 0L)
                    .collect(Collectors.toList());
            if (!memberIdsWithoutZero.isEmpty()) {
                pmPreds.add(pmRoot.get("user").get("id").in(memberIdsWithoutZero));
            } else {
                pmPreds.add(cb.disjunction());
            }
        }
        if (filter.getRoles() != null && !filter.getRoles().isEmpty()) {
            List<ProjectRole> roleEnums = new ArrayList<>();
            for (String r : filter.getRoles()) {
                try {
                    roleEnums.add(ProjectRole.valueOf(r.toUpperCase().trim()));
                } catch (Exception ignored) {}
            }
            if (!roleEnums.isEmpty()) {
                pmPreds.add(pmRoot.get("role").in(roleEnums));
            }
        }
        pmQuery.select(pmRoot).where(pmPreds.toArray(new Predicate[0]));
        List<ProjectMember> projectMembers = em().createQuery(pmQuery).getResultList();

        Map<Long, User> userMap = new LinkedHashMap<>();
        Map<Long, String> userRoleMap = new HashMap<>();
        for (ProjectMember pm : projectMembers) {
            if (pm.getUser() != null) {
                userMap.put(pm.getUser().getId(), pm.getUser());
                userRoleMap.put(pm.getUser().getId(), pm.getRole() != null ? pm.getRole().name() : "");
            }
        }

        // 2. Fetch issues in project
        CriteriaQuery<Issue> issueQuery = cb.createQuery(Issue.class);
        Root<Issue> issueRoot = issueQuery.from(Issue.class);
        issueRoot.fetch("assignee", JoinType.LEFT);
        issueRoot.fetch("status", JoinType.LEFT);

        List<Predicate> issuePreds = new ArrayList<>();
        issuePreds.add(cb.equal(issueRoot.get("project").get("id"), projectId));
        issuePreds.add(cb.isNull(issueRoot.get("deletedAt")));
        LocalDateTime startOfFrom = from.atStartOfDay();
        LocalDateTime endOfToWithNanos = to.atTime(23, 59, 59, 999999999);
        issuePreds.add(cb.between(issueRoot.get("createdAt"), startOfFrom, endOfToWithNanos));

        if (filter.getMemberIds() != null && !filter.getMemberIds().isEmpty()) {
            List<Long> memberIds = filter.getMemberIds();
            boolean hasZero = memberIds.contains(0L);
            List<Long> validUserIds = memberIds.stream().filter(id -> id != 0L).collect(Collectors.toList());
            if (hasZero && validUserIds.isEmpty()) {
                issuePreds.add(cb.isNull(issueRoot.get("assignee")));
            } else if (hasZero) {
                issuePreds.add(cb.or(cb.isNull(issueRoot.get("assignee")), issueRoot.get("assignee").get("id").in(validUserIds)));
            } else {
                issuePreds.add(issueRoot.get("assignee").get("id").in(validUserIds));
            }
        } else if (filter.getRoles() != null && !filter.getRoles().isEmpty()) {
            if (!userMap.isEmpty()) {
                issuePreds.add(issueRoot.get("assignee").get("id").in(userMap.keySet()));
            } else {
                issuePreds.add(cb.disjunction());
            }
        }

        if (filter.getIssueTypes() != null && !filter.getIssueTypes().isEmpty()) {
            List<IssueType> typeEnums = new ArrayList<>();
            for (String t : filter.getIssueTypes()) {
                try {
                    typeEnums.add(IssueType.valueOf(t.toUpperCase().trim()));
                } catch (Exception ignored) {}
            }
            if (!typeEnums.isEmpty()) {
                issuePreds.add(issueRoot.get("type").in(typeEnums));
            }
        }

        if (filter.getPriorities() != null && !filter.getPriorities().isEmpty()) {
            List<com.pms.backend.enu.Priority> priorityEnums = new ArrayList<>();
            for (String p : filter.getPriorities()) {
                try {
                    priorityEnums.add(com.pms.backend.enu.Priority.valueOf(p.toUpperCase().trim()));
                } catch (Exception ignored) {}
            }
            if (!priorityEnums.isEmpty()) {
                issuePreds.add(issueRoot.get("priority").in(priorityEnums));
            }
        }

        issueQuery.select(issueRoot).where(issuePreds.toArray(new Predicate[0]));
        List<Issue> rawIssues = em().createQuery(issueQuery).getResultList();

        // Status filter in memory to handle name / ID / category
        List<Issue> issues = new ArrayList<>();
        for (Issue is : rawIssues) {
            if (filter.getStatuses() != null && !filter.getStatuses().isEmpty()) {
                String sName = is.getStatus() != null ? is.getStatus().getName() : "";
                String sCat = (is.getStatus() != null && is.getStatus().getCategory() != null) ? is.getStatus().getCategory().name() : "";
                String sId = is.getStatus() != null ? String.valueOf(is.getStatus().getId()) : "";
                boolean matchStatus = filter.getStatuses().stream().anyMatch(st ->
                        st.equalsIgnoreCase(sName) || st.equalsIgnoreCase(sCat) || st.equalsIgnoreCase(sId));
                if (!matchStatus) continue;
            }
            issues.add(is);
        }

        // 3. Status history for first DONE time and bug reopening
        CriteriaQuery<IssueStatusHistory> histQuery = cb.createQuery(IssueStatusHistory.class);
        Root<IssueStatusHistory> histRoot = histQuery.from(IssueStatusHistory.class);
        histRoot.fetch("toStatus", JoinType.LEFT);
        histRoot.fetch("fromStatus", JoinType.LEFT);
        histRoot.fetch("issue", JoinType.LEFT);
        histQuery.select(histRoot).where(
                cb.equal(histRoot.get("issue").get("project").get("id"), projectId)
        ).orderBy(cb.asc(histRoot.get("changedAt")));
        List<IssueStatusHistory> histories = em().createQuery(histQuery).getResultList();

        Map<Long, LocalDateTime> firstDoneTimeByIssue = new HashMap<>();
        Set<Long> reopenedIssueIds = new HashSet<>();
        for (IssueStatusHistory h : histories) {
            if (h.getIssue() != null) {
                Long issueId = h.getIssue().getId();
                if (h.getToStatus() != null && h.getToStatus().getCategory() == StatusCategory.DONE) {
                    firstDoneTimeByIssue.putIfAbsent(issueId, h.getChangedAt());
                }
                if (h.getFromStatus() != null && h.getFromStatus().getCategory() == StatusCategory.DONE
                        && h.getToStatus() != null && h.getToStatus().getCategory() != StatusCategory.DONE) {
                    reopenedIssueIds.add(issueId);
                }
            }
        }

        // Overdue filter if requested
        if (Boolean.TRUE.equals(filter.getOverdueOnly())) {
            List<Issue> overdueFiltered = new ArrayList<>();
            LocalDate today = LocalDate.now();
            for (Issue issue : issues) {
                if (isIssueOverdue(issue, firstDoneTimeByIssue.get(issue.getId()), today)) {
                    overdueFiltered.add(issue);
                }
            }
            issues = overdueFiltered;
        }

        // 4. Fetch worklogs for this project in date range
        CriteriaQuery<Worklog> worklogQuery = cb.createQuery(Worklog.class);
        Root<Worklog> wlRoot = worklogQuery.from(Worklog.class);
        wlRoot.fetch("user", JoinType.LEFT);
        wlRoot.fetch("issue", JoinType.LEFT);

        List<Predicate> wlPreds = new ArrayList<>();
        wlPreds.add(cb.equal(wlRoot.get("issue").get("project").get("id"), projectId));
        wlPreds.add(cb.between(wlRoot.get("workDate"), from, to));
        if (filter.getMemberIds() != null && !filter.getMemberIds().isEmpty()) {
            List<Long> validUserIds = filter.getMemberIds().stream()
                    .filter(id -> id != null && id != 0L)
                    .collect(Collectors.toList());
            if (!validUserIds.isEmpty()) {
                wlPreds.add(wlRoot.get("user").get("id").in(validUserIds));
            } else {
                wlPreds.add(cb.disjunction());
            }
        }

        worklogQuery.select(wlRoot).where(wlPreds.toArray(new Predicate[0]));
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

        // 5. Aggregate stats per user and overall
        int totalAssignedAll = 0;
        int totalCompletedAll = 0;
        int totalInProgressAll = 0;
        int totalTodoAll = 0;
        int totalOverdueAll = 0;
        int totalOnTimeCompletedAll = 0;
        int totalEstimatedMinAll = 0;
        int totalBugsAssignedAll = 0;
        int totalBugsResolvedAll = 0;
        int totalBugsReopenedAll = 0;
        List<Double> allResolutionHours = new ArrayList<>();

        Map<Long, Integer> assignedByUser = new HashMap<>();
        Map<Long, Integer> completedByUser = new HashMap<>();
        Map<Long, Integer> inProgressByUser = new HashMap<>();
        Map<Long, Integer> todoByUser = new HashMap<>();
        Map<Long, Integer> overdueByUser = new HashMap<>();
        Map<Long, Integer> onTimeCompletedByUser = new HashMap<>();
        Map<Long, Integer> estimatedMinByUser = new HashMap<>();
        Map<Long, List<Double>> resolutionHoursByUser = new HashMap<>();

        Map<Long, Integer> bugsAssignedByUser = new HashMap<>();
        Map<Long, Integer> bugsResolvedByUser = new HashMap<>();
        Map<Long, Integer> bugsReopenedByUser = new HashMap<>();

        int unassignedCount = 0;
        int unassignedCompleted = 0;
        int unassignedInProgress = 0;
        int unassignedTodo = 0;
        int unassignedOverdue = 0;
        int unassignedOnTimeCompleted = 0;
        int unassignedEstMin = 0;
        int unassignedBugsAssigned = 0;
        int unassignedBugsResolved = 0;
        int unassignedBugsReopened = 0;
        List<Double> unassignedResolutionHours = new ArrayList<>();

        LocalDate today = LocalDate.now();

        for (Issue issue : issues) {
            totalAssignedAll++;
            Long assigneeId = (issue.getAssignee() != null) ? issue.getAssignee().getId() : null;
            if (assigneeId != null) {
                assignedByUser.put(assigneeId, assignedByUser.getOrDefault(assigneeId, 0) + 1);
            } else {
                unassignedCount++;
            }

            int estMin = issue.getOriginalEstimateMin() != null ? issue.getOriginalEstimateMin() : 0;
            totalEstimatedMinAll += estMin;
            if (assigneeId != null) {
                estimatedMinByUser.put(assigneeId, estimatedMinByUser.getOrDefault(assigneeId, 0) + estMin);
            } else {
                unassignedEstMin += estMin;
            }

            StatusCategory category = (issue.getStatus() != null && issue.getStatus().getCategory() != null)
                    ? issue.getStatus().getCategory() : StatusCategory.TODO;

            LocalDateTime doneTime = firstDoneTimeByIssue.get(issue.getId());
            boolean isOverdue = isIssueOverdue(issue, doneTime, today);
            if (isOverdue) {
                totalOverdueAll++;
                if (assigneeId != null) {
                    overdueByUser.put(assigneeId, overdueByUser.getOrDefault(assigneeId, 0) + 1);
                } else {
                    unassignedOverdue++;
                }
            }

            boolean isBug = issue.getType() == IssueType.BUG;
            if (isBug) {
                totalBugsAssignedAll++;
                if (assigneeId != null) {
                    bugsAssignedByUser.put(assigneeId, bugsAssignedByUser.getOrDefault(assigneeId, 0) + 1);
                } else {
                    unassignedBugsAssigned++;
                }
                if (reopenedIssueIds.contains(issue.getId())) {
                    totalBugsReopenedAll++;
                    if (assigneeId != null) {
                        bugsReopenedByUser.put(assigneeId, bugsReopenedByUser.getOrDefault(assigneeId, 0) + 1);
                    } else {
                        unassignedBugsReopened++;
                    }
                }
            }

            if (category == StatusCategory.DONE) {
                totalCompletedAll++;
                if (assigneeId != null) {
                    completedByUser.put(assigneeId, completedByUser.getOrDefault(assigneeId, 0) + 1);
                } else {
                    unassignedCompleted++;
                }

                if (isBug) {
                    totalBugsResolvedAll++;
                    if (assigneeId != null) {
                        bugsResolvedByUser.put(assigneeId, bugsResolvedByUser.getOrDefault(assigneeId, 0) + 1);
                    } else {
                        unassignedBugsResolved++;
                    }
                }

                // On-time check: on time if no dueDate OR doneDate <= dueDate
                boolean onTime = issue.getDueDate() == null || (doneTime != null && !doneTime.toLocalDate().isAfter(issue.getDueDate()));
                if (onTime) {
                    totalOnTimeCompletedAll++;
                    if (assigneeId != null) {
                        onTimeCompletedByUser.put(assigneeId, onTimeCompletedByUser.getOrDefault(assigneeId, 0) + 1);
                    } else {
                        unassignedOnTimeCompleted++;
                    }
                }

                // calculate resolution time
                LocalDateTime createdAt = issue.getCreatedAt();
                if (doneTime != null && createdAt != null && !doneTime.isBefore(createdAt)) {
                    double hours = Duration.between(createdAt, doneTime).toMinutes() / 60.0;
                    allResolutionHours.add(hours);
                    if (assigneeId != null) {
                        resolutionHoursByUser.computeIfAbsent(assigneeId, k -> new ArrayList<>()).add(hours);
                    } else {
                        unassignedResolutionHours.add(hours);
                    }
                }
            } else if (category == StatusCategory.IN_PROGRESS) {
                totalInProgressAll++;
                if (assigneeId != null) {
                    inProgressByUser.put(assigneeId, inProgressByUser.getOrDefault(assigneeId, 0) + 1);
                } else {
                    unassignedInProgress++;
                }
            } else {
                totalTodoAll++;
                if (assigneeId != null) {
                    todoByUser.put(assigneeId, todoByUser.getOrDefault(assigneeId, 0) + 1);
                } else {
                    unassignedTodo++;
                }
            }
        }

        Double avgResolutionTimeAll = allResolutionHours.isEmpty() ? null :
                Math.round(allResolutionHours.stream().mapToDouble(Double::doubleValue).average().orElse(0) * 10.0) / 10.0;
        Double totalLoggedHoursAll = Math.round((totalLoggedMinAll / 60.0) * 10.0) / 10.0;
        Double totalEstimatedHoursAll = Math.round((totalEstimatedMinAll / 60.0) * 10.0) / 10.0;
        Double overallOnTimeRate;
        if (totalCompletedAll > 0) {
            overallOnTimeRate = Math.round((totalOnTimeCompletedAll * 100.0 / totalCompletedAll) * 10.0) / 10.0;
        } else if (totalOverdueAll > 0) {
            overallOnTimeRate = 0.0;
        } else {
            overallOnTimeRate = 100.0;
        }

        // Working days for workload calculation
        long workingDays = 0;
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (d.getDayOfWeek() != DayOfWeek.SATURDAY && d.getDayOfWeek() != DayOfWeek.SUNDAY) {
                workingDays++;
            }
        }
        if (workingDays == 0) workingDays = 1;
        double expectedStandardHours = workingDays * appProperties.getProductivity().getDailyStandardHours();

        String scope = isPmOrAdmin ? "MEMBER_DETAIL" : "PROJECT_SUMMARY";
        List<MemberProductivityDto> memberDtos = new ArrayList<>();
        List<ProductivityPointDto> points = new ArrayList<>();

        if (isPmOrAdmin) {
            for (Map.Entry<Long, User> entry : userMap.entrySet()) {
                Long uId = entry.getKey();
                User user = entry.getValue();

                int assigned = assignedByUser.getOrDefault(uId, 0);
                int completed = completedByUser.getOrDefault(uId, 0);
                int inProgress = inProgressByUser.getOrDefault(uId, 0);
                int todo = todoByUser.getOrDefault(uId, 0);
                int overdue = overdueByUser.getOrDefault(uId, 0);
                int onTimeCompleted = onTimeCompletedByUser.getOrDefault(uId, 0);

                Double onTimeRate = completed > 0 ?
                        Math.round((onTimeCompleted * 100.0 / completed) * 10.0) / 10.0 :
                        (overdue > 0 ? 0.0 : 100.0);

                int loggedMin = loggedMinutesByUser.getOrDefault(uId, 0);
                Double loggedHours = Math.round((loggedMin / 60.0) * 10.0) / 10.0;

                int estMin = estimatedMinByUser.getOrDefault(uId, 0);
                Double estimatedHours = Math.round((estMin / 60.0) * 10.0) / 10.0;

                Double variancePercentage = null;
                if (estimatedHours > 0) {
                    variancePercentage = Math.round(((loggedHours - estimatedHours) / estimatedHours * 100.0) * 10.0) / 10.0;
                } else if (loggedHours > 0) {
                    variancePercentage = 100.0;
                } else {
                    variancePercentage = 0.0;
                }

                List<Double> userResHours = resolutionHoursByUser.get(uId);
                Double avgResHours = (userResHours == null || userResHours.isEmpty()) ? null :
                        Math.round(userResHours.stream().mapToDouble(Double::doubleValue).average().orElse(0) * 10.0) / 10.0;

                int bAssigned = bugsAssignedByUser.getOrDefault(uId, 0);
                int bResolved = bugsResolvedByUser.getOrDefault(uId, 0);
                int bReopened = bugsReopenedByUser.getOrDefault(uId, 0);

                // Workload calculation
                double ratio = expectedStandardHours > 0 ? (loggedHours / expectedStandardHours) : 1.0;
                ratio = Math.round(ratio * 100.0) / 100.0;

                WorkloadLevel workloadLevel;
                if (inProgress > appProperties.getProductivity().getMaxInProgressIssues()
                        || ratio > appProperties.getProductivity().getOverloadRatio()) {
                    workloadLevel = WorkloadLevel.OVERLOAD;
                } else if (ratio < appProperties.getProductivity().getUnderloadRatio()) {
                    workloadLevel = WorkloadLevel.UNDERLOAD;
                } else {
                    workloadLevel = WorkloadLevel.BALANCED;
                }

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
                dto.setProjectRole(userRoleMap.getOrDefault(uId, ""));
                dto.setAssignedIssues(assigned);
                dto.setTodoIssues(todo);
                dto.setOnTimeCompletedCount(onTimeCompleted);
                dto.setOnTimeRate(onTimeRate);
                dto.setOverdueIssues(overdue);
                dto.setEstimatedHours(estimatedHours);
                dto.setVariancePercentage(variancePercentage);
                dto.setBugsAssigned(bAssigned);
                dto.setBugsResolved(bResolved);
                dto.setBugsReopened(bReopened);
                dto.setWorkloadLevel(workloadLevel);
                dto.setWorkloadRatio(ratio);

                memberDtos.add(dto);

                points.add(new ProductivityPointDto(
                        dto.getFullName(),
                        completed,
                        inProgress,
                        completed
                ));
            }

            boolean includeUnassigned = (filter.getMemberIds() == null || filter.getMemberIds().isEmpty() || filter.getMemberIds().contains(0L))
                    && (filter.getRoles() == null || filter.getRoles().isEmpty());
            boolean explicitUnassigned = filter.getMemberIds() != null && filter.getMemberIds().contains(0L);
            if (includeUnassigned && (unassignedCount > 0 || explicitUnassigned)) {
                Double unassignedAvgResHours = unassignedResolutionHours.isEmpty() ? null :
                        Math.round(unassignedResolutionHours.stream().mapToDouble(Double::doubleValue).average().orElse(0) * 10.0) / 10.0;
                Double unassignedEstHours = Math.round((unassignedEstMin / 60.0) * 10.0) / 10.0;
                Double unassignedOnTimeRate = unassignedCompleted > 0 ?
                        Math.round((unassignedOnTimeCompleted * 100.0 / unassignedCompleted) * 10.0) / 10.0 :
                        (unassignedOverdue > 0 ? 0.0 : 100.0);

                MemberProductivityDto unassignedDto = new MemberProductivityDto(
                        0L,
                        "Chưa phân công",
                        "—",
                        null,
                        unassignedCompleted,
                        unassignedInProgress,
                        unassignedAvgResHours,
                        0.0
                );
                unassignedDto.setProjectRole("—");
                unassignedDto.setAssignedIssues(unassignedCount);
                unassignedDto.setTodoIssues(unassignedTodo);
                unassignedDto.setOnTimeCompletedCount(unassignedOnTimeCompleted);
                unassignedDto.setOnTimeRate(unassignedOnTimeRate);
                unassignedDto.setOverdueIssues(unassignedOverdue);
                unassignedDto.setEstimatedHours(unassignedEstHours);
                unassignedDto.setVariancePercentage(0.0);
                unassignedDto.setBugsAssigned(unassignedBugsAssigned);
                unassignedDto.setBugsResolved(unassignedBugsResolved);
                unassignedDto.setBugsReopened(unassignedBugsReopened);
                unassignedDto.setWorkloadLevel(WorkloadLevel.BALANCED);
                unassignedDto.setWorkloadRatio(0.0);

                memberDtos.add(unassignedDto);

                points.add(new ProductivityPointDto(
                        unassignedDto.getFullName(),
                        unassignedCompleted,
                        unassignedInProgress,
                        unassignedCompleted
                ));
            }

            // Apply sort
            applySorting(memberDtos, filter.getSort());
            points.sort((a, b) -> Integer.compare(b.getCompleted(), a.getCompleted()));
        }

        int totalMembers = memberDtos.size();
        int page = filter.getPage() != null && filter.getPage() >= 0 ? filter.getPage() : 0;
        int size = filter.getSize() != null && filter.getSize() > 0 ? filter.getSize() : Math.max(totalMembers, 1);
        int totalPages = (int) Math.ceil((double) totalMembers / size);

        List<MemberProductivityDto> pagedMembers = memberDtos;
        if (filter.getPage() != null && filter.getSize() != null) {
            int fromIdx = page * size;
            int toIdx = Math.min(fromIdx + size, totalMembers);
            if (fromIdx < totalMembers) {
                pagedMembers = new ArrayList<>(memberDtos.subList(fromIdx, toIdx));
            } else {
                pagedMembers = Collections.emptyList();
            }
        }

        ProductivityReportResponse response = new ProductivityReportResponse(
                projectId, from, to, scope,
                totalCompletedAll, totalInProgressAll,
                avgResolutionTimeAll, totalLoggedHoursAll,
                pagedMembers, points
        );
        response.setTotalAssigned(totalAssignedAll);
        response.setTotalTodo(totalTodoAll);
        response.setTotalOverdue(totalOverdueAll);
        response.setOverallOnTimeRate(overallOnTimeRate);
        response.setTotalEstimatedHours(totalEstimatedHoursAll);
        response.setTotalBugsAssigned(totalBugsAssignedAll);
        response.setTotalBugsResolved(totalBugsResolvedAll);
        response.setTotalBugsReopened(totalBugsReopenedAll);
        response.setTotalMembers(totalMembers);
        response.setPage(page);
        response.setSize(size);
        response.setTotalPages(totalPages);

        return response;
    }

    public MemberDetailProductivityResponse getMemberProductivityDetail(Long projectId, Long userId, ProductivityFilterRequest filter) {
        ProductivityReportResponse overall = generateProductivityReport(projectId, filter, true);

        MemberProductivityDto memberDto = overall.getMembers().stream()
                .filter(m -> m.getUserId().equals(userId))
                .findFirst()
                .orElse(null);

        if (memberDto == null && userId != null && userId == 0L) {
            memberDto = new MemberProductivityDto(
                    0L, "Chưa phân công", "—", null, 0, 0, null, 0.0
            );
            memberDto.setProjectRole("—");
            memberDto.setWorkloadLevel(WorkloadLevel.BALANCED);
        }

        LocalDate from = overall.getFrom();
        LocalDate to = overall.getTo();
        LocalDateTime endOfTo = to.atTime(23, 59, 59);

        // Fetch issues for this user in project
        CriteriaBuilder cb = em().getCriteriaBuilder();
        CriteriaQuery<Issue> issueQuery = cb.createQuery(Issue.class);
        Root<Issue> issueRoot = issueQuery.from(Issue.class);
        issueRoot.fetch("assignee", JoinType.LEFT);
        issueRoot.fetch("status", JoinType.LEFT);

        List<Predicate> issuePreds = new ArrayList<>();
        issuePreds.add(cb.equal(issueRoot.get("project").get("id"), projectId));
        if (userId != null && userId == 0L) {
            issuePreds.add(cb.isNull(issueRoot.get("assignee")));
        } else {
            issuePreds.add(cb.equal(issueRoot.get("assignee").get("id"), userId));
        }
        issuePreds.add(cb.isNull(issueRoot.get("deletedAt")));
        LocalDateTime startOfFrom = from.atStartOfDay();
        LocalDateTime endOfToWithNanos = to.atTime(23, 59, 59, 999999999);
        issuePreds.add(cb.between(issueRoot.get("createdAt"), startOfFrom, endOfToWithNanos));

        if (filter.getIssueTypes() != null && !filter.getIssueTypes().isEmpty()) {
            List<IssueType> typeEnums = new ArrayList<>();
            for (String t : filter.getIssueTypes()) {
                try {
                    typeEnums.add(IssueType.valueOf(t.toUpperCase().trim()));
                } catch (Exception ignored) {}
            }
            if (!typeEnums.isEmpty()) {
                issuePreds.add(issueRoot.get("type").in(typeEnums));
            }
        }

        if (filter.getPriorities() != null && !filter.getPriorities().isEmpty()) {
            List<com.pms.backend.enu.Priority> priorityEnums = new ArrayList<>();
            for (String p : filter.getPriorities()) {
                try {
                    priorityEnums.add(com.pms.backend.enu.Priority.valueOf(p.toUpperCase().trim()));
                } catch (Exception ignored) {}
            }
            if (!priorityEnums.isEmpty()) {
                issuePreds.add(issueRoot.get("priority").in(priorityEnums));
            }
        }

        issueQuery.select(issueRoot).where(issuePreds.toArray(new Predicate[0]));
        List<Issue> memberIssues = em().createQuery(issueQuery).getResultList();

        // Status history for first DONE time
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

        LocalDate today = LocalDate.now();
        List<MemberProductivityIssueDto> issueDtos = new ArrayList<>();
        for (Issue is : memberIssues) {
            if (filter.getStatuses() != null && !filter.getStatuses().isEmpty()) {
                String sName = is.getStatus() != null ? is.getStatus().getName() : "";
                String sCat = (is.getStatus() != null && is.getStatus().getCategory() != null) ? is.getStatus().getCategory().name() : "";
                String sId = is.getStatus() != null ? String.valueOf(is.getStatus().getId()) : "";
                boolean matchStatus = filter.getStatuses().stream().anyMatch(st ->
                        st.equalsIgnoreCase(sName) || st.equalsIgnoreCase(sCat) || st.equalsIgnoreCase(sId));
                if (!matchStatus) continue;
            }

            LocalDateTime doneTime = firstDoneTimeByIssue.get(is.getId());
            boolean overdue = isIssueOverdue(is, doneTime, today);
            if (Boolean.TRUE.equals(filter.getOverdueOnly()) && !overdue) {
                continue;
            }

            MemberProductivityIssueDto idto = new MemberProductivityIssueDto();
            idto.setId(is.getId());
            idto.setKey(is.getIssueKey());
            idto.setSummary(is.getSummary());
            idto.setType(is.getType() != null ? is.getType().name() : "");
            idto.setPriority(is.getPriority() != null ? is.getPriority().name() : "");
            idto.setStatus(is.getStatus() != null ? is.getStatus().getName() : "");
            idto.setStatusCategory(is.getStatus() != null && is.getStatus().getCategory() != null ? is.getStatus().getCategory().name() : "");
            idto.setDueDate(is.getDueDate());
            idto.setOverdue(overdue);
            idto.setOriginalEstimateMin(is.getOriginalEstimateMin() != null ? is.getOriginalEstimateMin() : 0);
            idto.setTimeSpentMin(is.getTimeSpentMin() != null ? is.getTimeSpentMin() : 0);

            double estH = idto.getEstimatedHours() != null ? idto.getEstimatedHours() : 0.0;
            double logH = idto.getLoggedHours() != null ? idto.getLoggedHours() : 0.0;
            if (estH > 0) {
                idto.setVariancePercentage(Math.round(((logH - estH) / estH * 100.0) * 10.0) / 10.0);
            } else if (logH > 0) {
                idto.setVariancePercentage(100.0);
            } else {
                idto.setVariancePercentage(0.0);
            }

            if (is.getCreatedAt() != null) {
                idto.setCreatedAt(is.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant());
            }
            if (doneTime != null) {
                idto.setCompletedAt(doneTime.atZone(java.time.ZoneId.systemDefault()).toInstant());
            }

            boolean onTime = is.getDueDate() == null || (doneTime != null && !doneTime.toLocalDate().isAfter(is.getDueDate()));
            idto.setOnTime(onTime);

            issueDtos.add(idto);
        }

        // Fetch worklogs for this user
        List<MemberProductivityWorklogDto> worklogDtos = new ArrayList<>();
        int totalLoggedMin = 0;

        if (userId != null && userId != 0L) {
            CriteriaQuery<Worklog> wlQuery = cb.createQuery(Worklog.class);
            Root<Worklog> wlRoot = wlQuery.from(Worklog.class);
            wlRoot.fetch("issue", JoinType.LEFT);
            wlRoot.fetch("user", JoinType.LEFT);

            wlQuery.select(wlRoot).where(
                    cb.equal(wlRoot.get("issue").get("project").get("id"), projectId),
                    cb.equal(wlRoot.get("user").get("id"), userId),
                    cb.between(wlRoot.get("workDate"), from, to)
            ).orderBy(cb.desc(wlRoot.get("workDate")));
            List<Worklog> memberWorklogs = em().createQuery(wlQuery).getResultList();

            for (Worklog wl : memberWorklogs) {
                int spent = wl.getTimeSpentMin() != null ? wl.getTimeSpentMin() : 0;
                totalLoggedMin += spent;

                MemberProductivityWorklogDto wdto = new MemberProductivityWorklogDto();
                wdto.setId(wl.getId());
                if (wl.getIssue() != null) {
                    wdto.setIssueId(wl.getIssue().getId());
                    wdto.setIssueKey(wl.getIssue().getIssueKey());
                    wdto.setIssueSummary(wl.getIssue().getSummary());
                }
                wdto.setWorkDate(wl.getWorkDate());
                wdto.setTimeSpentMin(spent);
                wdto.setComment(wl.getComment());
                if (wl.getCreatedAt() != null) {
                    wdto.setCreatedAt(wl.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant());
                }
                worklogDtos.add(wdto);
            }
        }

        MemberDetailProductivityResponse response = new MemberDetailProductivityResponse();
        response.setProjectId(projectId);
        response.setUserId(userId);
        response.setFrom(from);
        response.setTo(to);
        response.setMember(memberDto);
        response.setIssues(issueDtos);
        response.setWorklogs(worklogDtos);
        response.setTotalIssues(issueDtos.size());
        response.setTotalWorklogs(worklogDtos.size());
        response.setTotalLoggedHours(Math.round((totalLoggedMin / 60.0) * 10.0) / 10.0);

        return response;
    }

    public List<Issue> fetchIssuesForExport(Long projectId, ProductivityFilterRequest filter) {
        LocalDate from = filter.getFrom() != null ? filter.getFrom() : LocalDate.now().minusDays(30);
        LocalDate to = filter.getTo() != null ? filter.getTo() : LocalDate.now();
        if (from.isAfter(to)) {
            LocalDate tmp = from;
            from = to;
            to = tmp;
        }
        LocalDateTime startOfFrom = from.atStartOfDay();
        LocalDateTime endOfTo = to.atTime(23, 59, 59, 999999999);

        CriteriaBuilder cb = em().getCriteriaBuilder();
        CriteriaQuery<Issue> issueQuery = cb.createQuery(Issue.class);
        Root<Issue> issueRoot = issueQuery.from(Issue.class);
        issueRoot.fetch("assignee", JoinType.LEFT);
        issueRoot.fetch("reporter", JoinType.LEFT);
        issueRoot.fetch("status", JoinType.LEFT);

        List<Predicate> issuePreds = new ArrayList<>();
        issuePreds.add(cb.equal(issueRoot.get("project").get("id"), projectId));
        issuePreds.add(cb.isNull(issueRoot.get("deletedAt")));
        issuePreds.add(cb.between(issueRoot.get("createdAt"), startOfFrom, endOfTo));

        if (filter.getMemberIds() != null && !filter.getMemberIds().isEmpty()) {
            List<Long> memberIds = filter.getMemberIds();
            boolean hasZero = memberIds.contains(0L);
            List<Long> validUserIds = memberIds.stream().filter(id -> id != 0L).collect(Collectors.toList());
            if (hasZero && validUserIds.isEmpty()) {
                issuePreds.add(cb.isNull(issueRoot.get("assignee")));
            } else if (hasZero) {
                issuePreds.add(cb.or(cb.isNull(issueRoot.get("assignee")), issueRoot.get("assignee").get("id").in(validUserIds)));
            } else {
                issuePreds.add(issueRoot.get("assignee").get("id").in(validUserIds));
            }
        }
        if (filter.getIssueTypes() != null && !filter.getIssueTypes().isEmpty()) {
            List<IssueType> typeEnums = new ArrayList<>();
            for (String t : filter.getIssueTypes()) {
                try { typeEnums.add(IssueType.valueOf(t.toUpperCase().trim())); } catch (Exception ignored) {}
            }
            if (!typeEnums.isEmpty()) {
                issuePreds.add(issueRoot.get("type").in(typeEnums));
            }
        }
        if (filter.getPriorities() != null && !filter.getPriorities().isEmpty()) {
            List<com.pms.backend.enu.Priority> priorityEnums = new ArrayList<>();
            for (String p : filter.getPriorities()) {
                try { priorityEnums.add(com.pms.backend.enu.Priority.valueOf(p.toUpperCase().trim())); } catch (Exception ignored) {}
            }
            if (!priorityEnums.isEmpty()) {
                issuePreds.add(issueRoot.get("priority").in(priorityEnums));
            }
        }

        issueQuery.select(issueRoot).where(issuePreds.toArray(new Predicate[0]));
        List<Issue> rawIssues = em().createQuery(issueQuery).getResultList();

        List<Issue> issues = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (Issue is : rawIssues) {
            if (filter.getStatuses() != null && !filter.getStatuses().isEmpty()) {
                String sName = is.getStatus() != null ? is.getStatus().getName() : "";
                String sCat = (is.getStatus() != null && is.getStatus().getCategory() != null) ? is.getStatus().getCategory().name() : "";
                String sId = is.getStatus() != null ? String.valueOf(is.getStatus().getId()) : "";
                boolean matchStatus = filter.getStatuses().stream().anyMatch(st ->
                        st.equalsIgnoreCase(sName) || st.equalsIgnoreCase(sCat) || st.equalsIgnoreCase(sId));
                if (!matchStatus) continue;
            }
            if (Boolean.TRUE.equals(filter.getOverdueOnly())) {
                boolean overdue = isIssueOverdue(is, null, today);
                if (!overdue) continue;
            }
            issues.add(is);
        }
        return issues;
    }

    public List<Worklog> fetchWorklogsForExport(Long projectId, ProductivityFilterRequest filter) {
        LocalDate from = filter.getFrom() != null ? filter.getFrom() : LocalDate.now().minusDays(30);
        LocalDate to = filter.getTo() != null ? filter.getTo() : LocalDate.now();
        if (from.isAfter(to)) {
            LocalDate tmp = from;
            from = to;
            to = tmp;
        }

        CriteriaBuilder cb = em().getCriteriaBuilder();
        CriteriaQuery<Worklog> wlQuery = cb.createQuery(Worklog.class);
        Root<Worklog> wlRoot = wlQuery.from(Worklog.class);
        wlRoot.fetch("issue", JoinType.LEFT);
        wlRoot.fetch("user", JoinType.LEFT);

        List<Predicate> wlPreds = new ArrayList<>();
        wlPreds.add(cb.equal(wlRoot.get("issue").get("project").get("id"), projectId));
        wlPreds.add(cb.between(wlRoot.get("workDate"), from, to));
        if (filter.getMemberIds() != null && !filter.getMemberIds().isEmpty()) {
            List<Long> validUserIds = filter.getMemberIds().stream()
                    .filter(id -> id != null && id != 0L)
                    .collect(Collectors.toList());
            if (!validUserIds.isEmpty()) {
                wlPreds.add(wlRoot.get("user").get("id").in(validUserIds));
            } else {
                wlPreds.add(cb.disjunction());
            }
        }

        wlQuery.select(wlRoot).where(wlPreds.toArray(new Predicate[0])).orderBy(cb.desc(wlRoot.get("workDate")));
        return em().createQuery(wlQuery).getResultList();
    }

    private boolean isIssueOverdue(Issue issue, LocalDateTime doneTime, LocalDate today) {
        if (issue.getDueDate() == null) return false;
        StatusCategory category = (issue.getStatus() != null && issue.getStatus().getCategory() != null)
                ? issue.getStatus().getCategory() : StatusCategory.TODO;
        if (category == StatusCategory.DONE) {
            return doneTime != null && doneTime.toLocalDate().isAfter(issue.getDueDate());
        } else {
            return issue.getDueDate().isBefore(today);
        }
    }

    private void applySorting(List<MemberProductivityDto> list, String sort) {
        if (sort == null || sort.isBlank() || sort.equalsIgnoreCase("completed_desc")) {
            list.sort((a, b) -> Integer.compare(b.getCompletedIssues(), a.getCompletedIssues()));
        } else if (sort.equalsIgnoreCase("completed_asc")) {
            list.sort((a, b) -> Integer.compare(a.getCompletedIssues(), b.getCompletedIssues()));
        } else if (sort.equalsIgnoreCase("logged_desc")) {
            list.sort((a, b) -> Double.compare(
                    b.getTotalLoggedHours() != null ? b.getTotalLoggedHours() : 0.0,
                    a.getTotalLoggedHours() != null ? a.getTotalLoggedHours() : 0.0));
        } else if (sort.equalsIgnoreCase("logged_asc")) {
            list.sort((a, b) -> Double.compare(
                    a.getTotalLoggedHours() != null ? a.getTotalLoggedHours() : 0.0,
                    b.getTotalLoggedHours() != null ? b.getTotalLoggedHours() : 0.0));
        } else if (sort.equalsIgnoreCase("name_asc")) {
            list.sort(Comparator.comparing(MemberProductivityDto::getFullName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));
        } else if (sort.equalsIgnoreCase("name_desc")) {
            list.sort(Comparator.comparing(MemberProductivityDto::getFullName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)).reversed());
        } else if (sort.equalsIgnoreCase("overdue_desc")) {
            list.sort((a, b) -> Integer.compare(b.getOverdueIssues(), a.getOverdueIssues()));
        } else if (sort.equalsIgnoreCase("onTime_desc")) {
            list.sort((a, b) -> Double.compare(
                    b.getOnTimeRate() != null ? b.getOnTimeRate() : 0.0,
                    a.getOnTimeRate() != null ? a.getOnTimeRate() : 0.0));
        } else if (sort.equalsIgnoreCase("onTime_asc")) {
            list.sort((a, b) -> Double.compare(
                    a.getOnTimeRate() != null ? a.getOnTimeRate() : 0.0,
                    b.getOnTimeRate() != null ? b.getOnTimeRate() : 0.0));
        } else if (sort.equalsIgnoreCase("variance_desc")) {
            list.sort((a, b) -> Double.compare(
                    b.getVariancePercentage() != null ? b.getVariancePercentage() : 0.0,
                    a.getVariancePercentage() != null ? a.getVariancePercentage() : 0.0));
        } else {
            list.sort((a, b) -> Integer.compare(b.getCompletedIssues(), a.getCompletedIssues()));
        }
    }
}
