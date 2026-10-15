package com.pms.backend.hibernateDao;

import com.pms.backend.dto.IssueSearchRequest;
import com.pms.backend.model.Issue;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class IssueSearchDao {

    @PersistenceContext
    private EntityManager entityManager;

    public List<Issue> searchIssues(IssueSearchRequest request) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Issue> query = cb.createQuery(Issue.class);
        Root<Issue> root = query.from(Issue.class);

        List<Predicate> predicates = new ArrayList<>();

        if (request.getProjectId() != null) {
            predicates.add(cb.equal(root.get("project").get("id"), request.getProjectId()));
        }
        
        if (request.getKeyword() != null && !request.getKeyword().isEmpty()) {
            String likePattern = "%" + request.getKeyword().toLowerCase() + "%";
            Predicate summaryLike = cb.like(cb.lower(root.get("summary")), likePattern);
            Predicate descriptionLike = cb.like(cb.lower(root.get("description")), likePattern);
            predicates.add(cb.or(summaryLike, descriptionLike));
        }

        if (request.getTypes() != null && !request.getTypes().isEmpty()) {
            predicates.add(root.get("type").in(request.getTypes()));
        }

        if (request.getPriorities() != null && !request.getPriorities().isEmpty()) {
            predicates.add(root.get("priority").in(request.getPriorities()));
        }

        if (request.getAssigneeIds() != null && !request.getAssigneeIds().isEmpty()) {
            predicates.add(root.get("assignee").get("id").in(request.getAssigneeIds()));
        }

        if (request.getStatusIds() != null && !request.getStatusIds().isEmpty()) {
            predicates.add(root.get("status").get("id").in(request.getStatusIds()));
        }

        query.where(cb.and(predicates.toArray(new Predicate[0])));

        return entityManager.createQuery(query).getResultList();
    }
}
