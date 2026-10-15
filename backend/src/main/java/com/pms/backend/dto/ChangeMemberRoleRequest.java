package com.pms.backend.dto;

import com.pms.backend.enu.ProjectRole;
import jakarta.validation.constraints.NotNull;

public class ChangeMemberRoleRequest {

    @NotNull(message = "Vai trò không được để trống")
    private ProjectRole role;

    public ProjectRole getRole() { return role; }
    public void setRole(ProjectRole role) { this.role = role; }
}
