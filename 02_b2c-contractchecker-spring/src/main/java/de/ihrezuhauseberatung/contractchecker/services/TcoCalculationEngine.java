package de.ihrezuhauseberatung.contractchecker.services;

import de.ihrezuhauseberatung.contractchecker.models.domain.TcoResult;
import de.ihrezuhauseberatung.contractchecker.models.domain.TcoResult.PaymentReality;
import de.ihrezuhauseberatung.contractchecker.models.llm.ContractComponent;
import de.ihrezuhauseberatung.contractchecker.models.llm.ExtractedContractData;
import de.ihrezuhauseberatung.contractchecker.models.llm.PriceStage;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TcoCalculationEngine {

    /**
     * Berechnet die Total Cost of Ownership (TCO) mathematisch exakt (Abwärtskompatibilität).
     */
    public BigDecimal calculateTco(ExtractedContractData data) {
        return calculateTcoAndPhases(data).tco();
    }

    /**
     * "Cashflow Engine"
     * Berechnet die tatsächliche Zahlungsrealität, inklusive TCO, reinen Tarifphasen
     * und den echten Cashflow-Phasen nach Verrechnung von Startguthaben.
     */
    public TcoResult calculateTcoAndPhases(ExtractedContractData data) {
        if (data == null || data.getComponents() == null) {
            return new TcoResult(BigDecimal.ZERO, BigDecimal.ZERO, new ArrayList<>(), new ArrayList<>(), new PaymentReality(1, 0, BigDecimal.ZERO));
        }

        int duration = data.getDurationMonths() != null && data.getDurationMonths() > 0 ? data.getDurationMonths() : 24;
        
        // 1. Initialen Saldo (One-Time Charges vs One-Time Discounts) berechnen
        double oneTimeSum = 0.0;
        for (ContractComponent comp : data.getComponents()) {
            oneTimeSum += comp.getOneTimeCharge();
        }
        
        // Guthaben ist nur der negative Anteil. Positive Einmalkosten bleiben Kosten, sie 
        // erzeugen kein "negatives Guthaben", das auf Tarifkosten aufgeschlagen wird.
        double credit = oneTimeSum < 0 ? Math.abs(oneTimeSum) : 0.0;

        // 2. Arrays für rohe Tarifkosten und echten Cashflow
        double[] rawMonthlyPrices = new double[duration + 1];
        double[] cashflowMonthlyPrices = new double[duration + 1];

        for (ContractComponent comp : data.getComponents()) {
            if (comp.getPrices() != null) {
                for (int month = 1; month <= duration; month++) {
                    for (PriceStage ps : comp.getPrices()) {
                        if (month >= ps.getStartMonth() && month <= ps.getEndMonth()) {
                            rawMonthlyPrices[month] += ps.getAmount();
                            break; 
                        }
                    }
                }
            }
        }

        // 3. Cashflow-Simulation
        for (int month = 1; month <= duration; month++) {
            double rawPrice = rawMonthlyPrices[month];
            
            if (credit > 0) {
                if (credit >= rawPrice) {
                    cashflowMonthlyPrices[month] = 0.0;
                    credit -= rawPrice;
                } else {
                    cashflowMonthlyPrices[month] = rawPrice - credit;
                    credit = 0.0;
                }
            } else {
                cashflowMonthlyPrices[month] = rawPrice;
            }
        }

        // 4. Phasen aggregieren
        List<Map<String, Object>> rawPhases = aggregatePhases(rawMonthlyPrices, duration);
        List<Map<String, Object>> cashflowPhases = aggregatePhases(cashflowMonthlyPrices, duration);

        // 5. Metadaten (Payment Reality) berechnen
        int freeMonths = 0;
        int firstPaymentMonth = 1;
        double sumAfterCredit = 0.0;
        int paidMonths = 0;

        for (int month = 1; month <= duration; month++) {
            if (Math.round(cashflowMonthlyPrices[month] * 100.0) / 100.0 == 0.0) {
                freeMonths++;
            } else {
                if (firstPaymentMonth == 1 && freeMonths > 0) {
                    firstPaymentMonth = month;
                }
                sumAfterCredit += cashflowMonthlyPrices[month];
                paidMonths++;
            }
        }
        
        if (freeMonths == 0) firstPaymentMonth = 1;
        BigDecimal avgAfterCredit = paidMonths > 0 
            ? BigDecimal.valueOf(sumAfterCredit / paidMonths).setScale(2, RoundingMode.HALF_UP) 
            : BigDecimal.ZERO;

        // 6. TCO berechnen
        double tco = (oneTimeSum > 0 ? oneTimeSum : 0.0);
        for (int month = 1; month <= duration; month++) {
            tco += cashflowMonthlyPrices[month];
        }
        
        BigDecimal tcoBd = BigDecimal.valueOf(tco).setScale(2, RoundingMode.HALF_UP);
        BigDecimal effectiveMonthly = tcoBd.divide(BigDecimal.valueOf(duration), 2, RoundingMode.HALF_UP);

        return new TcoResult(
            tcoBd, 
            effectiveMonthly, 
            rawPhases, 
            cashflowPhases, 
            new PaymentReality(firstPaymentMonth, freeMonths, avgAfterCredit)
        );
    }

    /**
     * Veraltete Phase Engine für Abwärtskompatibilität, delegiert an die Cashflow-Engine.
     */
    public List<Map<String, Object>> calculatePricePhases(ExtractedContractData data) {
        return calculateTcoAndPhases(data).cashflowPhases();
    }

    private List<Map<String, Object>> aggregatePhases(double[] monthlyPrices, int duration) {
        List<Map<String, Object>> phases = new ArrayList<>();
        if (duration == 0) return phases;

        int currentPhaseStart = 1;
        double currentPhasePrice = Math.round(monthlyPrices[1] * 100.0) / 100.0;

        for (int month = 2; month <= duration; month++) {
            double monthPrice = Math.round(monthlyPrices[month] * 100.0) / 100.0;
            
            if (monthPrice != currentPhasePrice) {
                phases.add(createPhase(currentPhaseStart, month - 1, currentPhasePrice));
                currentPhaseStart = month;
                currentPhasePrice = monthPrice;
            }
        }

        phases.add(createPhase(currentPhaseStart, duration, currentPhasePrice));
        return phases;
    }

    private Map<String, Object> createPhase(int startMonth, int endMonth, double price) {
        Map<String, Object> phase = new LinkedHashMap<>();
        phase.put("startMonth", startMonth);
        phase.put("endMonth", endMonth);
        phase.put("price", price);
        
        String label = startMonth == endMonth 
            ? "Monat " + startMonth 
            : "Monate " + startMonth + " - " + endMonth;
        phase.put("label", label);
        return phase;
    }
}
