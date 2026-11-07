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

    public static JavaMailSenderImpl buildSender(MailProperties properties, Integer overridePort, Boolean useSsl) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        String host = properties.getHost() != null && !properties.getHost().isBlank()
                ? properties.getHost()
                : "smtp.gmail.com";
        sender.setHost(host);

        int port = overridePort != null ? overridePort : (properties.getPort() != null ? properties.getPort() : 587);
        sender.setPort(port);

        if (properties.getUsername() != null && !properties.getUsername().isBlank()) {
            sender.setUsername(properties.getUsername().trim());
        }

        String password = properties.getPassword();
        if (password != null) {
            // Remove all whitespace characters commonly found in copied Google App Passwords
            sender.setPassword(password.replaceAll("\\s+", ""));
        }

        if (properties.getDefaultEncoding() != null) {
            sender.setDefaultEncoding(properties.getDefaultEncoding().name());
        } else {
            sender.setDefaultEncoding("UTF-8");
        }

        Properties javaMailProps = new Properties();
        javaMailProps.put("mail.smtp.auth", "true");
        javaMailProps.put("mail.smtp.ssl.trust", "*");
        javaMailProps.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        javaMailProps.put("mail.smtp.connectiontimeout", "10000");
        javaMailProps.put("mail.smtp.timeout", "10000");
        javaMailProps.put("mail.smtp.writetimeout", "10000");

        boolean isSsl = Boolean.TRUE.equals(useSsl) || port == 465;
        if (isSsl) {
            javaMailProps.put("mail.smtp.ssl.enable", "true");
            javaMailProps.put("mail.smtp.socketFactory.port", String.valueOf(port));
            javaMailProps.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            javaMailProps.put("mail.smtp.socketFactory.fallback", "false");
            javaMailProps.put("mail.smtp.starttls.enable", "false");
        } else {
            javaMailProps.put("mail.smtp.starttls.enable", "true");
            javaMailProps.put("mail.smtp.starttls.required", "true");
            javaMailProps.put("mail.smtp.ssl.enable", "false");
        }

        Map<String, String> propMap = properties.getProperties();
        if (propMap != null && !propMap.isEmpty()) {
            javaMailProps.putAll(propMap);
        }
        sender.setJavaMailProperties(javaMailProps);
        return sender;
    }

    @Bean
    @Primary
    public JavaMailSender javaMailSender(MailProperties properties) {
        return buildSender(properties, null, null);
    }
}
