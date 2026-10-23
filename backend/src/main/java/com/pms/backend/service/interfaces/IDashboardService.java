package com.pms.backend.service.interfaces;

import com.pms.backend.dto.DashboardResponse;
import com.pms.backend.model.User;

public interface IDashboardService {
    DashboardResponse getDashboard(User currentUser);
}
