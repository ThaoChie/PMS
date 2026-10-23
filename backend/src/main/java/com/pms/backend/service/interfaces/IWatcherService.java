package com.pms.backend.service.interfaces;

import com.pms.backend.model.Issue;
import com.pms.backend.model.User;

import java.util.List;

public interface IWatcherService {
    void watchIssue(Issue issue, User user);
    void watchIssue(String issueKey, User user);
    void unwatchIssue(String issueKey, User user);
    boolean isWatching(Long issueId, Long userId);
    List<User> getWatchers(Long issueId);
    List<Issue> getWatchedIssues(User user);
}
