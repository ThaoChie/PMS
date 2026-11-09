package com.pms.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class MailServiceImpl implements IMailService {

    private static final Logger log = LoggerFactory.getLogger(MailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final AppProperties appProperties;
    private final MailProperties mailProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

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

        // 1. Priority 1: Check HTTPS Email API (Brevo / Resend) - bypasses Render SMTP port blocks (port 443 is never blocked)
        if (trySendViaHttpApi(fromAddress, to, subject, htmlContent)) {
            return;
        }

        // 2. Priority 2: Traditional SMTP (port 587 STARTTLS or configured port)
        try {
            sendWithSender(this.mailSender, fromAddress, to, subject, htmlContent);
            log.info("Email sent successfully via SMTP to {} with subject '{}'", to, subject);
            return;
        } catch (Exception ex) {
            log.warn("Primary SMTP sender failed for {}: {}. Attempting fallback SMTP...", to, ex.getMessage());

            // 3. Fallback: If primary was 587 -> try 465 SSL; if primary was 465 -> try 587 STARTTLS
            int currentPort = mailProperties.getPort() != null ? mailProperties.getPort() : 587;
            int fallbackPort = (currentPort == 465) ? 587 : 465;
            boolean fallbackSsl = (fallbackPort == 465);

            log.info("Attempting mail fallback on port {} (ssl={})", fallbackPort, fallbackSsl);
            JavaMailSenderImpl fallbackSender = MailConfig.buildSender(mailProperties, fallbackPort, fallbackSsl);
            sendWithSender(fallbackSender, fromAddress, to, subject, htmlContent);
            log.info("Fallback email sent successfully via SMTP to {} on port {}", to, fallbackPort);
        }
    }

    private boolean trySendViaHttpApi(String fromAddress, String to, String subject, String htmlContent) {
        String brevoKey = System.getenv("BREVO_API_KEY");
        if (brevoKey != null && !brevoKey.isBlank()) {
            try {
                sendViaBrevo(brevoKey.trim(), fromAddress, to, subject, htmlContent);
                log.info("Email sent successfully via Brevo HTTPS API to {}", to);
                return true;
            } catch (Exception ex) {
                log.error("Failed to send email via Brevo API: {}", ex.getMessage(), ex);
            }
        }

        String resendKey = System.getenv("RESEND_API_KEY");
        if (resendKey != null && !resendKey.isBlank()) {
            try {
                sendViaResend(resendKey.trim(), fromAddress, to, subject, htmlContent);
                log.info("Email sent successfully via Resend HTTPS API to {}", to);
                return true;
            } catch (Exception ex) {
                log.error("Failed to send email via Resend API: {}", ex.getMessage(), ex);
            }
        }

        return false;
    }

    private void sendViaBrevo(String apiKey, String fromAddress, String to, String subject, String htmlContent) throws Exception {
        URI uri = URI.create("https://api.brevo.com/v3/smtp/email");
        HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("api-key", apiKey);
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setRequestProperty("Accept", "application/json");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);
        conn.setDoOutput(true);

        Map<String, Object> body = Map.of(
                "sender", Map.of("name", "Hệ thống Quản lý Dự án EPMS", "email", fromAddress),
                "to", List.of(Map.of("email", to)),
                "subject", subject,
                "htmlContent", htmlContent
        );

        String json = objectMapper.writeValueAsString(body);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(json.getBytes(StandardCharsets.UTF_8));
        }

        int code = conn.getResponseCode();
        if (code >= 200 && code < 300) {
            return;
        }
        String errorResp = "";
        try (InputStream is = conn.getErrorStream()) {
            if (is != null) {
                errorResp = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        }
        throw new RuntimeException("Brevo API error HTTP " + code + ": " + errorResp);
    }

    private void sendViaResend(String apiKey, String fromAddress, String to, String subject, String htmlContent) throws Exception {
        URI uri = URI.create("https://api.resend.com/emails");
        HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Authorization", "Bearer " + apiKey);
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);
        conn.setDoOutput(true);

        String from = fromAddress.contains("@") && !fromAddress.endsWith("@gmail.com")
                ? "EPMS <" + fromAddress + ">"
                : "EPMS <onboarding@resend.dev>";

        Map<String, Object> body = Map.of(
                "from", from,
                "to", List.of(to),
                "subject", subject,
                "html", htmlContent
        );

        String json = objectMapper.writeValueAsString(body);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(json.getBytes(StandardCharsets.UTF_8));
        }

        int code = conn.getResponseCode();
        if (code >= 200 && code < 300) {
            return;
        }
        String errorResp = "";
        try (InputStream is = conn.getErrorStream()) {
            if (is != null) {
                errorResp = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        }
        throw new RuntimeException("Resend API error HTTP " + code + ": " + errorResp);
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
