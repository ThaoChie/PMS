package com.pms.backend.dao;

import com.pms.backend.model.AppAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppAdminRepository extends JpaRepository<AppAdmin, Long> {

    boolean existsByUserId(Long userId);

    @Query("SELECT a.userId FROM AppAdmin a")
    List<Long> findAllAdminUserIds();
}
