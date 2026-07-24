package de.ihrezuhauseberatung.contractchecker.auth;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "ihz.auth.provider", havingValue = "keycloak")
public class KeycloakIdentityAdapter implements IdentityProviderAdapter {

    @Override
    public String getProviderName() {
        return "keycloak";
    }

    @Override
    public SsoUserProfile extractUserProfile(Jwt jwt) {
        String uid = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        
        // Keycloak uses specific claims for names compared to Firebase
        String firstName = jwt.getClaimAsString("given_name");
        String lastName = jwt.getClaimAsString("family_name");

        if (firstName == null) firstName = "Gast";
        if (lastName == null) lastName = "Nutzer";

        return new SsoUserProfile(getProviderName(), uid, email, firstName, lastName);
    }
}
