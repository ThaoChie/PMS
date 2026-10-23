package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.ChangeMemberRoleRequest;
import com.pms.backend.dto.MemberResponse;
import com.pms.backend.service.interfaces.IMembershipService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/projects/{projectId}/members", "/projects/{projectId}/members"})
public class ProjectMemberController {

    private final IMembershipService membershipService;

    public ProjectMemberController(IMembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @GetMapping
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public ApiResponse<List<MemberResponse>> getMembers(@PathVariable Long projectId) {
        return ApiResponse.success(membershipService.getMembers(projectId));
    }

    @PutMapping("/{userId}/role")
    @PreAuthorize("@projectSecurity.isPmOrAdmin(#projectId)")
    public ApiResponse<String> changeMemberRole(@PathVariable Long projectId,
                                                @PathVariable Long userId,
                                                @Valid @RequestBody ChangeMemberRoleRequest request) {
        membershipService.changeMemberRole(projectId, userId, request.getRole());
        return ApiResponse.success("Cập nhật vai trò thành công");
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("@projectSecurity.isPmOrAdmin(#projectId)")
    public ApiResponse<String> removeMember(@PathVariable Long projectId,
                                            @PathVariable Long userId) {
        membershipService.removeMember(projectId, userId);
        return ApiResponse.success("Đã xóa thành viên khỏi dự án");
    }
}
