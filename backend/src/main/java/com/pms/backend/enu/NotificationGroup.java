package com.pms.backend.enu;

import java.util.Set;

public enum NotificationGroup {
    MENTION,
    ASSIGNMENT,
    WORKFLOW,
    APPROVAL,
    INVITE;

    public boolean matches(NotificationType type) {
        return switch (this) {
            case MENTION -> type == NotificationType.MENTION;
            case ASSIGNMENT -> type == NotificationType.ASSIGNED;
            case WORKFLOW -> type == NotificationType.STATUS_CHANGED;
            case APPROVAL -> type == NotificationType.APPROVAL_REQUESTED || type == NotificationType.APPROVAL_RESULT;
            case INVITE -> type == NotificationType.INVITE_RECEIVED || type == NotificationType.INVITE_RESPONDED;
        };
    }

    public static NotificationGroup fromString(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            return NotificationGroup.valueOf(val.toUpperCase());
        } catch (IllegalArgumentException e) {
            return switch (val.toLowerCase()) {
                case "mention" -> MENTION;
                case "assign", "assignment" -> ASSIGNMENT;
                case "workflow" -> WORKFLOW;
                case "approval" -> APPROVAL;
                case "invite", "invitation" -> INVITE;
                default -> null;
            };
        }
    }

    public Set<NotificationType> getNotificationTypes() {
        return switch (this) {
            case MENTION -> Set.of(NotificationType.MENTION);
            case ASSIGNMENT -> Set.of(NotificationType.ASSIGNED);
            case WORKFLOW -> Set.of(NotificationType.STATUS_CHANGED);
            case APPROVAL -> Set.of(NotificationType.APPROVAL_REQUESTED, NotificationType.APPROVAL_RESULT);
            case INVITE -> Set.of(NotificationType.INVITE_RECEIVED, NotificationType.INVITE_RESPONDED);
        };
    }
}
