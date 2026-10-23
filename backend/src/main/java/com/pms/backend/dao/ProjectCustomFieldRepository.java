package com.pms.backend.dao;

import com.pms.backend.model.ProjectCustomField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectCustomFieldRepository extends JpaRepository<ProjectCustomField, Long> {
    List<ProjectCustomField> findByProjectIdOrderByPositionAscIdAsc(Long projectId);
    Optional<ProjectCustomField> findByProjectIdAndFieldKey(Long projectId, String fieldKey);
    boolean existsByProjectIdAndFieldKey(Long projectId, String fieldKey);
}
