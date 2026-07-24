package de.ihrezuhauseberatung.contractchecker.models.llm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceStage {
    private int startMonth;
    private int endMonth;
    private double amount; // Positiv für Kosten, Negativ für Rabatte
}