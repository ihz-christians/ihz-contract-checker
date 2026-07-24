package de.ihrezuhauseberatung.contractchecker.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.ihrezuhauseberatung.contractchecker.models.AnalysisTask;
import de.ihrezuhauseberatung.contractchecker.models.Tenant;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.repositories.AnalysisTaskRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiWebhookServiceTest {

    @Mock
    private AnalysisTaskRepository taskRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ContractSummaryGenerator summaryGenerator;

    private AiWebhookService webhookService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        webhookService = new AiWebhookService(taskRepository, contractRepository, summaryGenerator, objectMapper);
    }

    @Test
    void shouldUpdateProgressWhenStatusIsInProgress() {
        // Arrange
        UUID taskId = UUID.randomUUID();
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        
        User user = new User();
        user.setId(UUID.randomUUID());
        
        AnalysisTask task = new AnalysisTask();
        task.setId(taskId);
        task.setTenant(tenant);
        task.setUser(user);
        task.setStatus("pending");
        task.setProgress(0);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        Map<String, Object> payload = new HashMap<>();
        payload.put("taskId", taskId.toString());
        payload.put("status", "IN_PROGRESS");
        payload.put("progress", 50);

        // Act
        webhookService.processAiResult(payload);

        // Assert
        ArgumentCaptor<AnalysisTask> taskCaptor = ArgumentCaptor.forClass(AnalysisTask.class);
        verify(taskRepository).save(taskCaptor.capture());

        AnalysisTask savedTask = taskCaptor.getValue();
        assertThat(savedTask.getProgress()).isEqualTo(50);
        assertThat(savedTask.getStatus()).isEqualTo("pending");
    }

    @Test
    void shouldHandleErrorStatus() {
        // Arrange
        UUID taskId = UUID.randomUUID();
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        
        AnalysisTask task = new AnalysisTask();
        task.setId(taskId);
        task.setTenant(tenant);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        Map<String, Object> payload = new HashMap<>();
        payload.put("taskId", taskId.toString());
        payload.put("status", "FAILED");
        payload.put("errorMessage", "MinIO Not Reachable");

        // Act
        webhookService.processAiResult(payload);

        // Assert
        ArgumentCaptor<AnalysisTask> taskCaptor = ArgumentCaptor.forClass(AnalysisTask.class);
        verify(taskRepository).save(taskCaptor.capture());

        AnalysisTask savedTask = taskCaptor.getValue();
        assertThat(savedTask.getStatus()).isEqualTo("error");
        assertThat(savedTask.getErrorMessage()).isEqualTo("MinIO Not Reachable");
    }
}
