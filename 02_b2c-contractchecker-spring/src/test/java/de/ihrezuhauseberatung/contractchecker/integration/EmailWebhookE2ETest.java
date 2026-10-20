package de.ihrezuhauseberatung.contractchecker.integration;

import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.models.Tenant;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.AnalysisTaskRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.TenantRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.UserRepository;
import de.ihrezuhauseberatung.contractchecker.services.StorageService;
import de.ihrezuhauseberatung.contractchecker.integration.AiGatewayClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class EmailWebhookE2ETest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private AnalysisTaskRepository analysisTaskRepository;

    // Edge dependencies to mock so we don't do real external I/O
    @MockBean
    private StorageService storageService;

    @MockBean
    private AiGatewayClient aiGatewayClient;

    private Tenant testTenant;

    @BeforeEach
    void setUp() {
        // Clean up before test with bypass
        de.ihrezuhauseberatung.contractchecker.config.TenantContext.clear();
        de.ihrezuhauseberatung.contractchecker.config.TenantContext.setBypassRls(true);
        analysisTaskRepository.deleteAll();
        contractRepository.deleteAll();
        userRepository.deleteAll();

        // Ensure we have a tenant with an email alias
        UUID tenantId = UUID.randomUUID();
        testTenant = Tenant.builder()
                .id(tenantId)
                .name("E2E Test Tenant")
                .emailAlias("e2e-test")
                .build();
        testTenant = tenantRepository.saveAndFlush(testTenant);
        
        // Ensure the sender is already registered (whitelist rule)
        User existingUser = User.builder()
                .id(UUID.randomUUID())
                .email("neuer-kunde@example.com")
                .firstName("Max")
                .lastName("Mustermann")
                .tenant(testTenant)
                .build();
        userRepository.saveAndFlush(existingUser);
        de.ihrezuhauseberatung.contractchecker.config.TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        de.ihrezuhauseberatung.contractchecker.config.TenantContext.clear();
        de.ihrezuhauseberatung.contractchecker.config.TenantContext.setBypassRls(true);
        analysisTaskRepository.deleteAll();
        contractRepository.deleteAll();
        userRepository.deleteAll();
        if (testTenant != null) {
            tenantRepository.delete(testTenant);
        }
        de.ihrezuhauseberatung.contractchecker.config.TenantContext.clear();
    }

    @Test
    void testFullEmailWebhookFlow() {
        // Arrange
        when(storageService.uploadFile(anyString(), any(byte[].class), anyString())).thenReturn("gs://mock-bucket/test.pdf");

        String webhookSecret = "my-super-secret-token"; // Should match default in Controller

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("from", "neuer-kunde@example.com");
        body.add("to", "e2e-test@ihrezuhauseberatung.de");
        
        // Simulating the PDF attachment
        ByteArrayResource attachment = new ByteArrayResource("dummy pdf content".getBytes()) {
            @Override
            public String getFilename() {
                return "vertrag.pdf";
            }
        };
        body.add("attachment", attachment);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-Webhook-Secret", webhookSecret);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        // Act - Call the webhook endpoint just like Mailgun/SendGrid would
        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/internal/webhooks/email",
                requestEntity,
                String.class
        );

        // Assert - HTTP Response
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo("Processed");

        // Assert - Database state with admin bypass to read created entities
        de.ihrezuhauseberatung.contractchecker.config.TenantContext.clear();
        de.ihrezuhauseberatung.contractchecker.config.TenantContext.setBypassRls(true);
        try {
            Optional<User> createdUserOpt = userRepository.findByEmail("neuer-kunde@example.com");
            assertThat(createdUserOpt).isPresent();
            
            User createdUser = createdUserOpt.get();
            assertThat(createdUser.getTenant().getId()).isEqualTo(testTenant.getId());

            // Assert - Database state (Contract created for the user)
            List<Contract> contracts = contractRepository.findAll();
            assertThat(contracts).hasSize(1);
            
            Contract contract = contracts.get(0);
            assertThat(contract.getTenant().getId()).isEqualTo(testTenant.getId());
            assertThat(contract.getUser().getId()).isEqualTo(createdUser.getId());
            assertThat(contract.getFilename()).isEqualTo("vertrag.pdf");
        } finally {
            de.ihrezuhauseberatung.contractchecker.config.TenantContext.clear();
        }
    }
}
