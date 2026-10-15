package com.pms.backend.dao;

import com.pms.backend.model.SavedFilter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SavedFilterRepository extends JpaRepository<SavedFilter, Long> {
    List<SavedFilter> findByUserId(Long userId);

    @Query("SELECT DISTINCT f FROM SavedFilter f LEFT JOIN FETCH f.user LEFT JOIN FETCH f.sharedUsers WHERE f.user.id = :userId OR :userId IN (SELECT u.id FROM f.sharedUsers u)")
    List<SavedFilter> findAccessibleFilters(@Param("userId") Long userId);
}
