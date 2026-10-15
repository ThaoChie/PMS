package com.pms.backend.dao;

import com.pms.backend.model.FilterSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FilterSubscriptionRepository extends JpaRepository<FilterSubscription, Long> {
    Optional<FilterSubscription> findByFilterIdAndUserId(Long filterId, Long userId);

    List<FilterSubscription> findByFilterId(Long filterId);

    void deleteByFilterIdAndUserId(Long filterId, Long userId);

    @Query("SELECT s FROM FilterSubscription s JOIN FETCH s.filter f JOIN FETCH s.user u WHERE s.nextRunAt <= :cutoff")
    List<FilterSubscription> findDueSubscriptions(@Param("cutoff") LocalDateTime cutoff);
}
