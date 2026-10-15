package com.pms.backend.dto;

import com.pms.backend.enu.LinkType;
import com.pms.backend.model.Issue;
import com.pms.backend.model.IssueLink;

public class LinkedIssueResponse {
    private Long id;
    private String key;
    private String summary;
    private String relation;
    private String status;

    public static LinkedIssueResponse from(IssueLink link, Long currentIssueId) {
        if (link == null) return null;
        LinkedIssueResponse res = new LinkedIssueResponse();
        res.setId(link.getId());

        boolean isSource = link.getSourceIssue().getId().equals(currentIssueId);
        Issue target = isSource ? link.getTargetIssue() : link.getSourceIssue();
        LinkType type = link.getLinkType();

        res.setKey(target.getIssueKey());
        res.setSummary(target.getSummary());
        res.setStatus(target.getStatus() != null ? target.getStatus().getName() : "");

        if (isSource) {
            res.setRelation(type.getOutwardDescription());
        } else {
            res.setRelation(type.getInwardDescription());
        }

        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getRelation() { return relation; }
    public void setRelation(String relation) { this.relation = relation; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
