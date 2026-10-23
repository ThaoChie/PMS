package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.RecentViewRepository;
import com.pms.backend.model.Issue;
import com.pms.backend.model.RecentView;
import com.pms.backend.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RecentViewServiceImpl implements IRecentViewService {

    private final RecentViewRepository recentViewRepository;

    public RecentViewServiceImpl(RecentViewRepository recentViewRepository) {
        this.recentViewRepository = recentViewRepository;
    }

    @Transactional
    public void recordView(Issue issue, User user) {
        if (issue == null || user == null) return;
        RecentView view = recentViewRepository.findByUserIdAndIssueId(user.getId(), issue.getId())
                .orElse(new RecentView(user, issue));
        view.setViewedAt(LocalDateTime.now());
        recentViewRepository.save(view);
    }

    @Transactional(readOnly = true)
    public List<RecentView> getRecentViews(User user) {
        return recentViewRepository.findTop20ByUserIdOrderByViewedAtDesc(user.getId());
    }
}
