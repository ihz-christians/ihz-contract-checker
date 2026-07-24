package de.ihrezuhauseberatung.contractchecker.config;

import org.springframework.jdbc.datasource.AbstractDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

public class TenantAwareDataSource extends AbstractDataSource {

    private final DataSource delegate;

    public TenantAwareDataSource(DataSource delegate) {
        this.delegate = delegate;
    }

    @Override
    public Connection getConnection() throws SQLException {
        Connection connection = delegate.getConnection();
        configureConnection(connection);
        return connection;
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        Connection connection = delegate.getConnection(username, password);
        configureConnection(connection);
        return connection;
    }

    private void configureConnection(Connection connection) throws SQLException {
        UUID tenantId = TenantContext.getCurrentTenant();
        UUID userId = TenantContext.getCurrentUser();
        boolean bypass = TenantContext.isBypassRls();

        try (Statement stmt = connection.createStatement()) {
            // Set current tenant session variable
            String tenantVal = (tenantId != null) ? tenantId.toString() : "";
            stmt.execute("SET app.current_tenant_id = '" + tenantVal + "'");

            // Set current user session variable
            String userVal = (userId != null) ? userId.toString() : "";
            stmt.execute("SET app.current_user_id = '" + userVal + "'");

            // Set bypass session variable
            stmt.execute("SET app.bypass_rls = '" + (bypass ? "true" : "false") + "'");
        }
    }
}
