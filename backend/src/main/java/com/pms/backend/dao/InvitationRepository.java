package com.pms.backend.dao;

import com.pms.backend.enu.InvitationStatus;
import com.pms.backend.model.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    Optional<Invitation> findByToken(String token);
    List<Invitation> findByProjectId(Long projectId);
    List<Invitation> findByEmailIgnoreCaseAndStatus(String email, InvitationStatus status);
    Optional<Invitation> findByProjectIdAndEmailIgnoreCaseAndStatus(Long projectId, String email, InvitationStatus status);
    List<Invitation> findByStatusAndExpiresAtBefore(InvitationStatus status, LocalDateTime dateTime);
}
