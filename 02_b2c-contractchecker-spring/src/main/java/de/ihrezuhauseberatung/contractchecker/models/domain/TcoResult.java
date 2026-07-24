package de.ihrezuhauseberatung.contractchecker.models.domain;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record TcoResult(
        BigDecimal tco,
        BigDecimal effectiveMonthly,
        List<Map<String, Object>> rawTariffPhases,
        List<Map<String, Object>> cashflowPhases,
        PaymentReality paymentReality
) {
    public record PaymentReality(
            int firstPaymentMonth,
            int freeMonths,
            BigDecimal avgAfterCredit
    ) {}
}