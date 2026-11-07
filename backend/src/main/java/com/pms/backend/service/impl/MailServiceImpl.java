package com.pms.backend.service.impl;

import com.pms.backend.config.AppProperties;
import com.pms.backend.config.MailConfig;
import com.pms.backend.service.interfaces.IMailService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
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
    private final MailProperties mailProperties;

    public MailServiceImpl(JavaMailSender mailSender, TemplateEngine templateEngine, AppProperties appProperties, MailProperties mailProperties) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.appProperties = appProperties;
        this.mailProperties = mailProperties;
    }

    @Async
    public void sendMailAsync(String to, String subject, String templateName, Map<String, Object> variables) {
        try {
            sendMailInternal(to, subject, templateName, variables);
        } catch (Exception ex) {
            log.error("Failed completely to send email to {} with subject '{}': {}", to, subject, ex.getMessage(), ex);
            // Intentionally not re-throwing in async context to prevent breaking calling transactions
        }
    }

    public void sendMailSync(String to, String subject, String templateName, Map<String, Object> variables) throws Exception {
        sendMailInternal(to, subject, templateName, variables);
    }

    private void sendMailInternal(String to, String subject, String templateName, Map<String, Object> variables) throws Exception {
        Context context = new Context();
        if (variables != null) {
            context.setVariables(variables);
        }
        String htmlContent = templateEngine.process("mail/" + templateName, context);
        String fromAddress = resolveFromAddress();

        // Attempt 1: Using primary configured mailSender
        try {
            sendWithSender(this.mailSender, fromAddress, to, subject, htmlContent);
            log.info("Email sent successfully to {} with subject '{}'", to, subject);
            return;
        } catch (Exception ex) {
            log.warn("Primary mail sender failed for {}: {}. Attempting fallback...", to, ex.getMessage());

            // Attempt 2: If primary was 587 -> try 465 SSL; if primary was 465 -> try 587 STARTTLS
            int currentPort = mailProperties.getPort() != null ? mailProperties.getPort() : 587;
            int fallbackPort = (currentPort == 465) ? 587 : 465;
            boolean fallbackSsl = (fallbackPort == 465);

            log.info("Attempting mail fallback on port {} (ssl={})", fallbackPort, fallbackSsl);
            JavaMailSenderImpl fallbackSender = MailConfig.buildSender(mailProperties, fallbackPort, fallbackSsl);
            sendWithSender(fallbackSender, fromAddress, to, subject, htmlContent);
            log.info("Fallback email sent successfully to {} on port {}", to, fallbackPort);
        }
    }

    private void sendWithSender(JavaMailSender sender, String fromAddress, String to, String subject, String htmlContent) throws Exception {
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());
        helper.setFrom(fromAddress, "Hệ thống Quản lý Dự án EPMS");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        sender.send(message);
    }

    private String resolveFromAddress() {
        String fromAddress = appProperties.getMail().getFrom();
        if (mailSender instanceof JavaMailSenderImpl impl && impl.getUsername() != null && !impl.getUsername().isBlank()) {
            if (fromAddress == null || fromAddress.isBlank() || fromAddress.contains("no-reply@epms.com")) {
                fromAddress = impl.getUsername();
            }
        }
        return (fromAddress != null && !fromAddress.isBlank()) ? fromAddress : "phuongthao.me69@gmail.com";
    }
}
