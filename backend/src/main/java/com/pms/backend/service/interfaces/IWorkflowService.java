package com.pms.backend.service.interfaces;

import com.pms.backend.dto.SaveWorkflowRequest;
import com.pms.backend.dto.TransitionOptionResponse;
import com.pms.backend.dto.WorkflowResponse;
import com.pms.backend.model.Issue;
import com.pms.backend.model.User;

import java.util.List;
import java.util.Map;

public interface IWorkflowService {
    WorkflowResponse getWorkflow(Long projectId);
    WorkflowResponse updateWorkflow(Long projectId, SaveWorkflowRequest request);
    List<TransitionOptionResponse> getTransitionsForIssue(String issueKey, User currentUser);
    Issue executeTransition(String issueKey, Long transitionId, Map<String, Object> fields, String comment, User currentUser);
    Issue approveIssue(String issueKey, String comment, User currentUser);
    Issue rejectIssue(String issueKey, String reason, User currentUser);
}
