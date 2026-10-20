package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.auth.IdentityProviderAdapter;
import de.ihrezuhauseberatung.contractchecker.auth.SsoJwtAuthenticationConverter;
import de.ihrezuhauseberatung.contractchecker.services.ChatbotService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChatbotController.class)
@org.springframework.boot.test.mock.mockito.MockBean({de.ihrezuhauseberatung.contractchecker.config.TenantFilter.class, de.ihrezuhauseberatung.contractchecker.auth.SsoJwtAuthenticationConverter.class})
@AutoConfigureMockMvc(addFilters = false) // Security für den Test deaktivieren
class ChatbotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChatbotService chatbotService;

    @MockBean
    private de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository contractRepository;

    // Security Mocks, damit der ApplicationContext sauber lädt
    @MockBean
    private IdentityProviderAdapter idpAdapter;
    @MockBean
    private SsoJwtAuthenticationConverter ssoJwtAuthenticationConverter;

    @Test
    void shouldFormatMarkdownToTailwindHtmlCorrectly() throws Exception {
        // ARRANGE
        UUID contractId = UUID.randomUUID();
        
        // Wir simulieren eine Antwort von Gemini (Python), die rohes Markdown mit unseren Custom-Tags enthält
        String rawGeminiMarkdown = "Das ist **fett**, das ist !!gefährlich!! und das ist __wichtig__.\n\n- Liste 1\n- Liste 2";
        
        when(chatbotService.generateResponse(anyString(), any(UUID.class), anyString()))
                .thenReturn(rawGeminiMarkdown);

        // ACT & ASSERT
        mockMvc.perform(post("/chatbot/query")
                        .param("question", "Test Frage")
                        .param("contractId", contractId.toString())
                        .param("contractType", "DSL"))
                .andExpect(status().isOk())
                // Prüfen, ob "!!gefährlich!!" in rote Warn-Tags (Destructive) umgewandelt wurde
                .andExpect(content().string(containsString("class=\"font-extrabold text-destructive bg-destructive/10 px-1 rounded\">gefährlich</strong>")))
                // Prüfen, ob "__wichtig__" in gelbe Warn-Tags (Amber) umgewandelt wurde
                .andExpect(content().string(containsString("class=\"font-bold text-amber-700 bg-amber-100 px-1 rounded\">wichtig</span>")))
                // Prüfen, ob "**fett**" im grünen Primary-Font gerendert wurde
                .andExpect(content().string(containsString("class=\"font-extrabold text-primary\">fett</strong>")))
                // Prüfen, ob "- Liste 1" in ein echtes HTML <li> Tag umgewandelt wurde
                .andExpect(content().string(containsString("<li class=\"ml-5 list-disc")));
    }

    @Test
    void shouldRenderActionWidgetWhenJsonIsReturned() throws Exception {
        UUID contractId = UUID.randomUUID();
        String jsonResponse = "{\"type\": \"ACTION_READY\", \"intent\": \"cancellation\", \"provider\": \"Vodafone\", \"action_date\": \"sofort\"}";
        
        when(chatbotService.generateResponse(anyString(), any(UUID.class), anyString()))
                .thenReturn(jsonResponse);

        mockMvc.perform(post("/chatbot/query")
                        .param("question", "Test Frage")
                        .param("contractId", contractId.toString())
                        .param("contractType", "DSL"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("<!-- Bot Message (Action Widget) -->")))
                .andExpect(content().string(containsString("Vodafone")))
                .andExpect(content().string(containsString("Jetzt verbindlich kündigung")));
    }
}
