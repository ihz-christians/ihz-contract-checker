package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.domain.TcoResult;
import de.ihrezuhauseberatung.contractchecker.models.llm.ContractComponent;
import de.ihrezuhauseberatung.contractchecker.models.llm.ExtractedContractData;
import de.ihrezuhauseberatung.contractchecker.models.llm.PriceStage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TcoCalculationEngineTest {

    private TcoCalculationEngine engine;

    @BeforeEach
    void setUp() {
        engine = new TcoCalculationEngine();
    }

    @Test
    void calculateTco_shouldReturnZero_whenDataIsNull() {
        TcoResult result = engine.calculateTcoAndPhases(null);
        assertThat(result.tco()).isEqualByComparingTo("0.00");
        assertThat(result.paymentReality().freeMonths()).isEqualTo(0);
    }

    @Test
    void calculateTco_shouldReturnZero_whenComponentsAreEmpty() {
        ExtractedContractData data = ExtractedContractData.builder()
                .components(List.of())
                .build();

        TcoResult result = engine.calculateTcoAndPhases(data);
        assertThat(result.tco()).isEqualByComparingTo("0.00");
    }

    @Test
    void calculateCashflow_withNeutralizingOneTimeCharges() {
        // Einmalkosten: +49,99
        // Gutschrift: -49,99
        // -> Credit: 0,00
        // Monat 1-24: 10,00
        ContractComponent tariff = ContractComponent.builder()
                .name("Tarif")
                .oneTimeCharge(49.99)
                .prices(List.of(new PriceStage(1, 24, 10.00)))
                .build();
                
        ContractComponent discount = ContractComponent.builder()
                .name("Gutschrift")
                .oneTimeCharge(-49.99)
                .prices(List.of())
                .build();

        ExtractedContractData data = ExtractedContractData.builder()
                .components(List.of(tariff, discount))
                .build();

        TcoResult result = engine.calculateTcoAndPhases(data);
        
        assertThat(result.tco()).isEqualByComparingTo("240.00");
        assertThat(result.paymentReality().freeMonths()).isEqualTo(0);
        assertThat(result.paymentReality().firstPaymentMonth()).isEqualTo(1);
    }

    @Test
    void calculateCashflow_withInitialCreditCoveringMultipleMonths() {
        // 50€ Guthaben
        // 15€ Grundgebühr
        // Monat 1: 0€ (Restguthaben 35€)
        // Monat 2: 0€ (Restguthaben 20€)
        // Monat 3: 0€ (Restguthaben 5€)
        // Monat 4: 10€ (Restguthaben 0€)
        // Monat 5-24: 15€
        // Gesamt TCO = 24 * 15 - 50 = 310
        
        ContractComponent tariff = ContractComponent.builder()
                .name("Tarif")
                .oneTimeCharge(0.0)
                .prices(List.of(new PriceStage(1, 24, 15.00)))
                .build();
                
        ContractComponent discount = ContractComponent.builder()
                .name("Startguthaben")
                .oneTimeCharge(-50.00)
                .prices(List.of())
                .build();

        ExtractedContractData data = ExtractedContractData.builder()
                .components(List.of(tariff, discount))
                .build();

        TcoResult result = engine.calculateTcoAndPhases(data);
        
        assertThat(result.tco()).isEqualByComparingTo("310.00");
        assertThat(result.paymentReality().freeMonths()).isEqualTo(3);
        assertThat(result.paymentReality().firstPaymentMonth()).isEqualTo(4);
        
        // Prüfe die Phasen
        List<java.util.Map<String, Object>> cashflow = result.cashflowPhases();
        assertThat(cashflow).hasSize(3); // 1-3 (0€), 4 (10€), 5-24 (15€)
        assertThat(cashflow.get(0).get("price")).isEqualTo(0.0);
        assertThat(cashflow.get(1).get("price")).isEqualTo(10.0);
        assertThat(cashflow.get(2).get("price")).isEqualTo(15.0);
    }

    @Test
    void calculateTco_withStandardContract_shouldCalculateCorrectly() {
        // Berechnungsbeispiel:
        // Einmalgebühr Anschluss: 39,99
        // Monat 1-6 (Aktionszeitraum): 19,99 pro Monat = 6 * 19,99 = 119,94
        // Monat 7-24 (Regulär): 39,99 pro Monat = 18 * 39,99 = 719,82
        // Erwartete Gesamtsumme: 39,99 + 119,94 + 719,82 = 879,75
        
        ContractComponent tariff = ContractComponent.builder()
                .name("MagentaZuhause M")
                .category("Haupttarif")
                .oneTimeCharge(39.99)
                .prices(List.of(
                        new PriceStage(1, 6, 19.99),
                        new PriceStage(7, 24, 39.99)
                ))
                .build();

        ExtractedContractData data = ExtractedContractData.builder()
                .components(List.of(tariff))
                .build();

        BigDecimal result = engine.calculateTco(data);
        
        assertThat(result).isEqualByComparingTo("879.75");
    }

    @Test
    void calculateTco_withHardwareAndDiscounts_shouldCalculateCorrectly() {
        // Berechnungsbeispiel:
        // Router Einmalzahlung: 9,99
        // Router Versand: 4,99
        // Willkommens-Bonus (Gutschrift): -50,00
        // Tarifkosten (durchgehend 24 Monate): 24 * 29,99 = 719,76
        // Erwartete Gesamtsumme: 9,99 + 4,99 - 50,00 + 719,76 = 684,74
        
        ContractComponent tariff = ContractComponent.builder()
                .name("Vodafone Red Internet")
                .category("Haupttarif")
                .oneTimeCharge(0.0)
                .prices(List.of(
                        new PriceStage(1, 24, 29.99)
                ))
                .build();

        ContractComponent router = ContractComponent.builder()
                .name("FritzBox 7590")
                .category("Hardware")
                .oneTimeCharge(14.98) // (9,99 Router + 4,99 Versand)
                .prices(List.of()) // Keine monatlichen Kosten für Hardware in diesem Fall
                .build();

        ContractComponent bonus = ContractComponent.builder()
                .name("Willkommensbonus")
                .category("Rabatt")
                .oneTimeCharge(-50.00) // Gutschrift als negativer Einmalbetrag
                .prices(List.of())
                .build();

        ExtractedContractData data = ExtractedContractData.builder()
                .components(List.of(tariff, router, bonus))
                .build();

        BigDecimal result = engine.calculateTco(data);
        
        assertThat(result).isEqualByComparingTo("684.74");
    }

    @Test
    void calculateTco_shouldIgnorePricesOutsideContractDuration() {
        // Berechnungsbeispiel mit DYNAMISCHER 12 Monats-Laufzeit:
        // Monat 1-12: 10,00 pro Monat = 120,00
        // Monat 13-24: 20,00 pro Monat (Sollte GÄNZLICH ignoriert werden, da durationMonths = 12)
        
        ContractComponent tariff = ContractComponent.builder()
                .name("Jahres-Tarif")
                .category("Haupttarif")
                .oneTimeCharge(0.0)
                .prices(List.of(
                        new PriceStage(1, 12, 10.00),
                        new PriceStage(13, 24, 20.00)
                ))
                .build();

        ExtractedContractData data = ExtractedContractData.builder()
                .durationMonths(12) // WICHTIG: 12 Monate!
                .components(List.of(tariff))
                .build();

        BigDecimal result = engine.calculateTco(data);
        
        assertThat(result).isEqualByComparingTo("120.00");
    }

    @Test
    void calculateTco_shouldFallbackTo24Months_whenDurationIsMissing() {
        // Berechnungsbeispiel OHNE durationMonths Angabe
        // Fallback-Logik greift und berechnet 24 Monate.
        // Monat 1-24: 10,00 pro Monat = 240,00
        // Monat 25-36: 20,00 pro Monat (Sollte ignoriert werden)
        
        ContractComponent tariff = ContractComponent.builder()
                .name("Langläufer Tarif")
                .category("Haupttarif")
                .oneTimeCharge(0.0)
                .prices(List.of(
                        new PriceStage(1, 24, 10.00),
                        new PriceStage(25, 36, 20.00)
                ))
                .build();

        ExtractedContractData data = ExtractedContractData.builder()
                .durationMonths(null) // KEINE ANGABE!
                .components(List.of(tariff))
                .build();

        BigDecimal result = engine.calculateTco(data);
        
        assertThat(result).isEqualByComparingTo("240.00");
    }
}
