package com.pms.backend.dto;

import java.util.List;

public class ShareFilterRequest {
    private List<Long> userIds;

    public ShareFilterRequest() {}

    public List<Long> getUserIds() { return userIds; }
    public void setUserIds(List<Long> userIds) { this.userIds = userIds; }
}
