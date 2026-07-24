package de.ihrezuhauseberatung.contractchecker.auth;

/**
 * Ein standardisiertes, unveränderliches Datenprofil für einen SSO-Benutzer.
 * Entkoppelt die interne Datenbank-Logik vollständig von Firebase oder Keycloak.
 */
public record SsoUserProfile(
        String providerId,
        String uid,
        String email,
        String firstName,
        String lastName
) {
}
