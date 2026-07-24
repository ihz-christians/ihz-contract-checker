package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.llm.ExtractedContractData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class LegalComplianceEngineTest {

    private LegalComplianceEngine engine;

    @BeforeEach
    void setUp() {
        engine = new LegalComplianceEngine();
    }

    @Test
    void shouldReturnPerfectScoreForLegalContract() {
        // Ein perfekter, legaler Vertrag
        ExtractedContractData legalData = ExtractedContractData.builder()
                .durationMonths(24)
                .autoRenewalMonths(1)
                .cancellationPeriodMonths(1)
                .build();

        Map<String, Object> result = engine.verifyBgbCompliance(legalData);

        assertThat(result.get("legalScore")).isEqualTo(100);
        assertThat((List<?>) result.get("violations")).isEmpty();
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldFlagIllegalCancellationPeriod() {
        // Ein alter Vertrag mit 3 Monaten Kündigungsfrist
        ExtractedContractData illegalData = ExtractedContractData.builder()
                .durationMonths(24)
                .autoRenewalMonths(1)
                .cancellationPeriodMonths(3) // Hier ist der Verstoß!
                .build();

        Map<String, Object> result = engine.verifyBgbCompliance(illegalData);

        assertThat(result.get("legalScore")).isEqualTo(70); // 100 - 30

        List<Map<String, String>> violations = (List<Map<String, String>>) result.get("violations");
        assertThat(violations).hasSize(1);
        assertThat(violations.get(0).get("check")).isEqualTo("Unzulässige Kündigungsfrist");
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldFlagMultipleViolationsAndDropScoreToTen() {
        // Ein absolut illegaler Knebelvertrag
        ExtractedContractData evilData = ExtractedContractData.builder()
                .durationMonths(36) // max 24
                .autoRenewalMonths(12) // max 1
                .cancellationPeriodMonths(3) // max 1
                .build();

        Map<String, Object> result = engine.verifyBgbCompliance(evilData);

        assertThat(result.get("legalScore")).isEqualTo(10); // 100 - (3 * 30)

        List<Map<String, String>> violations = (List<Map<String, String>>) result.get("violations");
        assertThat(violations).hasSize(3);
    }
}
