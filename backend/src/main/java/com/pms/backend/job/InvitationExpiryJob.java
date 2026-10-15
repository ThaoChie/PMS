package com.pms.backend.job;

import com.pms.backend.dao.InvitationRepository;
import com.pms.backend.enu.InvitationStatus;
import com.pms.backend.model.Invitation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class InvitationExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(InvitationExpiryJob.class);

    private final InvitationRepository invitationRepository;

    public InvitationExpiryJob(InvitationRepository invitationRepository) {
        this.invitationRepository = invitationRepository;
    }

    @Scheduled(cron = "${app.job.invitation-expiry-cron:0 0 2 * * ?}")
    @Transactional
    public void cleanupExpiredInvitations() {
        log.info("Running InvitationExpiryJob to check expired invitations...");
        List<Invitation> expired = invitationRepository.findByStatusAndExpiresAtBefore(
                InvitationStatus.PENDING, LocalDateTime.now()
        );

        if (!expired.isEmpty()) {
            for (Invitation inv : expired) {
                inv.setStatus(InvitationStatus.EXPIRED);
            }
            invitationRepository.saveAll(expired);
            log.info("Marked {} invitations as EXPIRED.", expired.size());
        } else {
            log.info("No expired invitations found.");
        }
    }
}
