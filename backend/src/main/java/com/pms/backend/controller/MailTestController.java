package com.pms.backend.controller;

import com.pms.backend.config.AppProperties;
import com.pms.backend.service.interfaces.IMailService;
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

    private final IMailService mailService;
    private final MailProperties mailProperties;
    private final AppProperties appProperties;

    public MailTestController(IMailService mailService, MailProperties mailProperties, AppProperties appProperties) {
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

        String brevoKey = System.getenv("BREVO_API_KEY");
        String resendKey = System.getenv("RESEND_API_KEY");

        Map<String, Object> configInfo = new LinkedHashMap<>();
        configInfo.put("host", mailProperties.getHost());
        configInfo.put("port", mailProperties.getPort());
        configInfo.put("username", mailProperties.getUsername());
        configInfo.put("appMailFrom", appProperties.getMail() != null ? appProperties.getMail().getFrom() : null);
        String pw = mailProperties.getPassword();
        configInfo.put("passwordLength", pw != null ? pw.length() : 0);
        configInfo.put("passwordPreview", pw != null && pw.length() >= 4 ? "****" + pw.substring(pw.length() - 4) : "NULL");
        configInfo.put("hasBrevoApiKey", brevoKey != null && !brevoKey.isBlank());
        configInfo.put("hasResendApiKey", resendKey != null && !resendKey.isBlank());

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
                            "projectName", "Dự án Thử Nghiệm EPMS",
                            "role", "MEMBER",
                            "inviterName", "Hệ thống EPMS",
                            "acceptUrl", "https://pms-chi-self.vercel.app/invitations",
                            "expiryDays", 7
                    )
            );
            response.put("success", true);
            String channel = (brevoKey != null && !brevoKey.isBlank())
                    ? "Brevo HTTPS API (Cổng 443 - không bị chặn bởi Render)"
                    : ((resendKey != null && !resendKey.isBlank())
                    ? "Resend HTTPS API (Cổng 443 - không bị chặn bởi Render)"
                    : "SMTP thông thường (Cổng " + mailProperties.getPort() + ")");
            response.put("message", "Email test đã được gửi thành công tới " + recipient + " qua kênh: " + channel);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            response.put("success", false);
            response.put("errorClass", ex.getClass().getName());
            response.put("errorMessage", ex.getMessage());
            response.put("rootCause", ex.getCause() != null ? ex.getCause().getMessage() : null);

            String hint;
            String msg = (ex.getMessage() + " " + (ex.getCause() != null ? ex.getCause().getMessage() : "")).toLowerCase();
            if (msg.contains("authenticationfailed") || msg.contains("535") || msg.contains("username and password not accepted")) {
                hint = "LỖI XÁC THỰC GMAIL (535): Google từ chối tài khoản hoặc mật khẩu! Vui lòng kiểm tra trên Render: 1) SPRING_MAIL_USERNAME phải là địa chỉ Gmail đầy đủ ('phuongthao.me69@gmail.com'). 2) SPRING_MAIL_PASSWORD phải là Mật khẩu ứng dụng (App Password 16 chữ cái).";
            } else if (msg.contains("connectexception") || msg.contains("timed out") || msg.contains("timeout") || msg.contains("could not connect")) {
                hint = "LỖI CHẶN CỔNG SMTP TRÊN RENDER: Render gói Free chặn toàn bộ kết nối ra ngoài qua các cổng SMTP 25, 465, 587. Để gửi được email trên Render Free, bạn chỉ cần tạo 1 API key miễn phí tại Brevo (https://brevo.com - miễn phí 300 email/ngày) và thêm biến môi trường BREVO_API_KEY trên Render. Hệ thống sẽ tự động chuyển sang gửi qua cổng 443 HTTPS không bao giờ bị chặn!";
            } else {
                hint = "Kiểm tra chi tiết lỗi bên trên.";
            }
            response.put("diagnosticHint", hint);
            return ResponseEntity.status(500).body(response);
        }
    }
}
