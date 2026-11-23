package com.pms.backend.dao;

import com.pms.backend.enu.InvitationStatus;
import com.pms.backend.model.Invitation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    @Override
    @EntityGraph(attributePaths = {"project", "invitedBy"})
    Optional<Invitation> findById(Long id);

    Optional<Invitation> findByToken(String token);

    @EntityGraph(attributePaths = {"project", "invitedBy"})
    List<Invitation> findByProjectId(Long projectId);

    @EntityGraph(attributePaths = {"project", "invitedBy"})
    List<Invitation> findByEmailIgnoreCaseAndStatus(String email, InvitationStatus status);

    @EntityGraph(attributePaths = {"project", "invitedBy"})
    List<Invitation> findByEmailIgnoreCaseOrderByIdDesc(String email);

    Optional<Invitation> findByProjectIdAndEmailIgnoreCaseAndStatus(Long projectId, String email, InvitationStatus status);
    List<Invitation> findByStatusAndExpiresAtBefore(InvitationStatus status, LocalDateTime dateTime);
}
