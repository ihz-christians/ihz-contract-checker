package de.ihrezuhauseberatung.contractchecker.controllers.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import de.ihrezuhauseberatung.contractchecker.services.AiWebhookService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/internal/webhooks")
public class AiWebhookController {

    private static final Logger log = LoggerFactory.getLogger(AiWebhookController.class);
    private final AiWebhookService aiWebhookService;

    public AiWebhookController(AiWebhookService aiWebhookService) {
        this.aiWebhookService = aiWebhookService;
    }

    @PostMapping("/ai-result")
    public ResponseEntity<Void> receiveAiResult(@RequestBody Map<String, Object> payload) {
        log.info("Received AI webhook payload for task: {}", payload.get("task_id"));
        
        // Asynchrone oder synchrone Übergabe an den Service
        aiWebhookService.processAiResult(payload);
        
        return ResponseEntity.ok().build();
    }
}
