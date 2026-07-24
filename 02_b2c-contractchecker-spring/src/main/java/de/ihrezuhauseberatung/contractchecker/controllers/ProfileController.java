package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.config.CustomUserDetails;
import de.ihrezuhauseberatung.contractchecker.models.User;
import de.ihrezuhauseberatung.contractchecker.repositories.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Controller
public class ProfileController {

    private final UserRepository userRepository;

    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/profil")
    public String profil(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails != null) {
            model.addAttribute("userEmail", userDetails.getUsername());
            userRepository.findById(userDetails.getUserId()).ifPresent(user -> {
                model.addAttribute("user", user);
            });
        }
        return "profil";
    }

    @PostMapping("/profil/save")
    public String saveProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String street,
            @RequestParam(required = false) String houseNumber,
            @RequestParam(required = false) String zipCode,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) String customPrompt) {

        if (userDetails != null) {
            userRepository.findById(userDetails.getUserId()).ifPresent(user -> {
                user.setFirstName(firstName);
                user.setLastName(lastName);
                user.setStreet(street);
                user.setHouseNumber(houseNumber);
                user.setZipCode(zipCode);
                user.setCity(city);
                
                if (tags != null && !tags.isBlank()) {
                    List<String> parsedTags = Arrays.stream(tags.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList());
                    user.setAiContextTags(parsedTags);
                } else {
                    user.setAiContextTags(null);
                }
                
                user.setAiCustomPrompt(customPrompt);
                
                userRepository.save(user);
            });
        }
        
        return "redirect:/profil?success=true";
    }
}
