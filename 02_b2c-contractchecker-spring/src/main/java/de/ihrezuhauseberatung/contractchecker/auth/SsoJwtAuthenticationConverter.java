package de.ihrezuhauseberatung.contractchecker.auth;

import de.ihrezuhauseberatung.contractchecker.config.CustomUserDetails;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.services.UserService;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Wandelt ein Standard-OAuth2-JWT (z.B. von Firebase oder Keycloak)
 * nahtlos in unser etabliertes CustomUserDetails System um.
 * 
 * Damit bleibt der restliche Code (inkl. RLS-TenantFilter) völlig unberührt!
 */
@Component
public class SsoJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final IdentityProviderAdapter idpAdapter;
    private final UserService userService;

    public SsoJwtAuthenticationConverter(IdentityProviderAdapter idpAdapter, @Lazy UserService userService) {
        this.idpAdapter = idpAdapter;
        this.userService = userService;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        // 1. JWT herstellerunabhängig auslesen (Firebase / Keycloak)
        SsoUserProfile profile = idpAdapter.extractUserProfile(jwt);

        // 2. Nutzer in der lokalen Postgres RLS-DB anlegen oder synchronisieren
        User user = userService.syncOrCreateSsoUser(profile);

        // 3. UserDetails für Spring Security verpacken
        CustomUserDetails userDetails = new CustomUserDetails(user);

        // Wir geben einen UsernamePasswordAuthenticationToken zurück, damit er
        // exakt so aussieht wie ein lokaler Form-Login für unseren TenantFilter.
        return new UsernamePasswordAuthenticationToken(userDetails, jwt, userDetails.getAuthorities());
    }
}
