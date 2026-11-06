package com.pms.backend.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pms.backend.dao.AppAdminRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dto.ApprovalRequestResponse;
import com.pms.backend.dto.ApprovalStepResponse;
import com.pms.backend.enu.ApprovalApproverRole;
import com.pms.backend.enu.ApprovalStepStatus;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.model.ApprovalRequest;
import com.pms.backend.model.ApprovalStep;
import com.pms.backend.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ApprovalRequestMapper {

    private static final Logger log = LoggerFactory.getLogger(ApprovalRequestMapper.class);
    private final ObjectMapper objectMapper;
    private final ProjectMemberRepository memberRepository;
    private final AppAdminRepository appAdminRepository;

    @Autowired
    public ApprovalRequestMapper(ObjectMapper objectMapper,
                                 ProjectMemberRepository memberRepository,
                                 AppAdminRepository appAdminRepository) {
        this.objectMapper = objectMapper;
        this.memberRepository = memberRepository;
        this.appAdminRepository = appAdminRepository;
    }

    public ApprovalRequestMapper(ObjectMapper objectMapper) {
        this(objectMapper, null, null);
    }

    public ApprovalRequestResponse toResponse(ApprovalRequest req, Long currentUserId) {
        ApprovalRequestResponse dto = new ApprovalRequestResponse();
        dto.setId(req.getId());
        dto.setType(req.getType().name());
        dto.setStatus(req.getStatus().name());
        dto.setApplyStatus(req.getApplyStatus().name());
        dto.setReason(req.getReason());
        dto.setCreatedAt(req.getCreatedAt());
        dto.setCompletedAt(req.getCompletedAt());

        if (req.getProject() != null) {
            dto.setProject(new ApprovalRequestResponse.ProjectSummary(
                    req.getProject().getId(),
                    req.getProject().getProjectKey(),
                    req.getProject().getName()
            ));
        }

        if (req.getRequester() != null) {
            dto.setRequester(toUserSummary(req.getRequester()));
        }

        if (req.getPayloadJson() != null) {
            dto.setPayload(parseJson(req.getPayloadJson()));
        }

        List<ApprovalStepResponse> steps = req.getSteps().stream()
                .map(this::toStepResponse)
                .collect(Collectors.toList());
        dto.setSteps(steps);

        Integer currentLevel = req.getSteps().stream()
                .filter(s -> s.getStatus() == ApprovalStepStatus.PENDING)
                .map(ApprovalStep::getLevel)
                .findFirst()
                .orElse(null);
        dto.setCurrentLevel(currentLevel);

        Long projectId = req.getProject() != null ? req.getProject().getId() : null;
        boolean canIDecide = currentLevel != null && req.getSteps().stream()
                .filter(s -> s.getStatus() == ApprovalStepStatus.PENDING)
                .anyMatch(s -> isEligibleDecider(s, currentUserId, req.getRequester(), projectId));
        dto.setCanIDecide(canIDecide);

        return dto;
    }

    private ApprovalStepResponse toStepResponse(ApprovalStep step) {
        ApprovalStepResponse dto = new ApprovalStepResponse();
        dto.setLevel(step.getLevel());
        dto.setApproverRole(step.getApproverRole().name());
        dto.setStatus(step.getStatus().name());
        dto.setComment(step.getComment());
        dto.setDecidedAt(step.getDecidedAt());
        if (step.getDecidedBy() != null) {
            dto.setDecidedBy(toUserSummary(step.getDecidedBy()));
        }
        return dto;
    }

    private ApprovalRequestResponse.UserSummary toUserSummary(User user) {
        return new ApprovalRequestResponse.UserSummary(
                user.getId(), user.getFullName(), user.getEmail(), user.getAvatarUrl());
    }

    private boolean isEligibleDecider(ApprovalStep step, Long currentUserId, User requester, Long projectId) {
        if (currentUserId == null) return false;
        if (requester != null && currentUserId.equals(requester.getId())) return false;
        if (step == null || step.getApproverRole() == null) return false;

        if (step.getApproverRole() == ApprovalApproverRole.PM) {
            if (memberRepository == null || projectId == null) return false;
            return memberRepository.findByProjectIdAndUserId(projectId, currentUserId)
                    .map(m -> m.getRole() == ProjectRole.PM)
                    .orElse(false);
        } else if (step.getApproverRole() == ApprovalApproverRole.ADMIN) {
            if (appAdminRepository == null) return false;
            return appAdminRepository.existsByUserId(currentUserId);
        }
        return false;
    }

    private Object parseJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse payload JSON: {}", e.getMessage());
            return json;
        }
    }
}
