package com.pms.backend.service.interfaces;

import com.pms.backend.dto.MemberResponse;
import com.pms.backend.enu.ProjectRole;

import java.util.List;

public interface IMembershipService {
    List<MemberResponse> getMembers(Long projectId);
    void changeMemberRole(Long projectId, Long userId, ProjectRole newRole);
    void removeMember(Long projectId, Long userId);
}
