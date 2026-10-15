package com.pms.backend.dao;

import com.pms.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    Optional<User> findByGoogleSub(String googleSub);

    @Query("SELECT u FROM User u WHERE LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<User> searchUsers(@Param("q") String q);

    @Query("SELECT pm.user FROM ProjectMember pm WHERE pm.project.id = :projectId AND (LOWER(pm.user.email) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(pm.user.fullName) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<User> searchProjectMembers(@Param("projectId") Long projectId, @Param("q") String q);
}
