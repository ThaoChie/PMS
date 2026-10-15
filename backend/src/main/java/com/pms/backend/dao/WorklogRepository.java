package com.pms.backend.dao;
import com.pms.backend.model.Worklog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface WorklogRepository extends JpaRepository<Worklog, Long> {
    List<Worklog> findByIssueId(Long issueId);
}
