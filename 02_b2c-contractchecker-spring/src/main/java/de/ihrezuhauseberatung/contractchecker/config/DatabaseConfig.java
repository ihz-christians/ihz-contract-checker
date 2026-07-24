package de.ihrezuhauseberatung.contractchecker.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import org.springframework.context.annotation.Profile;
import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource rawDataSource(DataSourceProperties properties) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(properties.getUrl());
        config.setUsername(properties.getUsername());
        config.setPassword(properties.getPassword());
        config.setDriverClassName(properties.getDriverClassName());
        return new HikariDataSource(config);
    }

    @Bean
    @Primary
    @Profile("!test")
    public DataSource dataSource(HikariDataSource rawDataSource) {
        return new TenantAwareDataSource(rawDataSource);
    }

    @Bean
    @Primary
    @Profile("test")
    public DataSource testDataSource(HikariDataSource rawDataSource) {
        return rawDataSource;
    }
}
