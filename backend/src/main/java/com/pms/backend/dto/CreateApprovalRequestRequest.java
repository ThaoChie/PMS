package com.pms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateApprovalRequestRequest {

    @NotNull(message = "Loại yêu cầu không được để trống")
    private String type;

    @NotBlank(message = "Lý do không được để trống")
    @Size(min = 1, max = 1000, message = "Lý do phải từ 1 đến 1000 ký tự")
    private String reason;

    private Object payload;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
}
