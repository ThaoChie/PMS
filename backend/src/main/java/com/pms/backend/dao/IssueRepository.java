package com.pms.backend.dao;

import com.pms.backend.model.Issue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
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

    @EntityGraph(attributePaths = {"status", "assignee", "reporter", "project"})
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

    @Query("SELECT i FROM Issue i " +
           "JOIN FETCH i.project p " +
           "LEFT JOIN FETCH i.status s " +
           "LEFT JOIN FETCH i.assignee a " +
           "LEFT JOIN FETCH i.reporter r " +
           "WHERE i.deletedAt IS NULL " +
           "AND i.assignee.id = :userId " +
           "AND i.project.id IN :projectIds " +
           "AND (i.status IS NULL OR i.status.category != :doneCategory) " +
           "ORDER BY i.updatedAt DESC")
    List<Issue> findTopAssignedIssues(
            @Param("userId") Long userId,
            @Param("projectIds") List<Long> projectIds,
            @Param("doneCategory") com.pms.backend.enu.StatusCategory doneCategory,
            Pageable pageable
    );

    @Query("SELECT COALESCE(s.name, 'Unassigned Status'), COUNT(i) " +
           "FROM Issue i LEFT JOIN i.status s " +
           "WHERE i.project.id = :projectId AND i.deletedAt IS NULL " +
           "GROUP BY s.name")
    List<Object[]> countIssuesByStatusGrouped(@Param("projectId") Long projectId);

    @Query("SELECT COALESCE(u.fullName, 'Unassigned'), COUNT(i) " +
           "FROM Issue i LEFT JOIN i.assignee u " +
           "WHERE i.project.id = :projectId AND i.deletedAt IS NULL " +
           "GROUP BY u.fullName")
    List<Object[]> countIssuesByAssigneeGrouped(@Param("projectId") Long projectId);
}
