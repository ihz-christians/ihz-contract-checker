package de.ihrezuhauseberatung.contractchecker.services.auth;

import de.ihrezuhauseberatung.contractchecker.config.TenantContext;
import de.ihrezuhauseberatung.contractchecker.models.PasswordResetToken;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.repositories.PasswordResetTokenRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final AuthEmailService authEmailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void initiatePasswordReset(String email, String baseUrl, Locale locale) {
        // Temporarily bypass TenantContext/RLS because we need to search users globally by email
        TenantContext.clear();
        TenantContext.setBypassRls(true);
        Optional<User> userOpt;
        try {
            userOpt = userRepository.findByEmail(email);
        } finally {
            TenantContext.clear();
        }

        if (userOpt.isEmpty()) {
            log.warn("Password reset requested for non-existent email",
                    kv("event", "OPS_METRIC_PASSWORD_RESET_UNKNOWN_EMAIL"),
                    kv("email", email));
            // We don't throw an error to prevent user enumeration attacks
            return;
        }

        User user = userOpt.get();
        String token = UUID.randomUUID().toString();
        
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(OffsetDateTime.now().plusHours(1))
                .build();
                
        tokenRepository.save(resetToken);
        
        log.info("Password reset token generated",
                kv("event", "OPS_METRIC_PASSWORD_RESET_REQUESTED"),
                kv("userId", user.getId()),
                kv("tenantId", user.getTenant().getId()));
        
        String resetUrl = baseUrl + "/reset-password?token=" + token;
        authEmailService.sendPasswordResetEmail(user, token, resetUrl, locale);
    }

    @Transactional
    public boolean validatePasswordResetToken(String token) {
        TenantContext.clear();
        TenantContext.setBypassRls(true);
        Optional<PasswordResetToken> tokenOpt;
        try {
            tokenOpt = tokenRepository.findByToken(token);
        } finally {
            TenantContext.clear();
        }

        if (tokenOpt.isEmpty()) {
            return false;
        }
        PasswordResetToken resetToken = tokenOpt.get();
        return resetToken.getExpiryDate().isAfter(OffsetDateTime.now());
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (newPassword == null || newPassword.trim().length() < 8) {
            throw new IllegalArgumentException("Das Passwort muss mindestens 8 Zeichen lang sein");
        }

        TenantContext.clear();
        TenantContext.setBypassRls(true);
        PasswordResetToken resetToken;
        try {
            resetToken = tokenRepository.findByToken(token)
                    .orElseThrow(() -> new IllegalArgumentException("Ungültiger oder abgelaufener Token"));
        } finally {
            TenantContext.clear();
        }

        if (resetToken.getExpiryDate().isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("Token ist abgelaufen");
        }

        User user = resetToken.getUser();
        user.setHashedPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Consume the token so it can't be reused
        tokenRepository.delete(resetToken);
        
        log.info("Password successfully reset",
                kv("event", "OPS_METRIC_PASSWORD_RESET_COMPLETED"),
                kv("userId", user.getId()),
                kv("tenantId", user.getTenant().getId()));
    }
}
