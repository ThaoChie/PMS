package com.pms.backend.hibernateDao;

import com.pms.backend.dto.IssueSearchRequest;
import com.pms.backend.enu.StatusCategory;
import com.pms.backend.model.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class IssueSearchDao {

    @PersistenceContext
    private EntityManager entityManager;

    public List<Issue> searchIssues(IssueSearchRequest request) {
        return searchIssues(request, null, null, null);
    }

    public List<Issue> searchIssues(IssueSearchRequest request, List<Long> accessibleProjectIds, Long currentUserId, List<Long> recentlyViewedIssueIds) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Issue> query = cb.createQuery(Issue.class);
        Root<Issue> root = query.from(Issue.class);

        // Eager fetch status and assignee for performance
        root.fetch("status", JoinType.LEFT);
        root.fetch("assignee", JoinType.LEFT);
        root.fetch("project", JoinType.LEFT);

        List<Predicate> predicates = buildPredicates(cb, query, root, request, accessibleProjectIds, currentUserId, recentlyViewedIssueIds);
        if (predicates == null) {
            return Collections.emptyList(); // Access restricted
        }

        query.where(cb.and(predicates.toArray(new Predicate[0])));

        // Ordering based on quick or default
        applyOrdering(cb, query, root, request);

        query.distinct(true);

        return entityManager.createQuery(query).getResultList();
    }

    public Page<Issue> searchIssuesPage(IssueSearchRequest request, List<Long> accessibleProjectIds, Long currentUserId, List<Long> recentlyViewedIssueIds, Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        // 1. Count query
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Issue> countRoot = countQuery.from(Issue.class);
        List<Predicate> countPredicates = buildPredicates(cb, countQuery, countRoot, request, accessibleProjectIds, currentUserId, recentlyViewedIssueIds);
        if (countPredicates == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        countQuery.select(cb.countDistinct(countRoot));
        countQuery.where(cb.and(countPredicates.toArray(new Predicate[0])));
        Long total = entityManager.createQuery(countQuery).getSingleResult();

        if (total == 0) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        // 2. Data query
        CriteriaQuery<Issue> query = cb.createQuery(Issue.class);
        Root<Issue> root = query.from(Issue.class);
        root.fetch("status", JoinType.LEFT);
        root.fetch("assignee", JoinType.LEFT);
        root.fetch("project", JoinType.LEFT);

        List<Predicate> predicates = buildPredicates(cb, query, root, request, accessibleProjectIds, currentUserId, recentlyViewedIssueIds);
        query.where(cb.and(predicates.toArray(new Predicate[0])));
        applyOrdering(cb, query, root, request);
        query.distinct(true);

        TypedQuery<Issue> typedQuery = entityManager.createQuery(query);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());

        List<Issue> issues = typedQuery.getResultList();
        return new PageImpl<>(issues, pageable, total);
    }

    public long countIssues(IssueSearchRequest request, List<Long> accessibleProjectIds, Long currentUserId, List<Long> recentlyViewedIssueIds) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Issue> countRoot = countQuery.from(Issue.class);
        List<Predicate> countPredicates = buildPredicates(cb, countQuery, countRoot, request, accessibleProjectIds, currentUserId, recentlyViewedIssueIds);
        if (countPredicates == null) {
            return 0;
        }

        countQuery.select(cb.countDistinct(countRoot));
        countQuery.where(cb.and(countPredicates.toArray(new Predicate[0])));
        return entityManager.createQuery(countQuery).getSingleResult();
    }

    private List<Predicate> buildPredicates(
            CriteriaBuilder cb,
            CriteriaQuery<?> query,
            Root<Issue> root,
            IssueSearchRequest request,
            List<Long> accessibleProjectIds,
            Long currentUserId,
            List<Long> recentlyViewedIssueIds
    ) {
        List<Predicate> predicates = new ArrayList<>();

        // Exclude soft deleted
        predicates.add(cb.isNull(root.get("deletedAt")));

        // Scope to accessible projects (BR-SRCH-01)
        if (accessibleProjectIds != null) {
            if (accessibleProjectIds.isEmpty()) {
                return null; // Caller cannot access any project
            }
            if (request.getProjectIds() != null && !request.getProjectIds().isEmpty()) {
                List<Long> intersection = request.getProjectIds().stream()
                        .filter(accessibleProjectIds::contains)
                        .collect(Collectors.toList());
                if (intersection.isEmpty()) {
                    return null; // Requested projects not accessible
                }
                predicates.add(root.get("project").get("id").in(intersection));
            } else {
                predicates.add(root.get("project").get("id").in(accessibleProjectIds));
            }
        } else if (request.getProjectIds() != null && !request.getProjectIds().isEmpty()) {
            predicates.add(root.get("project").get("id").in(request.getProjectIds()));
        }

        // Keyword: ILIKE on lower(summary) and lower(description)
        if (request.getKeyword() != null && !request.getKeyword().isBlank()) {
            String likePattern = "%" + request.getKeyword().trim().toLowerCase() + "%";
            Predicate summaryLike = cb.like(cb.lower(root.get("summary")), likePattern);
            Predicate descLike = cb.like(cb.lower(cb.coalesce(root.get("description"), "")), likePattern);
            Predicate keyLike = cb.like(cb.lower(root.get("issueKey")), likePattern);
            predicates.add(cb.or(summaryLike, descLike, keyLike));
        }

        // Issue Types
        if (request.getTypes() != null && !request.getTypes().isEmpty()) {
            predicates.add(root.get("type").in(request.getTypes()));
        }

        // Priorities
        if (request.getPriorities() != null && !request.getPriorities().isEmpty()) {
            predicates.add(root.get("priority").in(request.getPriorities()));
        }

        // Status IDs
        if (request.getStatusIds() != null && !request.getStatusIds().isEmpty()) {
            predicates.add(root.get("status").get("id").in(request.getStatusIds()));
        }

        // Status Names
        if (request.getStatuses() != null && !request.getStatuses().isEmpty()) {
            predicates.add(root.get("status").get("name").in(request.getStatuses()));
        }

        // Assignee IDs
        if (request.getAssigneeIds() != null && !request.getAssigneeIds().isEmpty()) {
            predicates.add(root.get("assignee").get("id").in(request.getAssigneeIds()));
        }

        // Reporter IDs
        if (request.getReporterIds() != null && !request.getReporterIds().isEmpty()) {
            predicates.add(root.get("reporter").get("id").in(request.getReporterIds()));
        }

        // Labels
        if (request.getLabels() != null && !request.getLabels().isEmpty()) {
            Join<Issue, Label> labelJoin = root.join("labels", JoinType.LEFT);
            predicates.add(labelJoin.get("name").in(request.getLabels()));
        }

        // Date range
        if (request.getFromDate() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), request.getFromDate().atStartOfDay()));
        }
        if (request.getToDate() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), request.getToDate().atTime(LocalTime.MAX)));
        }

        // Quick filter
        if (request.getQuick() != null && !request.getQuick().isBlank()) {
            String q = request.getQuick().trim().toUpperCase();
            switch (q) {
                case "MY_OPEN":
                case "MY-ISSUES":
                    if (currentUserId != null) {
                        predicates.add(cb.equal(root.get("assignee").get("id"), currentUserId));
                    }
                    predicates.add(cb.notEqual(root.get("status").get("category"), StatusCategory.DONE));
                    break;
                case "REPORTED_BY_ME":
                case "REPORTED-BY-ME":
                    if (currentUserId != null) {
                        predicates.add(cb.equal(root.get("reporter").get("id"), currentUserId));
                    }
                    break;
                case "OPEN":
                    predicates.add(cb.notEqual(root.get("status").get("category"), StatusCategory.DONE));
                    break;
                case "DONE":
                    predicates.add(cb.equal(root.get("status").get("category"), StatusCategory.DONE));
                    break;
                case "CRITICAL":
                    predicates.add(cb.equal(root.get("priority"), com.pms.backend.enu.Priority.HIGHEST));
                    break;
                case "RECENTLY_VIEWED":
                    if (recentlyViewedIssueIds != null && !recentlyViewedIssueIds.isEmpty()) {
                        predicates.add(root.get("id").in(recentlyViewedIssueIds));
                    } else {
                        // Empty set for recently viewed
                        predicates.add(cb.disjunction());
                    }
                    break;
                default:
                    break;
            }
        }

        return predicates;
    }

    private void applyOrdering(CriteriaBuilder cb, CriteriaQuery<Issue> query, Root<Issue> root, IssueSearchRequest request) {
        if (request.getQuick() != null) {
            String q = request.getQuick().trim().toUpperCase();
            if ("RECENTLY_CREATED".equals(q)) {
                query.orderBy(cb.desc(root.get("createdAt")));
                return;
            } else if ("RECENTLY_UPDATED".equals(q) || "RECENTLY-UPDATED".equals(q)) {
                query.orderBy(cb.desc(root.get("updatedAt")));
                return;
            }
        }
        // Default order by updatedAt desc
        query.orderBy(cb.desc(root.get("updatedAt")));
    }
}
