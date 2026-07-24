package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.config.TenantContext;
import de.ihrezuhauseberatung.contractchecker.models.AnalysisTask;
import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.models.llm.ContractComponent;
import de.ihrezuhauseberatung.contractchecker.models.llm.ExtractedContractData;
import de.ihrezuhauseberatung.contractchecker.models.llm.PriceStage;
import de.ihrezuhauseberatung.contractchecker.repositories.AnalysisTaskRepository;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import de.ihrezuhauseberatung.contractchecker.integration.AiGatewayClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import static net.logstash.logback.argument.StructuredArguments.kv;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class ContractService {

    private final ContractRepository contractRepository;
    private final AnalysisTaskRepository taskRepository;
    private final DocumentParsingService parsingService;
    private final TcoCalculationEngine tcoEngine;
    private final LegalComplianceEngine legalEngine;
    private final TextProcessingService textProcessingService;
    private final StorageService storageService;
    private final AiGatewayClient aiGatewayClient;

    public ContractService(ContractRepository contractRepository,
                           AnalysisTaskRepository taskRepository,
                           DocumentParsingService parsingService,
                           TcoCalculationEngine tcoEngine,
                           LegalComplianceEngine legalEngine,
                           TextProcessingService textProcessingService,
                           StorageService storageService,
                           AiGatewayClient aiGatewayClient) {
        this.contractRepository = contractRepository;
        this.taskRepository = taskRepository;
        this.parsingService = parsingService;
        this.tcoEngine = tcoEngine;
        this.legalEngine = legalEngine;
        this.textProcessingService = textProcessingService;
        this.storageService = storageService;
        this.aiGatewayClient = aiGatewayClient;
    }

    @Transactional
    public Contract saveAndStartAnalysis(String filename, byte[] fileContent, 
                                         String compareFilename, byte[] compareFileContent,
                                         String contractType, User user) {
        UUID tenantId = TenantContext.getCurrentTenant();
        
        // 1. Upload physische Datei in Google Cloud Storage
        String storagePath = "contracts/" + user.getTenant().getId() + "/" + user.getId() + "/" + UUID.randomUUID() + "_" + filename;
        String contentType = filename.toLowerCase().endsWith(".pdf") ? "application/pdf" : "text/plain";
        String gcsUri = storageService.uploadFile(storagePath, fileContent, contentType);
        
        String compareGcsUri = null;
        if (compareFilename != null && compareFileContent != null && compareFileContent.length > 0) {
            String compareStoragePath = "contracts/" + user.getTenant().getId() + "/" + user.getId() + "/" + UUID.randomUUID() + "_compare_" + compareFilename;
            String compareContentType = compareFilename.toLowerCase().endsWith(".pdf") ? "application/pdf" : "text/plain";
            compareGcsUri = storageService.uploadFile(compareStoragePath, compareFileContent, compareContentType);
        }

        Contract contract = Contract.builder()
                .id(UUID.randomUUID())
                .tenant(user.getTenant())
                .user(user)
                .filename(filename)
                .filepath(gcsUri)
                .compareFilename(compareFilename)
                .compareFilepath(compareGcsUri)
                .contractType(contractType)
                .build();

        Contract savedContract = contractRepository.save(contract);

        AnalysisTask task = AnalysisTask.builder()
                .id(UUID.randomUUID())
                .tenant(user.getTenant())
                .contract(savedContract)
                .user(user)
                .status("pending")
                .progress(0)
                .build();

        AnalysisTask savedTask = taskRepository.save(task);
        
        log.info("Analysis Pipeline Started",
                kv("event", "OPS_METRIC_ANALYSIS_STARTED"),
                kv("contractId", savedContract.getId()),
                kv("tenantId", tenantId),
                kv("taskId", savedTask.getId()));

        // Webhook URL (in Produktion aus Config laden, hier als lokaler Standard)
        // WICHTIG: Wenn Python aus seinem Docker-Container (oder host) Java anpingt,
        // muss host.docker.internal genutzt werden, falls Python in Docker läuft.
        // Da wir Python hier NATIV starten (uv run), funktioniert localhost:8080!
        String webhookUrl = "http://localhost:8080/api/internal/webhooks/ai-result";

        try {
            // Starte asynchronen Job auf dem Python Gateway
            boolean accepted = aiGatewayClient.startAnalysis(
                savedTask.getId().toString(),
                gcsUri,
                compareGcsUri,
                webhookUrl,
                tenantId.toString()
            );

            if (!accepted) {
                System.err.println("WARNUNG: AI Gateway hat den Task nicht akzeptiert (kein HTTP 202)!");
                savedTask.setStatus("error");
                savedTask.setErrorMessage("AI Gateway lehnte den Task ab.");
                taskRepository.save(savedTask);
            }
        } catch (Exception e) {
            System.err.println("FEHLER beim Aufruf des AI Gateways: " + e.getMessage());
            savedTask.setStatus("error");
            savedTask.setErrorMessage("Python AI-Gateway nicht erreichbar: " + e.getMessage());
            taskRepository.save(savedTask);
        }

        return savedContract;
    }

    // ACHTUNG: Die simulateAsyncAnalysis Methode wurde entfernt, da die Analyse 
    // jetzt komplett im Python AI Gateway läuft und via Webhook zurückgemeldet wird.
    
    private void updateProgress(UUID taskId, int progress, String status, Map<String, Object> result, UUID tenantId, UUID userId) {
        // Explicitly set ThreadLocal variables since executor threads don't share the Web Thread's ThreadLocal
        TenantContext.setCurrentTenant(tenantId);
        TenantContext.setCurrentUser(userId);
        try {
            taskRepository.findById(taskId).ifPresent(task -> {
                task.setProgress(progress);
                task.setStatus(status);
                if (result != null) {
                    task.setResult(result);
                }
                taskRepository.save(task);
            });
        } finally {
            TenantContext.clear();
        }
    }

    private void setContractSummary(UUID contractId, Map<String, Object> summary, UUID tenantId, UUID userId) {
        TenantContext.setCurrentTenant(tenantId);
        TenantContext.setCurrentUser(userId);
        try {
            contractRepository.findById(contractId).ifPresent(contract -> {
                contract.setSummary(summary);
                contractRepository.save(contract);
            });
        } finally {
            TenantContext.clear();
        }
    }

    @Transactional(readOnly = true)
    public List<Contract> getMyContracts() {
        UUID userId = TenantContext.getCurrentUser();
        if (userId == null) {
            return Collections.emptyList();
        }
        return contractRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Optional<Contract> getContractById(UUID contractId) {
        return contractRepository.findById(contractId);
    }

    @Transactional(readOnly = true)
    public Optional<AnalysisTask> getTaskByContractId(UUID contractId) {
        return taskRepository.findByContractId(contractId);
    }

    @Transactional
    public void deleteContract(UUID contractId) {
        contractRepository.deleteById(contractId);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> generateAnalysisSummary(String extractedText, ExtractedContractData extractedData) {
        Map<String, Object> root = new HashMap<>();
        
        String resolvedContractType = extractedData != null && extractedData.getMainContractName() != null ? extractedData.getMainContractName() : "Allgemeiner Vertrag";
        String resolvedProvider = extractedData != null && extractedData.getProvider() != null ? extractedData.getProvider() : "Unbekannt";
        Integer resolvedDuration = extractedData != null && extractedData.getDurationMonths() != null ? extractedData.getDurationMonths() : 24;

        // Metadata
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("uploadDate", OffsetDateTime.now().toString());
        metadata.put("sourceType", "Upload");
        metadata.put("userIntent", "Verstehen");
        metadata.put("contractType", resolvedProvider + " - " + resolvedContractType);
        metadata.put("urgency", "Normal");
        metadata.put("extractedRawText", extractedText); // Speichert den ausgelesenen OCR-Text
        root.put("metadata", metadata);

        // 1. Run our BGB Legal Compliance Engine dynamically on extracted text!
        Map<String, Object> complianceResult = legalEngine.verifyBgbCompliance(extractedData);
        int legalScore = (Integer) complianceResult.getOrDefault("legalScore", 100);
        List<Map<String, String>> detectedViolations = (List<Map<String, String>>) complianceResult.get("violations");

        // Overview
        Map<String, Object> overview = new HashMap<>();
        overview.put("title", "📄 " + resolvedProvider + " " + resolvedContractType + " - PDF-Exakte Analyse");
        
        if (legalScore < 100) {
            overview.put("summaryB1", resolvedProvider + " " + resolvedContractType + " erkannt. WARNUNG: Dieser Vertrag enthält Klauseln, die nach deutschen Verbraucherschutzgesetzen (§ 309 Nr. 9 BGB) voraussichtlich rechtswidrig sind!");
        } else {
            overview.put("summaryB1", resolvedProvider + " " + resolvedContractType + " erfolgreich ausgelesen. Die gesetzlichen Vorgaben scheinen eingehalten zu werden.");
        }

        List<String> bulletpoints = new ArrayList<>();
        bulletpoints.add("📅 Laufzeit: " + resolvedDuration + " Monate");

        // TCO Calculation via Component Engine
        java.math.BigDecimal calculatedTco = tcoEngine.calculateTco(extractedData);
        bulletpoints.add("💡 GESAMTKOSTEN: " + calculatedTco + "€ über " + resolvedDuration + " Monate");

        // Dynamische Bausteine als Bulletpoints aufschlüsseln
        List<String> hiddenCosts = new ArrayList<>();
        double currentPrice = 0.0;
        double regularPrice = 0.0;

        if (extractedData != null && extractedData.getComponents() != null) {
            for (ContractComponent comp : extractedData.getComponents()) {
                StringBuilder compStr = new StringBuilder();
                if ("Haupttarif".equalsIgnoreCase(comp.getCategory()) || "Tarif".equalsIgnoreCase(comp.getCategory())) {
                    compStr.append("📡 ");
                } else if ("Hardware".equalsIgnoreCase(comp.getCategory())) {
                    compStr.append("🔌 ");
                } else if ("Rabatt".equalsIgnoreCase(comp.getCategory()) || comp.getName().toLowerCase().contains("rabatt") || comp.getName().toLowerCase().contains("gutschrift")) {
                    compStr.append("🎁 ");
                } else {
                    compStr.append("📺 ");
                }
                
                compStr.append(comp.getCategory().toUpperCase()).append(" '").append(comp.getName()).append("': ");
                
                if (comp.getOneTimeCharge() != 0) {
                    compStr.append("Einmalig ").append(comp.getOneTimeCharge()).append("€ ");
                }
                
                if (comp.getPrices() != null && !comp.getPrices().isEmpty()) {
                    for (PriceStage ps : comp.getPrices()) {
                        compStr.append("| ").append(ps.getAmount()).append("€ (M. ").append(ps.getStartMonth()).append("-").append(ps.getEndMonth()).append(") ");
                        if ("Haupttarif".equalsIgnoreCase(comp.getCategory()) || "Tarif".equalsIgnoreCase(comp.getCategory())) {
                            if (ps.getStartMonth() <= 1) currentPrice += ps.getAmount();
                            if (ps.getEndMonth() >= 24) regularPrice += ps.getAmount();
                        }
                    }
                }
                
                bulletpoints.add(compStr.toString().trim());

                // Finde Preissprünge / Gefahren in den Komponenten
                if (comp.getPrices() != null && comp.getPrices().size() > 1) {
                    hiddenCosts.add(comp.getName() + " wird nach Ablauf der Aktionstempo/Rabatte teurer!");
                }
            }
        }

        if (legalScore < 100) {
            bulletpoints.add("⚠️ RECHTSVERSTOẞ: Unzulässige Klauseln nach § 309 Nr.9 BGB erkannt!");
        }
        overview.put("keyBulletpoints", bulletpoints);
        
        Map<String, Object> riskAmpel = new HashMap<>();
        if (legalScore < 70) {
            riskAmpel.put("color", "🔴");
            riskAmpel.put("score", legalScore);
            riskAmpel.put("description", "Sehr hohes Risiko - Illegale Klauseln gefunden!");
        } else if (legalScore < 100) {
            riskAmpel.put("color", "🟡");
            riskAmpel.put("score", legalScore);
            riskAmpel.put("description", "Erhöhtes Risiko - Eventuell rechtswidrige Verlängerungsklauseln.");
        } else {
            riskAmpel.put("color", "🟢");
            riskAmpel.put("score", 100);
            riskAmpel.put("description", "Geringes Risiko - Keine schwerwiegenden BGB Verstöße.");
        }
        overview.put("riskAmpel", riskAmpel);

        Map<String, Object> duration = new HashMap<>();
        duration.put("months", resolvedDuration);
        duration.put("endDate", "Siehe Kündigungsfrist");
        duration.put("autoRenewal", true);
        duration.put("renewalPeriod", extractedData != null && extractedData.getAutoRenewalMonths() != null ? extractedData.getAutoRenewalMonths() : 1);
        overview.put("contractDuration", duration);

        Map<String, Object> costs = new HashMap<>();
        costs.put("current", currentPrice);
        costs.put("regular", regularPrice);
        costs.put("tco24", calculatedTco);
        
        if (currentPrice > 0 && currentPrice < regularPrice) {
            hiddenCosts.add("Haupttarif erhöht sich im Laufe des Vertrages!");
        }
        costs.put("hidden", hiddenCosts);
        overview.put("costs", costs);
        
        root.put("overview", overview);

        // Legal Check
        Map<String, Object> legalCheck = new HashMap<>();
        legalCheck.put("legalScore", legalScore);
        
        if (legalScore < 100) {
            legalCheck.put("recommendation", "🔴 RECHTLICHE BEDENKEN: Unzulässige Verlängerungs- oder Kündigungsfristen detektiert!");
        } else {
            legalCheck.put("recommendation", "🟢 ALLES IN ORDNUNG: Dieser Vertrag enthält keine offensichtlichen, standardisierten Rechtsverstöße.");
        }
        
        List<Map<String, String>> mandatoryElements = new ArrayList<>();
        
        // Dynamically add detected violations to BGB check UI card
        if (detectedViolations != null && !detectedViolations.isEmpty()) {
            for (Map<String, String> violation : detectedViolations) {
                mandatoryElements.add(createMandatoryElement(
                        violation.get("check") + ": " + violation.get("explanation"),
                        violation.get("status"),
                        violation.get("paragraph")
                ));
            }
        } else {
            mandatoryElements.add(createMandatoryElement("Kündigungsmöglichkeit nach Mindestlaufzeit", "✅", "§309 Nr. 9 BGB"));
        }
        
        legalCheck.put("mandatoryElementsBGB", mandatoryElements);

        List<Map<String, String>> violations = new ArrayList<>(detectedViolations != null ? detectedViolations : Collections.emptyList());
        if (currentPrice > 0 && regularPrice >= currentPrice * 1.5) {
             violations.add(createViolation("Preissprung von über 50% nach Aktionszeitraum!", "Fairness", "medium"));
        }
        legalCheck.put("consumerViolations", violations);
        
        root.put("legalCheck", legalCheck);

        // Recommendations
        Map<String, Object> recs = new HashMap<>();
        List<String> immediateActions = new ArrayList<>();
        if (currentPrice < regularPrice) {
             immediateActions.add("🚨 PRÜFEN: Kündigung vor Ende des Aktionszeitraums vorbereiten, um Preisexplosion auf " + regularPrice + "€ zu vermeiden.");
        } else {
             immediateActions.add("✅ Sie zahlen bereits den Standardpreis. Überprüfen Sie regelmäßig Wechselangebote der Konkurrenz.");
        }

        if (legalScore < 100) {
            immediateActions.add("⚖️ WEGEN UNZULÄSSIGKEIT: Kündigungsschutz oder sofortigen Widerruf prüfen!");
        }
        recs.put("immediateActions", immediateActions);
        root.put("recommendations", recs);

        root.put("riskScore", 100 - legalScore);
        root.put("complianceScore", legalScore);

        return root;
    }

    private Map<String, String> createMandatoryElement(String check, String status, String paragraph) {
        Map<String, String> m = new HashMap<>();
        m.put("check", check);
        m.put("status", status);
        m.put("paragraph", paragraph);
        return m;
    }

    private Map<String, String> createViolation(String violation, String paragraph, String severity) {
        Map<String, String> m = new HashMap<>();
        m.put("violation", violation);
        m.put("paragraph", paragraph);
        m.put("severity", severity);
        return m;
    }
}
