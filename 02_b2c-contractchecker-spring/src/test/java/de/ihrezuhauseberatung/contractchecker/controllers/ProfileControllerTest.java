package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.auth.IdentityProviderAdapter;
import de.ihrezuhauseberatung.contractchecker.auth.SsoJwtAuthenticationConverter;
import de.ihrezuhauseberatung.contractchecker.config.SecurityConfig;
import de.ihrezuhauseberatung.contractchecker.config.CustomUserDetails;
import de.ihrezuhauseberatung.contractchecker.models.Role;
import de.ihrezuhauseberatung.contractchecker.models.Tenant;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProfileController.class)
@Import({SecurityConfig.class})
public class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private IdentityProviderAdapter identityProviderAdapter;
    
    @MockBean
    private SsoJwtAuthenticationConverter ssoJwtAuthenticationConverter;

    private CustomUserDetails createMockUserDetails(UUID userId) {
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        Role role = new Role();
        role.setName("ROLE_USER");

        User user = new User();
        user.setId(userId);
        user.setEmail("test@example.com");
        user.setTenant(tenant);
        user.setRole(role);
        
        return new CustomUserDetails(user);
    }

    @Test
    public void testGetProfilePage_Unauthenticated() throws Exception {
        mockMvc.perform(get("/profil"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testGetProfilePage_Authenticated() throws Exception {
        UUID userId = UUID.randomUUID();
        CustomUserDetails userDetails = createMockUserDetails(userId);
        
        User mockUser = new User();
        mockUser.setId(userId);
        mockUser.setFirstName("Max");
        
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

        mockMvc.perform(get("/profil").with(user(userDetails)))
                .andExpect(status().isOk())
                .andExpect(view().name("profil"))
                .andExpect(model().attributeExists("userEmail"))
                .andExpect(model().attributeExists("user"));
    }

    @Test
    public void testSaveProfile_Authenticated() throws Exception {
        UUID userId = UUID.randomUUID();
        CustomUserDetails userDetails = createMockUserDetails(userId);
        
        User mockUser = new User();
        mockUser.setId(userId);
        
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        mockMvc.perform(post("/profil/save")
                        .with(user(userDetails))
                        .with(csrf())
                        .param("firstName", "Max")
                        .param("lastName", "Mustermann")
                        .param("street", "Musterstraße")
                        .param("houseNumber", "12")
                        .param("zipCode", "12345")
                        .param("city", "Musterstadt")
                        .param("tags", "Single, Student")
                        .param("customPrompt", "Ich bin Student"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/profil?success=true"));

        verify(userRepository, times(1)).save(argThat(user -> 
            "Max".equals(user.getFirstName()) &&
            "Mustermann".equals(user.getLastName()) &&
            "Musterstraße".equals(user.getStreet()) &&
            user.getAiContextTags().contains("Student") &&
            "Ich bin Student".equals(user.getAiCustomPrompt())
        ));
    }
}
