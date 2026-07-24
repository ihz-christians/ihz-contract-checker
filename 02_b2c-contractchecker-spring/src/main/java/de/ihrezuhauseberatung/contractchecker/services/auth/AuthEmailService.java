package de.ihrezuhauseberatung.contractchecker.services.auth;

import de.ihrezuhauseberatung.contractchecker.models.User;

import java.util.Locale;

public interface AuthEmailService {
    void sendWelcomeEmail(User user, Locale locale);
    void sendPasswordResetEmail(User user, String token, String resetUrl, Locale locale);
}
