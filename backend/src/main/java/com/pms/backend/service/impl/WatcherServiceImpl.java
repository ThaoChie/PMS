package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dao.IssueWatcherRepository;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.model.Issue;
import com.pms.backend.model.IssueWatcher;
import com.pms.backend.model.IssueWatcherId;
import com.pms.backend.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WatcherServiceImpl implements IWatcherService {

    private final IssueWatcherRepository watcherRepository;
    private final IssueRepository issueRepository;

    public WatcherServiceImpl(IssueWatcherRepository watcherRepository, IssueRepository issueRepository) {
        this.watcherRepository = watcherRepository;
        this.issueRepository = issueRepository;
    }

    @Transactional
    public void watchIssue(Issue issue, User user) {
        if (issue == null || user == null) return;
        if (!watcherRepository.existsByIssueIdAndUserId(issue.getId(), user.getId())) {
            IssueWatcher watcher = new IssueWatcher(issue, user);
            watcherRepository.save(watcher);
        }
    }

    @Transactional
    public void watchIssue(String issueKey, User user) {
        Issue issue = issueRepository.findByIssueKeyAndDeletedAtIsNull(issueKey)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found: " + issueKey));
        watchIssue(issue, user);
    }

    @Transactional
    public void unwatchIssue(String issueKey, User user) {
        Issue issue = issueRepository.findByIssueKeyAndDeletedAtIsNull(issueKey)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found: " + issueKey));
        watcherRepository.deleteByIssueIdAndUserId(issue.getId(), user.getId());
    }

    @Transactional(readOnly = true)
    public boolean isWatching(Long issueId, Long userId) {
        return watcherRepository.existsByIssueIdAndUserId(issueId, userId);
    }

    @Transactional(readOnly = true)
    public List<User> getWatchers(Long issueId) {
        return watcherRepository.findByIssueId(issueId).stream()
                .map(IssueWatcher::getUser)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Issue> getWatchedIssues(User user) {
        return watcherRepository.findByUserId(user.getId()).stream()
                .map(IssueWatcher::getIssue)
                .filter(i -> i.getDeletedAt() == null)
                .collect(Collectors.toList());
    }
}
