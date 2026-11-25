package com.pms.backend.hibernateDao;

import com.pms.backend.dto.BugReportItemDto;
import com.pms.backend.dto.BugReportResponse;
import com.pms.backend.dto.BugReportRowDto;
import com.pms.backend.model.User;
import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;
import com.pms.backend.enu.StatusCategory;
import com.pms.backend.model.Issue;
import com.pms.backend.model.IssueStatusHistory;
import jakarta.persistence.criteria.*;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Repository
public class BugReportHibernateDao extends BaseHibernateDao {

    public BugReportResponse generateBugReport(Long projectId, LocalDate from, LocalDate to) {
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

        List<Issue> bugs = queryBugs(projectId, to);

        if (bugs.isEmpty()) {
            return new BugReportResponse(projectId, from, to, 0, 0, 0, 0.0, null, Collections.emptyList(), Collections.emptyMap());
        }

        Map<Long, LocalDateTime> firstDoneTimeByIssue = firstDoneTimes(projectId);

        int totalBugs = bugs.size();
        int resolvedBugs = 0;
        int unresolvedBugs = 0;
        List<Double> closingTimesHours = new ArrayList<>();

        Map<Priority, int[]> statsByPriority = new LinkedHashMap<>();
        for (Priority p : Priority.values()) {
            statsByPriority.put(p, new int[2]); // [resolved, unresolved]
        }

        Map<String, Integer> openBugsByPriority = new LinkedHashMap<>();

        for (Issue bug : bugs) {
            Priority p = bug.getPriority() != null ? bug.getPriority() : Priority.MEDIUM;
            int[] counts = statsByPriority.get(p);

            StatusCategory cat = (bug.getStatus() != null && bug.getStatus().getCategory() != null)
                    ? bug.getStatus().getCategory() : StatusCategory.TODO;

            if (cat == StatusCategory.DONE) {
                resolvedBugs++;
                counts[0]++;

                LocalDateTime doneTime = firstDoneTimeByIssue.get(bug.getId());
                LocalDateTime createdAt = bug.getCreatedAt();
                if (doneTime != null && createdAt != null && !doneTime.isBefore(createdAt)) {
                    double hours = Duration.between(createdAt, doneTime).toMinutes() / 60.0;
                    closingTimesHours.add(hours);
                }
            } else {
                unresolvedBugs++;
                counts[1]++;
                openBugsByPriority.put(p.name(), openBugsByPriority.getOrDefault(p.name(), 0) + 1);
            }
        }

        double resolutionRate = (totalBugs > 0)
                ? Math.round((resolvedBugs * 1000.0) / totalBugs) / 10.0
                : 0.0;

        Double avgClosingTimeHours = closingTimesHours.isEmpty() ? null :
                Math.round(closingTimesHours.stream().mapToDouble(Double::doubleValue).average().orElse(0) * 10.0) / 10.0;

        List<BugReportItemDto> byPriority = new ArrayList<>();
        for (Map.Entry<Priority, int[]> entry : statsByPriority.entrySet()) {
            int res = entry.getValue()[0];
            int unres = entry.getValue()[1];
            if (res > 0 || unres > 0) {
                byPriority.add(new BugReportItemDto(entry.getKey().name(), res, unres));
            }
        }

        return new BugReportResponse(
                projectId, from, to,
                totalBugs, resolvedBugs, unresolvedBugs,
                resolutionRate, avgClosingTimeHours,
                byPriority, openBugsByPriority
        );
    }

    /**
     * Danh sách chi tiết từng lỗi, cùng điều kiện lọc với {@link #generateBugReport} (để file xuất
     * khớp số liệu tổng hợp). Sắp xếp: chưa khắc phục trước, rồi theo mức ưu tiên giảm dần, mới tạo trước.
     */
    public List<BugReportRowDto> listBugRows(Long projectId, LocalDate from, LocalDate to) {
        if (to == null) {
            to = LocalDate.now();
        }
        if (from != null && from.isAfter(to)) {
            to = from;
        }
        List<Issue> bugs = queryBugs(projectId, to);
        if (bugs.isEmpty()) {
            return Collections.emptyList();
        }
        Map<Long, LocalDateTime> firstDone = firstDoneTimes(projectId);

        List<BugReportRowDto> rows = new ArrayList<>();
        for (Issue bug : bugs) {
            Priority p = bug.getPriority() != null ? bug.getPriority() : Priority.MEDIUM;
            boolean resolved = bug.getStatus() != null && bug.getStatus().getCategory() == StatusCategory.DONE;
            LocalDateTime doneAt = resolved ? firstDone.get(bug.getId()) : null;
            Double hours = null;
            if (doneAt != null && bug.getCreatedAt() != null && !doneAt.isBefore(bug.getCreatedAt())) {
                hours = Math.round(Duration.between(bug.getCreatedAt(), doneAt).toMinutes() / 6.0) / 10.0;
            }
            rows.add(new BugReportRowDto(
                    bug.getIssueKey(),
                    bug.getSummary(),
                    p.name(),
                    bug.getStatus() != null ? bug.getStatus().getName() : "",
                    resolved,
                    displayName(bug.getAssignee()),
                    displayName(bug.getReporter()),
                    bug.getCreatedAt(),
                    doneAt,
                    hours
            ));
        }
        rows.sort(Comparator
                .comparing(BugReportRowDto::isResolved)
                .thenComparing(r -> Priority.valueOf(r.getPriority()).ordinal())
                .thenComparing(BugReportRowDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return rows;
    }

    private static String displayName(User u) {
        if (u == null) return "";
        return u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getEmail();
    }

    /** Lỗi (type BUG, chưa xóa) của dự án, tạo đến hết ngày {@code to}. */
    private List<Issue> queryBugs(Long projectId, LocalDate to) {
        LocalDateTime endOfTo = to.atTime(23, 59, 59);

        CriteriaBuilder cb = em().getCriteriaBuilder();
        CriteriaQuery<Issue> bugQuery = cb.createQuery(Issue.class);
        Root<Issue> bugRoot = bugQuery.from(Issue.class);
        bugRoot.fetch("status", JoinType.LEFT);
        bugRoot.fetch("assignee", JoinType.LEFT);
        bugRoot.fetch("reporter", JoinType.LEFT);

        List<Predicate> preds = new ArrayList<>();
        preds.add(cb.equal(bugRoot.get("project").get("id"), projectId));
        preds.add(cb.equal(bugRoot.get("type"), IssueType.BUG));
        preds.add(cb.isNull(bugRoot.get("deletedAt")));
        preds.add(cb.lessThanOrEqualTo(bugRoot.get("createdAt"), endOfTo));
        bugQuery.select(bugRoot).where(preds.toArray(new Predicate[0]));

        return em().createQuery(bugQuery).getResultList();
    }

    /** Thời điểm đầu tiên mỗi issue của dự án chuyển sang trạng thái DONE (A-10). */
    private Map<Long, LocalDateTime> firstDoneTimes(Long projectId) {
        CriteriaBuilder cb = em().getCriteriaBuilder();
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
        return firstDoneTimeByIssue;
    }
}
