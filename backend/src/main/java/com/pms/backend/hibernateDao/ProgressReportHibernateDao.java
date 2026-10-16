package com.pms.backend.hibernateDao;

import com.pms.backend.dto.ProgressPointDto;
import com.pms.backend.dto.ProgressReportResponse;
import com.pms.backend.enu.StatusCategory;
import com.pms.backend.model.Issue;
import com.pms.backend.model.IssueStatusHistory;
import jakarta.persistence.criteria.*;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Repository
public class ProgressReportHibernateDao extends BaseHibernateDao {

    public ProgressReportResponse generateProgressReport(Long projectId, LocalDate from, LocalDate to, String metric) {
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
        if (metric == null || metric.isBlank()) {
            metric = "issues";
        }

        LocalDateTime endOfTo = to.atTime(23, 59, 59);

        // Query issues in project created on or before endOfTo, and not deleted before from
        CriteriaBuilder cb = em().getCriteriaBuilder();
        CriteriaQuery<Issue> issueQuery = cb.createQuery(Issue.class);
        Root<Issue> issueRoot = issueQuery.from(Issue.class);
        issueRoot.fetch("status", JoinType.LEFT);

        List<Predicate> issuePreds = new ArrayList<>();
        issuePreds.add(cb.equal(issueRoot.get("project").get("id"), projectId));
        issuePreds.add(cb.lessThanOrEqualTo(issueRoot.get("createdAt"), endOfTo));
        issuePreds.add(cb.or(
                cb.isNull(issueRoot.get("deletedAt")),
                cb.greaterThan(issueRoot.get("deletedAt"), from.atStartOfDay())
        ));
        issueQuery.select(issueRoot).where(issuePreds.toArray(new Predicate[0]));

        List<Issue> issues = em().createQuery(issueQuery).getResultList();

        if (issues.isEmpty()) {
            return new ProgressReportResponse(projectId, from, to, metric, false, 0, 0, 0, false, Collections.emptyList());
        }

        // Query status history for these issues up to endOfTo
        CriteriaQuery<IssueStatusHistory> histQuery = cb.createQuery(IssueStatusHistory.class);
        Root<IssueStatusHistory> histRoot = histQuery.from(IssueStatusHistory.class);
        histRoot.fetch("toStatus", JoinType.LEFT);

        List<Predicate> histPreds = new ArrayList<>();
        histPreds.add(cb.equal(histRoot.get("issue").get("project").get("id"), projectId));
        histPreds.add(cb.lessThanOrEqualTo(histRoot.get("changedAt"), endOfTo));
        histQuery.select(histRoot)
                .where(histPreds.toArray(new Predicate[0]))
                .orderBy(cb.asc(histRoot.get("changedAt")));

        List<IssueStatusHistory> historyList = em().createQuery(histQuery).getResultList();

        // Group history by issue id
        Map<Long, List<IssueStatusHistory>> historyByIssue = new HashMap<>();
        for (IssueStatusHistory h : historyList) {
            if (h.getIssue() != null) {
                historyByIssue.computeIfAbsent(h.getIssue().getId(), k -> new ArrayList<>()).add(h);
            }
        }

        boolean useHours = "hours".equalsIgnoreCase(metric);
        List<ProgressPointDto> series = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");

        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
        if (totalDays <= 0) totalDays = 1;

        // Calculate initial scope at start date
        double initialTotalScope = 0;
        for (Issue issue : issues) {
            LocalDate createdDate = issue.getCreatedAt() != null ? issue.getCreatedAt().toLocalDate() : from;
            if (!createdDate.isAfter(from)) {
                double weight = useHours
                        ? (issue.getOriginalEstimateMin() != null && issue.getOriginalEstimateMin() > 0
                                ? issue.getOriginalEstimateMin() / 60.0 : 1.0)
                        : 1.0;
                initialTotalScope += weight;
            }
        }
        if (initialTotalScope == 0) {
            // fallback to total scope across all issues
            for (Issue issue : issues) {
                double weight = useHours
                        ? (issue.getOriginalEstimateMin() != null && issue.getOriginalEstimateMin() > 0
                                ? issue.getOriginalEstimateMin() / 60.0 : 1.0)
                        : 1.0;
                initialTotalScope += weight;
            }
        }

        double latestRemaining = 0;
        double latestCompleted = 0;
        double latestTotalScope = 0;
        boolean atRisk = false;

        LocalDate cur = from;
        int dayIndex = 0;
        while (!cur.isAfter(to)) {
            LocalDateTime endOfDay = cur.atTime(23, 59, 59);
            double dayTotalScope = 0;
            double dayCompleted = 0;
            double dayRemaining = 0;

            for (Issue issue : issues) {
                // Must be created on or before this day
                LocalDate createdDate = issue.getCreatedAt() != null ? issue.getCreatedAt().toLocalDate() : from;
                if (createdDate.isAfter(cur)) {
                    continue;
                }
                // If deleted before this day, ignore
                if (issue.getDeletedAt() != null && issue.getDeletedAt().isBefore(cur.atStartOfDay())) {
                    continue;
                }

                double weight = 1.0;
                if (useHours) {
                    double orig = (issue.getOriginalEstimateMin() != null && issue.getOriginalEstimateMin() > 0)
                            ? issue.getOriginalEstimateMin() / 60.0 : 1.0;
                    weight = orig;
                }

                dayTotalScope += weight;

                // Determine status category at endOfDay
                List<IssueStatusHistory> issueHist = historyByIssue.get(issue.getId());
                StatusCategory statusCatAtDay = null;
                if (issueHist != null) {
                    for (IssueStatusHistory h : issueHist) {
                        if (!h.getChangedAt().isAfter(endOfDay) && h.getToStatus() != null) {
                            statusCatAtDay = h.getToStatus().getCategory();
                        }
                    }
                }
                if (statusCatAtDay == null) {
                    // check initial status
                    statusCatAtDay = (issue.getStatus() != null && issue.getStatus().getCategory() != null)
                            ? issue.getStatus().getCategory() : StatusCategory.TODO;
                }

                if (statusCatAtDay == StatusCategory.DONE) {
                    dayCompleted += weight;
                } else {
                    double remWeight = weight;
                    if (useHours && issue.getRemainingEstimateMin() != null && issue.getRemainingEstimateMin() > 0) {
                        remWeight = issue.getRemainingEstimateMin() / 60.0;
                    }
                    dayRemaining += remWeight;
                }
            }

            // Ideal burn-down line linearly goes from initialTotalScope to 0
            double idealFraction = (totalDays > 1) ? ((double) (totalDays - 1 - dayIndex) / (totalDays - 1)) : 0;
            double ideal = Math.max(0, initialTotalScope * idealFraction);

            int roundedRemaining = (int) Math.round(dayRemaining);
            int roundedCompleted = (int) Math.round(dayCompleted);
            int roundedIdeal = (int) Math.round(ideal);

            ProgressPointDto point = new ProgressPointDto(cur.format(fmt), roundedRemaining, roundedCompleted, roundedIdeal);
            point.setDate(cur.toString());
            series.add(point);

            latestRemaining = roundedRemaining;
            latestCompleted = roundedCompleted;
            latestTotalScope = Math.round(dayTotalScope);
            if (cur.equals(LocalDate.now()) || cur.equals(to)) {
                atRisk = (roundedRemaining > roundedIdeal);
            }

            cur = cur.plusDays(1);
            dayIndex++;
        }

        boolean hasEnoughData = latestTotalScope > 0 && !series.isEmpty();

        return new ProgressReportResponse(
                projectId, from, to, metric, hasEnoughData,
                latestTotalScope, latestRemaining, latestCompleted, atRisk, series
        );
    }
}
