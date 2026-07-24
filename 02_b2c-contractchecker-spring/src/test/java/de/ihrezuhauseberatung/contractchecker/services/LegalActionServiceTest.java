package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.*;
import de.ihrezuhauseberatung.contractchecker.repositories.LegalActionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LegalActionServiceTest {

    private LegalActionRepository legalActionRepository;
    private DocumentGenerationService documentGenerationService;
    private DeliveryService deliveryService;
    private LegalActionService legalActionService;

    @BeforeEach
    void setUp() {
        legalActionRepository = mock(LegalActionRepository.class);
        documentGenerationService = mock(DocumentGenerationService.class);
        deliveryService = mock(DeliveryService.class);
        legalActionService = new LegalActionService(legalActionRepository, documentGenerationService, deliveryService);
    }

    @Test
    void testCreatePendingAction() {
        Contract contract = new Contract();
        User user = new User();
        Tenant tenant = new Tenant();
        
        when(legalActionRepository.save(any(LegalAction.class))).thenAnswer(i -> i.getArguments()[0]);

        LegalAction action = legalActionService.createPendingAction(contract, user, tenant, LegalActionType.CANCELLATION);

        assertNotNull(action);
        assertEquals(LegalActionStatus.PENDING, action.getStatus());
        assertEquals(LegalActionType.CANCELLATION, action.getActionType());
        assertEquals(contract, action.getContract());
        
        verify(legalActionRepository).save(any(LegalAction.class));
    }

    @Test
    void testProcessPendingAction_Success_GeneratesHashAndUpdatesStatus() {
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        LegalAction action = LegalAction.builder()
                .id(UUID.randomUUID())
                .tenant(tenant)
                .status(LegalActionStatus.PENDING)
                .actionType(LegalActionType.CANCELLATION)
                .build();

        byte[] pdfContent = "Generated PDF Content".getBytes();
        when(documentGenerationService.generateLegalActionPdf(action)).thenReturn(pdfContent);
        when(deliveryService.deliverLegalAction(eq(action), eq(pdfContent))).thenReturn("email-receipt-12345");

        legalActionService.processPendingAction(action);

        assertEquals(LegalActionStatus.SENT, action.getStatus());
        assertNotNull(action.getDocumentHash(), "Document Hash should be generated");
        assertNotNull(action.getProviderReceiptId(), "Provider receipt should be populated");
        assertEquals("email-receipt-12345", action.getProviderReceiptId());
        
        // Check that repository was called
        verify(legalActionRepository, times(1)).saveAndFlush(action);
        verify(legalActionRepository, times(1)).save(action);
    }
}
