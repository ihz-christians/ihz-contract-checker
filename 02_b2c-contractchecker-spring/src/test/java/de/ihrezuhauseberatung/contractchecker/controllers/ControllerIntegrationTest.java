package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.config.CustomUserDetails;
import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.models.Tenant;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.services.ChatbotService;
import de.ihrezuhauseberatung.contractchecker.services.ContractService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest({DashboardController.class, ContractController.class, ChatbotController.class})
@org.springframework.boot.test.mock.mockito.MockBean({de.ihrezuhauseberatung.contractchecker.config.TenantFilter.class, de.ihrezuhauseberatung.contractchecker.auth.SsoJwtAuthenticationConverter.class, de.ihrezuhauseberatung.contractchecker.auth.IdentityProviderAdapter.class})

@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class ControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ContractService contractService;

    @MockBean
    private ChatbotService chatbotService;

    @MockBean
    private de.ihrezuhauseberatung.contractchecker.repositories.UserRepository userRepository;

    @MockBean
    private de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository contractRepository;

    private CustomUserDetails customUserDetails;
    private UUID mockUserId;
    private UUID mockTenantId;

    @BeforeEach
    void setUp() {
        mockUserId = UUID.randomUUID();
        mockTenantId = UUID.randomUUID();

        Tenant tenant = Tenant.builder().id(mockTenantId).name("Test Tenant").build();
        User user = User.builder()
                .id(mockUserId)
                .tenant(tenant)
                .email("test@example.com")
                .firstName("John")
                .lastName("Doe")
                .build();

        customUserDetails = new CustomUserDetails(user);
    }

    @Test
    void indexRedirectsToDashboard() throws Exception {
        mockMvc.perform(get("/").with(user(customUserDetails)))
                .andExpect(status().isOk())
                .andExpect(view().name("index"));
    }

    @Test
    void dashboardPage_WithMockUser_LoadsSuccessfully() throws Exception {
        // Arrange
        when(contractService.getMyContracts()).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/dashboard").with(user(customUserDetails)))
                .andExpect(status().isOk())
                .andExpect(view().name("dashboard"))
                .andExpect(model().attributeExists("contracts"))
                ;

        verify(contractService, times(1)).getMyContracts();
    }

    @Test
    void viewContractAnalysis_Success_WithMissingJsonFields() throws Exception {
        // Arrange
        UUID contractId = UUID.randomUUID();
        
        // Mock a realistic Map structure for Thymeleaf to parse successfully
        // We INTENTIONALLY omit fields like mainTariffs, hardware, discounts, addOns, mandatoryElementsBGB
        // to prove that the template rendering does not crash with NullPointerException/TemplateProcessingException.
        java.util.Map<String, Object> summary = new java.util.HashMap<>();
        
        java.util.Map<String, Object> overview = new java.util.HashMap<>();
        overview.put("title", "Test Title");
        overview.put("summaryB1", "Test Summary");
        overview.put("provider", "Test Provider");
        overview.put("contractType", "Test Type");
        overview.put("targetAudienceGood", "Test Audience Good");
        overview.put("targetAudienceBad", "Test Audience Bad");
        overview.put("revocationAdvice", "Test Revocation");
        overview.put("telephonyRisks", "Test Risks");
        overview.put("contactHotline", "0800 12345");
        overview.put("calculatedTco", 10.0);
        overview.put("effectiveMonthly", 5.0);
        overview.put("isUnreadableScan", false);
        overview.put("mainTariffs", Collections.emptyList());
        overview.put("hardware", Collections.emptyList());
        overview.put("addOns", Collections.emptyList());
        overview.put("discounts", Collections.emptyList());
        
        java.util.Map<String, Object> contractDuration = new java.util.HashMap<>();
        contractDuration.put("months", 24);
        contractDuration.put("cancellationPeriod", 1);
        overview.put("contractDuration", contractDuration);

        java.util.Map<String, Object> costs = new java.util.HashMap<>();
        costs.put("hidden", Collections.emptyList());
        costs.put("phases", Collections.emptyList());
        overview.put("costs", costs);
        
        java.util.Map<String, Object> riskAmpel = new java.util.HashMap<>();
        riskAmpel.put("color", "🔴");
        riskAmpel.put("description", "High Risk");
        overview.put("riskAmpel", riskAmpel);
        
        java.util.Map<String, Object> legalCheck = new java.util.HashMap<>();
        legalCheck.put("mandatoryElementsBGB", Collections.emptyList());
        
        summary.put("overview", overview);
        summary.put("legalCheck", legalCheck);
        java.util.Map<String, Object> metadata = new java.util.HashMap<>();
        metadata.put("extractedRawText", "Raw Text");
        summary.put("metadata", metadata);

        Contract contract = Contract.builder()
                .id(contractId)
                .filename("test.pdf")
                .contractType("Internet")
                .summary(summary)
                .build();

        when(contractService.getContractById(contractId)).thenReturn(Optional.of(contract));

        // Act & Assert
        // If the template engine crashes, this will throw a NestedServletException containing a TemplateProcessingException.
        mockMvc.perform(get("/contract/{id}", contractId).with(user(customUserDetails)))
                .andExpect(status().isOk())
                .andExpect(view().name("contract_details"))
                .andExpect(model().attribute("contract", contract))
                .andExpect(model().attributeExists("analysis"));
    }

    @Test
    void chatbotQuery_ReturnsFormattedHtmxFragment() throws Exception {
        // Arrange
        String question = "Gibt es versteckte Kosten?";
        String botReply = "**Ja**, 4.99 € Router-Miete.";
        when(chatbotService.generateResponse(eq(question), any(), anyString())).thenReturn(botReply);

        // Act & Assert
        mockMvc.perform(post("/chatbot/query")
                        .param("question", question)
                        .param("contractType", "Kabel")
                        .with(user(customUserDetails))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Vertrags-Experte")))
                .andExpect(content().string(containsString("<strong class=\"font-extrabold text-primary\">Ja</strong>"))); // Markdown translation check

        verify(chatbotService, times(1)).generateResponse(eq(question), any(), anyString());
    }
}
