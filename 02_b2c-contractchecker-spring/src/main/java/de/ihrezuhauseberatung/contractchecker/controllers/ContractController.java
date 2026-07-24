package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.config.CustomUserDetails;
import de.ihrezuhauseberatung.contractchecker.models.AnalysisTask;
import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.repositories.UserRepository;
import de.ihrezuhauseberatung.contractchecker.services.ContractService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Controller
public class ContractController {

    private final ContractService contractService;
    private final UserRepository userRepository;

    public ContractController(ContractService contractService, UserRepository userRepository) {
        this.contractService = contractService;
        this.userRepository = userRepository;
    }

    @PostMapping("/contract/upload")
    public String uploadContract(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "compareFile", required = false) MultipartFile compareFile,
            @RequestParam(value = "isCompareMode", defaultValue = "false") boolean isCompareMode,
            @RequestParam(value = "contractType", defaultValue = "Telekommunikation") String contractType,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            Model model) {

        if (file.isEmpty()) {
            model.addAttribute("error", "Bitte wählen Sie eine gültige Datei zum Hochladen aus.");
            return "redirect:/dashboard";
        }

        try {
            User user = userRepository.findById(userDetails.getUserId())
                    .orElseThrow(() -> new IllegalStateException("Aktueller Benutzer nicht gefunden"));

            // Get original file attributes
            String originalFilename = file.getOriginalFilename();
            byte[] fileBytes = file.getBytes();
            
            String compareFilename = null;
            byte[] compareFileBytes = null;
            
            if (isCompareMode && compareFile != null && !compareFile.isEmpty()) {
                compareFilename = compareFile.getOriginalFilename();
                compareFileBytes = compareFile.getBytes();
            }

            // Start contract checker workflow using high-performance cloud storage & parsing!
            Contract contract = contractService.saveAndStartAnalysis(originalFilename, fileBytes, compareFilename, compareFileBytes, contractType, user);

            return "redirect:/contract/status/" + contract.getId();

        } catch (IOException e) {
            model.addAttribute("error", "Fehler beim Lesen der hochgeladenen Datei.");
            return "redirect:/dashboard";
        }
    }

    @GetMapping("/contract/status/{contractId}")
    public String analysisStatus(@PathVariable("contractId") UUID contractId, Model model) {
        Optional<Contract> contractOpt = contractService.getContractById(contractId);
        if (contractOpt.isEmpty()) {
            return "redirect:/dashboard";
        }

        model.addAttribute("contract", contractOpt.get());
        Optional<AnalysisTask> taskOpt = contractService.getTaskByContractId(contractId);
        
        int progress = 0;
        String status = "pending";
        if (taskOpt.isPresent()) {
            progress = taskOpt.get().getProgress();
            status = taskOpt.get().getStatus();
        }
        
        model.addAttribute("progress", progress);
        model.addAttribute("status", status);

        return "analysis_status";
    }

// HTMX Polling endpoint for analysis progress bar
    @GetMapping("/contract/status/{contractId}/progress")
    public String getAnalysisProgressHtml(@PathVariable("contractId") UUID contractId, Model model) {
        Optional<AnalysisTask> taskOpt = contractService.getTaskByContractId(contractId);
        
        int progress = 0;
        String status = "pending";
        String errorMessage = "Unbekannter Fehler bei der Analyse.";
        
        if (taskOpt.isPresent()) {
            progress = taskOpt.get().getProgress();
            status = taskOpt.get().getStatus();
            if (taskOpt.get().getErrorMessage() != null) {
                errorMessage = taskOpt.get().getErrorMessage();
            }
        }

        model.addAttribute("contractId", contractId);
        model.addAttribute("progress", progress);
        model.addAttribute("status", status != null ? status.toLowerCase() : "pending");
        model.addAttribute("errorMessage", errorMessage);

        return "analysis_status :: progress_content";
    }
    @GetMapping("/contract/status/{contractId}/redirect-trigger")
    @ResponseBody
    public String redirectTrigger(@PathVariable("contractId") UUID contractId, @RequestHeader(value = "HX-Request", required = false) String hxRequest) {
        // We inject HX-Redirect header to let HTMX redirect the full page
        return "<script>window.location.href='/contract/" + contractId + "';</script>";
    }

    @GetMapping("/contract/{contractId}")
    public String viewContractAnalysis(@PathVariable("contractId") UUID contractId, Model model) {
        Optional<Contract> contractOpt = contractService.getContractById(contractId);
        if (contractOpt.isEmpty()) {
            return "redirect:/dashboard";
        }

        Contract contract = contractOpt.get();
        model.addAttribute("contract", contract);
        model.addAttribute("analysis", contract.getSummary());

        return "contract_details";
    }

    @PostMapping("/contract/delete/{contractId}")
    public String deleteContract(@PathVariable("contractId") UUID contractId) {
        contractService.deleteContract(contractId);
        return "redirect:/dashboard";
    }
}
