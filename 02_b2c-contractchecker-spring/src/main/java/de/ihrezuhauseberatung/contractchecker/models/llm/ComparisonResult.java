package de.ihrezuhauseberatung.contractchecker.models.llm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComparisonResult {
    private String recommendation; // Die finale Empfehlung (Behalten, Wechseln, etc.)
    private String explanation;    // Begründung für die Empfehlung
    private String differences;    // Wichtigste Unterschiede zwischen Alt und Neu
}
