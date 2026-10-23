package com.pms.backend.service.interfaces;

import org.springframework.web.multipart.MultipartFile;

public interface IFileStorageService {
    String uploadFile(MultipartFile file);
    String getFileUrl(String fileName);
}
