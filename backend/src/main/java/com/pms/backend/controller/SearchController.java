package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.IssueSearchRequest;
import com.pms.backend.hibernateDao.IssueSearchDao;
import com.pms.backend.model.Issue;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final IssueSearchDao issueSearchDao;

    public SearchController(IssueSearchDao issueSearchDao) {
        this.issueSearchDao = issueSearchDao;
    }

    @PostMapping("/issues")
    public ApiResponse<List<Issue>> searchIssues(@RequestBody IssueSearchRequest request) {
        return ApiResponse.success(issueSearchDao.searchIssues(request));
    }
}
