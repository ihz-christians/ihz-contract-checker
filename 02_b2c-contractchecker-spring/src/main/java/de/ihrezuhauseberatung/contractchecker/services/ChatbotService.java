package de.ihrezuhauseberatung.contractchecker.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.ihrezuhauseberatung.contractchecker.integration.AiGatewayClient;
import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ChatbotService {

    private final ContractRepository contractRepository;
    private final AiGatewayClient aiGatewayClient;
    private final ObjectMapper objectMapper;

    public ChatbotService(ContractRepository contractRepository, AiGatewayClient aiGatewayClient, ObjectMapper objectMapper) {
        this.contractRepository = contractRepository;
        this.aiGatewayClient = aiGatewayClient;
        this.objectMapper = objectMapper;
    }

    public String generateResponse(String question, String contractType) {
        return generateResponse(question, null, contractType);
    }

    public String generateResponse(String question, UUID contractId, String fallbackContractType) {
        if (question == null || question.trim().isEmpty()) {
            return "Entschuldigung, ich habe Ihre Frage nicht verstanden.";
        }

        // 1. Wenn wir eine ContractID haben, schicken wir die echte KI (Gemini) los!
        if (contractId != null) {
            Optional<Contract> contractOpt = contractRepository.findById(contractId);
            if (contractOpt.isPresent()) {
                Contract contract = contractOpt.get();
                Map<String, Object> summary = contract.getSummary();
                
                if (summary != null) {
                    try {
                        // CONTEXT ENGINEERING: Wir serialisieren die harte Business Logik (Kosten, BGB) als JSON für das LLM
                        String contextJson = objectMapper.writeValueAsString(summary);
                        
                        // PROMPT ENGINEERING: Der Request geht nun ans Python Gateway zu Gemini
                        return aiGatewayClient.askChatbot(question, contextJson);
                        
                    } catch (JsonProcessingException e) {
                        return "Interner Fehler bei der Aufbereitung der Vertragsdaten.";
                    }
                }
            }
        }

        // 2. Fallback, falls kein Vertrag vorliegt (nur Demo-Antwort)
        return "🤖 Ich bin nicht mit einem konkreten Vertrag verbunden. Bitte rufen Sie den Chat über die Vertragsdetails auf.";
    }
}
