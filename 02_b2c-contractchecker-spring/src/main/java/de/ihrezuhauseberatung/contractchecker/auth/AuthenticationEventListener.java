package de.ihrezuhauseberatung.contractchecker.auth;

import de.ihrezuhauseberatung.contractchecker.config.CustomUserDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Component
@Slf4j
public class AuthenticationEventListener implements ApplicationListener<AuthenticationSuccessEvent> {
    
    @Override
    public void onApplicationEvent(AuthenticationSuccessEvent event) {
        Object principal = event.getAuthentication().getPrincipal();
        
        if (principal instanceof CustomUserDetails userDetails) {
            log.info("User logged in successfully",
                    kv("event", "OPS_METRIC_USER_LOGIN"),
                    kv("userId", userDetails.getUserId()),
                    kv("tenantId", userDetails.getTenantId()),
                    kv("email", userDetails.getUsername()));
        } else if (principal instanceof org.springframework.security.oauth2.jwt.Jwt) {
            // For OAuth2 Logins where the principal is directly a JWT
            log.info("User logged in successfully via SSO",
                    kv("event", "OPS_METRIC_USER_LOGIN_SSO"));
        }
    }
}
