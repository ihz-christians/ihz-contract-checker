package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.domain.TcoResult;
import de.ihrezuhauseberatung.contractchecker.models.llm.ContractComponent;
import de.ihrezuhauseberatung.contractchecker.models.llm.ExtractedContractData;
import de.ihrezuhauseberatung.contractchecker.models.llm.PriceStage;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class ContractSummaryGenerator {

    private final TcoCalculationEngine tcoEngine;
    private final LegalComplianceEngine legalEngine;

    public ContractSummaryGenerator(TcoCalculationEngine tcoEngine, LegalComplianceEngine legalEngine) {
        this.tcoEngine = tcoEngine;
        this.legalEngine = legalEngine;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> generateAnalysisSummary(String extractedText, ExtractedContractData extractedData) {
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
        metadata.put("extractedRawText", extractedText); 
        root.put("metadata", metadata);

        // 1. Run BGB Legal Compliance Engine
        Map<String, Object> complianceResult = legalEngine.verifyBgbCompliance(extractedData);
        int legalScore = (Integer) complianceResult.getOrDefault("legalScore", 100);
        List<Map<String, String>> detectedViolations = (List<Map<String, String>>) complianceResult.get("violations");

        boolean isUnreadableScan = extractedText != null && extractedText.contains("keinen maschinenlesbaren Text");

        Map<String, Object> overview = new HashMap<>();
        overview.put("title", "📄 " + resolvedProvider + " " + resolvedContractType + " - PDF-Exakte Analyse");
        overview.put("isUnreadableScan", isUnreadableScan);

        overview.put("provider", resolvedProvider);
        overview.put("contractType", resolvedContractType);

        if (isUnreadableScan) {
            overview.put("summaryB1", "Das hochgeladene Dokument scheint ein reines Bild oder ein Scan zu sein, der keinen maschinenlesbaren Text enthält.");
            overview.put("targetAudienceBad", "Konnte aufgrund des fehlerhaften Scans nicht berechnet werden.");
        } else if (extractedData != null) {
            overview.put("summaryB1", extractedData.getSimpleSummary() != null ? extractedData.getSimpleSummary() : "Vertrag von " + resolvedProvider);
            overview.put("targetAudienceGood", extractedData.getTargetAudienceGood());
            overview.put("targetAudienceBad", extractedData.getTargetAudienceBad());
            overview.put("revocationAdvice", extractedData.getRevocationAdvice());
            overview.put("contactHotline", extractedData.getContactHotline());
            overview.put("telephonyRisks", extractedData.getTelephonyRisks());
            if (extractedData.getComparisonResult() != null) {
                overview.put("comparisonResult", extractedData.getComparisonResult());
            }
        }

        // TCO & Cashflow Calculation
        TcoResult tcoResult = tcoEngine.calculateTcoAndPhases(extractedData);
        
        overview.put("calculatedTco", tcoResult.tco());
        overview.put("effectiveMonthly", tcoResult.effectiveMonthly());

        List<Map<String, Object>> cashflowPhases = tcoResult.cashflowPhases();
        List<Map<String, Object>> rawPhases = tcoResult.rawTariffPhases();
        
        List<String> hiddenCosts = new ArrayList<>();
        
        // Risikobewertung anhand der ROHEN Tarife (ohne Startguthaben-Verzerrung)
        double firstMonthRawPrice = rawPhases.isEmpty() ? 0.0 : (double) rawPhases.get(0).get("price");
        double regularRawPrice = rawPhases.isEmpty() ? 0.0 : (double) rawPhases.get(rawPhases.size() - 1).get("price");

        List<ContractComponent> mainTariffs = new ArrayList<>();
        List<ContractComponent> hardware = new ArrayList<>();
        List<ContractComponent> addOns = new ArrayList<>();
        List<ContractComponent> discounts = new ArrayList<>();

        if (extractedData != null && extractedData.getComponents() != null) {
            for (ContractComponent comp : extractedData.getComponents()) {
                String cat = comp.getCategory() != null ? comp.getCategory().toUpperCase() : "";
                
                if (cat.contains("HAUPTTARIF") || cat.contains("TARIF") || comp.getName().toLowerCase().contains("tv connect") || comp.getName().toLowerCase().contains("kabelanschluss")) {
                    mainTariffs.add(comp);
                } else if (cat.contains("HARDWARE") || comp.getName().toLowerCase().contains("router") || comp.getName().toLowerCase().contains("station")) {
                    hardware.add(comp);
                } else if (cat.contains("RABATT") || comp.getName().toLowerCase().contains("rabatt") || comp.getName().toLowerCase().contains("gutschrift")) {
                    discounts.add(comp);
                } else {
                    addOns.add(comp);
                }

                // Versteckte Kosten ermitteln (Preissprünge innerhalb einzelner Komponenten)
                if (comp.getPrices() != null && comp.getPrices().size() > 1) {
                    hiddenCosts.add("Preissprung bei '" + comp.getName() + "' nach Aktionszeitraum!");
                }
            }
        }

        overview.put("mainTariffs", mainTariffs);
        overview.put("hardware", hardware);
        overview.put("addOns", addOns);
        overview.put("discounts", discounts);

        // Economic Risk Score
        int economicScore = 100;
        if (firstMonthRawPrice > 0 && regularRawPrice > firstMonthRawPrice) {
            double increaseRatio = (regularRawPrice - firstMonthRawPrice) / firstMonthRawPrice;
            if (increaseRatio > 1.0) {
                hiddenCosts.add("Kostenfalle: Die Fixkosten steigen im Vertragsverlauf um mehr als 100%!");
                economicScore -= 40;
            } else if (increaseRatio > 0.3) {
                hiddenCosts.add("Achtung: Der reguläre Preis ist deutlich höher als der Lockpreis.");
                economicScore -= 20;
            }
        }
        
        // Gesamt-Risikoampel (Mix aus Legal & Economic)
        int finalScore = Math.min(legalScore, economicScore);

        Map<String, Object> riskAmpel = new HashMap<>();
        if (finalScore < 40) {
            riskAmpel.put("color", "🔴");
            riskAmpel.put("score", finalScore);
            riskAmpel.put("description", "Hohes Risiko (Extreme Kostenfallen oder illegale Klauseln)");
        } else if (finalScore < 100) {
            riskAmpel.put("color", "🟡");
            riskAmpel.put("score", finalScore);
            String reason = hiddenCosts.isEmpty() ? "Wahrscheinlich Preissprünge nach Rabattphase" : hiddenCosts.get(0).replace("Kostenfalle: ", "");
            riskAmpel.put("description", "Mittleres Risiko (" + reason + ")");
        } else {
            riskAmpel.put("color", "🟢");
            riskAmpel.put("score", 100);
            riskAmpel.put("description", "Geringes Risiko - Faire und transparente Preisstruktur");
        }
        overview.put("riskAmpel", riskAmpel);

        Map<String, Object> duration = new HashMap<>();
        duration.put("months", resolvedDuration);
        duration.put("cancellationPeriod", extractedData != null && extractedData.getCancellationPeriodMonths() != null ? extractedData.getCancellationPeriodMonths() : 1);
        duration.put("endDate", "Siehe Kündigungsfrist");
        duration.put("autoRenewal", true);
        duration.put("renewalPeriod", extractedData != null && extractedData.getAutoRenewalMonths() != null ? extractedData.getAutoRenewalMonths() : 1);
        overview.put("contractDuration", duration);

        Map<String, Object> costs = new HashMap<>();
        // Hier geben wir in die UI den tatsächlichen Erst- und Letzt-Cashflow aus (z.B. für "Jetzt vs Später" Vergleiche)
        double firstMonthCashflow = cashflowPhases.isEmpty() ? 0.0 : (double) cashflowPhases.get(0).get("price");
        double regularCashflow = cashflowPhases.isEmpty() ? 0.0 : (double) cashflowPhases.get(cashflowPhases.size() - 1).get("price");

        costs.put("firstMonthPrice", firstMonthCashflow);
        costs.put("regularPrice", regularCashflow);
        costs.put("tco24", tcoResult.tco());
        costs.put("effectiveMonthly", tcoResult.effectiveMonthly());
        
        // Das echte Cashflow-Aggregat für die UI Timeline
        costs.put("phases", cashflowPhases);
        
        // NEU: Die Zahlungsrealität ausgeben
        costs.put("paymentReality", tcoResult.paymentReality());
        
        // Price Curve Analysis
        if (regularCashflow > firstMonthCashflow) {
            costs.put("priceCurve", "increasing");
        } else if (regularCashflow < firstMonthCashflow) {
            costs.put("priceCurve", "decreasing");
        } else {
            costs.put("priceCurve", "stable");
        }

        costs.put("hidden", hiddenCosts);
        overview.put("costs", costs);

        root.put("overview", overview);

        Map<String, Object> legalCheck = new HashMap<>();
        legalCheck.put("legalScore", legalScore);

        if (legalScore < 100) {
            legalCheck.put("recommendation", "🔴 RECHTLICHE BEDENKEN: Unzulässige Fristen detektiert!");
        } else {
            legalCheck.put("recommendation", "🟢 ALLES IN ORDNUNG: Keine offensichtlichen, standardisierten Rechtsverstöße.");
        }
        
        legalCheck.put("mandatoryElementsBGB", detectedViolations != null ? detectedViolations : new ArrayList<>());

        root.put("legalCheck", legalCheck);

        return root;
    }
}
