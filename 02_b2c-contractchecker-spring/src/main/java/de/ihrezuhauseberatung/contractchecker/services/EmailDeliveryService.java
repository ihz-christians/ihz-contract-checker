package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.LegalAction;
import de.ihrezuhauseberatung.contractchecker.services.export.EmailProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailDeliveryService implements DeliveryService {

    private final EmailProvider emailProvider;

    @Override
    public String deliverLegalAction(LegalAction action, byte[] pdfContent) {
        String recipient = action.getUser().getEmail();
        String actionName = switch(action.getActionType()) {
            case CANCELLATION -> "Kuendigung";
            case REVOCATION -> "Widerruf";
            case DOWNGRADE -> "Tarifwechsel";
        };
        
        String subject = "Bestätigung: Ihre rechtliche Maßnahme (" + actionName + ")";
        String htmlBody = "<h1>Hallo " + action.getUser().getFirstName() + "</h1>" +
                "<p>Ihre rechtliche Maßnahme (" + actionName + ") wurde erfolgreich erzeugt.</p>" +
                "<p>Anbei finden Sie das generierte Dokument als PDF im Anhang zu Ihrer Übersicht und zur Weiterleitung.</p>" +
                "<br/><p>Mit freundlichen Grüßen,<br/>Ihr Team von IhreZuhauseBeratung</p>";

        String filename = "Dokument_" + actionName + "_" + UUID.randomUUID().toString().substring(0, 8) + ".pdf";

        emailProvider.sendEmailWithAttachment(recipient, subject, htmlBody, pdfContent, filename);

        return "email-receipt-" + UUID.randomUUID().toString();
    }
}
