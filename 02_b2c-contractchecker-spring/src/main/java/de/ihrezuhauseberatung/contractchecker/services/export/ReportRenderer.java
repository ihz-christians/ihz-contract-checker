package de.ihrezuhauseberatung.contractchecker.services.export;

import java.util.Locale;
import de.ihrezuhauseberatung.contractchecker.models.Contract;

public interface ReportRenderer {
    String renderEmailBody(Contract contract, Locale locale);
    String renderPdfContent(Contract contract, Locale locale);
}
