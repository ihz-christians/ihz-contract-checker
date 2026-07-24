package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.llm.ExtractedContractData;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LegalComplianceEngine {

    /**
     * Prüft den strukturierten "Norm-Vertrag" gegen deutsches Verbraucherrecht (BGB / TKG).
     * Fokus auf Änderungen ab 01.03.2022 (Gesetz für faire Verbraucherverträge).
     */
    public Map<String, Object> verifyBgbCompliance(ExtractedContractData data) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, String>> violations = new ArrayList<>();

        if (data == null) {
            result.put("legalScore", 100);
            result.put("violations", violations);
            return result;
        }

        // 1. Check: Mindestlaufzeit (darf bei B2C Verträgen im Regelfall max 24 Monate sein)
        if (data.getDurationMonths() != null && data.getDurationMonths() > 24) {
            violations.add(createViolation(
                    "Überlange Mindestlaufzeit",
                    "§ 309 Nr. 9 lit. a BGB",
                    "Mindestlaufzeiten über 24 Monate sind in AGB-Verträgen unzulässig."
            ));
        }

        // 2. Check: Automatische Vertragsverlängerung (darf nur noch auf unbestimmte Zeit erfolgen, also 1 Monat)
        if (data.getAutoRenewalMonths() != null && data.getAutoRenewalMonths() > 1) {
            violations.add(createViolation(
                    "Automatische Vertragsverlängerung > 1 Monat",
                    "§ 309 Nr. 9 lit. b BGB",
                    "Eine stillschweigende Verlängerung um feste Zeiträume (z.B. 12 Monate) ist für Verträge ab 01.03.2022 verboten. Verträge dürfen sich nur auf unbestimmte Zeit verlängern."
            ));
        }

        // 3. Check: Kündigungsfrist (darf nicht länger als 1 Monat sein)
        if (data.getCancellationPeriodMonths() != null && data.getCancellationPeriodMonths() > 1) {
            violations.add(createViolation(
                    "Unzulässige Kündigungsfrist",
                    "§ 309 Nr. 9 lit. c BGB",
                    "Die Kündigungsfrist darf maximal 1 Monat vor Ablauf der Mindestvertragslaufzeit betragen. Frühere 3-Monats-Fristen sind unzulässig."
            ));
        }

        // Score berechnen (jeder Verstoß zieht 30 Punkte ab)
        int score = 100 - (violations.size() * 30);
        result.put("legalScore", Math.max(score, 0));
        result.put("violations", violations);

        return result;
    }

    private Map<String, String> createViolation(String check, String paragraph, String explanation) {
        Map<String, String> violation = new HashMap<>();
        violation.put("check", check);
        violation.put("paragraph", paragraph);
        violation.put("status", "❌ RECHTSWIDRIG");
        violation.put("explanation", explanation);
        return violation;
    }
}
