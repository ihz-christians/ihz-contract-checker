package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.LegalAction;

public interface DeliveryService {
    String deliverLegalAction(LegalAction action, byte[] pdfContent);
}
