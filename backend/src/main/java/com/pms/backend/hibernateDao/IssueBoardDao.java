package com.pms.backend.hibernateDao;

import com.pms.backend.dao.IssueRepository;
import com.pms.backend.model.Issue;
import com.pms.backend.model.ProjectMember;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class IssueBoardDao {

    private final IssueRepository issueRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public IssueBoardDao(IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
    }

    public Issue saveIssue(Issue issue) {
        return issueRepository.save(issue);
    }

    public Optional<Issue> findIssueById(Long id) {
        return issueRepository.findById(id);
    }

    public void deleteIssueById(Long id) {
        issueRepository.deleteById(id);
    }

    public List<Issue> findIssuesByProjectId(Long projectId) {
        return issueRepository.findByProjectId(projectId);
    }

    // Dynamic query with security scope: project IN (danh sách project user được phân quyền)
    public List<Issue> findIssuesForUserBoard(Long userId, Long projectId) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Issue> query = cb.createQuery(Issue.class);
        Root<Issue> issueRoot = query.from(Issue.class);

        // Subquery to find projects the user is a member of
        Subquery<Long> projectSubquery = query.subquery(Long.class);
        Root<ProjectMember> memberRoot = projectSubquery.from(ProjectMember.class);
        projectSubquery.select(memberRoot.get("project").get("id"))
                       .where(cb.equal(memberRoot.get("user").get("id"), userId));

        // Basic security condition
        Predicate securityPredicate = issueRoot.get("project").get("id").in(projectSubquery);

        if (projectId != null) {
            Predicate projectPredicate = cb.equal(issueRoot.get("project").get("id"), projectId);
            query.where(cb.and(securityPredicate, projectPredicate));
        } else {
            query.where(securityPredicate);
        }

        return entityManager.createQuery(query).getResultList();
    }
}
