package com.pms.backend.service.interfaces;

public interface IAuditService {
    void log(String action, String entityType, Long entityId, Long projectId, String beforeState, String afterState);
}
