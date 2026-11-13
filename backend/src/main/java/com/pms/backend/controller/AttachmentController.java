package com.pms.backend.controller;

import com.pms.backend.dao.IssueAttachmentRepository;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.model.IssueAttachment;
import com.pms.backend.service.interfaces.IFileStorageService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
public class AttachmentController {

    private final IFileStorageService fileStorageService;
    private final IssueAttachmentRepository attachmentRepository;

    public AttachmentController(IFileStorageService fileStorageService, IssueAttachmentRepository attachmentRepository) {
        this.fileStorageService = fileStorageService;
        this.attachmentRepository = attachmentRepository;
    }

    @GetMapping({"/api/attachments/files/{fileName:.+}", "/attachments/files/{fileName:.+}"})
    public ResponseEntity<Resource> serveFile(@PathVariable String fileName) {
        // Sanitize path traversal attempts
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }

        byte[] data = fileStorageService.loadFileData(fileName);
        if (data == null) {
            return ResponseEntity.notFound().build();
        }

        String contentType = fileStorageService.getContentType(fileName);
        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(contentType);
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        boolean isInline = contentType.startsWith("image/") || contentType.equals("application/pdf") || contentType.startsWith("text/");
        String dispositionType = isInline ? "inline" : "attachment";

        // Clean user-friendly display name (strip UUID prefix)
        String displayName = fileName;
        if (fileName.contains("-") && fileName.indexOf('-') < fileName.length() - 1) {
            displayName = fileName.substring(fileName.indexOf('-') + 1);
        }

        String encodedName = URLEncoder.encode(displayName, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, dispositionType + "; filename=\"" + displayName + "\"; filename*=UTF-8''" + encodedName)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(new ByteArrayResource(data));
    }

    @GetMapping({"/api/attachments/{id}/download", "/attachments/{id}/download"})
    public ResponseEntity<Resource> downloadAttachmentById(@PathVariable Long id) {
        IssueAttachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tệp đính kèm không tồn tại"));

        String rawUrl = attachment.getFileUrl();
        String fileName = rawUrl != null && rawUrl.contains("/")
                ? rawUrl.substring(rawUrl.lastIndexOf('/') + 1)
                : rawUrl;

        byte[] data = fileStorageService.loadFileData(fileName);
        if (data == null) {
            return ResponseEntity.notFound().build();
        }

        String originalName = attachment.getFileName() != null ? attachment.getFileName() : fileName;
        String encodedName = URLEncoder.encode(originalName, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalName + "\"; filename*=UTF-8''" + encodedName)
                .body(new ByteArrayResource(data));
    }
}
