package com.pms.backend.job;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pms.backend.dao.FilterSubscriptionRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.hibernateDao.IssueSearchDao;
import com.pms.backend.model.*;
import com.pms.backend.service.MailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FilterDigestJobTest {

    @Mock private FilterSubscriptionRepository subscriptionRepository;
    @Mock private IssueSearchDao issueSearchDao;
    @Mock private ProjectMemberRepository projectMemberRepository;
    @Mock private MailService mailService;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private FilterDigestJob filterDigestJob;

    private User subscriber;
    private SavedFilter filter;
    private FilterSubscription subscription;

    @BeforeEach
    void setup() {
        subscriber = new User();
        subscriber.setId(1L);
        subscriber.setEmail("sub@example.com");
        subscriber.setFullName("Subscriber");

        filter = new SavedFilter("My Open Bugs", "{\"keyword\":\"Bug\"}", subscriber);
        filter.setId(10L);

        subscription = new FilterSubscription(filter, subscriber, "DAILY", LocalDateTime.now().minusHours(1));
        subscription.setId(100L);
    }

    @Test
    void testProcessSubscription_SendsEmailAndUpdatesNextRunAt() {
        LocalDateTime now = LocalDateTime.now();

        Project project = new Project();
        project.setId(5L);
        when(projectMemberRepository.findByUserId(1L)).thenReturn(List.of(new ProjectMember(project, subscriber, null)));

        Issue matchedIssue = new Issue();
        matchedIssue.setIssueKey("PRJ-1");
        matchedIssue.setSummary("Bug in login");

        when(issueSearchDao.searchIssues(any(), eq(List.of(5L)), eq(1L), any())).thenReturn(List.of(matchedIssue));

        filterDigestJob.processSubscription(subscription, now);

        // Verify digest email is sent
        verify(mailService, times(1)).sendMailAsync(
                eq("sub@example.com"),
                contains("My Open Bugs"),
                eq("notification"),
                anyMap()
        );

        // Verify nextRunAt advanced by 1 day
        assertTrue(subscription.getNextRunAt().isAfter(now));
        verify(subscriptionRepository, times(1)).save(subscription);
    }
}
