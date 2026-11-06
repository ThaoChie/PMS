package com.pms.backend.hibernateDao;

import com.pms.backend.enu.ApprovalApproverRole;
import com.pms.backend.enu.ApprovalRequestStatus;
import com.pms.backend.enu.ApprovalStepStatus;
import com.pms.backend.model.ApprovalRequest;
import com.pms.backend.model.ApprovalStep;
import com.pms.backend.wrapper.PageWrapper;
import jakarta.persistence.criteria.*;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Repository
public class ApprovalRequestHibernateDao extends BaseHibernateDao implements IApprovalRequestHibernateDao {

    @Override
    public PageWrapper<ApprovalRequest> findByProjectId(Long projectId, String status, String type, int page, int size) {
        CriteriaBuilder cb = em().getCriteriaBuilder();

        CriteriaQuery<ApprovalRequest> query = cb.createQuery(ApprovalRequest.class);
        Root<ApprovalRequest> root = query.from(ApprovalRequest.class);
        root.fetch("requester", JoinType.LEFT);
        root.fetch("steps", JoinType.LEFT);

        List<Predicate> preds = buildPredicates(cb, root, projectId, status, type);
        query.where(preds.toArray(new Predicate[0])).orderBy(cb.desc(root.get("createdAt")));
        query.distinct(true);

        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<ApprovalRequest> countRoot = countQuery.from(ApprovalRequest.class);
        List<Predicate> countPreds = buildPredicates(cb, countRoot, projectId, status, type);
        countQuery.select(cb.count(countRoot)).where(countPreds.toArray(new Predicate[0]));

        return executePagedQuery(query, countQuery, page, size);
    }

    @Override
    public List<ApprovalRequest> findPendingForUser(Long userId, boolean isAdmin, List<Long> pmProjectIds) {
        CriteriaBuilder cb = em().getCriteriaBuilder();
        CriteriaQuery<ApprovalRequest> query = cb.createQuery(ApprovalRequest.class);
        Root<ApprovalRequest> root = query.from(ApprovalRequest.class);
        root.fetch("requester", JoinType.LEFT);
        root.fetch("project", JoinType.LEFT);

        Join<ApprovalRequest, ApprovalStep> stepJoin = root.join("steps", JoinType.INNER);

        List<Predicate> preds = new ArrayList<>();
        preds.add(cb.equal(root.get("status"), ApprovalRequestStatus.PENDING));
        preds.add(cb.equal(stepJoin.get("status"), ApprovalStepStatus.PENDING));
        preds.add(cb.notEqual(root.get("requester").get("id"), userId));

        if (isAdmin && (pmProjectIds == null || pmProjectIds.isEmpty())) {
            preds.add(cb.equal(stepJoin.get("approverRole"), ApprovalApproverRole.ADMIN));
        } else if (!isAdmin && pmProjectIds != null && !pmProjectIds.isEmpty()) {
            preds.add(cb.equal(stepJoin.get("approverRole"), ApprovalApproverRole.PM));
            preds.add(root.get("project").get("id").in(pmProjectIds));
        } else if (isAdmin && pmProjectIds != null && !pmProjectIds.isEmpty()) {
            Predicate adminPred = cb.equal(stepJoin.get("approverRole"), ApprovalApproverRole.ADMIN);
            Predicate pmPred = cb.and(
                    cb.equal(stepJoin.get("approverRole"), ApprovalApproverRole.PM),
                    root.get("project").get("id").in(pmProjectIds)
            );
            preds.add(cb.or(adminPred, pmPred));
        } else {
            return List.of();
        }

        query.where(preds.toArray(new Predicate[0])).orderBy(cb.desc(root.get("createdAt")));
        query.distinct(true);
        return em().createQuery(query).getResultList();
    }

    private List<Predicate> buildPredicates(CriteriaBuilder cb, Root<ApprovalRequest> root,
                                             Long projectId, String status, String type) {
        List<Predicate> preds = new ArrayList<>();
        preds.add(cb.equal(root.get("project").get("id"), projectId));
        if (StringUtils.hasText(status)) {
            try {
                preds.add(cb.equal(root.get("status"),
                        com.pms.backend.enu.ApprovalRequestStatus.valueOf(status.toUpperCase())));
            } catch (IllegalArgumentException ignored) {}
        }
        if (StringUtils.hasText(type)) {
            try {
                preds.add(cb.equal(root.get("type"),
                        com.pms.backend.enu.ApprovalRequestType.valueOf(type.toUpperCase())));
            } catch (IllegalArgumentException ignored) {}
        }
        return preds;
    }
}
