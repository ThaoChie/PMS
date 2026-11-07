package com.pms.backend.config;

import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Map;
import java.util.Properties;

@Configuration
@EnableConfigurationProperties(MailProperties.class)
public class MailConfig {

    @Bean
    @Primary
    public JavaMailSender javaMailSender(MailProperties properties) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        if (properties.getHost() != null) {
            sender.setHost(properties.getHost());
        }
        if (properties.getPort() != null) {
            sender.setPort(properties.getPort());
        }
        if (properties.getUsername() != null) {
            sender.setUsername(properties.getUsername());
        }
        String password = properties.getPassword();
        if (password != null) {
            // Strip all whitespace characters commonly present in copied Google App Passwords ("xxxx xxxx xxxx xxxx")
            sender.setPassword(password.replaceAll("\\s+", ""));
        }
        if (properties.getDefaultEncoding() != null) {
            sender.setDefaultEncoding(properties.getDefaultEncoding().name());
        } else {
            sender.setDefaultEncoding("UTF-8");
        }
        Properties javaMailProps = new Properties();
        javaMailProps.put("mail.smtp.auth", "true");
        javaMailProps.put("mail.smtp.starttls.enable", "true");
        javaMailProps.put("mail.smtp.starttls.required", "true");
        javaMailProps.put("mail.smtp.ssl.trust", "*");
        javaMailProps.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        javaMailProps.put("mail.smtp.connectiontimeout", "10000");
        javaMailProps.put("mail.smtp.timeout", "10000");
        javaMailProps.put("mail.smtp.writetimeout", "10000");

        Map<String, String> propMap = properties.getProperties();
        if (propMap != null && !propMap.isEmpty()) {
            javaMailProps.putAll(propMap);
        }
        sender.setJavaMailProperties(javaMailProps);
        return sender;
    }
}
