package de.ihrezuhauseberatung.contractchecker.services.auth;

import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.services.export.EmailProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthEmailServiceImpl implements AuthEmailService {

    private final TemplateEngine templateEngine;
    private final EmailProvider emailProvider;

    @Async
    @Override
    public void sendWelcomeEmail(User user, Locale locale) {
        log.info("Sending welcome email to {}", user.getEmail());
        try {
            Context context = new Context(locale);
            context.setVariable("user", user);
            
            String htmlBody = templateEngine.process("auth/welcome-email", context);
            
            emailProvider.sendEmailWithAttachment(
                user.getEmail(),
                "Willkommen bei IhreZuhauseBeratung!",
                htmlBody,
                null,
                null
            );
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}", user.getEmail(), e);
        }
    }

    @Async
    @Override
    public void sendPasswordResetEmail(User user, String token, String resetUrl, Locale locale) {
        log.info("Sending password reset email to {}", user.getEmail());
        try {
            Context context = new Context(locale);
            context.setVariable("user", user);
            context.setVariable("resetUrl", resetUrl);
            
            String htmlBody = templateEngine.process("auth/password-reset-email", context);
            
            emailProvider.sendEmailWithAttachment(
                user.getEmail(),
                "Passwort zurücksetzen - IhreZuhauseBeratung",
                htmlBody,
                null,
                null
            );
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", user.getEmail(), e);
        }
    }
}
