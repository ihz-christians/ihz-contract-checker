package de.ihrezuhauseberatung.contractchecker.services.export;

import de.ihrezuhauseberatung.contractchecker.config.TenantContext;
import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExportOrchestratorServiceTest {

    @Mock
    private ContractRepository repository;
    @Mock
    private ReportRenderer reportRenderer;
    @Mock
    private PdfGenerator pdfGenerator;
    @Mock
    private EmailProvider emailProvider;

    @InjectMocks
    private ExportOrchestratorService orchestrator;

    @BeforeEach
    void setUp() {
        TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldGenerateAndSendReport_andCleanUpTenantContext() {
        // Arrange
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID contractId = UUID.randomUUID();
        
        Contract mockContract = Contract.builder()
                .id(contractId)
                .contractType("Stromtarif")
                .build();
        
        when(repository.findById(contractId)).thenReturn(Optional.of(mockContract));
        when(reportRenderer.renderEmailBody(any(), any())).thenReturn("<html>Email</html>");
        when(reportRenderer.renderPdfContent(any(), any())).thenReturn("<html>PDF</html>");
        when(pdfGenerator.generatePdfFromHtml("<html>PDF</html>")).thenReturn(new byte[]{1, 2, 3});

        // Act
        orchestrator.generateAndSendReport(contractId, tenantId, userId, "test@test.de", Locale.GERMAN);

        // Assert
        verify(emailProvider).sendEmailWithAttachment(
            eq("test@test.de"), 
            eq("Ihre Vertragsanalyse"), 
            eq("<html>Email</html>"), 
            eq(new byte[]{1, 2, 3}), 
            eq("Vertragsanalyse_Stromtarif.pdf")
        );
        
        // WICHTIG: RLS Security Check!
        assertNull(TenantContext.getCurrentTenant(), "TenantContext must be cleared to prevent data leaks!");
        assertNull(TenantContext.getCurrentUser(), "TenantContext must be cleared to prevent data leaks!");
    }
}
