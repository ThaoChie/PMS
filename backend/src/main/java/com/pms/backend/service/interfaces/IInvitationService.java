package com.pms.backend.service.interfaces;

import com.pms.backend.dto.InviteMemberRequest;
import com.pms.backend.model.Invitation;
import com.pms.backend.model.User;

import java.util.List;

public interface IInvitationService {
    Invitation createInvitation(Long projectId, InviteMemberRequest request, User inviter);
    List<Invitation> getProjectInvitations(Long projectId);
    List<Invitation> getMyInvitations(String userEmail);
    void acceptInvitation(Long invitationId, User user);
    void declineInvitation(Long invitationId, User user);
}
