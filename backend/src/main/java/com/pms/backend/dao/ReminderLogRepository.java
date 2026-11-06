package com.pms.backend.dao;

import com.pms.backend.model.ReminderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface ReminderLogRepository extends JpaRepository<ReminderLog, Long> {

    boolean existsByTypeAndRefIdAndSentOn(String type, Long refId, LocalDate sentOn);

    Optional<ReminderLog> findByTypeAndRefIdAndSentOn(String type, Long refId, LocalDate sentOn);
}
