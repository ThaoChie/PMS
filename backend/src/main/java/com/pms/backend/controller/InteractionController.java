package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dao.AttachmentRepository;
import com.pms.backend.dao.CommentRepository;
import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dao.WorklogRepository;
import com.pms.backend.model.Attachment;
import com.pms.backend.model.Comment;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Worklog;
import com.pms.backend.service.FileStorageService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/issues/{issueId}")
public class InteractionController {

    private final CommentRepository commentRepository;
    private final WorklogRepository worklogRepository;
    private final AttachmentRepository attachmentRepository;
    private final FileStorageService fileStorageService;
    private final IssueRepository issueRepository;

    public InteractionController(CommentRepository commentRepository, WorklogRepository worklogRepository, AttachmentRepository attachmentRepository, FileStorageService fileStorageService, IssueRepository issueRepository) {
        this.commentRepository = commentRepository;
        this.worklogRepository = worklogRepository;
        this.attachmentRepository = attachmentRepository;
        this.fileStorageService = fileStorageService;
        this.issueRepository = issueRepository;
    }

    @PostMapping("/comments")
    public ApiResponse<Comment> addComment(@PathVariable Long issueId, @RequestBody Comment comment) {
        Issue issue = issueRepository.findById(issueId).orElseThrow();
        comment.setIssue(issue);
        // Note: In real app, get user from SecurityContext
        return ApiResponse.success(commentRepository.save(comment));
    }

    @GetMapping("/comments")
    public ApiResponse<List<Comment>> getComments(@PathVariable Long issueId) {
        return ApiResponse.success(commentRepository.findByIssueId(issueId));
    }

    @PostMapping("/worklogs")
    public ApiResponse<Worklog> addWorklog(@PathVariable Long issueId, @RequestBody Worklog worklog) {
        Issue issue = issueRepository.findById(issueId).orElseThrow();
        worklog.setIssue(issue);
        // Note: Update remaining estimate on Issue here
        return ApiResponse.success(worklogRepository.save(worklog));
    }

    @PostMapping("/attachments")
    public ApiResponse<Attachment> uploadAttachment(@PathVariable Long issueId, @RequestParam("file") MultipartFile file) {
        Issue issue = issueRepository.findById(issueId).orElseThrow();
        String fileName = fileStorageService.uploadFile(file);
        String fileUrl = fileStorageService.getFileUrl(fileName);
        
        Attachment attachment = new Attachment();
        attachment.setIssue(issue);
        attachment.setFileUrl(fileUrl);
        return ApiResponse.success(attachmentRepository.save(attachment));
    }
}
