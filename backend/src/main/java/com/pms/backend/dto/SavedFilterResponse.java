package com.pms.backend.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pms.backend.model.SavedFilter;
import com.pms.backend.model.User;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class SavedFilterResponse {
    private String id;
    private String name;
    private UserResponse owner;
    private List<UserResponse> sharedWith = new ArrayList<>();
    private boolean emailSubscription;
    private String frequency;
    private Object filters;
    private String criteria;
    private boolean isShared;

    public SavedFilterResponse() {}

    public static SavedFilterResponse from(SavedFilter filter, ObjectMapper objectMapper, boolean subscribed, String frequency) {
        if (filter == null) return null;
        SavedFilterResponse res = new SavedFilterResponse();
        res.setId(String.valueOf(filter.getId()));
        res.setName(filter.getName());
        res.setOwner(UserResponse.from(filter.getUser()));
        if (filter.getSharedUsers() != null) {
            res.setSharedWith(filter.getSharedUsers().stream().map(UserResponse::from).collect(Collectors.toList()));
        }
        res.setIsShared(Boolean.TRUE.equals(filter.getIsShared()));
        res.setCriteria(filter.getCriteria());
        res.setEmailSubscription(subscribed);
        res.setFrequency(frequency);

        if (filter.getCriteria() != null && objectMapper != null) {
            try {
                Object parsed = objectMapper.readValue(filter.getCriteria(), Object.class);
                res.setFilters(parsed);
            } catch (Exception e) {
                res.setFilters(Collections.emptyMap());
            }
        }
        return res;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public UserResponse getOwner() { return owner; }
    public void setOwner(UserResponse owner) { this.owner = owner; }

    public List<UserResponse> getSharedWith() { return sharedWith; }
    public void setSharedWith(List<UserResponse> sharedWith) { this.sharedWith = sharedWith; }

    public boolean isEmailSubscription() { return emailSubscription; }
    public void setEmailSubscription(boolean emailSubscription) { this.emailSubscription = emailSubscription; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public Object getFilters() { return filters; }
    public void setFilters(Object filters) { this.filters = filters; }

    public String getCriteria() { return criteria; }
    public void setCriteria(String criteria) { this.criteria = criteria; }

    public boolean isShared() { return isShared; }
    public void setIsShared(boolean shared) { isShared = shared; }
}
