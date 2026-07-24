package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.LegalAction;

public interface DocumentGenerationService {
    byte[] generateLegalActionPdf(LegalAction action);
}
