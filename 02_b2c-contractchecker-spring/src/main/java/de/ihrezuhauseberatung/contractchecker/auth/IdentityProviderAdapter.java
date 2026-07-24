package de.ihrezuhauseberatung.contractchecker.auth;

import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Der Port (Interface) für unsere Identitätsprovider.
 * Garantiert, dass wir jeden Anbieter (Firebase, Keycloak, Auth0) nahtlos
 * austauschen können, solange er dieses Interface implementiert.
 */
public interface IdentityProviderAdapter {
    
    /**
     * @return Der Name des Providers (z.B. "firebase" oder "keycloak")
     */
    String getProviderName();

    /**
     * Extrahiert ein standardisiertes SsoUserProfile aus einem providerspezifischen JWT.
     *
     * @param jwt Das JWT-Token aus dem Authorization-Header
     * @return Das standardisierte Profil
     */
    SsoUserProfile extractUserProfile(Jwt jwt);
}
