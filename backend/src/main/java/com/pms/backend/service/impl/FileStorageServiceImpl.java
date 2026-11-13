package com.pms.backend.service.impl;

import com.pms.backend.dao.AttachmentBlobRepository;
import com.pms.backend.model.AttachmentBlob;
import com.pms.backend.service.interfaces.IFileStorageService;
import io.minio.*;
import io.minio.http.Method;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class FileStorageServiceImpl implements IFileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageServiceImpl.class);

    private final MinioClient minioClient;
    private final AttachmentBlobRepository blobRepository;

    @Value("${minio.bucketName:epms-attachments}")
    private String bucketName;

    @Value("${minio.url:http://localhost:9000}")
    private String minioUrl;

    private final Path localUploadDir = Paths.get("uploads", "attachments").toAbsolutePath().normalize();
    private volatile Boolean minioAvailable = null;

    public FileStorageServiceImpl(MinioClient minioClient, AttachmentBlobRepository blobRepository) {
        this.minioClient = minioClient;
        this.blobRepository = blobRepository;
        initLocalDir();
    }

    private void initLocalDir() {
        try {
            Files.createDirectories(localUploadDir);
        } catch (Exception ex) {
            log.warn("Failed to create local upload directory {}: {}", localUploadDir, ex.getMessage());
        }
    }

    private boolean isMinioConfiguredAndReady() {
        if (minioAvailable != null && !minioAvailable) {
            // Once confirmed unavailable on this instance, skip slow network timeout
            return false;
        }

        if (minioUrl == null || minioUrl.isBlank() || minioUrl.contains("localhost")) {
            // On production/cloud with default localhost, skip MinIO directly to avoid 500 connection refused
            minioAvailable = false;
            return false;
        }

        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }
            minioAvailable = true;
            return true;
        } catch (Exception e) {
            log.warn("MinIO service not reachable at {}. Switching to persistent database/local storage fallback: {}", minioUrl, e.getMessage());
            minioAvailable = false;
            return false;
        }
    }

    @Override
    @Transactional
    public String uploadFile(MultipartFile file) {
        String cleanOriginalName = file.getOriginalFilename() != null ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.\\-_]", "_") : "file";
        String fileName = UUID.randomUUID().toString() + "-" + cleanOriginalName;

        // 1. Try MinIO if available
        if (isMinioConfiguredAndReady()) {
            try {
                InputStream inputStream = file.getInputStream();
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(fileName)
                                .stream(inputStream, file.getSize(), -1)
                                .contentType(file.getContentType())
                                .build()
                );
                log.info("File uploaded to MinIO: {}", fileName);
                return fileName;
            } catch (Exception ex) {
                log.warn("MinIO upload failed for {}. Falling back to database/local storage: {}", fileName, ex.getMessage());
                minioAvailable = false;
            }
        }

        // 2. Hybrid fallback: Save to local disk cache + PostgreSQL database
        try {
            byte[] bytes = file.getBytes();

            // Cache to local disk
            try {
                Path targetPath = localUploadDir.resolve(fileName);
                Files.write(targetPath, bytes);
            } catch (Exception ioEx) {
                log.warn("Could not write to local cache disk {}: {}", fileName, ioEx.getMessage());
            }

            // Persist to PostgreSQL (immune to server redeploys and restarts)
            AttachmentBlob blob = new AttachmentBlob(
                    fileName,
                    file.getContentType(),
                    file.getSize(),
                    bytes
            );
            blobRepository.save(blob);
            log.info("File persisted successfully to database storage: {} ({} bytes)", fileName, bytes.length);

            return fileName;
        } catch (Exception e) {
            log.error("Fatal error storing file {}: {}", fileName, e.getMessage(), e);
            throw new RuntimeException("Không thể lưu trữ tệp đính kèm: " + e.getMessage(), e);
        }
    }

    @Override
    public String getFileUrl(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "";
        }

        // If minio is active, generate presigned url
        if (isMinioConfiguredAndReady()) {
            try {
                return minioClient.getPresignedObjectUrl(
                        GetPresignedObjectUrlArgs.builder()
                                .method(Method.GET)
                                .bucket(bucketName)
                                .object(fileName)
                                .expiry(7, TimeUnit.DAYS)
                                .build()
                );
            } catch (Exception e) {
                log.warn("Failed to generate MinIO presigned URL for {}: {}", fileName, e.getMessage());
            }
        }

        // Standard endpoint accessible by both frontend and API
        return "/api/attachments/files/" + fileName;
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] loadFileData(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return null;
        }

        // 1. Check local cache first
        Path localPath = localUploadDir.resolve(fileName).normalize();
        if (Files.exists(localPath)) {
            try {
                return Files.readAllBytes(localPath);
            } catch (Exception ex) {
                log.warn("Error reading local cached file {}: {}", fileName, ex.getMessage());
            }
        }

        // 2. Check Database BLOB
        Optional<AttachmentBlob> blobOpt = blobRepository.findByFileName(fileName);
        if (blobOpt.isPresent()) {
            byte[] data = blobOpt.get().getData();
            // Re-populate local cache if possible
            try {
                Files.write(localPath, data);
            } catch (Exception ignored) {}
            return data;
        }

        // 3. Fallback: Check MinIO if enabled
        if (isMinioConfiguredAndReady()) {
            try (InputStream stream = minioClient.getObject(
                    GetObjectArgs.builder().bucket(bucketName).object(fileName).build()
            )) {
                return stream.readAllBytes();
            } catch (Exception ex) {
                log.warn("Could not read file from MinIO {}: {}", fileName, ex.getMessage());
            }
        }

        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public String getContentType(String fileName) {
        if (fileName == null) return "application/octet-stream";

        Optional<AttachmentBlob> blobOpt = blobRepository.findByFileName(fileName);
        if (blobOpt.isPresent() && blobOpt.get().getContentType() != null) {
            return blobOpt.get().getContentType();
        }

        String lower = fileName.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".txt") || lower.endsWith(".log")) return "text/plain";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".zip")) return "application/zip";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        return "application/octet-stream";
    }

    @Override
    @Transactional
    public void deleteFile(String fileName) {
        if (fileName == null || fileName.isBlank()) return;

        // Clean file name if it was a URL
        if (fileName.contains("/")) {
            fileName = fileName.substring(fileName.lastIndexOf('/') + 1);
        }

        // 1. Delete from local cache
        try {
            Path path = localUploadDir.resolve(fileName).normalize();
            Files.deleteIfExists(path);
        } catch (Exception ignored) {}

        // 2. Delete from Database
        try {
            blobRepository.deleteByFileName(fileName);
        } catch (Exception ex) {
            log.warn("Failed to delete attachment blob for {}: {}", fileName, ex.getMessage());
        }

        // 3. Delete from MinIO if active
        if (isMinioConfiguredAndReady()) {
            try {
                minioClient.removeObject(
                        RemoveObjectArgs.builder().bucket(bucketName).object(fileName).build()
                );
            } catch (Exception ignored) {}
        }
    }
}
