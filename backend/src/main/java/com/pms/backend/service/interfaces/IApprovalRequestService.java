package com.pms.backend.service.interfaces;

import com.pms.backend.dto.ApprovalDecisionRequest;
import com.pms.backend.dto.ApprovalRequestResponse;
import com.pms.backend.dto.CreateApprovalRequestRequest;
import com.pms.backend.wrapper.PageWrapper;

import java.util.List;

public interface IApprovalRequestService {

    ApprovalRequestResponse create(Long projectId, CreateApprovalRequestRequest request);

    ApprovalRequestResponse approve(Long requestId, ApprovalDecisionRequest decision);

    ApprovalRequestResponse reject(Long requestId, ApprovalDecisionRequest decision);

    ApprovalRequestResponse cancel(Long requestId);

    ApprovalRequestResponse getById(Long requestId);

    PageWrapper<ApprovalRequestResponse> findByProject(Long projectId, String status, String type, int page, int size);

    List<ApprovalRequestResponse> findPendingForMe();
}
