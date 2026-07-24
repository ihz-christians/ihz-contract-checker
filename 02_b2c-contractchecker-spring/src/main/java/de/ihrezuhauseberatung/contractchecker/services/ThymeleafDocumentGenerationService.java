package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.LegalAction;
import de.ihrezuhauseberatung.contractchecker.services.export.PdfGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ThymeleafDocumentGenerationService implements DocumentGenerationService {

    private final TemplateEngine templateEngine;
    private final PdfGenerator pdfGenerator;

    @Override
    public byte[] generateLegalActionPdf(LegalAction action) {
        Context context = new Context(Locale.GERMANY);
        context.setVariable("action", action);
        context.setVariable("user", action.getUser());
        context.setVariable("contract", action.getContract());
        
        // Render HTML template via Thymeleaf
        String htmlContent = templateEngine.process("export/legal-action", context);
        
        // Convert to PDF via OpenHTMLToPDF
        return pdfGenerator.generatePdfFromHtml(htmlContent);
    }
}
