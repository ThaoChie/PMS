package com.pms.backend.dao;

import com.pms.backend.enu.ProjectRole;
import com.pms.backend.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByUserId(Long userId);
    List<ProjectMember> findByProjectId(Long projectId);
    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);
    long countByProjectIdAndRole(Long projectId, ProjectRole role);
    void deleteByProjectIdAndUserId(Long projectId, Long userId);
}
