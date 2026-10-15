package com.pms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class CreateFilterRequest {
    @NotBlank(message = "Filter name is required")
    private String name;

    private Object filters;
    private String criteria;
    private List<Long> sharedWithUserIds;
    private Boolean emailSubscription;
    private String frequency;

    public CreateFilterRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Object getFilters() { return filters; }
    public void setFilters(Object filters) { this.filters = filters; }

    public String getCriteria() { return criteria; }
    public void setCriteria(String criteria) { this.criteria = criteria; }

    public List<Long> getSharedWithUserIds() { return sharedWithUserIds; }
    public void setSharedWithUserIds(List<Long> sharedWithUserIds) { this.sharedWithUserIds = sharedWithUserIds; }

    public Boolean getEmailSubscription() { return emailSubscription; }
    public void setEmailSubscription(Boolean emailSubscription) { this.emailSubscription = emailSubscription; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
}
