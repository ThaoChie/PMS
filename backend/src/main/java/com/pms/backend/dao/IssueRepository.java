package com.pms.backend.dao;

import com.pms.backend.model.Issue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<Issue, Long> {

    Optional<Issue> findByIssueKey(String key);

    Optional<Issue> findByIssueKeyAndDeletedAtIsNull(String key);

    default Optional<Issue> findByKeyOrId(String keyOrId) {
        if (keyOrId == null || keyOrId.isBlank()) return Optional.empty();
        Optional<Issue> opt = findByIssueKeyAndDeletedAtIsNull(keyOrId);
        if (opt.isEmpty() && keyOrId.matches("^\\d+$")) {
            try {
                opt = findById(Long.parseLong(keyOrId)).filter(i -> i.getDeletedAt() == null);
            } catch (Exception ignored) {}
        }
        return opt;
    }

    List<Issue> findByProjectIdAndDeletedAtIsNull(Long projectId);

    Page<Issue> findByProjectIdAndDeletedAtIsNull(Long projectId, Pageable pageable);

    List<Issue> findByParentIdAndDeletedAtIsNull(Long parentId);

    List<Issue> findByEpicIdAndDeletedAtIsNull(Long epicId);

    long countByStatusIdAndDeletedAtIsNull(Long statusId);

    long countByProjectIdAndDeletedAtIsNull(Long projectId);

    @Query(value = "SELECT i FROM Issue i WHERE i.project.id = :projectId AND i.deletedAt IS NULL AND " +
           "(:type IS NULL OR i.type = :type) AND " +
           "(:priority IS NULL OR i.priority = :priority) AND " +
           "(:statusId IS NULL OR i.status.id = :statusId) AND " +
           "(:assigneeId IS NULL OR i.assignee.id = :assigneeId)",
           countQuery = "SELECT COUNT(i) FROM Issue i WHERE i.project.id = :projectId AND i.deletedAt IS NULL AND " +
           "(:type IS NULL OR i.type = :type) AND " +
           "(:priority IS NULL OR i.priority = :priority) AND " +
           "(:statusId IS NULL OR i.status.id = :statusId) AND " +
           "(:assigneeId IS NULL OR i.assignee.id = :assigneeId)")
    Page<Issue> findFilteredIssues(
            @Param("projectId") Long projectId,
            @Param("type") com.pms.backend.enu.IssueType type,
            @Param("priority") com.pms.backend.enu.Priority priority,
            @Param("statusId") Long statusId,
            @Param("assigneeId") Long assigneeId,
            Pageable pageable
    );
}
