package com.pms.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.io.File;
import java.net.URI;
import java.nio.file.Files;
import java.util.List;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    @Value("${spring.datasource.username:}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    private String resolveDatabaseUrl() {
        if ("dev".equalsIgnoreCase(activeProfile) || "local".equalsIgnoreCase(activeProfile) || "test".equalsIgnoreCase(activeProfile)) {
            if (StringUtils.hasText(datasourceUrl)) {
                return datasourceUrl;
            }
        }
        if (StringUtils.hasText(datasourceUrl) && !datasourceUrl.contains("localhost:5432/pms")) {
            return datasourceUrl;
        }
        if (StringUtils.hasText(databaseUrl)) {
            return databaseUrl;
        }

        String envUrl = System.getenv("DATABASE_URL");
        if (StringUtils.hasText(envUrl)) {
            return envUrl;
        }

        String springDs = System.getenv("SPRING_DATASOURCE_URL");
        if (StringUtils.hasText(springDs)) {
            return springDs;
        }

        // Search .env.local and .env in current and parent directories (pulled by neon deploy)
        for (String filename : List.of(".env.local", ".env", "../.env.local", "../.env")) {
            File f = new File(filename);
            if (f.exists() && f.isFile()) {
                try {
                    List<String> lines = Files.readAllLines(f.toPath());
                    for (String line : lines) {
                        line = line.trim();
                        if (line.startsWith("DATABASE_URL=")) {
                            String val = line.substring("DATABASE_URL=".length()).trim();
                            if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.substring(1, val.length() - 1);
                            }
                            if (StringUtils.hasText(val)) {
                                log.info("Loaded Neon DATABASE_URL from {}", f.getAbsolutePath());
                                return val;
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Could not read {}: {}", f.getAbsolutePath(), e.getMessage());
                }
            }
        }

        return StringUtils.hasText(datasourceUrl) ? datasourceUrl : "jdbc:postgresql://localhost:5432/pms";
    }

    @Bean
    @Primary
    public DataSource dataSource() {
        String rawUrl = resolveDatabaseUrl();
        String effectiveUrl = rawUrl.trim();
        String effectiveUser = username;
        String effectivePassword = password;

        if (effectiveUrl.startsWith("postgres://") || effectiveUrl.startsWith("postgresql://")) {
            try {
                URI uri = new URI(effectiveUrl.replace("postgres://", "postgresql://"));
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    // Credentials embedded in Postgres URI take precedence over local defaults
                    effectiveUser = parts[0];
                    effectivePassword = parts[1];
                }

                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath() != null ? uri.getPath() : "/pms";
                String query = uri.getQuery();

                StringBuilder jdbc = new StringBuilder("jdbc:postgresql://")
                        .append(uri.getHost())
                        .append(":")
                        .append(port)
                        .append(path);

                if (StringUtils.hasText(query)) {
                    jdbc.append("?").append(query);
                } else {
                    jdbc.append("?sslmode=require");
                }
                effectiveUrl = jdbc.toString();
                log.info("Configured Neon DataSource JDBC URL: jdbc:postgresql://{}:{}{}", uri.getHost(), port, path);
            } catch (Exception e) {
                log.warn("Could not parse URI, prepending 'jdbc:' prefix: {}", e.getMessage());
                if (!effectiveUrl.startsWith("jdbc:")) {
                    effectiveUrl = "jdbc:" + effectiveUrl;
                }
            }
        }

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(effectiveUrl);
        if (StringUtils.hasText(effectiveUser)) {
            config.setUsername(effectiveUser);
        }
        if (StringUtils.hasText(effectivePassword)) {
            config.setPassword(effectivePassword);
        }
        config.setDriverClassName("org.postgresql.Driver");

        // Optimal pool sizing for free tier cloud environments (Neon / Render)
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(300000);
        config.setConnectionTimeout(20000);

        return new HikariDataSource(config);
    }

    @Bean
    public org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            try {
                log.info("Running Flyway repair to clean any prior failed migration states...");
                flyway.repair();
            } catch (Exception e) {
                log.warn("Flyway repair encountered an issue (ignoring): {}", e.getMessage());
            }
            log.info("Running Flyway migrations...");
            flyway.migrate();
        };
    }
}
