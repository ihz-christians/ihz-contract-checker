package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.config.CustomUserDetails;
import de.ihrezuhauseberatung.contractchecker.services.export.ExportOrchestratorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;

import java.util.Locale;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.flash;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import de.ihrezuhauseberatung.contractchecker.auth.IdentityProviderAdapter;
import de.ihrezuhauseberatung.contractchecker.auth.SsoJwtAuthenticationConverter;

@WebMvcTest(ExportController.class)
class ExportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ExportOrchestratorService exportOrchestratorService;
    
    @MockBean
    private IdentityProviderAdapter identityProviderAdapter;
    
    @MockBean
    private SsoJwtAuthenticationConverter ssoJwtAuthenticationConverter;

    @Test
    void shouldTriggerExportAndRedirect() throws Exception {
        // Arrange
        UUID contractId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        
        de.ihrezuhauseberatung.contractchecker.models.Tenant mockTenant = de.ihrezuhauseberatung.contractchecker.models.Tenant.builder()
                .id(tenantId)
                .name("Test Tenant")
                .build();
                
        de.ihrezuhauseberatung.contractchecker.models.User userModel = new de.ihrezuhauseberatung.contractchecker.models.User();
        userModel.setId(userId);
        userModel.setTenant(mockTenant);
        userModel.setEmail("testuser@test.de");
        
        CustomUserDetails mockUser = new CustomUserDetails(userModel);

        // Act & Assert
        mockMvc.perform(post("/contract/" + contractId + "/export")
                        .with(csrf())
                        .with(user(mockUser))
                        .param("email", "kunde@test.de")
                        .locale(Locale.GERMAN))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/contract/" + contractId))
                .andExpect(flash().attributeExists("successMessage"));

        // Verify that the service was called securely with the mocked user's exact tenantId & userId
        verify(exportOrchestratorService).generateAndSendReport(
                eq(contractId),
                eq(tenantId),
                eq(userId),
                eq("kunde@test.de"),
                eq(Locale.GERMAN)
        );
    }
}
