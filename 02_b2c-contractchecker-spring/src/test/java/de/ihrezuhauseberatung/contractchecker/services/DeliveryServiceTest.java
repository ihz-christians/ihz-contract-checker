package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.*;
import de.ihrezuhauseberatung.contractchecker.services.export.EmailProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class DeliveryServiceTest {

    private EmailProvider emailProvider;
    private EmailDeliveryService deliveryService;

    @BeforeEach
    void setUp() {
        emailProvider = mock(EmailProvider.class);
        deliveryService = new EmailDeliveryService(emailProvider);
    }

    @Test
    void testDeliverLegalAction_Success() {
        // Arrange
        User user = User.builder()
                .firstName("Max")
                .lastName("Mustermann")
                .email("max@mustermann.de")
                .build();

        Contract contract = Contract.builder()
                .contractType("Stromvertrag")
                .build();

        LegalAction action = LegalAction.builder()
                .id(UUID.randomUUID())
                .actionType(LegalActionType.CANCELLATION)
                .user(user)
                .contract(contract)
                .build();

        byte[] pdfContent = "PDF-CONTENT".getBytes();

        // Act
        String receiptId = deliveryService.deliverLegalAction(action, pdfContent);

        // Assert
        assertNotNull(receiptId);
        assertTrue(receiptId.startsWith("email-receipt-"));
        verify(emailProvider).sendEmailWithAttachment(
                eq("max@mustermann.de"),
                contains("Bestätigung"),
                anyString(),
                eq(pdfContent),
                contains("Kuendigung")
        );
    }
}
