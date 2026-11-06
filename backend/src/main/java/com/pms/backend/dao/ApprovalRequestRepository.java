package com.pms.backend.dao;

import com.pms.backend.enu.ApprovalRequestStatus;
import com.pms.backend.enu.ApprovalRequestType;
import com.pms.backend.model.ApprovalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {

    boolean existsByProjectIdAndTypeAndStatus(Long projectId, ApprovalRequestType type, ApprovalRequestStatus status);

    @Query("SELECT ar FROM ApprovalRequest ar LEFT JOIN FETCH ar.steps LEFT JOIN FETCH ar.requester LEFT JOIN FETCH ar.project WHERE ar.id = :id")
    Optional<ApprovalRequest> findByIdWithDetails(@Param("id") Long id);
}
