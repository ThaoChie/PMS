package com.pms.backend.config;

import com.pms.backend.wrapper.NoOpProcessEngineClient;
import com.pms.backend.wrapper.ProcessEngineClient;
import org.flowable.engine.ProcessEngine;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CamundaFlagDisabledTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(ProcessEngineClientConfig.class, CamundaConfig.class);

    @Test
    @DisplayName("Khi camunda.enabled=false hoặc không set: chỉ có NoOp bean, không có Flowable ProcessEngine hay DataSource nào")
    void whenCamundaDisabled_thenNoFlowableBeansCreated() {
        contextRunner.run(context -> {
            assertThat(context).hasSingleBean(ProcessEngineClient.class);
            assertThat(context.getBean(ProcessEngineClient.class)).isInstanceOf(NoOpProcessEngineClient.class);

            assertThatThrownBy(() -> context.getBean(ProcessEngine.class))
                    .isInstanceOf(NoSuchBeanDefinitionException.class);

            assertThat(context.containsBean("flowableDataSource")).isFalse();
            assertThat(context.containsBean("flowableProcessEngine")).isFalse();
            assertThat(context.containsBean("flowableProcessEngineClient")).isFalse();
        });
    }

    @Test
    @DisplayName("Khi camunda.enabled explicit false: không có bean Flowable nào được tạo")
    void whenCamundaExplicitlyFalse_thenNoFlowableBeansCreated() {
        contextRunner.withPropertyValues("camunda.enabled=false")
                .run(context -> {
                    assertThat(context).hasSingleBean(ProcessEngineClient.class);
                    assertThat(context.getBean(ProcessEngineClient.class)).isInstanceOf(NoOpProcessEngineClient.class);

                    assertThatThrownBy(() -> context.getBean(ProcessEngine.class))
                            .isInstanceOf(NoSuchBeanDefinitionException.class);

                    assertThat(context.containsBean("flowableDataSource")).isFalse();
                    assertThat(context.containsBean("flowableProcessEngine")).isFalse();
                    assertThat(context.containsBean("flowableProcessEngineClient")).isFalse();
                });
    }
}
