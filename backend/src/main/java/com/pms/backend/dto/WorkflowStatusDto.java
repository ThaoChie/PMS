package com.pms.backend.dto;

import com.pms.backend.enu.StatusCategory;
import com.pms.backend.model.WorkflowStatus;

public class WorkflowStatusDto {
    private Long id;
    private String name;
    private StatusCategory category;
    private Integer position;
    private Boolean isInitial;

    public static WorkflowStatusDto from(WorkflowStatus s) {
        if (s == null) return null;
        WorkflowStatusDto dto = new WorkflowStatusDto();
        dto.setId(s.getId());
        dto.setName(s.getName());
        dto.setCategory(s.getCategory());
        dto.setPosition(s.getPosition());
        dto.setIsInitial(s.isInitial());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public StatusCategory getCategory() { return category; }
    public void setCategory(StatusCategory category) { this.category = category; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }

    public Boolean getIsInitial() { return isInitial; }
    public void setIsInitial(Boolean isInitial) { this.isInitial = isInitial; }
}
