package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.pms.backend.config.AppProperties;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class MailServiceImpl implements IMailService {

    private static final Logger log = LoggerFactory.getLogger(MailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final AppProperties appProperties;

    public MailServiceImpl(JavaMailSender mailSender, TemplateEngine templateEngine, AppProperties appProperties) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.appProperties = appProperties;
    }

    @Async
    public void sendMailAsync(String to, String subject, String templateName, Map<String, Object> variables) {
        try {
            Context context = new Context();
            if (variables != null) {
                context.setVariables(variables);
            }
            String htmlContent = templateEngine.process("mail/" + templateName, context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            String fromAddress = appProperties.getMail().getFrom();
            helper.setFrom(fromAddress, "Hệ thống Quản lý Dự án EPMS");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent successfully to {} with subject '{}'", to, subject);
        } catch (Exception ex) {
            log.error("Failed to send email to {} with subject '{}': {}", to, subject, ex.getMessage());
            // Intentionally not re-throwing to avoid rolling back transaction
        }
    }
}
