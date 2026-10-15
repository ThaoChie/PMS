package com.pms.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class SubscriptionRequest {
    @NotBlank(message = "Frequency is required")
    private String frequency;

    public SubscriptionRequest() {}

    public SubscriptionRequest(String frequency) {
        this.frequency = frequency;
    }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
}
