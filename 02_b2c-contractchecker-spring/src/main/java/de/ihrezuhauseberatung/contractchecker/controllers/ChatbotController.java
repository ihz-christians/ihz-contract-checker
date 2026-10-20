package de.ihrezuhauseberatung.contractchecker.controllers;

import de.ihrezuhauseberatung.contractchecker.config.CustomUserDetails;
import de.ihrezuhauseberatung.contractchecker.models.Contract;
import de.ihrezuhauseberatung.contractchecker.repositories.ContractRepository;
import de.ihrezuhauseberatung.contractchecker.services.ChatbotService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Optional;
import java.util.UUID;

@Controller
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final ContractRepository contractRepository;

    public ChatbotController(ChatbotService chatbotService, ContractRepository contractRepository) {
        this.chatbotService = chatbotService;
        this.contractRepository = contractRepository;
    }

    @PostMapping("/chatbot/query")
    @ResponseBody
    public String handleChatbotQuery(
            @RequestParam("question") String question,
            @RequestParam(value = "contractId", required = false) UUID contractId,
            @RequestParam(value = "contractType", defaultValue = "Vodafone Komplettpaket") String contractType,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (question == null || question.trim().isEmpty()) {
            return "";
        }

        // IDOR Protection: verify contract ownership if a contractId is given
        if (contractId != null) {
            Optional<Contract> contractOpt = contractRepository.findById(contractId);
            if (contractOpt.isPresent()) {
                Contract contract = contractOpt.get();
                if (contract.getUser() != null && userDetails != null && !contract.getUser().getId().equals(userDetails.getUserId())) {
                    throw new AccessDeniedException("Zugriff verweigert: Vertrag gehört einem anderen Benutzer.");
                }
            }
        }

        // Generate dynamic bot answer using contract context if available
        String botAnswerMarkdown = chatbotService.generateResponse(question, contractId, contractType);
        
        // INTERCEPT JSON ACTION WIDGETS
        if (botAnswerMarkdown != null && botAnswerMarkdown.trim().startsWith("{") && botAnswerMarkdown.contains("ACTION_READY")) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode actionNode = mapper.readTree(botAnswerMarkdown);
                String rawIntent = actionNode.has("intent") ? actionNode.get("intent").asText() : "action";
                String intent = switch (rawIntent.toLowerCase()) {
                    case "cancellation", "revocation", "downgrade" -> rawIntent.toLowerCase();
                    default -> "cancellation";
                };
                String provider = actionNode.has("provider") ? actionNode.get("provider").asText() : "";
                String actionDate = actionNode.has("action_date") ? actionNode.get("action_date").asText() : "";
                
                String emoji = intent.equals("cancellation") ? "❌" : (intent.equals("revocation") ? "↩️" : "📉");
                String title = intent.equals("cancellation") ? "Kündigung" : (intent.equals("revocation") ? "Widerruf" : "Downgrade");
                
                // Render specific HTMX-powered widget for the action
                return "<!-- Bot Message (Action Widget) -->" +
                       "<div class=\"flex justify-start mb-4 animate-fade-in\">" +
                       "  <div class=\"bg-white rounded-2xl px-5 py-4 max-w-[90%] border-2 border-primary/40 shadow-card text-sm leading-relaxed\">" +
                       "    <div class=\"flex items-center gap-2 mb-3\">" +
                       "      <span class=\"text-2xl\">" + emoji + "</span>" +
                       "      <h4 class=\"font-extrabold text-slate-900\">" + title + " vorbereitet</h4>" +
                       "    </div>" +
                       "    <p class=\"text-slate-600 mb-4\">Ich habe alle notwendigen Daten gesammelt. Soll ich das Dokument generieren und den Prozess verbindlich starten?</p>" +
                       "    <div class=\"bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 space-y-1.5\">" +
                       "      <div class=\"flex justify-between text-xs\"><span class=\"text-slate-500\">Anbieter:</span> <span class=\"font-semibold text-slate-800\">" + escapeHtml(provider) + "</span></div>" +
                       "      <div class=\"flex justify-between text-xs\"><span class=\"text-slate-500\">Aktion:</span> <span class=\"font-semibold text-slate-800\">" + title + "</span></div>" +
                       "      <div class=\"flex justify-between text-xs\"><span class=\"text-slate-500\">Datum:</span> <span class=\"font-semibold text-slate-800\">" + escapeHtml(actionDate) + "</span></div>" +
                       "    </div>" +
                       "    <button type=\"button\" hx-post=\"/contract/" + contractId + "/action/" + escapeHtml(intent) + "\" hx-target=\"#action-result\" class=\"w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-bold shadow-sm transition-colors mb-2 flex justify-center items-center gap-2\">" +
                       "      " + emoji + " Jetzt verbindlich " + title.toLowerCase() +
                       "    </button>" +
                       "    <div id=\"action-result\" class=\"text-xs text-center text-slate-500\">Kostenfrei & Rechtssicher</div>" +
                       "  </div>" +
                       "</div>";
            } catch (Exception e) {
                // Fallback to text if JSON parsing fails
                botAnswerMarkdown = "Aktion konnte nicht vorbereitet werden. " + e.getMessage();
            }
        }
        
        // Convert some basic Markdown formatters to HTML for safe viewing
        String botAnswerHtml = formatMarkdownToHtml(botAnswerMarkdown);

        // Render HTML fragments for the bot's response ONLY, because the frontend already appended the user message optimistically
        return "<!-- Bot Message -->" +
               "<div class=\"flex justify-start mb-4 animate-fade-in\">" +
               "  <div class=\"bg-secondary text-secondary-foreground rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%] border border-border shadow-md text-sm leading-relaxed\">" +
               "    <div class=\"font-semibold text-xs text-primary mb-1\">Vertrags-Experte</div>" +
               "    <div>" + botAnswerHtml + "</div>" +
               "  </div>" +
               "</div>";
    }

    private String formatMarkdownToHtml(String md) {
        if (md == null) return "";
        String html = escapeHtml(md);

        // Match red warning: !!text!! -> <strong class="font-extrabold text-destructive bg-destructive/10 px-1 rounded">text</strong>
        html = html.replaceAll("!!(.*?)!!", "<strong class=\"font-extrabold text-destructive bg-destructive/10 px-1 rounded\">$1</strong>");

        // Match highlight: __text__ -> <span class="font-bold text-amber-700 bg-amber-100 px-1 rounded">text</span>
        html = html.replaceAll("__(.*?)__", "<span class=\"font-bold text-amber-700 bg-amber-100 px-1 rounded\">$1</span>");

        // Match bold: **text** -> <strong class="font-extrabold text-primary">text</strong>
        html = html.replaceAll("\\*\\*(.*?)\\*\\*", "<strong class=\"font-extrabold text-primary\">$1</strong>");

        // Group consecutive bullet points into clean, padded lists with margin-bottom for better breathing room
        // 1. Convert bullet points: - item -> <li class="ml-5 list-disc mb-1.5 pl-1 text-secondary-foreground">item</li>
        html = html.replaceAll("(?m)^\\s*-\\s*(.*?)$", "<li class=\"ml-5 list-disc mb-1.5 pl-1 text-secondary-foreground\">$1</li>");
        
        // Match double newlines: \n\n -> <div class="h-3"></div> (adds premium, airy spacing between paragraphs)
        html = html.replaceAll("\n\n", "<div class=\"h-3\"></div>");
        
        // Match single newlines: \n -> <br class="mb-1" />
        html = html.replaceAll("\n", "<br/>");
        
        // Remove empty or double br tags around divs that might get introduced
        html = html.replaceAll("<br/>\\s*<div class=\"h-3\"></div>", "<div class=\"h-3\"></div>");
        html = html.replaceAll("<div class=\"h-3\"></div>\\s*<br/>", "<div class=\"h-3\"></div>");
        
        // If li blocks are wrapped nicely, add small padding around them
        html = html.replaceAll("(<li class=.*?</li>)", "<ul class=\"my-2 space-y-1\">$1</ul>");
        // Simplify duplicated ul wrappers caused by regex matching
        html = html.replaceAll("</ul>\\s*<ul class=\"my-2 space-y-1\">", "");
        
        return html;
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#x27;");
    }
}
