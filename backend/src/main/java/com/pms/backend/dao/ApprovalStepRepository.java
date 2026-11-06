package com.pms.backend.dao;

import com.pms.backend.enu.ApprovalStepStatus;
import com.pms.backend.model.ApprovalStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalStepRepository extends JpaRepository<ApprovalStep, Long> {

    List<ApprovalStep> findByRequestIdOrderByLevelAsc(Long requestId);

    Optional<ApprovalStep> findByRequestIdAndStatus(Long requestId, ApprovalStepStatus status);
}
