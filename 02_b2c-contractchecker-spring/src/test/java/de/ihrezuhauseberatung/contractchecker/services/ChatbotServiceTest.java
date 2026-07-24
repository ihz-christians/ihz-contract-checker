package de.ihrezuhauseberatung.contractchecker.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.ihrezuhauseberatung.contractchecker.integration.AiGatewayClient;
import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatbotServiceTest {

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private AiGatewayClient aiGatewayClient;

    private ObjectMapper objectMapper;
    private ChatbotService chatbotService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        chatbotService = new ChatbotService(contractRepository, aiGatewayClient, objectMapper);
    }

    @Test
    void shouldReturnFallbackIfNoQuestionProvided() {
        String response = chatbotService.generateResponse("", UUID.randomUUID(), "DSL");
        assertThat(response).isEqualTo("Entschuldigung, ich habe Ihre Frage nicht verstanden.");
    }

    @Test
    void shouldReturnGenericFallbackIfContractNotFound() {
        UUID randomId = UUID.randomUUID();
        when(contractRepository.findById(randomId)).thenReturn(Optional.empty());

        String response = chatbotService.generateResponse("Wie sind die Kosten?", randomId, "DSL");
        
        assertThat(response).contains("Ich bin nicht mit einem konkreten Vertrag verbunden");
        verify(aiGatewayClient, never()).askChatbot(anyString(), anyString());
    }

    @Test
    void shouldSerializeContextAndCallAiGatewayWhenContractExists() throws JsonProcessingException {
        // ARRANGE
        UUID contractId = UUID.randomUUID();
        Contract mockContract = new Contract();
        mockContract.setId(contractId);
        mockContract.setFilename("Vodafone_Giga.pdf");
        
        // Wir bauen eine fiktive, aber realistische Summary Map auf (wie sie ContractSummaryGenerator ausspuckt)
        Map<String, Object> mockSummary = new HashMap<>();
        Map<String, Object> legalCheck = new HashMap<>();
        legalCheck.put("legalScore", 70);
        legalCheck.put("recommendation", "Risiko gefunden");
        mockSummary.put("legalCheck", legalCheck);
        mockContract.setSummary(mockSummary);

        when(contractRepository.findById(contractId)).thenReturn(Optional.of(mockContract));
        when(aiGatewayClient.askChatbot(eq("Ist der Vertrag legal?"), anyString()))
                .thenReturn("Das ist die smarte Antwort vom LLM.");

        // ACT
        String response = chatbotService.generateResponse("Ist der Vertrag legal?", contractId, "DSL");

        // ASSERT
        // 1. Die finale Antwort muss genau die vom AI-Gateway sein
        assertThat(response).isEqualTo("Das ist die smarte Antwort vom LLM.");

        // 2. Wir fangen den JSON-String ab, der an das Python-Gateway geschickt wurde (Context Engineering)
        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiGatewayClient).askChatbot(eq("Ist der Vertrag legal?"), jsonCaptor.capture());

        String capturedJsonContext = jsonCaptor.getValue();
        
        // 3. Wir prüfen, ob der Jackson ObjectMapper das JSON richtig geschnürt hat
        @SuppressWarnings("unchecked")
        Map<String, Object> deserializedContext = objectMapper.readValue(capturedJsonContext, Map.class);
        
        assertThat(deserializedContext).containsKey("legalCheck");
        Map<String, Object> deserializedLegalCheck = (Map<String, Object>) deserializedContext.get("legalCheck");
        assertThat(deserializedLegalCheck.get("legalScore")).isEqualTo(70);
    }
}
