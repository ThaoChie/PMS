package com.pms.backend.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
public class IssueKeyGenerator {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Atomically increments issue_seq on the project table and returns the next formatted key: {PROJECT_KEY}-{seq}.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public String generateNextKey(Long projectId, String projectKey) {
        Number nextSeq = (Number) entityManager.createNativeQuery(
                "UPDATE projects SET issue_seq = issue_seq + 1 WHERE id = :projectId RETURNING issue_seq")
                .setParameter("projectId", projectId)
                .getSingleResult();

        return projectKey.toUpperCase() + "-" + nextSeq.longValue();
    }
}
