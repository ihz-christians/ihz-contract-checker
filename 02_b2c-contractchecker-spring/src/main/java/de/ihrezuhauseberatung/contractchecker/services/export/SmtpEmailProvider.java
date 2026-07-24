package de.ihrezuhauseberatung.contractchecker.services.export;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "smtp")
@RequiredArgsConstructor
@Slf4j
public class SmtpEmailProvider implements EmailProvider {

    private final JavaMailSender mailSender;

    @Override
    public void sendEmailWithAttachment(String to, String subject, String htmlBody, byte[] attachment, String attachmentName) {
        log.info("Sending SMTP email to '{}' with subject '{}'", to, subject);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = isHtml
            
            if (attachment != null && attachmentName != null) {
                helper.addAttachment(attachmentName, new ByteArrayResource(attachment));
            }
            
            mailSender.send(message);
            log.info("Successfully sent SMTP email to '{}'", to);
        } catch (Exception e) {
            log.error("Failed to send SMTP email to '{}'", to, e);
            throw new ExportException("SMTP email dispatch failed", e);
        }
    }
}
