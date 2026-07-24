package de.ihrezuhauseberatung.contractchecker.services.export;

import de.ihrezuhauseberatung.contractchecker.config.TenantContext;
import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportOrchestratorService {

    private final ContractRepository repository;
    private final ReportRenderer reportRenderer;
    private final PdfGenerator pdfGenerator;
    private final EmailProvider emailProvider;

    @Async
    public void generateAndSendReport(UUID contractId, UUID tenantId, UUID userId, String recipientEmail, Locale locale) {
        log.info("Starting async report generation for contract {}", contractId);
        
        try {
            // 1. RLS Kontext erzwingen
            TenantContext.setCurrentTenant(tenantId);
            TenantContext.setCurrentUser(userId);

            // 2. Daten sicher laden
            Contract contract = repository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found"));

            // 3. HTML rendern
            String emailHtml = reportRenderer.renderEmailBody(contract, locale);
            String pdfHtml = reportRenderer.renderPdfContent(contract, locale);

            // 4. PDF konvertieren
            byte[] pdfBytes = pdfGenerator.generatePdfFromHtml(pdfHtml);

            // 5. Über den injizierten Provider versenden
            String attachmentName = "Vertragsanalyse_" + 
                (contract.getContractType() != null ? contract.getContractType().replaceAll("\\s+", "_") : "Dokument") + 
                ".pdf";

            emailProvider.sendEmailWithAttachment(
                recipientEmail, 
                "Ihre Vertragsanalyse", 
                emailHtml, 
                pdfBytes, 
                attachmentName
            );

            log.info("Successfully sent report to {}", recipientEmail);

        } catch (Exception e) {
            log.error("Failed to generate and send report for contract {}", contractId, e);
            throw new ExportException("Report generation failed", e);
        } finally {
            // 6. Security: RLS aufräumen
            TenantContext.clear();
        }
    }
}
