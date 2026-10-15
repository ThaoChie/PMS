package com.pms.backend.dao;

import com.pms.backend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByProjectKey(String key);
    Optional<Project> findByProjectKeyIgnoreCase(String key);
    boolean existsByProjectKeyIgnoreCase(String key);
}
