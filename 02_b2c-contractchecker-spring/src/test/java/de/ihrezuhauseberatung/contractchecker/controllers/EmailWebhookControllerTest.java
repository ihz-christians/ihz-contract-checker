package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.services.EmailWebhookService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class EmailWebhookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EmailWebhookService emailWebhookService;

    @Test
    void receiveEmail_missingToken_shouldReturnUnauthorized() throws Exception {
        MockMultipartFile file = new MockMultipartFile("attachment", "test.pdf", "application/pdf", "dummy content".getBytes());

        mockMvc.perform(multipart("/api/internal/webhooks/email")
                .file(file)
                .param("from", "kunde@example.com")
                .param("to", "max-mueller@ihrezuhauseberatung.de")
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void receiveEmail_invalidToken_shouldReturnUnauthorized() throws Exception {
        MockMultipartFile file = new MockMultipartFile("attachment", "test.pdf", "application/pdf", "dummy content".getBytes());

        mockMvc.perform(multipart("/api/internal/webhooks/email")
                .file(file)
                .param("from", "kunde@example.com")
                .param("to", "max-mueller@ihrezuhauseberatung.de")
                .header("X-Webhook-Secret", "wrong-token")
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void receiveEmail_validToken_shouldProcessAndReturnOk() throws Exception {
        MockMultipartFile file = new MockMultipartFile("attachment", "test.pdf", "application/pdf", "dummy content".getBytes());

        mockMvc.perform(multipart("/api/internal/webhooks/email")
                .file(file)
                .param("from", "kunde@example.com")
                .param("to", "max-mueller@ihrezuhauseberatung.de")
                .header("X-Webhook-Secret", "my-super-secret-token")
                .with(csrf()))
                .andExpect(status().isOk());

        verify(emailWebhookService).processIncomingEmail(
                eq("max-mueller@ihrezuhauseberatung.de"),
                eq("kunde@example.com"),
                eq("test.pdf"),
                any(byte[].class)
        );
    }
}
