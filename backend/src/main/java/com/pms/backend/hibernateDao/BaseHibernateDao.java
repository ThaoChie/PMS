package com.pms.backend.hibernateDao;

import com.pms.backend.wrapper.PageWrapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.util.List;

public abstract class BaseHibernateDao {

    @PersistenceContext
    protected EntityManager entityManager;

    protected EntityManager em() {
        return entityManager;
    }

    protected <T> PageWrapper<T> executePagedQuery(
            CriteriaQuery<T> query,
            CriteriaQuery<Long> countQuery,
            int page,
            int size) {
        
        long total = em().createQuery(countQuery).getSingleResult();
        if (total == 0) {
            return PageWrapper.empty(page, size);
        }

        List<T> content = em().createQuery(query)
                .setFirstResult(page * size)
                .setMaxResults(size)
                .getResultList();

        return PageWrapper.of(content, page, size, total);
    }
}
