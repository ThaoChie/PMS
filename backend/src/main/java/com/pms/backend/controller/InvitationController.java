package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.InviteMemberRequest;
import com.pms.backend.dto.InvitationResponse;
import com.pms.backend.model.Invitation;
import com.pms.backend.model.User;
import com.pms.backend.security.AuthUserPrincipal;
import com.pms.backend.service.InvitationService;
import com.pms.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
public class InvitationController {

    private final InvitationService invitationService;
    private final UserService userService;

    public InvitationController(InvitationService invitationService, UserService userService) {
        this.invitationService = invitationService;
        this.userService = userService;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUserPrincipal principal) {
            return userService.getUserById(principal.getId());
        }
        throw new IllegalStateException("User not authenticated");
    }

    @PostMapping("/api/projects/{projectId}/invitations")
    @PreAuthorize("@projectSecurity.isPmOrAdmin(#projectId)")
    public ApiResponse<InvitationResponse> createInvitation(@PathVariable Long projectId,
                                                           @Valid @RequestBody InviteMemberRequest request) {
        User currentUser = getCurrentUser();
        Invitation invitation = invitationService.createInvitation(projectId, request, currentUser);
        return ApiResponse.success(InvitationResponse.from(invitation));
    }

    @GetMapping("/api/projects/{projectId}/invitations")
    @PreAuthorize("@projectSecurity.isPmOrAdmin(#projectId)")
    public ApiResponse<List<InvitationResponse>> getProjectInvitations(@PathVariable Long projectId) {
        List<Invitation> invitations = invitationService.getProjectInvitations(projectId);
        return ApiResponse.success(invitations.stream().map(InvitationResponse::from).collect(Collectors.toList()));
    }

    @GetMapping("/api/invitations/mine")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<InvitationResponse>> getMyInvitations() {
        User currentUser = getCurrentUser();
        List<Invitation> invitations = invitationService.getMyInvitations(currentUser.getEmail());
        return ApiResponse.success(invitations.stream().map(InvitationResponse::from).collect(Collectors.toList()));
    }

    @PostMapping("/api/invitations/{id}/accept")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<String> acceptInvitation(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        invitationService.acceptInvitation(id, currentUser);
        return ApiResponse.success("Đã chấp nhận lời mời tham gia dự án");
    }

    @PostMapping("/api/invitations/{id}/decline")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<String> declineInvitation(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        invitationService.declineInvitation(id, currentUser);
        return ApiResponse.success("Đã từ chối lời mời tham gia dự án");
    }
}
