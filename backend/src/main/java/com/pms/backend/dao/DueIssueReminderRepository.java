package com.pms.backend.dao;

import com.pms.backend.enu.StatusCategory;
import com.pms.backend.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DueIssueReminderRepository extends JpaRepository<Issue, Long> {

    @Query("SELECT i FROM Issue i " +
           "JOIN FETCH i.status s " +
           "JOIN FETCH i.assignee a " +
           "JOIN FETCH i.project p " +
           "WHERE i.deletedAt IS NULL " +
           "AND s.category != :doneCategory " +
           "AND i.assignee IS NOT NULL " +
           "AND i.dueDate IS NOT NULL " +
           "AND i.dueDate <= :targetDueDate")
    List<Issue> findDueIssuesBefore(
            @Param("doneCategory") StatusCategory doneCategory,
            @Param("targetDueDate") LocalDate targetDueDate);
}
