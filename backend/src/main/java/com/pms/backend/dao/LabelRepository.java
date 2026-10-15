package com.pms.backend.dao;

import com.pms.backend.model.Label;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LabelRepository extends JpaRepository<Label, Long> {
    Optional<Label> findByProjectIdAndName(Long projectId, String name);
    List<Label> findByProjectId(Long projectId);
}
