package de.ihrezuhauseberatung.contractchecker.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Component
@Slf4j
public class AiGatewayClient {

    private final RestClient restClient;
    private final String pythonGatewayUrl;

    public AiGatewayClient(
            RestClient.Builder restClientBuilder,
            @Value("${ai.gateway.url:http://localhost:8000}") String pythonGatewayUrl) {
        this.restClient = restClientBuilder.build();
        this.pythonGatewayUrl = pythonGatewayUrl;
    }

    /**
     * Startet einen asynchronen Analyse-Task im Python-Gateway.
     * @return true wenn das Gateway den Job akzeptiert hat (202 Accepted).
     */
    public boolean startAnalysis(String taskId, String s3Url, String compareS3Url, String callbackUrl, String tenantId) {
        Map<String, String> payload = new java.util.HashMap<>(Map.of(
                "task_id", taskId,
                "s3_url", s3Url,
                "callback_url", callbackUrl,
                "tenant_id", tenantId
        ));
        
        if (compareS3Url != null) {
            payload.put("compare_s3_url", compareS3Url);
        }

        try {
            long startTime = System.currentTimeMillis();
            boolean accepted = restClient.post()
                    .uri(pythonGatewayUrl + "/api/v1/analyze")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .exchange((request, response) -> {
                        // Wir erwarten ein 202 Accepted vom BackgroundTask-Controller
                        return response.getStatusCode().is2xxSuccessful();
                    });
                    
            log.info("LLM Request Sent",
                    kv("event", "OPS_METRIC_LLM_REQUEST"),
                    kv("taskId", taskId),
                    kv("tenantId", tenantId),
                    kv("durationMs", System.currentTimeMillis() - startTime),
                    kv("status", accepted ? "ACCEPTED" : "REJECTED"));
            return accepted;
        } catch (Exception e) {
            log.error("AI Gateway not reachable",
                    kv("event", "OPS_ALERT_LLM_OUTAGE"),
                    kv("taskId", taskId),
                    kv("tenantId", tenantId),
                    kv("error", e.getMessage()), e);
            throw e;
        }
    }

    public String askChatbot(String question, String contextJson) {
        long startTime = System.currentTimeMillis();
        Map<String, String> payload = Map.of(
                "question", question,
                "context_json", contextJson
        );

        try {
            Map<String, String> response = restClient.post()
                    .uri(pythonGatewayUrl + "/api/v1/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            log.info("Chatbot Request completed",
                    kv("event", "OPS_METRIC_CHATBOT_REQUEST"),
                    kv("durationMs", System.currentTimeMillis() - startTime));

            return response != null ? response.getOrDefault("answer", "Keine Antwort erhalten.") : "Fehler im Gateway.";
        } catch (Exception e) {
            log.error("Chatbot AI Gateway not reachable",
                    kv("event", "OPS_ALERT_LLM_OUTAGE"),
                    kv("error", e.getMessage()), e);
            return "Entschuldigung, der KI-Service ist derzeit nicht erreichbar.";
        }
    }
}
