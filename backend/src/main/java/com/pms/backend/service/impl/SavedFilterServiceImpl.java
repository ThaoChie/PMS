package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pms.backend.dao.FilterSubscriptionRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.SavedFilterRepository;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.CreateFilterRequest;
import com.pms.backend.dto.SavedFilterResponse;
import com.pms.backend.dto.UserResponse;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ForbiddenException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.model.FilterSubscription;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.model.SavedFilter;
import com.pms.backend.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SavedFilterServiceImpl implements ISavedFilterService {

    private final SavedFilterRepository filterRepository;
    private final FilterSubscriptionRepository subscriptionRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public SavedFilterServiceImpl(SavedFilterRepository filterRepository,
                              FilterSubscriptionRepository subscriptionRepository,
                              ProjectMemberRepository projectMemberRepository,
                              UserRepository userRepository,
                              ObjectMapper objectMapper) {
        this.filterRepository = filterRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<SavedFilterResponse> getAccessibleFilters(User currentUser) {
        List<SavedFilter> filters = filterRepository.findAccessibleFilters(currentUser.getId());
        List<SavedFilterResponse> responses = new ArrayList<>();

        for (SavedFilter filter : filters) {
            Optional<FilterSubscription> sub = subscriptionRepository.findByFilterIdAndUserId(filter.getId(), currentUser.getId());
            boolean subscribed = sub.isPresent();
            String freq = sub.map(FilterSubscription::getFrequency).orElse(null);
            responses.add(SavedFilterResponse.from(filter, objectMapper, subscribed, freq));
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public SavedFilterResponse getFilterById(Long filterId, User currentUser) {
        SavedFilter filter = filterRepository.findById(filterId)
                .orElseThrow(() -> new ResourceNotFoundException("Saved filter not found: " + filterId));

        boolean hasAccess = filter.getUser().getId().equals(currentUser.getId()) ||
                filter.getSharedUsers().stream().anyMatch(u -> u.getId().equals(currentUser.getId()));
        if (!hasAccess) {
            throw new ForbiddenException("You do not have access to this filter");
        }

        Optional<FilterSubscription> sub = subscriptionRepository.findByFilterIdAndUserId(filter.getId(), currentUser.getId());
        return SavedFilterResponse.from(filter, objectMapper, sub.isPresent(), sub.map(FilterSubscription::getFrequency).orElse(null));
    }

    @Transactional
    public SavedFilterResponse createFilter(CreateFilterRequest request, User currentUser) {
        String criteriaStr = request.getCriteria();
        if ((criteriaStr == null || criteriaStr.isBlank()) && request.getFilters() != null) {
            try {
                criteriaStr = objectMapper.writeValueAsString(request.getFilters());
            } catch (Exception e) {
                criteriaStr = "{}";
            }
        }
        if (criteriaStr == null || criteriaStr.isBlank()) {
            criteriaStr = "{}";
        }

        SavedFilter filter = new SavedFilter(request.getName(), criteriaStr, currentUser);

        if (request.getSharedWithUserIds() != null && !request.getSharedWithUserIds().isEmpty()) {
            validateSharePermissions(criteriaStr, request.getSharedWithUserIds());
            Set<User> sharedUsers = new HashSet<>(userRepository.findAllById(request.getSharedWithUserIds()));
            filter.setSharedUsers(sharedUsers);
            filter.setIsShared(true);
        }

        SavedFilter saved = filterRepository.save(filter);

        boolean subscribed = false;
        String frequency = null;
        if (Boolean.TRUE.equals(request.getEmailSubscription())) {
            frequency = (request.getFrequency() != null && !request.getFrequency().isBlank()) ?
                    request.getFrequency().toUpperCase() : "DAILY";
            validateFrequency(frequency);
            FilterSubscription sub = new FilterSubscription(
                    saved,
                    currentUser,
                    frequency,
                    calculateNextRun(frequency)
            );
            subscriptionRepository.save(sub);
            subscribed = true;
        }

        return SavedFilterResponse.from(saved, objectMapper, subscribed, frequency);
    }

    @Transactional
    public SavedFilterResponse updateFilter(Long filterId, CreateFilterRequest request, User currentUser) {
        SavedFilter filter = filterRepository.findById(filterId)
                .orElseThrow(() -> new ResourceNotFoundException("Saved filter not found: " + filterId));

        if (!filter.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ chủ sở hữu bộ lọc mới có quyền chỉnh sửa");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            filter.setName(request.getName());
        }

        String criteriaStr = request.getCriteria();
        if ((criteriaStr == null || criteriaStr.isBlank()) && request.getFilters() != null) {
            try {
                criteriaStr = objectMapper.writeValueAsString(request.getFilters());
            } catch (Exception e) {
                // Keep existing
            }
        }
        if (criteriaStr != null && !criteriaStr.isBlank()) {
            filter.setCriteria(criteriaStr);
        }

        if (request.getSharedWithUserIds() != null) {
            validateSharePermissions(filter.getCriteria(), request.getSharedWithUserIds());
            Set<User> sharedUsers = new HashSet<>(userRepository.findAllById(request.getSharedWithUserIds()));
            filter.setSharedUsers(sharedUsers);
            filter.setIsShared(!sharedUsers.isEmpty());
        }

        filter.setUpdatedAt(LocalDateTime.now());
        SavedFilter saved = filterRepository.save(filter);

        Optional<FilterSubscription> sub = subscriptionRepository.findByFilterIdAndUserId(saved.getId(), currentUser.getId());
        return SavedFilterResponse.from(saved, objectMapper, sub.isPresent(), sub.map(FilterSubscription::getFrequency).orElse(null));
    }

    @Transactional
    public void deleteFilter(Long filterId, User currentUser) {
        SavedFilter filter = filterRepository.findById(filterId)
                .orElseThrow(() -> new ResourceNotFoundException("Saved filter not found: " + filterId));

        if (!filter.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ chủ sở hữu bộ lọc mới có quyền xoá");
        }

        filterRepository.delete(filter);
    }

    @Transactional
    public void shareFilter(Long filterId, List<Long> userIds, User currentUser) {
        SavedFilter filter = filterRepository.findById(filterId)
                .orElseThrow(() -> new ResourceNotFoundException("Saved filter not found: " + filterId));

        if (!filter.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ chủ sở hữu bộ lọc mới có quyền chia sẻ");
        }

        if (userIds == null || userIds.isEmpty()) {
            filter.getSharedUsers().clear();
            filter.setIsShared(false);
            filterRepository.save(filter);
            return;
        }

        validateSharePermissions(filter.getCriteria(), userIds);

        List<User> targetUsers = userRepository.findAllById(userIds);
        filter.getSharedUsers().clear();
        filter.getSharedUsers().addAll(targetUsers);
        filter.setIsShared(true);
        filterRepository.save(filter);
    }

    @Transactional
    public void updateSubscription(Long filterId, String frequency, User currentUser) {
        SavedFilter filter = filterRepository.findById(filterId)
                .orElseThrow(() -> new ResourceNotFoundException("Saved filter not found: " + filterId));

        boolean hasAccess = filter.getUser().getId().equals(currentUser.getId()) ||
                filter.getSharedUsers().stream().anyMatch(u -> u.getId().equals(currentUser.getId()));
        if (!hasAccess) {
            throw new ForbiddenException("You do not have access to subscribe to this filter");
        }

        String normFreq = frequency != null ? frequency.trim().toUpperCase() : "DAILY";
        validateFrequency(normFreq);

        FilterSubscription subscription = subscriptionRepository.findByFilterIdAndUserId(filterId, currentUser.getId())
                .orElse(new FilterSubscription(filter, currentUser, normFreq, calculateNextRun(normFreq)));

        subscription.setFrequency(normFreq);
        subscription.setNextRunAt(calculateNextRun(normFreq));
        subscription.setUpdatedAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);
    }

    @Transactional
    public void cancelSubscription(Long filterId, User currentUser) {
        subscriptionRepository.deleteByFilterIdAndUserId(filterId, currentUser.getId());
    }

    /**
     * Verifies that each user in targetUserIds is a member in ALL projects specified in criteria (BR-SRCH-02)
     */
    public void validateSharePermissions(String criteriaJson, List<Long> targetUserIds) {
        if (targetUserIds == null || targetUserIds.isEmpty()) return;

        List<Long> criteriaProjectIds = extractProjectIdsFromCriteria(criteriaJson);
        if (criteriaProjectIds.isEmpty()) {
            return; // No specific project restriction
        }

        for (Long userId : targetUserIds) {
            User targetUser = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

            List<ProjectMember> memberships = projectMemberRepository.findByUserId(userId);
            Set<Long> userProjectIds = memberships.stream()
                    .map(pm -> pm.getProject().getId())
                    .collect(Collectors.toSet());

            for (Long reqProjectId : criteriaProjectIds) {
                if (!userProjectIds.contains(reqProjectId)) {
                    throw new BusinessException(
                            ErrorCode.FILTER_SHARE_FORBIDDEN,
                            "Không thể chia sẻ bộ lọc cho người dùng " + targetUser.getFullName() +
                                    " do không có quyền truy cập vào dự án trong bộ lọc."
                    );
                }
            }
        }
    }

    public List<Long> extractProjectIdsFromCriteria(String criteriaJson) {
        if (criteriaJson == null || criteriaJson.isBlank()) return Collections.emptyList();
        List<Long> result = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(criteriaJson);
            if (root.has("projectIds") && root.get("projectIds").isArray()) {
                for (JsonNode n : root.get("projectIds")) {
                    if (n.isNumber()) result.add(n.asLong());
                    else if (n.isTextual()) {
                        try { result.add(Long.parseLong(n.asText())); } catch (NumberFormatException ignored) {}
                    }
                }
            }
            if (root.has("projectId") && !root.get("projectId").isNull()) {
                long pid = root.get("projectId").asLong();
                if (!result.contains(pid)) result.add(pid);
            }
        } catch (Exception ignored) {}
        return result;
    }

    private void validateFrequency(String frequency) {
        if (!"DAILY".equalsIgnoreCase(frequency) && !"WEEKLY".equalsIgnoreCase(frequency)) {
            throw new BusinessException(ErrorCode.INVALID_SUBSCRIPTION_FREQUENCY, "Tần suất đăng ký phải là DAILY hoặc WEEKLY.");
        }
    }

    private LocalDateTime calculateNextRun(String frequency) {
        if ("WEEKLY".equalsIgnoreCase(frequency)) {
            return LocalDateTime.now().plusDays(7);
        }
        return LocalDateTime.now().plusDays(1);
    }
}
