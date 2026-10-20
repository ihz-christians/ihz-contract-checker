package de.ihrezuhauseberatung.contractchecker.workers;

import de.ihrezuhauseberatung.contractchecker.config.TenantContext;
import de.ihrezuhauseberatung.contractchecker.models.LegalAction;
import de.ihrezuhauseberatung.contractchecker.repositories.LegalActionRepository;
import de.ihrezuhauseberatung.contractchecker.services.LegalActionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class LegalActionOutboxWorker {

    private final LegalActionRepository legalActionRepository;
    private final LegalActionService legalActionService;

    // Runs every 30 seconds
    @Scheduled(fixedDelayString = "${app.legal-action.worker.delay:30000}")
    public void processPendingActions() {
        // System Worker: Temporarily bypass RLS to discover pending actions across all tenants
        TenantContext.clear();
        TenantContext.setBypassRls(true);
        List<LegalAction> pendingActions;
        try {
            pendingActions = legalActionService.fetchPendingActionsWithLock();
        } finally {
            TenantContext.clear();
        }
        
        if (pendingActions != null && !pendingActions.isEmpty()) {
            log.info("Found {} pending legal actions to process", pendingActions.size());
            for (LegalAction action : pendingActions) {
                try {
                    legalActionService.processPendingAction(action);
                } catch (Exception e) {
                    log.error("Fatal error processing legal action {}", action.getId(), e);
                }
            }
        }
    }
}
