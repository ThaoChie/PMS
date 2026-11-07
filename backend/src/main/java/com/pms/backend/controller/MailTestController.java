package com.pms.backend.controller;

import com.pms.backend.config.AppProperties;
import com.pms.backend.service.impl.MailServiceImpl;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class MailTestController {

    private final MailServiceImpl mailService;
    private final MailProperties mailProperties;
    private final AppProperties appProperties;

    public MailTestController(MailServiceImpl mailService, MailProperties mailProperties, AppProperties appProperties) {
        this.mailService = mailService;
        this.mailProperties = mailProperties;
        this.appProperties = appProperties;
    }

    @GetMapping("/mail")
    public ResponseEntity<Map<String, Object>> testMail(@RequestParam(required = false) String to) {
        String recipient = (to != null && !to.isBlank()) ? to.trim() : mailProperties.getUsername();
        if (recipient == null || recipient.isBlank()) {
            recipient = "phuongthao.me69@gmail.com";
        }

        Map<String, Object> configInfo = new LinkedHashMap<>();
        configInfo.put("host", mailProperties.getHost());
        configInfo.put("port", mailProperties.getPort());
        configInfo.put("username", mailProperties.getUsername());
        configInfo.put("appMailFrom", appProperties.getMail() != null ? appProperties.getMail().getFrom() : null);
        String pw = mailProperties.getPassword();
        configInfo.put("passwordLength", pw != null ? pw.length() : 0);
        configInfo.put("passwordPreview", pw != null && pw.length() >= 4 ? "****" + pw.substring(pw.length() - 4) : "NULL");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("testedRecipient", recipient);
        response.put("config", configInfo);

        try {
            mailService.sendMailSync(
                    recipient,
                    "[EPMS Test] Thử nghiệm gửi email từ hệ thống",
                    "invitation",
                    Map.of(
                            "recipientEmail", recipient,
                            "projectName", "Dự án Thử Nghiệm",
                            "role", "MEMBER",
                            "inviterName", "Hệ thống EPMS",
                            "acceptUrl", "https://pms-chi-self.vercel.app/invitations",
                            "expiryDays", 7
                    )
            );
            response.put("success", true);
            response.put("message", "Email test đã được gửi thành công tới " + recipient + "! Cả 2 cổng 587 và 465 đều sẵn sàng.");
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            response.put("success", false);
            response.put("errorClass", ex.getClass().getName());
            response.put("errorMessage", ex.getMessage());
            response.put("rootCause", ex.getCause() != null ? ex.getCause().getMessage() : null);

            String hint = "Kiểm tra cấu hình SMTP.";
            String msg = (ex.getMessage() + " " + (ex.getCause() != null ? ex.getCause().getMessage() : "")).toLowerCase();
            if (msg.contains("authenticationfailed") || msg.contains("535") || msg.contains("username and password not accepted")) {
                hint = "LỖI XÁC THỰC GMAIL (535): Google từ chối tài khoản hoặc mật khẩu! Vui lòng kiểm tra trên Render: 1) SPRING_MAIL_USERNAME phải là địa chỉ Gmail đầy đủ ('phuongthao.me69@gmail.com') chứ không được là chuỗi khác. 2) SPRING_MAIL_PASSWORD phải là Mật khẩu ứng dụng (App Password 16 chữ cái tạo trong Google Account > Security > 2-Step Verification > App Passwords).";
            } else if (msg.contains("connectexception") || msg.contains("timed out") || msg.contains("timeout") || msg.contains("could not connect")) {
                hint = "LỖI KẾT NỐI TỚI SMTP SERVER: Render có thể đang chặn hoặc timeout kết nối tới Google SMTP. Hệ thống đã thử cả 587 và 465 nhưng đều không phản hồi.";
            }
            response.put("diagnosticHint", hint);
            return ResponseEntity.status(500).body(response);
        }
    }
}
