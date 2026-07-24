package de.ihrezuhauseberatung.contractchecker.services.export;

import de.ihrezuhauseberatung.contractchecker.models.Contract;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ThymeleafReportRenderer implements ReportRenderer {

    private final TemplateEngine templateEngine;

    @Override
    public String renderEmailBody(Contract contract, Locale locale) {
        Context context = new Context(locale);
        context.setVariable("contract", contract);
        context.setVariable("analysis", contract.getSummary()); // Make JSON summary accessible
        
        // This expects a template at src/main/resources/templates/export/email-report.html
        return templateEngine.process("export/email-report", context);
    }

    @Override
    public String renderPdfContent(Contract contract, Locale locale) {
        Context context = new Context(locale);
        context.setVariable("contract", contract);
        context.setVariable("analysis", contract.getSummary());
        
        // This expects a template at src/main/resources/templates/export/pdf-report.html
        return templateEngine.process("export/pdf-report", context);
    }
}
