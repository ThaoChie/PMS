package com.pms.backend.dao;
import com.pms.backend.model.SavedFilter;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface SavedFilterRepository extends JpaRepository<SavedFilter, Long> {
    List<SavedFilter> findByUserId(Long userId);
}
