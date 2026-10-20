package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.config.TenantContext;
import de.ihrezuhauseberatung.contractchecker.models.Tenant;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.repositories.TenantRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailWebhookService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final ContractService contractService;

    public void processIncomingEmail(String toAddress, String fromAddress, String filename, byte[] pdfContent) {
        String alias = extractAlias(toAddress);
        if (alias == null) {
            log.warn("Could not extract alias from toAddress", 
                    kv("event", "WEBHOOK_INVALID_ALIAS"),
                    kv("toAddress", toAddress),
                    kv("fromAddress", fromAddress));
            return;
        }

        Tenant tenant = tenantRepository.findByEmailAlias(alias).orElse(null);
        if (tenant == null) {
            log.warn("No tenant found for email alias", 
                    kv("event", "WEBHOOK_TENANT_NOT_FOUND"),
                    kv("alias", alias),
                    kv("fromAddress", fromAddress));
            return;
        }

        // Set TenantContext for RLS before accessing any tenant-scoped data
        TenantContext.clear();
        TenantContext.setBypassRls(true);
        User customer;
        try {
            Optional<User> userOpt = userRepository.findByEmail(fromAddress);
            if (userOpt.isEmpty() || userOpt.get().getTenant() == null || !userOpt.get().getTenant().getId().equals(tenant.getId())) {
                log.warn("Unregistered or non-matching sender attempted to submit document via Webhook", 
                        kv("event", "OPS_ALERT_WEBHOOK_REJECTED"),
                        kv("fromAddress", fromAddress),
                        kv("toAddress", toAddress),
                        kv("tenantId", tenant.getId()),
                        kv("reason", "USER_NOT_IN_WHITELIST"));
                return;
            }
            customer = userOpt.get();
        } finally {
            TenantContext.clear();
        }

        TenantContext.setCurrentTenant(tenant.getId());
        TenantContext.setCurrentUser(customer.getId());
        try {
            contractService.saveAndStartAnalysis(filename, pdfContent, null, null, "UNKNOWN", customer);
            
            log.info("Successfully processed incoming email and started analysis", 
                    kv("event", "WEBHOOK_PROCESSING_SUCCESS"),
                    kv("fromAddress", fromAddress),
                    kv("tenantId", tenant.getId()),
                    kv("userId", customer.getId()),
                    kv("filename", filename));
        } catch (Exception e) {
            log.error("Failed to process webhook analysis", 
                    kv("event", "OPS_ALERT_WEBHOOK_ERROR"),
                    kv("fromAddress", fromAddress),
                    kv("tenantId", tenant.getId()),
                    kv("error", e.getMessage()), e);
            throw e;
        } finally {
            TenantContext.clear();
        }
    }

    private String extractAlias(String email) {
        if (email == null || !email.contains("@")) return null;
        return email.split("@")[0];
    }
}
