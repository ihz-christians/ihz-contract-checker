package de.ihrezuhauseberatung.contractchecker.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.ihrezuhauseberatung.contractchecker.config.TenantContext;
import de.ihrezuhauseberatung.contractchecker.models.AnalysisTask;
import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.models.llm.ExtractedContractData;
import de.ihrezuhauseberatung.contractchecker.repositories.AnalysisTaskRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Service
public class AiWebhookService {

    private static final Logger log = LoggerFactory.getLogger(AiWebhookService.class);

    private final AnalysisTaskRepository taskRepository;
    private final ContractRepository contractRepository;
    private final ContractSummaryGenerator summaryGenerator;
    private final ObjectMapper objectMapper;

    public AiWebhookService(AnalysisTaskRepository taskRepository,
                            ContractRepository contractRepository,
                            ContractSummaryGenerator summaryGenerator,
                            ObjectMapper objectMapper) {
        this.taskRepository = taskRepository;
        this.contractRepository = contractRepository;
        this.summaryGenerator = summaryGenerator;
        this.objectMapper = objectMapper;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public void processAiResult(Map<String, Object> payload) {
        // Python sendet camelCase (taskId), unser Test/Alt-Code hat task_id genutzt. Wir unterstützen beides:
        String taskIdStr = (String) payload.get("taskId");
        if (taskIdStr == null) {
            taskIdStr = (String) payload.get("task_id");
        }
        
        if (taskIdStr == null) {
            log.error("Webhook payload is missing 'taskId' or 'task_id'");
            return;
        }

        UUID taskId = UUID.fromString(taskIdStr);
        Optional<AnalysisTask> taskOpt = taskRepository.findById(taskId);

        if (taskOpt.isEmpty()) {
            log.error("Received webhook for unknown task ID: {}", taskId);
            return;
        }

        AnalysisTask task = taskOpt.get();

        // RLS Context wiederherstellen, damit wir auf den Contract zugreifen dürfen!
        TenantContext.setCurrentTenant(task.getTenant().getId());
        if (task.getUser() != null) {
            TenantContext.setCurrentUser(task.getUser().getId());
        }

        try {
            String status = (String) payload.get("status");

            if ("ERROR".equalsIgnoreCase(status) || "FAILED".equalsIgnoreCase(status)) {
                task.setStatus("error"); // UI expects "error" (lowercase is safer or just match it)
                
                String errMsg = (String) payload.get("errorMessage");
                if (errMsg == null) errMsg = (String) payload.get("error_message");
                
                task.setErrorMessage(errMsg);
                taskRepository.save(task);
                log.warn("Task finished with error/failed", 
                        kv("event", "OPS_ALERT_ANALYSIS_FAILED"),
                        kv("taskId", taskId),
                        kv("tenantId", task.getTenant().getId()),
                        kv("error", task.getErrorMessage()));
                return;
            }

            if ("IN_PROGRESS".equalsIgnoreCase(status) || "PROCESSING".equalsIgnoreCase(status)) {
                task.setStatus("pending");
                Integer progress = null;
                if (payload.get("progress") instanceof Number) {
                    progress = ((Number) payload.get("progress")).intValue();
                } else if (payload.get("progress") instanceof String) {
                    try {
                        progress = Integer.parseInt((String) payload.get("progress"));
                    } catch (NumberFormatException ignored) {}
                }
                if (progress != null) {
                    task.setProgress(progress);
                }
                taskRepository.save(task);
                log.info("Task {} progress updated to {}%", taskId, progress);
                return;
            }

            // SUCCESS-Verarbeitung
            task.setStatus("completed");
            task.setProgress(100);

            // Audit Trail speichern (Extrem wichtig für Compliance!)
            if (payload.containsKey("audit_trail")) {
                task.setAuditTrail((Map<String, Object>) payload.get("audit_trail"));
            }

            // JSON zu Java-Modell konvertieren
            ExtractedContractData extractedData = null;
            Object extractedDataPayload = payload.get("extractedData");
            if (extractedDataPayload == null) {
                extractedDataPayload = payload.get("extracted_data");
            }

            String rawText = "Kein Rohtext vom Gateway empfangen.";

            if (extractedDataPayload != null) {
                Map<String, Object> dataMap = (Map<String, Object>) extractedDataPayload;
                if (dataMap.containsKey("_raw_extracted_text")) {
                    rawText = (String) dataMap.get("_raw_extracted_text");
                }
                extractedData = objectMapper.convertValue(extractedDataPayload, ExtractedContractData.class);
            }

            // Business-Logik ausführen (TCO + Legal)
            Map<String, Object> summary = summaryGenerator.generateAnalysisSummary(rawText, extractedData);
            task.setResult(summary);
            taskRepository.save(task);

            // Contract aktualisieren
            Contract contract = task.getContract();
            if (contract != null) {
                contract.setSummary(summary);
                contractRepository.save(contract);
            }

            log.info("Analysis Pipeline Completed", 
                    kv("event", "OPS_METRIC_ANALYSIS_COMPLETED"),
                    kv("taskId", taskId),
                    kv("contractId", contract != null ? contract.getId() : null),
                    kv("tenantId", task.getTenant().getId()),
                    kv("userId", task.getUser() != null ? task.getUser().getId() : null));

        } catch (Exception e) {
            log.error("Error processing AI Webhook",
                    kv("event", "OPS_ALERT_WEBHOOK_PROCESSING_ERROR"),
                    kv("taskId", taskId),
                    kv("error", e.getMessage()), e);
            task.setStatus("ERROR");
            task.setErrorMessage("Internal Processing Error: " + e.getMessage());
            taskRepository.save(task);
        } finally {
            TenantContext.clear();
        }
    }
}
