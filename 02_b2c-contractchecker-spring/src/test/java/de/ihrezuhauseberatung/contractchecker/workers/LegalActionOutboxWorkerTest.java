package de.ihrezuhauseberatung.contractchecker.workers;

import de.ihrezuhauseberatung.contractchecker.models.LegalAction;
import de.ihrezuhauseberatung.contractchecker.models.LegalActionStatus;
import de.ihrezuhauseberatung.contractchecker.repositories.LegalActionRepository;
import de.ihrezuhauseberatung.contractchecker.services.LegalActionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.Mockito.*;

class LegalActionOutboxWorkerTest {

    private LegalActionRepository legalActionRepository;
    private LegalActionService legalActionService;
    private LegalActionOutboxWorker worker;

    @BeforeEach
    void setUp() {
        legalActionRepository = mock(LegalActionRepository.class);
        legalActionService = mock(LegalActionService.class);
        worker = new LegalActionOutboxWorker(legalActionRepository, legalActionService);
    }

    @Test
    void testProcessPendingActions_WhenActionsExist_ShouldProcessThem() {
        LegalAction action1 = LegalAction.builder().id(UUID.randomUUID()).build();
        LegalAction action2 = LegalAction.builder().id(UUID.randomUUID()).build();
        
        when(legalActionRepository.findTop10ByStatusWithLock(LegalActionStatus.PENDING))
                .thenReturn(Arrays.asList(action1, action2));

        worker.processPendingActions();

        verify(legalActionRepository, times(1)).findTop10ByStatusWithLock(LegalActionStatus.PENDING);
        verify(legalActionService, times(1)).processPendingAction(action1);
        verify(legalActionService, times(1)).processPendingAction(action2);
    }

    @Test
    void testProcessPendingActions_WhenServiceThrowsException_ShouldContinueProcessingOthers() {
        LegalAction action1 = LegalAction.builder().id(UUID.randomUUID()).build();
        LegalAction action2 = LegalAction.builder().id(UUID.randomUUID()).build();

        when(legalActionRepository.findTop10ByStatusWithLock(LegalActionStatus.PENDING))
                .thenReturn(Arrays.asList(action1, action2));
                
        // action1 throws exception
        doThrow(new RuntimeException("API Error")).when(legalActionService).processPendingAction(action1);

        worker.processPendingActions();

        // Should still try to process action2 despite action1 failing
        verify(legalActionService, times(1)).processPendingAction(action1);
        verify(legalActionService, times(1)).processPendingAction(action2);
    }

    @Test
    void testProcessPendingActions_WhenNoActionsExist_ShouldDoNothing() {
        when(legalActionRepository.findTop10ByStatusWithLock(LegalActionStatus.PENDING))
                .thenReturn(Collections.emptyList());

        worker.processPendingActions();

        verify(legalActionRepository, times(1)).findTop10ByStatusWithLock(LegalActionStatus.PENDING);
        verifyNoInteractions(legalActionService);
    }
}
