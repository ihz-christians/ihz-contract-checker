package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.auth.SsoUserProfile;
import de.ihrezuhauseberatung.contractchecker.config.TenantContext;
import de.ihrezuhauseberatung.contractchecker.models.Role;
import de.ihrezuhauseberatung.contractchecker.models.Tenant;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.repositories.RoleRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.TenantRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.UserRepository;
import de.ihrezuhauseberatung.contractchecker.services.auth.AuthEmailService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthEmailService authEmailService;

    // Fixed pre-seeded default IDs
    private static final UUID DEFAULT_B2C_TENANT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ROLE_CONSUMER_ID = UUID.fromString("e5b2a048-6fd3-40e1-bb76-2e99d865bfa3");

    public UserService(UserRepository userRepository, RoleRepository roleRepository,
                       TenantRepository tenantRepository, PasswordEncoder passwordEncoder,
                       AuthEmailService authEmailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.tenantRepository = tenantRepository;
        this.passwordEncoder = passwordEncoder;
        this.authEmailService = authEmailService;
    }

    @Transactional
    public User registerConsumerUser(String email, String password, String firstName, String lastName) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("E-Mail-Adresse wird bereits verwendet");
        }

        Tenant defaultTenant = tenantRepository.findById(DEFAULT_B2C_TENANT_ID)
                .orElseThrow(() -> new IllegalStateException("Standard B2C-Tenant nicht gefunden"));

        Role consumerRole = roleRepository.findById(ROLE_CONSUMER_ID)
                .orElseThrow(() -> new IllegalStateException("Standard Verbraucher-Rolle nicht gefunden"));

        User user = User.builder()
                .id(UUID.randomUUID())
                .tenant(defaultTenant)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .hashedPassword(passwordEncoder.encode(password))
                .role(consumerRole)
                .isActive(1)
                .isEmailVerified(1) // Default auto-verify for smooth testing
                .build();

        user = userRepository.save(user);
        
        // Send welcome email (asynchronously)
        authEmailService.sendWelcomeEmail(user, Locale.getDefault());
        
        return user;
    }

    /**
     * Synchronizes a user coming from an SSO Identity Provider (Firebase, Keycloak, etc.)
     * with the local PostgreSQL RLS database.
     */
    @Transactional
    public User syncOrCreateSsoUser(SsoUserProfile profile) {
        // Temporarily clear RLS tenant context to search users globally across the system
        TenantContext.clear();
        
        Optional<User> existingUser = userRepository.findByFirebaseUid(profile.uid());
        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        // Check if user exists by email (migration from local pass to SSO)
        Optional<User> byEmail = userRepository.findByEmail(profile.email());
        if (byEmail.isPresent()) {
            User u = byEmail.get();
            u.setFirebaseUid(profile.uid()); // Link the SSO account
            return userRepository.save(u);
        }

        // Completely new SSO user -> Create with defaults
        Tenant defaultTenant = tenantRepository.findById(DEFAULT_B2C_TENANT_ID)
                .orElseThrow(() -> new IllegalStateException("Standard B2C-Tenant nicht gefunden"));
        Role consumerRole = roleRepository.findById(ROLE_CONSUMER_ID)
                .orElseThrow(() -> new IllegalStateException("Standard Verbraucher-Rolle nicht gefunden"));

        User newUser = User.builder()
                .id(UUID.randomUUID())
                .tenant(defaultTenant)
                .email(profile.email())
                .firstName(profile.firstName())
                .lastName(profile.lastName())
                .firebaseUid(profile.uid())
                .role(consumerRole)
                .isActive(1)
                .isEmailVerified(1)
                .build();

        return userRepository.save(newUser);
    }
}
