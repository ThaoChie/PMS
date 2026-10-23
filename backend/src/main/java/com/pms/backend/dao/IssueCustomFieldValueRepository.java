package com.pms.backend.dao;

import com.pms.backend.model.IssueCustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IssueCustomFieldValueRepository extends JpaRepository<IssueCustomFieldValue, Long> {
    @Query("SELECT v FROM IssueCustomFieldValue v JOIN FETCH v.field WHERE v.issue.id = :issueId")
    List<IssueCustomFieldValue> findByIssueId(@Param("issueId") Long issueId);

    Optional<IssueCustomFieldValue> findByIssueIdAndFieldId(Long issueId, Long fieldId);

    void deleteByIssueId(Long issueId);
}
