package de.ihrezuhauseberatung.contractchecker.controllers.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.ihrezuhauseberatung.contractchecker.services.AiWebhookService;
// Mocking the required beans that break the context
import de.ihrezuhauseberatung.contractchecker.auth.IdentityProviderAdapter;
import de.ihrezuhauseberatung.contractchecker.auth.SsoJwtAuthenticationConverter;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import org.springframework.test.context.TestPropertySource;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AiWebhookController.class)
@AutoConfigureMockMvc(addFilters = false) // Security für den Test deaktivieren
@TestPropertySource(properties = "ai.gateway.internal-secret=ai-internal-secret-test")
class AiWebhookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AiWebhookService aiWebhookService;
    
    // Wir mocken die Security-Beans, damit der ApplicationContext sauber hochfährt
    @MockBean
    private IdentityProviderAdapter idpAdapter;
    @MockBean
    private SsoJwtAuthenticationConverter ssoJwtAuthenticationConverter;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @SuppressWarnings("unchecked")
    void shouldAcceptWebhookAndMapToExtractedDataCorrectly() throws Exception {
        // ARRANGE: Unser perfekter "Norm-Vertrag" von Python
        String webhookPayload = """
                {
                  "task_id": "123e4567-e89b-12d3-a456-426614174000",
                  "status": "COMPLETED",
                  "tenant_id": "mandant-abc",
                  "extracted_data": {
                    "provider": "MusterCom GmbH",
                    "mainContractName": "Premium Internet 250",
                    "durationMonths": 24,
                    "autoRenewalMonths": 1,
                    "cancellationPeriodMonths": 1,
                    "components": [
                      {
                        "name": "Grundgebühr Internet",
                        "category": "Haupttarif",
                        "oneTimeCharge": 39.99,
                        "prices": [
                          {
                            "startMonth": 1,
                            "endMonth": 6,
                            "amount": 19.99
                          }
                        ]
                      }
                    ]
                  }
                }
                """;

        // ACT: Senden des Webhooks an den Controller mit gültigem Secret
        mockMvc.perform(post("/api/internal/webhooks/ai-result")
                        .header("X-Internal-Secret", "ai-internal-secret-test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(webhookPayload))
                // ASSERT: Controller muss mit 200 OK antworten
                .andExpect(status().isOk());

        // ASSERT: Prüfen, ob der Service mit den richtigen Daten aufgerufen wurde
        ArgumentCaptor<Map<String, Object>> payloadCaptor = ArgumentCaptor.forClass(Map.class);
        verify(aiWebhookService).processAiResult(payloadCaptor.capture());

        Map<String, Object> capturedPayload = payloadCaptor.getValue();
        assertThat(capturedPayload.get("task_id")).isEqualTo("123e4567-e89b-12d3-a456-426614174000");
        assertThat(capturedPayload.get("status")).isEqualTo("COMPLETED");

        // Wir konvertieren das Map-Objekt um zu prüfen, ob Jackson das Mapping fehlerfrei schafft
        Map<String, Object> rawExtractedData = (Map<String, Object>) capturedPayload.get("extracted_data");
        de.ihrezuhauseberatung.contractchecker.models.llm.ExtractedContractData extractedData =
            objectMapper.convertValue(rawExtractedData, de.ihrezuhauseberatung.contractchecker.models.llm.ExtractedContractData.class);

        // Das wichtigste: Kündigungsfrist muss da sein!
        assertThat(extractedData.getCancellationPeriodMonths()).isEqualTo(1);
        assertThat(extractedData.getProvider()).isEqualTo("MusterCom GmbH");
        assertThat(extractedData.getComponents()).hasSize(1);
        assertThat(extractedData.getComponents().get(0).getCategory()).isEqualTo("Haupttarif");
    }

    @Test
    void shouldRejectWebhookWhenSecretIsMissingOrInvalid() throws Exception {
        String payload = "{\"task_id\": \"123e4567-e89b-12d3-a456-426614174000\"}";

        // Fehlender Header -> 401 Unauthorized
        mockMvc.perform(post("/api/internal/webhooks/ai-result")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());

        // Falscher Header -> 401 Unauthorized
        mockMvc.perform(post("/api/internal/webhooks/ai-result")
                        .header("X-Internal-Secret", "wrong-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());

        verify(aiWebhookService, never()).processAiResult(org.mockito.ArgumentMatchers.any());
    }
}
