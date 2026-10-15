package com.pms.backend.enu;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Validation failed"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Unauthorized access"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Access is denied"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Resource not found"),
    CONFLICT(HttpStatus.CONFLICT, "Resource conflict"),
    PROJECT_KEY_EXISTS(HttpStatus.CONFLICT, "Project key already exists"),
    PROJECT_CLOSED(HttpStatus.CONFLICT, "Project is closed and cannot be modified"),
    MEMBER_ALREADY_EXISTS(HttpStatus.CONFLICT, "User is already a member of this project"),
    LAST_PM_REMOVAL(HttpStatus.CONFLICT, "Cannot remove or demote the last Project Manager"),
    CONCURRENT_MODIFICATION(HttpStatus.CONFLICT, "Resource was modified concurrently"),
    UNPROCESSABLE_ENTITY(HttpStatus.UNPROCESSABLE_ENTITY, "Unprocessable entity"),
    USER_NOT_FOUND(HttpStatus.UNPROCESSABLE_ENTITY, "User not found"),
    ESTIMATE_INVALID(HttpStatus.UNPROCESSABLE_ENTITY, "Remaining estimate cannot exceed original estimate"),
    EPIC_LINK_CYCLE(HttpStatus.UNPROCESSABLE_ENTITY, "Epic link cannot form a cyclic relationship"),
    REQUIRED_FIELD_MISSING(HttpStatus.UNPROCESSABLE_ENTITY, "Required field is missing for this transition"),
    SUBTASK_NESTING_NOT_ALLOWED(HttpStatus.UNPROCESSABLE_ENTITY, "Sub-task cannot have sub-tasks"),
    EXPORT_LIMIT_EXCEEDED(HttpStatus.UNPROCESSABLE_ENTITY, "Export row limit exceeded"),
    FILE_TYPE_NOT_ALLOWED(HttpStatus.UNPROCESSABLE_ENTITY, "File type is not allowed"),
    FILE_TOO_LARGE(HttpStatus.UNPROCESSABLE_ENTITY, "File size exceeds allowed limit"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() { return status; }
    public String getDefaultMessage() { return defaultMessage; }
}
