package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "issue_custom_field_values", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"issue_id", "field_id"})
})
public class IssueCustomFieldValue extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id", nullable = false)
    private ProjectCustomField field;

    @Column(name = "field_value", columnDefinition = "TEXT")
    private String fieldValue;

    public IssueCustomFieldValue() {}

    public IssueCustomFieldValue(Issue issue, ProjectCustomField field, String fieldValue) {
        this.issue = issue;
        this.field = field;
        this.fieldValue = fieldValue;
    }

    public Issue getIssue() { return issue; }
    public void setIssue(Issue issue) { this.issue = issue; }

    public ProjectCustomField getField() { return field; }
    public void setField(ProjectCustomField field) { this.field = field; }

    public String getFieldValue() { return fieldValue; }
    public void setFieldValue(String fieldValue) { this.fieldValue = fieldValue; }
}
