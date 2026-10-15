package com.pms.backend.dao;

import com.pms.backend.enu.LinkType;
import com.pms.backend.model.IssueLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IssueLinkRepository extends JpaRepository<IssueLink, Long> {

    @Query("SELECT l FROM IssueLink l WHERE l.sourceIssue.id = :issueId OR l.targetIssue.id = :issueId")
    List<IssueLink> findAllLinksForIssue(@Param("issueId") Long issueId);

    Optional<IssueLink> findBySourceIssueIdAndTargetIssueIdAndLinkType(Long sourceId, Long targetId, LinkType linkType);

    void deleteBySourceIssueIdOrTargetIssueId(Long sourceId, Long targetId);
}
