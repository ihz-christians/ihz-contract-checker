package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.config.TenantContext;
import de.ihrezuhauseberatung.contractchecker.models.Tenant;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.repositories.TenantRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest(classes = {EmailWebhookService.class})
@ActiveProfiles("test")
public class EmailWebhookServiceTest {

    @MockBean
    private TenantRepository tenantRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private ContractService contractService;

    @Autowired
    private EmailWebhookService emailWebhookService;

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void processIncomingEmail_shouldIdentifyTenantAndUserAndStartAnalysis() {
        // Arrange
        String toAddress = "max-mueller@ihrezuhauseberatung.de";
        String fromAddress = "kunde@example.com";
        String filename = "rechnung.pdf";
        byte[] pdfContent = new byte[]{1, 2, 3};

        UUID tenantId = UUID.randomUUID();
        Tenant tenant = Tenant.builder().id(tenantId).name("Max").emailAlias("max-mueller").build();
        
        UUID userId = UUID.randomUUID();
        User customer = User.builder().id(userId).email(fromAddress).tenant(tenant).build();

        when(tenantRepository.findByEmailAlias("max-mueller")).thenReturn(Optional.of(tenant));
        when(userRepository.findByEmail(fromAddress)).thenReturn(Optional.of(customer));

        // Act
        emailWebhookService.processIncomingEmail(toAddress, fromAddress, filename, pdfContent);

        // Assert
        verify(tenantRepository).findByEmailAlias("max-mueller");
        verify(userRepository).findByEmail(fromAddress);
        verify(contractService).saveAndStartAnalysis(eq(filename), eq(pdfContent), isNull(), isNull(), eq("UNKNOWN"), eq(customer));
    }

    @Test
    void processIncomingEmail_unregisteredUser_shouldLogAndAbort() {
        // Arrange
        String toAddress = "max-mueller@ihrezuhauseberatung.de";
        String fromAddress = "unbekannt@example.com";
        String filename = "rechnung.pdf";
        byte[] pdfContent = new byte[]{1, 2, 3};

        UUID tenantId = UUID.randomUUID();
        Tenant tenant = Tenant.builder().id(tenantId).name("Max").emailAlias("max-mueller").build();

        when(tenantRepository.findByEmailAlias("max-mueller")).thenReturn(Optional.of(tenant));
        when(userRepository.findByEmail(fromAddress)).thenReturn(Optional.empty()); // User does not exist

        // Act
        emailWebhookService.processIncomingEmail(toAddress, fromAddress, filename, pdfContent);

        // Assert
        verify(tenantRepository).findByEmailAlias("max-mueller");
        verify(userRepository).findByEmail(fromAddress);
        verifyNoInteractions(contractService); // Must abort and not process
    }
}
