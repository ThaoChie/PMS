package com.pms.backend.service.interfaces;

import com.pms.backend.dto.InviteMemberRequest;
import com.pms.backend.model.Invitation;
import com.pms.backend.model.User;

import java.util.List;

/**
 * Dịch vụ quản lý vòng đời lời mời tham gia dự án (tạo mới, tra cứu, chấp nhận, từ chối, thu hồi).
 */
public interface IInvitationService {
    Invitation createInvitation(Long projectId, InviteMemberRequest request, User inviter);
    List<Invitation> getProjectInvitations(Long projectId);
    List<Invitation> getMyInvitations(String userEmail);
    void acceptInvitation(Long invitationId, User user);
    void declineInvitation(Long invitationId, User user);
    /**
     * Thu hồi lời mời đang ở trạng thái chờ phản hồi (PENDING -> CANCELLED).
     */
    void cancelInvitation(Long projectId, Long invitationId, User actor);
}
