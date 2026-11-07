package com.pms.backend.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import static org.assertj.core.api.Assertions.assertThat;

class MailConfigTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(MailConfig.class);

    @Test
    @DisplayName("MailConfig khởi tạo thành công và tự động loại bỏ khoảng trắng trong password")
    void testMailConfigLoadsAndStripsPasswordWhitespace() {
        contextRunner
                .withPropertyValues(
                        "spring.mail.host=smtp.gmail.com",
                        "spring.mail.port=587",
                        "spring.mail.username=test@gmail.com",
                        "spring.mail.password=zepi gxfi njvk huri",
                        "spring.mail.properties.mail.smtp.auth=true",
                        "spring.mail.properties.mail.smtp.starttls.enable=true"
                )
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).hasSingleBean(JavaMailSender.class);
                    JavaMailSender sender = context.getBean(JavaMailSender.class);
                    assertThat(sender).isInstanceOf(JavaMailSenderImpl.class);
                    JavaMailSenderImpl impl = (JavaMailSenderImpl) sender;
                    assertThat(impl.getHost()).isEqualTo("smtp.gmail.com");
                    assertThat(impl.getPort()).isEqualTo(587);
                    assertThat(impl.getUsername()).isEqualTo("test@gmail.com");
                    assertThat(impl.getPassword()).isEqualTo("zepigxfinjvkhuri");
                    assertThat(impl.getJavaMailProperties().getProperty("mail.smtp.auth")).isEqualTo("true");
                    assertThat(impl.getJavaMailProperties().getProperty("mail.smtp.starttls.enable")).isEqualTo("true");
                });
    }

    @Test
    @DisplayName("MailConfig khởi tạo thành công ngay cả khi không có cấu hình spring.mail nào")
    void testMailConfigLoadsWithDefaultProperties() {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).hasSingleBean(JavaMailSender.class);
        });
    }
}
