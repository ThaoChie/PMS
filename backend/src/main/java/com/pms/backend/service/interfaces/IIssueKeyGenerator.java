package com.pms.backend.service.interfaces;

public interface IIssueKeyGenerator {
    String generateNextKey(Long projectId, String projectKey);
}
