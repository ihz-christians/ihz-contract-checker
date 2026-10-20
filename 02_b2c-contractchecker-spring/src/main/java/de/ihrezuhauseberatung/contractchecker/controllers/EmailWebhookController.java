package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.services.EmailWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Slf4j
@RestController
@RequestMapping("/api/internal/webhooks")
@RequiredArgsConstructor
public class EmailWebhookController {

    private final EmailWebhookService emailWebhookService;

    @Value("${app.webhooks.secret:}")
    private String webhookSecret;

    @PostMapping("/email")
    public ResponseEntity<String> receiveEmail(
            @RequestHeader(value = "X-Webhook-Secret", required = false) String token,
            @RequestParam("from") String fromAddress,
            @RequestParam("to") String toAddress,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment) {

        if (webhookSecret == null || webhookSecret.isBlank() || token == null || !token.equals(webhookSecret)) {
            log.warn("Unauthorized webhook access attempt", 
                    kv("event", "OPS_ALERT_WEBHOOK_UNAUTHORIZED"),
                    kv("fromAddress", fromAddress),
                    kv("toAddress", toAddress));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        if (attachment == null || attachment.isEmpty()) {
            log.warn("Received email webhook without attachment", 
                    kv("event", "WEBHOOK_NO_ATTACHMENT"),
                    kv("fromAddress", fromAddress));
            return ResponseEntity.ok("No attachment found, ignoring");
        }

        try {
            // Processing is done asynchronously in the service to avoid timeouts for the webhook provider
            // For now, we call it synchronously but normally we would want an @Async here
            // or return 200 OK immediately and process via Message Queue.
            // As per architecture constraints, let's keep it simple and just call the service.
            emailWebhookService.processIncomingEmail(toAddress, fromAddress, attachment.getOriginalFilename(), attachment.getBytes());
            return ResponseEntity.ok("Processed");
        } catch (IOException e) {
            log.error("Failed to read email attachment", 
                    kv("event", "OPS_ALERT_WEBHOOK_IO_ERROR"),
                    kv("fromAddress", fromAddress),
                    kv("error", e.getMessage()), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to read attachment");
        } catch (Exception e) {
            log.error("Failed to process email webhook", 
                    kv("event", "OPS_ALERT_WEBHOOK_BUSINESS_ERROR"),
                    kv("fromAddress", fromAddress),
                    kv("error", e.getMessage()), e);
            // Always return 200 to webhook provider to prevent retries on business errors
            return ResponseEntity.ok("Processed with errors");
        }
    }
}
