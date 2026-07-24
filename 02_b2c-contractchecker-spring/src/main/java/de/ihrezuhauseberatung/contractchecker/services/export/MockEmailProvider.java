package de.ihrezuhauseberatung.contractchecker.services.export;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "mock", matchIfMissing = true)
@Slf4j
public class MockEmailProvider implements EmailProvider {
    
    @Override
    public void sendEmailWithAttachment(String to, String subject, String htmlBody, byte[] attachment, String attachmentName) {
        log.info("MOCK MAIL SENDER: Would send email to '{}' with subject '{}'", to, subject);
        log.info("MOCK MAIL SENDER: Attachment '{}' size is {} bytes", attachmentName, attachment != null ? attachment.length : 0);
    }
}
