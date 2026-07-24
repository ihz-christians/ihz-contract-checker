package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.auth.IdentityProviderAdapter;
import de.ihrezuhauseberatung.contractchecker.auth.SsoJwtAuthenticationConverter;
import de.ihrezuhauseberatung.contractchecker.config.CustomUserDetails;
import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.models.LegalActionType;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.models.Tenant;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import de.ihrezuhauseberatung.contractchecker.services.LegalActionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.context.annotation.Import;
import de.ihrezuhauseberatung.contractchecker.config.SecurityConfig;

@WebMvcTest(LegalActionController.class)
@org.springframework.boot.test.mock.mockito.MockBean({de.ihrezuhauseberatung.contractchecker.config.TenantFilter.class, de.ihrezuhauseberatung.contractchecker.auth.SsoJwtAuthenticationConverter.class})
@Import(SecurityConfig.class)
class LegalActionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private de.ihrezuhauseberatung.contractchecker.config.TenantFilter tenantFilter;

    @MockBean
    private ContractRepository contractRepository;

    @MockBean
    private LegalActionService legalActionService;

    @MockBean
    private IdentityProviderAdapter idpAdapter;

    private CustomUserDetails mockUser;
    private Contract mockContract;

    @BeforeEach
    void setUp() throws Exception {
        org.mockito.Mockito.doAnswer(invocation -> {
            jakarta.servlet.ServletRequest request = invocation.getArgument(0);
            jakarta.servlet.ServletResponse response = invocation.getArgument(1);
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(request, response);
            return null;
        }).when(tenantFilter).doFilter(any(), any(), any());

        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail("test@test.com");
        Tenant t = new Tenant();
        t.setId(UUID.randomUUID());
        u.setTenant(t);
        mockUser = new CustomUserDetails(u);
        
        mockContract = new Contract();
        mockContract.setId(UUID.randomUUID());
    }

    @Test
    void executeLegalAction_ValidIntent_ShouldQueueAction() throws Exception {
        when(contractRepository.findById(mockContract.getId())).thenReturn(Optional.of(mockContract));

        mockMvc.perform(post("/contract/" + mockContract.getId() + "/action/cancellation")
                        .with(user(mockUser))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Erfolgreich beauftragt!")));

        verify(legalActionService).createPendingAction(
                any(Contract.class), 
                any(), 
                any(), 
                org.mockito.ArgumentMatchers.eq(LegalActionType.CANCELLATION)
        );
    }

    @Test
    void executeLegalAction_InvalidIntent_ShouldReturnError() throws Exception {
        when(contractRepository.findById(mockContract.getId())).thenReturn(Optional.of(mockContract));

        mockMvc.perform(post("/contract/" + mockContract.getId() + "/action/unknown")
                        .with(user(mockUser))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Unbekannte Aktion")));
    }
}
