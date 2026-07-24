package de.ihrezuhauseberatung.contractchecker.auth;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "ihz.auth.provider", havingValue = "firebase", matchIfMissing = true)
public class FirebaseIdentityAdapter implements IdentityProviderAdapter {

    @Override
    public String getProviderName() {
        return "firebase";
    }

    @Override
    public SsoUserProfile extractUserProfile(Jwt jwt) {
        String uid = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");

        String firstName = "";
        String lastName = "";

        if (name != null) {
            String[] parts = name.split(" ", 2);
            firstName = parts[0];
            lastName = parts.length > 1 ? parts[1] : "";
        } else {
            // Fallback for Firebase users without a display name
            firstName = "Gast";
            lastName = "Nutzer";
        }

        return new SsoUserProfile(getProviderName(), uid, email, firstName, lastName);
    }
}
