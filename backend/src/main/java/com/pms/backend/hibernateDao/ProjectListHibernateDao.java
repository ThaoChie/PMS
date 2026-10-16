package com.pms.backend.hibernateDao;

import com.pms.backend.dto.ProjectResponse;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.wrapper.PageWrapper;
import jakarta.persistence.criteria.*;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class ProjectListHibernateDao extends BaseHibernateDao {

    public PageWrapper<ProjectResponse> findProjects(Long userId, String q, String sort, int page, int size) {
        CriteriaBuilder cb = em().getCriteriaBuilder();

        // 1. Data Query
        CriteriaQuery<Project> query = cb.createQuery(Project.class);
        Root<Project> root = query.from(Project.class);

        List<Predicate> predicates = buildPredicates(cb, root, query, userId, q);
        query.where(cb.and(predicates.toArray(new Predicate[0])));

        // Sorting
        if ("name,asc".equalsIgnoreCase(sort)) {
            query.orderBy(cb.asc(root.get("name")));
        } else if ("name,desc".equalsIgnoreCase(sort)) {
            query.orderBy(cb.desc(root.get("name")));
        } else {
            query.orderBy(cb.desc(root.get("updatedAt")));
        }

        // 2. Count Query
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Project> countRoot = countQuery.from(Project.class);
        List<Predicate> countPredicates = buildPredicates(cb, countRoot, countQuery, userId, q);
        countQuery.select(cb.count(countRoot)).where(cb.and(countPredicates.toArray(new Predicate[0])));

        long total = em().createQuery(countQuery).getSingleResult();
        if (total == 0) {
            return PageWrapper.empty(page, size);
        }

        List<Project> projects = em().createQuery(query)
                .setFirstResult(page * size)
                .setMaxResults(size)
                .getResultList();

        List<ProjectResponse> content = projects.stream()
                .map(ProjectResponse::from)
                .collect(Collectors.toList());

        return PageWrapper.of(content, page, size, total);
    }

    private List<Predicate> buildPredicates(CriteriaBuilder cb, Root<Project> root, CriteriaQuery<?> query,
                                            Long userId, String q) {
        List<Predicate> predicates = new ArrayList<>();

        // Scope to projects user is a member of
        if (userId != null) {
            Subquery<Long> memberSubquery = query.subquery(Long.class);
            Root<ProjectMember> pmRoot = memberSubquery.from(ProjectMember.class);
            memberSubquery.select(pmRoot.get("project").get("id"))
                    .where(cb.equal(pmRoot.get("user").get("id"), userId));

            predicates.add(root.get("id").in(memberSubquery));
        }

        // Keyword filter on name or key
        if (StringUtils.hasText(q)) {
            String pattern = "%" + q.trim().toLowerCase() + "%";
            Predicate nameLike = cb.like(cb.lower(root.get("name")), pattern);
            Predicate keyLike = cb.like(cb.lower(root.get("projectKey")), pattern);
            predicates.add(cb.or(nameLike, keyLike));
        }

        return predicates;
    }
}
