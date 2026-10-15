package com.pms.backend.dao;

import com.pms.backend.model.IssueAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IssueAttachmentRepository extends JpaRepository<IssueAttachment, Long> {

    List<IssueAttachment> findByIssueId(Long issueId);

    @Query("SELECT COALESCE(SUM(a.fileSize), 0) FROM IssueAttachment a WHERE a.issue.id = :issueId")
    long calculateTotalAttachmentSizeForIssue(@Param("issueId") Long issueId);
}
