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
public class ExtractedContractData {
    private String provider;
    private String mainContractName;
    private Integer durationMonths;
    private Integer autoRenewalMonths;
    private String simpleSummary;

    private Integer cancellationPeriodMonths;

    private String targetAudienceGood;
    private String targetAudienceBad;
    private String revocationAdvice;
    private String contactHotline;
    private String telephonyRisks;

    private ComparisonResult comparisonResult;

    private List<ContractComponent> components;
}