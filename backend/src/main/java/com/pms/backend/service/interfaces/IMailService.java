package com.pms.backend.service.interfaces;

import java.util.Map;

public interface IMailService {
    void sendMailAsync(String to, String subject, String templateName, Map<String, Object> variables);
}
