package de.ihrezuhauseberatung.contractchecker.services.export;

public interface PdfGenerator {
    byte[] generatePdfFromHtml(String htmlContent);
}
