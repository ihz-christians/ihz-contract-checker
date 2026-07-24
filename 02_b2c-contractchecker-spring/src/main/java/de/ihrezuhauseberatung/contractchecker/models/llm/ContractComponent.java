package de.ihrezuhauseberatung.contractchecker.models.llm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractComponent {
    private String name;
    private String category; // z.B. "Haupttarif", "Hardware", "Zusatzoption", "Rabatt"
    private double oneTimeCharge; // Einmalige Kosten (positiv) oder Einmal-Gutschriften (negativ)
    
    @Builder.Default
    private List<PriceStage> prices = new java.util.ArrayList<>(); // Monatliche Kosten (oder monatliche Rabatte als negativer Wert)
}