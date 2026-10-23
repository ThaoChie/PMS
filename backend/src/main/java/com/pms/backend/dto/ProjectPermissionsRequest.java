package com.pms.backend.dto;

public class ProjectPermissionsRequest {

    private Boolean allowMemberDeleteIssue;
    private Boolean allowMemberDeleteSubtask;
    private Boolean allowMemberConvertSubtask;
    private Boolean allowMemberManageCustomFields;

    public ProjectPermissionsRequest() {}

    public Boolean getAllowMemberDeleteIssue() { return allowMemberDeleteIssue; }
    public void setAllowMemberDeleteIssue(Boolean allowMemberDeleteIssue) { this.allowMemberDeleteIssue = allowMemberDeleteIssue; }

    public Boolean getAllowMemberDeleteSubtask() { return allowMemberDeleteSubtask; }
    public void setAllowMemberDeleteSubtask(Boolean allowMemberDeleteSubtask) { this.allowMemberDeleteSubtask = allowMemberDeleteSubtask; }

    public Boolean getAllowMemberConvertSubtask() { return allowMemberConvertSubtask; }
    public void setAllowMemberConvertSubtask(Boolean allowMemberConvertSubtask) { this.allowMemberConvertSubtask = allowMemberConvertSubtask; }

    public Boolean getAllowMemberManageCustomFields() { return allowMemberManageCustomFields; }
    public void setAllowMemberManageCustomFields(Boolean allowMemberManageCustomFields) { this.allowMemberManageCustomFields = allowMemberManageCustomFields; }
}
