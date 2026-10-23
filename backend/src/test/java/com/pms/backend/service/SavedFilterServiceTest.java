package com.pms.backend.service;

import com.pms.backend.service.impl.*;
import com.pms.backend.service.interfaces.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pms.backend.dao.FilterSubscriptionRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.SavedFilterRepository;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.CreateFilterRequest;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.model.SavedFilter;
import com.pms.backend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SavedFilterServiceTest {

    @Mock private SavedFilterRepository filterRepository;
    @Mock private FilterSubscriptionRepository subscriptionRepository;
    @Mock private ProjectMemberRepository projectMemberRepository;
    @Mock private UserRepository userRepository;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SavedFilterServiceImpl savedFilterService;

    private User owner;
    private User authorizedUser;
    private User unauthorizedUser;
    private Project project1;
    private SavedFilter savedFilter;

    @BeforeEach
    void setup() {
        owner = new User();
        owner.setId(1L);
        owner.setFullName("Owner");

        authorizedUser = new User();
        authorizedUser.setId(2L);
        authorizedUser.setFullName("Authorized User");

        unauthorizedUser = new User();
        unauthorizedUser.setId(3L);
        unauthorizedUser.setFullName("Unauthorized User");

        project1 = new Project();
        project1.setId(10L);

        savedFilter = new SavedFilter("Filter 1", "{\"projectIds\":[10]}", owner);
        savedFilter.setId(100L);
    }

    @Test
    void testShareFilter_UserLacksProjectAccess_ThrowsException() {
        when(filterRepository.findById(100L)).thenReturn(Optional.of(savedFilter));
        when(userRepository.findById(3L)).thenReturn(Optional.of(unauthorizedUser));
        // unauthorizedUser is member of project 99, not project 10
        Project otherProject = new Project();
        otherProject.setId(99L);
        when(projectMemberRepository.findByUserId(3L)).thenReturn(List.of(new ProjectMember(otherProject, unauthorizedUser, null)));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                savedFilterService.shareFilter(100L, List.of(3L), owner));

        assertEquals(ErrorCode.FILTER_SHARE_FORBIDDEN, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Unauthorized User"));
    }

    @Test
    void testShareFilter_UserHasProjectAccess_Success() {
        when(filterRepository.findById(100L)).thenReturn(Optional.of(savedFilter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(authorizedUser));
        when(projectMemberRepository.findByUserId(2L)).thenReturn(List.of(new ProjectMember(project1, authorizedUser, null)));
        when(userRepository.findAllById(List.of(2L))).thenReturn(List.of(authorizedUser));

        savedFilterService.shareFilter(100L, List.of(2L), owner);

        assertTrue(savedFilter.getIsShared());
        assertTrue(savedFilter.getSharedUsers().contains(authorizedUser));
        verify(filterRepository, times(1)).save(savedFilter);
    }

    @Test
    void testSubscribeFilter_InvalidFrequency_ThrowsException() {
        when(filterRepository.findById(100L)).thenReturn(Optional.of(savedFilter));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                savedFilterService.updateSubscription(100L, "HOURLY", owner));

        assertEquals(ErrorCode.INVALID_SUBSCRIPTION_FREQUENCY, ex.getErrorCode());
    }

    @Test
    void testSubscribeFilter_ValidFrequency_Success() {
        when(filterRepository.findById(100L)).thenReturn(Optional.of(savedFilter));
        when(subscriptionRepository.findByFilterIdAndUserId(100L, 1L)).thenReturn(Optional.empty());

        savedFilterService.updateSubscription(100L, "WEEKLY", owner);

        verify(subscriptionRepository, times(1)).save(argThat(sub ->
                "WEEKLY".equals(sub.getFrequency()) && sub.getNextRunAt() != null
        ));
    }
}
