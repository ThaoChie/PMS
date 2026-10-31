package com.pms.backend.dao;

import com.pms.backend.enu.ProjectRole;
import com.pms.backend.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    @Query("SELECT pm FROM ProjectMember pm JOIN FETCH pm.project WHERE pm.user.id = :userId")
    List<ProjectMember> findByUserId(@Param("userId") Long userId);

    @Query("SELECT pm FROM ProjectMember pm JOIN FETCH pm.user WHERE pm.project.id = :projectId")
    List<ProjectMember> findByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT pm.project.id, COUNT(pm) FROM ProjectMember pm WHERE pm.project.id IN :projectIds GROUP BY pm.project.id")
    List<Object[]> countMembersByProjectIds(@Param("projectIds") List<Long> projectIds);

    @Query("SELECT pm FROM ProjectMember pm JOIN FETCH pm.user WHERE pm.project.id IN :projectIds")
    List<ProjectMember> findMembersByProjectIds(@Param("projectIds") List<Long> projectIds);

    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);
    long countByProjectId(Long projectId);
    long countByProjectIdAndRole(Long projectId, ProjectRole role);
    void deleteByProjectIdAndUserId(Long projectId, Long userId);
}
