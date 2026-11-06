package com.pms.backend.hibernateDao;

import com.pms.backend.model.ApprovalRequest;
import com.pms.backend.wrapper.PageWrapper;

import java.util.List;

public interface IApprovalRequestHibernateDao {

    PageWrapper<ApprovalRequest> findByProjectId(Long projectId, String status, String type, int page, int size);

    List<ApprovalRequest> findPendingForUser(Long userId, boolean isAdmin, List<Long> memberProjectIds);
}
