package de.ihrezuhauseberatung.contractchecker.integration;

import de.ihrezuhauseberatung.contractchecker.config.TenantContext;
import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.models.Role;
import de.ihrezuhauseberatung.contractchecker.models.Tenant;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.TenantRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.UserRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.RoleRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class TenantRlsIntegrationTest {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContractRepository contractRepository;
    
    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private javax.sql.DataSource dataSource;

    private Tenant tenantA;
    private Tenant tenantB;

    @BeforeEach
    void setUp() {
        // Temporarily clear context to act as a system user and set up data
        TenantContext.clear();
        TenantContext.setBypassRls(true); // Bypass RLS to allow setup data creation
        
        contractRepository.deleteAll();
        userRepository.deleteAll();
        tenantRepository.deleteAll();
        
        tenantA = tenantRepository.saveAndFlush(Tenant.builder()
            .id(UUID.randomUUID())
            .name("Tenant A")
            .build());
            
        tenantB = tenantRepository.saveAndFlush(Tenant.builder()
            .id(UUID.randomUUID())
            .name("Tenant B")
            .build());

        User userA = userRepository.saveAndFlush(User.builder()
            .id(UUID.randomUUID())
            .tenant(tenantA)
            .email("userA@tenantA.com")
            .firstName("A")
            .lastName("User")
            .hashedPassword("hash")
            .build());
            
        User userB = userRepository.saveAndFlush(User.builder()
            .id(UUID.randomUUID())
            .tenant(tenantB)
            .email("userB@tenantB.com")
            .firstName("B")
            .lastName("User")
            .hashedPassword("hash")
            .build());

        // 1. Set context to Tenant A and create data
        TenantContext.clear(); // Clear bypass before setting specific tenant
        TenantContext.setBypassRls(true); // STILL NEED TO BYPASS because our tenant Context logic applies strictly in DB!
        TenantContext.setCurrentTenant(tenantA.getId());
        TenantContext.setCurrentUser(userA.getId());
        contractRepository.saveAndFlush(Contract.builder()
            .id(UUID.randomUUID())
            .tenant(tenantA)
            .user(userA)
            .filename("vertrag_A1.pdf")
            .filepath("/path/to/A1")
            .build());
        contractRepository.saveAndFlush(Contract.builder()
            .id(UUID.randomUUID())
            .tenant(tenantA)
            .user(userA)
            .filename("vertrag_A2.pdf")
            .filepath("/path/to/A2")
            .build());

        // 2. Set context to Tenant B and create data
        TenantContext.clear(); // Clear bypass before setting specific tenant
        TenantContext.setBypassRls(true);
        TenantContext.setCurrentTenant(tenantB.getId());
        TenantContext.setCurrentUser(userB.getId());
        contractRepository.saveAndFlush(Contract.builder()
            .id(UUID.randomUUID())
            .tenant(tenantB)
            .user(userB)
            .filename("vertrag_B1.pdf")
            .filepath("/path/to/B1")
            .build());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        contractRepository.deleteAll();
        userRepository.deleteAll();
        tenantRepository.deleteAll();
    }

    @Test
    void whenContextIsTenantA_thenOnlyTenantADataIsVisible() throws Exception {
        // Given
        TenantContext.clear();
        TenantContext.setBypassRls(true); // Bypass for saving data in setup

        // Wir testen RLS direkt über eine rohe JDBC Connection, um Spring/Hibernate Caching völlig auszuschließen
        try (java.sql.Connection conn = dataSource.getConnection();
             java.sql.Statement stmt = conn.createStatement()) {
            
            // Setze RLS für Tenant A
            stmt.execute("SET app.bypass_rls = 'false'");
            stmt.execute("SET app.current_tenant_id = '" + tenantA.getId() + "'");

            // When
            java.sql.ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM contracts");
            rs.next();
            int count = rs.getInt(1);

            // Teste den User und RLS Status
            java.sql.ResultSet rsUser = stmt.executeQuery("SELECT current_user, current_setting('row_security')");
            rsUser.next();
            System.out.println("CURRENT DB USER: " + rsUser.getString(1));
            System.out.println("ROW SECURITY STATUS: " + rsUser.getString(2));

            // Then
            assertThat(count).isEqualTo(2); // Tenant A hat 2 Verträge
        }
    }

    @Test
    void whenContextIsTenantB_thenOnlyTenantBDataIsVisible() throws Exception {
        // Wir testen RLS direkt über eine rohe JDBC Connection
        try (java.sql.Connection conn = dataSource.getConnection();
             java.sql.Statement stmt = conn.createStatement()) {
            
            // Setze RLS für Tenant B
            stmt.execute("SET app.bypass_rls = 'false'");
            stmt.execute("SET app.current_tenant_id = '" + tenantB.getId() + "'");

            // When
            java.sql.ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM contracts");
            rs.next();
            int count = rs.getInt(1);

            // Then
            assertThat(count).isEqualTo(1); // Tenant B hat 1 Vertrag
        }
    }

    @Test
    void whenNoContextIsSet_thenNoDataIsVisibleOrThrowsException() throws Exception {
        // Wir testen RLS direkt über eine rohe JDBC Connection
        try (java.sql.Connection conn = dataSource.getConnection();
             java.sql.Statement stmt = conn.createStatement()) {
            
            // Leerer Kontext
            stmt.execute("SET app.bypass_rls = 'false'");
            stmt.execute("SET app.current_tenant_id = ''");

            // When
            try {
                java.sql.ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM contracts");
                rs.next();
                int count = rs.getInt(1);
                
                // Then
                assertThat(count).isEqualTo(0);
            } catch (Exception e) {
                // Postgres wirft Fehler, was auch okay ist
                assertThat(e.getMessage()).contains("invalid input syntax for type uuid");
            }
        }
    }
}
