package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.*;
import de.ihrezuhauseberatung.contractchecker.services.export.PdfGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class DocumentGenerationServiceTest {

    private TemplateEngine templateEngine;
    private PdfGenerator pdfGenerator;
    private ThymeleafDocumentGenerationService documentGenerationService;

    @BeforeEach
    void setUp() {
        templateEngine = mock(TemplateEngine.class);
        pdfGenerator = mock(PdfGenerator.class);
        documentGenerationService = new ThymeleafDocumentGenerationService(templateEngine, pdfGenerator);
    }

    @Test
    void testGenerateLegalActionPdf_Success() {
        // Arrange
        User user = User.builder()
                .firstName("Max")
                .lastName("Mustermann")
                .street("Musterstraße")
                .houseNumber("12")
                .zipCode("12345")
                .city("Musterstadt")
                .email("max@mustermann.de")
                .build();

        Contract contract = Contract.builder()
                .contractType("Stromvertrag")
                .build();

        LegalAction action = LegalAction.builder()
                .id(UUID.randomUUID())
                .actionType(LegalActionType.CANCELLATION)
                .user(user)
                .contract(contract)
                .build();

        String htmlContent = "<html><body>Kündigung</body></html>";
        byte[] pdfBytes = "PDF-BYTES".getBytes();

        when(templateEngine.process(eq("export/legal-action"), any(Context.class))).thenReturn(htmlContent);
        when(pdfGenerator.generatePdfFromHtml(htmlContent)).thenReturn(pdfBytes);

        // Act
        byte[] result = documentGenerationService.generateLegalActionPdf(action);

        // Assert
        assertNotNull(result);
        assertArrayEquals(pdfBytes, result);
        verify(templateEngine).process(eq("export/legal-action"), any(Context.class));
        verify(pdfGenerator).generatePdfFromHtml(htmlContent);
    }
}
