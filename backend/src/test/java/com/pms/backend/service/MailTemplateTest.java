package com.pms.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MailTemplateTest {

    private SpringTemplateEngine templateEngine;

    @BeforeEach
    void setUp() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding(StandardCharsets.UTF_8.name());

        templateEngine = new SpringTemplateEngine();
        templateEngine.setTemplateResolver(resolver);
    }

    @Test
    void notificationTemplate_defaultInternalNote_doesNotMentionSharedTask() {
        Context context = new Context();
        context.setVariables(Map.of(
                "recipientName", "Nguyễn Văn A",
                "title", "Cập nhật công việc",
                "message", "Công việc TEST-1 đã được giao cho bạn.",
                "link", "https://epms.example.com/issues/TEST-1"
        ));

        String html = templateEngine.process("mail/notification", context);

        assertTrue(html.contains(">Xem chi tiết</a>"));
        assertTrue(html.contains("Vui lòng đăng nhập hệ thống EPMS để xem chi tiết và tiếp tục xử lý công việc."));
        assertFalse(html.contains("công việc được chia sẻ"));
        assertFalse(html.contains("đăng ký tài khoản mới"));
    }

    @Test
    void notificationTemplate_approvalFeedbackNote_rendersFeedbackFooter() {
        Context context = new Context();
        context.setVariables(Map.of(
                "recipientName", "Nguyễn Văn B",
                "title", "Phản hồi của PM về công việc của bạn",
                "message", "Công việc: TEST-14 - Implement feature X",
                "link", "https://epms.example.com/projects/TEST/issues/TEST-14",
                "buttonText", "Xem chi tiết công việc",
                "footerNote", "* Lưu ý: Vui lòng đăng nhập hệ thống EPMS để xem chi tiết phản hồi và tiếp tục xử lý công việc."
        ));

        String html = templateEngine.process("mail/notification", context);

        assertTrue(html.contains(">Xem chi tiết công việc</a>"));
        assertTrue(html.contains("Vui lòng đăng nhập hệ thống EPMS để xem chi tiết phản hồi và tiếp tục xử lý công việc."));
        assertFalse(html.contains("công việc được chia sẻ"));
    }

    @Test
    void notificationTemplate_shareIssueNote_rendersSharedTaskFooter() {
        Context context = new Context();
        context.setVariables(Map.of(
                "recipientName", "Khách ngoài",
                "title", "PM đã chia sẻ công việc: TEST-14",
                "message", "Nội dung công việc: Implement feature X",
                "link", "https://epms.example.com/issues/TEST-14",
                "buttonText", "Xem chi tiết công việc",
                "footerNote", "* Lưu ý: Bạn cần đăng nhập (hoặc đăng ký tài khoản mới nếu chưa có) để truy cập và xem chi tiết công việc được chia sẻ."
        ));

        String html = templateEngine.process("mail/notification", context);

        assertTrue(html.contains(">Xem chi tiết công việc</a>"));
        assertTrue(html.contains("Bạn cần đăng nhập (hoặc đăng ký tài khoản mới nếu chưa có) để truy cập và xem chi tiết công việc được chia sẻ."));
    }
}
