package com.pms.backend.service.interfaces;

import com.pms.backend.model.Issue;
import com.pms.backend.model.RecentView;
import com.pms.backend.model.User;

import java.util.List;

public interface IRecentViewService {
    void recordView(Issue issue, User user);
    List<RecentView> getRecentViews(User user);
}
