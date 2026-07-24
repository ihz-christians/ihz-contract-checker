package de.ihrezuhauseberatung.contractchecker.workers;

import de.ihrezuhauseberatung.contractchecker.models.LegalAction;
import de.ihrezuhauseberatung.contractchecker.models.LegalActionStatus;
import de.ihrezuhauseberatung.contractchecker.repositories.LegalActionRepository;
import de.ihrezuhauseberatung.contractchecker.services.LegalActionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class LegalActionOutboxWorker {

    private final LegalActionRepository legalActionRepository;
    private final LegalActionService legalActionService;

    // Runs every 30 seconds
    @Scheduled(fixedDelayString = "${app.legal-action.worker.delay:30000}")
    @Transactional
    public void processPendingActions() {
        // Fetch up to 10 pending actions, using pessimistic locking (SKIP LOCKED is ideal but handled at DB/driver level usually via custom dialects, FOR UPDATE is minimum required)
        List<LegalAction> pendingActions = legalActionRepository.findTop10ByStatusWithLock(LegalActionStatus.PENDING);
        
        if (!pendingActions.isEmpty()) {
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
