package com.pms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateApprovalRequestRequest {

    private Long projectId;

    @NotNull(message = "Loại yêu cầu không được để trống")
    private String type;

    @NotBlank(message = "Lý do không được để trống")
    @Size(min = 1, max = 1000, message = "Lý do phải từ 1 đến 1000 ký tự")
    private String reason;

    private Object payload;

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
}
