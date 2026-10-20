package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.config.TenantContext;
import de.ihrezuhauseberatung.contractchecker.models.*;
import de.ihrezuhauseberatung.contractchecker.repositories.LegalActionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Service
@RequiredArgsConstructor
@Slf4j
public class LegalActionService {

    private final LegalActionRepository legalActionRepository;
    private final DocumentGenerationService documentGenerationService;
    private final DeliveryService deliveryService;

    @Transactional
    public LegalAction createPendingAction(Contract contract, User user, Tenant tenant, LegalActionType type) {
        LegalAction action = LegalAction.builder()
                .contract(contract)
                .user(user)
                .tenant(tenant)
                .actionType(type)
                .status(LegalActionStatus.PENDING)
                .build();
        
        LegalAction saved = legalActionRepository.save(action);
        
        log.info("New Legal Action requested",
                kv("event", "OPS_METRIC_LEGAL_ACTION_REQUESTED"),
                kv("actionType", type.name()),
                kv("contractId", contract.getId()),
                kv("userId", user.getId()),
                kv("tenantId", tenant.getId()),
                kv("actionId", saved.getId()));
                
        return saved;
    }

    @Transactional
    public List<LegalAction> fetchPendingActionsWithLock() {
        return legalActionRepository.findTop10ByStatusWithLock(LegalActionStatus.PENDING);
    }

    @Transactional
    public void processPendingAction(LegalAction action) {
        log.info("Processing LegalAction {} of type {}", action.getId(), action.getActionType());
        
        try {
            // Restore tenant and user context for this specific action
            if (action.getTenant() != null) {
                TenantContext.setCurrentTenant(action.getTenant().getId());
            }
            if (action.getUser() != null) {
                TenantContext.setCurrentUser(action.getUser().getId());
            }

            // 1. Mark as GENERATING to prevent other workers from picking it up
            action.setStatus(LegalActionStatus.GENERATING);
            legalActionRepository.saveAndFlush(action);

            // 2. Generate PDF
            byte[] generatedPdf = documentGenerationService.generateLegalActionPdf(action);
            
            // 3. Generate SHA-256 Hash for Audit Trail
            String documentHash = calculateSha256(generatedPdf);
            action.setDocumentHash(documentHash);

            // 4. Send via Provider
            String receiptId = deliveryService.deliverLegalAction(action, generatedPdf);
            
            // 5. Update Status
            action.setProviderReceiptId(receiptId);
            action.setStatus(LegalActionStatus.SENT); // Next step would be checking DELIVERED asynchronously
            
            log.info("Successfully processed LegalAction",
                    kv("event", "OPS_METRIC_LEGAL_ACTION_PROCESSED"),
                    kv("actionId", action.getId()),
                    kv("actionType", action.getActionType().name()),
                    kv("tenantId", action.getTenant().getId()),
                    kv("receiptId", receiptId));
        } catch (Exception e) {
            log.error("Failed to process LegalAction",
                    kv("event", "OPS_ALERT_LEGAL_ACTION_FAILED"),
                    kv("actionId", action.getId()),
                    kv("actionType", action.getActionType().name()),
                    kv("tenantId", action.getTenant().getId()),
                    kv("error", e.getMessage()), e);
            action.setStatus(LegalActionStatus.FAILED);
            action.setErrorMessage(e.getMessage());
        } finally {
            TenantContext.clear();
        }
        
        legalActionRepository.save(action);
    }

    private String calculateSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not supported", e);
        }
    }
}
