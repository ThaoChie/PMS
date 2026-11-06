package com.pms.backend.config;

import com.pms.backend.wrapper.FlowableProcessEngineClient;
import com.pms.backend.wrapper.ProcessEngineClient;
import org.flowable.engine.ProcessEngine;
import org.flowable.engine.ProcessEngineConfiguration;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.spring.SpringProcessEngineConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

import javax.sql.DataSource;

@Configuration
@ConditionalOnProperty(name = "camunda.enabled", havingValue = "true")
public class CamundaConfig {

    private static final Logger log = LoggerFactory.getLogger(CamundaConfig.class);

    @Bean(destroyMethod = "close")
    public ProcessEngine flowableProcessEngine(
            @Value("${flowable.datasource.url:jdbc:postgresql://localhost:5433/epms_flowable}") String url,
            @Value("${flowable.datasource.username:postgres}") String username,
            @Value("${flowable.datasource.password:postgres}") String password,
            @Value("${flowable.datasource.driver-class-name:org.postgresql.Driver}") String driverClassName,
            ApplicationContext applicationContext,
            ResourcePatternResolver resourcePatternResolver) {
        log.info("Initializing embedded Flowable ProcessEngine with isolated DataSource at {}", url);

        // DataSource được tạo trực tiếp cho Flowable, KHÔNG đăng ký làm Spring Bean
        // để đảm bảo DataSource chính, TransactionManager, JPA và Flyway của PMS hoàn toàn không bị ảnh hưởng.
        DataSource flowableDataSource = DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName(driverClassName)
                .build();

        SpringProcessEngineConfiguration cfg = new SpringProcessEngineConfiguration();
        cfg.setApplicationContext(applicationContext);
        cfg.setDataSource(flowableDataSource);
        cfg.setTransactionManager(new DataSourceTransactionManager(flowableDataSource));
        cfg.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE);
        cfg.setAsyncExecutorActivate(true);

        ProcessEngine engine = cfg.buildProcessEngine();
        deployBpmnResources(engine, resourcePatternResolver);
        return engine;
    }

    @Bean
    public RepositoryService flowableRepositoryService(ProcessEngine processEngine) {
        return processEngine.getRepositoryService();
    }

    @Bean
    public RuntimeService flowableRuntimeService(ProcessEngine processEngine) {
        return processEngine.getRuntimeService();
    }

    @Bean
    public TaskService flowableTaskService(ProcessEngine processEngine) {
        return processEngine.getTaskService();
    }

    @Bean
    public ProcessEngineClient flowableProcessEngineClient(ProcessEngine processEngine, RuntimeService runtimeService) {
        return new FlowableProcessEngineClient(processEngine, runtimeService);
    }

    private void deployBpmnResources(ProcessEngine processEngine, ResourcePatternResolver resolver) {
        try {
            Resource[] resources = resolver.getResources("classpath*:bpmn/*.bpmn");
            if (resources != null && resources.length > 0) {
                RepositoryService repo = processEngine.getRepositoryService();
                for (Resource r : resources) {
                    if (r.isReadable()) {
                        repo.createDeployment()
                                .name(r.getFilename())
                                .addInputStream(r.getFilename(), r.getInputStream())
                                .deploy();
                        log.info("Auto-deployed BPMN process definition from {}", r.getFilename());
                    }
                }
            } else {
                log.info("No BPMN files found in classpath:bpmn/*.bpmn to deploy");
            }
        } catch (Exception e) {
            log.warn("Failed to auto-deploy BPMN resources: {}", e.getMessage());
        }
    }
}
