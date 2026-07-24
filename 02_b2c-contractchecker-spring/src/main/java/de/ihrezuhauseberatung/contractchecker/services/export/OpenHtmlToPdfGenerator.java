package de.ihrezuhauseberatung.contractchecker.services.export;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
@Slf4j
public class OpenHtmlToPdfGenerator implements PdfGenerator {

    @Override
    public byte[] generatePdfFromHtml(String htmlContent) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            // In a real scenario, baseUri is needed for relative images/css
            builder.withHtmlContent(htmlContent, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (Exception e) {
            log.error("Error generating PDF from HTML", e);
            throw new ExportException("Failed to generate PDF", e);
        }
    }
}
