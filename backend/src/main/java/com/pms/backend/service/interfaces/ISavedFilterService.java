package com.pms.backend.service.interfaces;

import com.pms.backend.dto.CreateFilterRequest;
import com.pms.backend.dto.SavedFilterResponse;
import com.pms.backend.model.User;

import java.util.List;

public interface ISavedFilterService {
    List<SavedFilterResponse> getAccessibleFilters(User currentUser);
    SavedFilterResponse getFilterById(Long filterId, User currentUser);
    SavedFilterResponse createFilter(CreateFilterRequest request, User currentUser);
    SavedFilterResponse updateFilter(Long filterId, CreateFilterRequest request, User currentUser);
    void deleteFilter(Long filterId, User currentUser);
    void shareFilter(Long filterId, List<Long> userIds, User currentUser);
    void updateSubscription(Long filterId, String frequency, User currentUser);
    void cancelSubscription(Long filterId, User currentUser);
    void validateSharePermissions(String criteriaJson, List<Long> targetUserIds);
    List<Long> extractProjectIdsFromCriteria(String criteriaJson);
}
