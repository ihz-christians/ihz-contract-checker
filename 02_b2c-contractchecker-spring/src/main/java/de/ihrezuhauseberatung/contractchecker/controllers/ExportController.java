package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.config.CustomUserDetails;
import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import de.ihrezuhauseberatung.contractchecker.services.export.ExportOrchestratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Locale;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ExportController {

    private final ContractRepository contractRepository;
    private final ExportOrchestratorService exportOrchestratorService;

    @PostMapping("/contract/{id}/export")
    public String exportContract(
            @PathVariable("id") UUID contractId,
            @RequestParam(value = "email", required = false) String email,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            Locale locale,
            RedirectAttributes redirectAttributes) {

        // IDOR Protection: Verify contract ownership before exporting
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Vertrag nicht gefunden"));

        if (contract.getUser() != null && userDetails != null && !contract.getUser().getId().equals(userDetails.getUserId())) {
            log.warn("IDOR violation attempt: User {} tried to export contract {} owned by {}",
                    userDetails.getUserId(), contractId, contract.getUser().getId());
            throw new AccessDeniedException("Zugriff verweigert: Vertrag gehört einem anderen Benutzer.");
        }

        // Fallback: Wenn keine E-Mail im Formular angegeben wurde, nehmen wir den Login-Namen (falls es eine E-Mail ist)
        String targetEmail = (email != null && !email.trim().isEmpty()) ? email : userDetails.getUsername();

        log.info("User {} triggered PDF export for contract {} to email {}", userDetails.getUserId(), contractId, targetEmail);

        // Aufruf des asynchronen Orchestrators. Wir übergeben die Locale des Users für die Mehrsprachigkeit (i18n).
        exportOrchestratorService.generateAndSendReport(
                contractId,
                userDetails.getTenantId(),
                userDetails.getUserId(),
                targetEmail,
                locale
        );

        redirectAttributes.addFlashAttribute("successMessage", 
                "Export gestartet! Die detaillierte Vertragsanalyse wird als PDF generiert und in Kürze an " + targetEmail + " gesendet.");

        return "redirect:/contract/" + contractId;
    }
}
