package com.pms.backend.service.interfaces;

import com.pms.backend.dto.CreateWorklogRequest;
import com.pms.backend.dto.WorklogResponse;
import com.pms.backend.model.User;
import com.pms.backend.model.Worklog;

import java.util.List;

public interface IWorklogService {
    List<WorklogResponse> getWorklogs(String issueKey);
    WorklogResponse logWork(String issueKey, CreateWorklogRequest request, User currentUser);
    Worklog logWork(Worklog worklog);
}
