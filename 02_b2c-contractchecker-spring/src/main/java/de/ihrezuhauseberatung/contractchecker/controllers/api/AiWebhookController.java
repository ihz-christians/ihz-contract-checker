package de.ihrezuhauseberatung.contractchecker.controllers.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import de.ihrezuhauseberatung.contractchecker.services.AiWebhookService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/internal/webhooks")
public class AiWebhookController {

    private static final Logger log = LoggerFactory.getLogger(AiWebhookController.class);
    private final AiWebhookService aiWebhookService;

    @Value("${ai.gateway.internal-secret:}")
    private String internalSecret;

    public AiWebhookController(AiWebhookService aiWebhookService) {
        this.aiWebhookService = aiWebhookService;
    }

    @PostMapping("/ai-result")
    public ResponseEntity<?> receiveAiResult(
            @RequestHeader(value = "X-Internal-Secret", required = false) String incomingSecret,
            @RequestBody Map<String, Object> payload) {
        log.info("Received AI webhook payload for task: {}", payload.get("task_id"));

        if (internalSecret == null || internalSecret.isBlank() || incomingSecret == null || !incomingSecret.equals(internalSecret)) {
            log.warn("Unauthorized AI webhook attempt: invalid or missing X-Internal-Secret");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        
        // Asynchrone oder synchrone Übergabe an den Service
        aiWebhookService.processAiResult(payload);
        
        return ResponseEntity.ok().build();
    }
}
