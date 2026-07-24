package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.auth.SsoUserProfile;
import de.ihrezuhauseberatung.contractchecker.auth.IdentityProviderAdapter;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.services.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthSyncController {

    private final UserService userService;
    private final IdentityProviderAdapter idpAdapter;

    public AuthSyncController(UserService userService, IdentityProviderAdapter idpAdapter) {
        this.userService = userService;
        this.idpAdapter = idpAdapter;
    }

    /**
     * Wird vom Frontend (z.B. React/Next.js) direkt nach einem erfolgreichen
     * Firebase/Keycloak-Login mit dem JWT-Token im Authorization-Header aufgerufen.
     * Sorgt dafür, dass der Nutzer in der PostgreSQL RLS-Tabelle existiert.
     */
    @PostMapping("/auth/sync-user")
    public User syncFirebaseUser(@AuthenticationPrincipal Jwt jwt) {
        SsoUserProfile profile = idpAdapter.extractUserProfile(jwt);
        return userService.syncOrCreateSsoUser(profile);
    }
}
