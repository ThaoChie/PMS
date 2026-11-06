package com.pms.backend.config;

import com.pms.backend.wrapper.NoOpProcessEngineClient;
import com.pms.backend.wrapper.ProcessEngineClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProcessEngineClientConfig {

    @Bean
    @ConditionalOnProperty(name = "camunda.enabled", havingValue = "false", matchIfMissing = true)
    public ProcessEngineClient noOpProcessEngineClient() {
        return new NoOpProcessEngineClient();
    }
}
