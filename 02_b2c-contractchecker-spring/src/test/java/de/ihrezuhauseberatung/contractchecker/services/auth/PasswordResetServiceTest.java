package de.ihrezuhauseberatung.contractchecker.services.auth;

import de.ihrezuhauseberatung.contractchecker.config.TenantContext;
import de.ihrezuhauseberatung.contractchecker.models.PasswordResetToken;
import de.ihrezuhauseberatung.contractchecker.models.Tenant;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.repositories.PasswordResetTokenRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordResetTokenRepository tokenRepository;
    
    @Mock
    private AuthEmailService authEmailService;
    
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordResetService passwordResetService;

    @BeforeEach
    void setUp() {
        TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldInitiatePasswordReset() {
        // Arrange
        String email = "test@test.de";
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        User user = new User();
        user.setEmail(email);
        user.setTenant(tenant);
        
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        // Act
        passwordResetService.initiatePasswordReset(email, "http://localhost:8080", Locale.GERMAN);

        // Assert
        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(tokenCaptor.capture());
        PasswordResetToken savedToken = tokenCaptor.getValue();
        
        assertNotNull(savedToken.getToken());
        assertEquals(user, savedToken.getUser());
        assertTrue(savedToken.getExpiryDate().isAfter(OffsetDateTime.now()));
        
        verify(authEmailService).sendPasswordResetEmail(eq(user), eq(savedToken.getToken()), anyString(), eq(Locale.GERMAN));
        assertNull(TenantContext.getCurrentTenant()); // Ensure RLS context is cleared
    }

    @Test
    void shouldNotThrowExceptionForUnknownEmail_toPreventUserEnumeration() {
        // Arrange
        String email = "unknown@test.de";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act & Assert
        assertDoesNotThrow(() -> passwordResetService.initiatePasswordReset(email, "http://localhost:8080", Locale.GERMAN));
        verifyNoInteractions(tokenRepository);
        verifyNoInteractions(authEmailService);
    }
    
    @Test
    void shouldResetPassword() {
        // Arrange
        String token = "valid-token";
        String newPassword = "new-secure-password";
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        User user = new User();
        user.setEmail("test@test.de");
        user.setTenant(tenant);
        
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(OffsetDateTime.now().plusMinutes(30)); // valid
        
        when(tokenRepository.findByToken(token)).thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode(newPassword)).thenReturn("hashed-new-password");

        // Act
        passwordResetService.resetPassword(token, newPassword);

        // Assert
        assertEquals("hashed-new-password", user.getHashedPassword());
        verify(userRepository).save(user);
        verify(tokenRepository).delete(resetToken);
        assertNull(TenantContext.getCurrentTenant()); // Ensure RLS context is cleared
    }
}
