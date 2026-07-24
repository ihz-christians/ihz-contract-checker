package de.ihrezuhauseberatung.contractchecker.services.export;

public interface EmailProvider {
    void sendEmailWithAttachment(String to, String subject, String htmlBody, byte[] attachment, String attachmentName);
}
