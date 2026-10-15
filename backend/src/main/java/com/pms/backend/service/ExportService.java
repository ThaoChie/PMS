package com.pms.backend.service;

import com.pms.backend.exception.BusinessException;
import com.pms.backend.model.Issue;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExportService {

    @Value("${app.export.max-rows:10000}")
    private int maxExportRows;

    public byte[] exportToCsv(List<Issue> issues) {
        if (issues.size() > maxExportRows) {
            throw new BusinessException("Result set too large. Max allowed rows for export is " + maxExportRows + ". Please narrow down your filters.");
        }
        
        // CSV Generation logic mock
        StringBuilder sb = new StringBuilder("Key,Summary,Status\n");
        for (Issue i : issues) {
            sb.append(i.getIssueKey()).append(",").append(i.getSummary()).append(",").append(i.getStatus() != null ? i.getStatus().getName() : "").append("\n");
        }
        return sb.toString().getBytes();
    }
}
