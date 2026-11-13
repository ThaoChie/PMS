package com.pms.backend.dao;

import com.pms.backend.model.AttachmentBlob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AttachmentBlobRepository extends JpaRepository<AttachmentBlob, Long> {
    Optional<AttachmentBlob> findByFileName(String fileName);
    void deleteByFileName(String fileName);
}
