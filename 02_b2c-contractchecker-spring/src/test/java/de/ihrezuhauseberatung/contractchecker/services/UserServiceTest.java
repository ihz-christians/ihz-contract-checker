package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.Role;
import de.ihrezuhauseberatung.contractchecker.models.Tenant;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.repositories.RoleRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.TenantRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.UserRepository;
import de.ihrezuhauseberatung.contractchecker.services.auth.AuthEmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthEmailService authEmailService;

    @InjectMocks
    private UserService userService;

    private Tenant defaultTenant;
    private Role consumerRole;

    private static final UUID DEFAULT_B2C_TENANT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ROLE_CONSUMER_ID = UUID.fromString("e5b2a048-6fd3-40e1-bb76-2e99d865bfa3");

    @BeforeEach
    void setUp() {
        defaultTenant = Tenant.builder()
                .id(DEFAULT_B2C_TENANT_ID)
                .name("Default B2C Tenant")
                .build();

        consumerRole = Role.builder()
                .id(ROLE_CONSUMER_ID)
                .name("ROLE_CONSUMER")
                .build();
    }

    @Test
    void registerConsumerUser_Success() {
        // Arrange
        String email = "test@example.com";
        String rawPassword = "password123";
        String hashedPassword = "hashed_password123";
        String firstName = "Max";
        String lastName = "Mustermann";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(tenantRepository.findById(DEFAULT_B2C_TENANT_ID)).thenReturn(Optional.of(defaultTenant));
        when(roleRepository.findById(ROLE_CONSUMER_ID)).thenReturn(Optional.of(consumerRole));
        when(passwordEncoder.encode(rawPassword)).thenReturn(hashedPassword);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User registeredUser = userService.registerConsumerUser(email, rawPassword, firstName, lastName);

        // Assert
        assertThat(registeredUser).isNotNull();
        assertThat(registeredUser.getEmail()).isEqualTo(email);
        assertThat(registeredUser.getFirstName()).isEqualTo(firstName);
        assertThat(registeredUser.getLastName()).isEqualTo(lastName);
        assertThat(registeredUser.getHashedPassword()).isEqualTo(hashedPassword);
        assertThat(registeredUser.getTenant()).isEqualTo(defaultTenant);
        assertThat(registeredUser.getRole()).isEqualTo(consumerRole);
        assertThat(registeredUser.getIsActive()).isEqualTo(1);
        assertThat(registeredUser.getIsEmailVerified()).isEqualTo(1);

        verify(userRepository, times(1)).findByEmail(email);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void registerConsumerUser_EmailAlreadyExists_ThrowsException() {
        // Arrange
        String email = "existing@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(new User()));

        // Act & Assert
        assertThatThrownBy(() -> userService.registerConsumerUser(email, "password123", "A", "B"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("E-Mail-Adresse wird bereits verwendet");

        verify(userRepository, times(1)).findByEmail(email);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerConsumerUser_ShortPassword_ThrowsException() {
        assertThatThrownBy(() -> userService.registerConsumerUser("new@example.com", "short", "A", "B"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mindestens 8 Zeichen");
    }
}
