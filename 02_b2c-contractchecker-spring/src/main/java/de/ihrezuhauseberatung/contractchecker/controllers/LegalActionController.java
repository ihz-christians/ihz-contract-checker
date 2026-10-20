package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.models.*;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import de.ihrezuhauseberatung.contractchecker.services.LegalActionService;
import de.ihrezuhauseberatung.contractchecker.config.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class LegalActionController {

    private final ContractRepository contractRepository;
    private final LegalActionService legalActionService;

    @PostMapping("/contract/{contractId}/action/{intent}")
    @ResponseBody
    public String executeLegalAction(
            @PathVariable UUID contractId,
            @PathVariable String intent,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
            
        try {
            // Find contract strictly scoped to the tenant
            Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Vertrag nicht gefunden"));

            // IDOR Protection: Ensure contract belongs to authenticated user
            if (contract.getUser() != null && userDetails != null && !contract.getUser().getId().equals(userDetails.getUserId())) {
                log.warn("IDOR violation: User {} attempted to act on contract {} owned by {}",
                        userDetails.getUserId(), contractId, contract.getUser().getId());
                throw new org.springframework.security.access.AccessDeniedException("Zugriff verweigert: Vertrag gehört einem anderen Benutzer");
            }
                
            LegalActionType actionType = switch (intent.toLowerCase()) {
                case "cancellation" -> LegalActionType.CANCELLATION;
                case "revocation" -> LegalActionType.REVOCATION;
                case "downgrade" -> LegalActionType.DOWNGRADE;
                default -> throw new IllegalArgumentException("Unbekannte Aktion: " + intent);
            };
            
            // Generate the User and Tenant proxies (since they're already fetched in SecurityContext)
            User user = new User();
            user.setId(userDetails.getUserId());
            
            Tenant tenant = new Tenant();
            tenant.setId(userDetails.getTenantId());
            
            // Create the pending outbox entry!
            legalActionService.createPendingAction(contract, user, tenant, actionType);
            
            log.info("Successfully queued legal action {} for contract {}", actionType, contractId);
            
            return "<div class=\"text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg font-semibold flex items-center gap-2 mt-2\">" +
                   "  <span class=\"text-lg\">✅</span>" +
                   "  Erfolgreich beauftragt! Das Dokument wird nun generiert und rechtssicher versandt." +
                   "</div>";
                   
        } catch (Exception e) {
            log.error("Failed to queue legal action for contract {}", contractId, e);
            return "<div class=\"text-red-700 bg-red-50 px-3 py-2 rounded-lg font-semibold mt-2\">" +
                   "  Fehler bei der Beauftragung: " + e.getMessage() +
                   "</div>";
        }
    }
}
