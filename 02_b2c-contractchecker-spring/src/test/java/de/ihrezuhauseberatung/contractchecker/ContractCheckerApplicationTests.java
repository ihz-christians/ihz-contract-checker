package de.ihrezuhauseberatung.contractchecker;

import de.ihrezuhauseberatung.contractchecker.controllers.api.AiWebhookController;
import de.ihrezuhauseberatung.contractchecker.integration.AiGatewayClient;
import de.ihrezuhauseberatung.contractchecker.services.ChatbotService;
import de.ihrezuhauseberatung.contractchecker.services.ContractService;
import de.ihrezuhauseberatung.contractchecker.services.LegalComplianceEngine;
import de.ihrezuhauseberatung.contractchecker.services.TcoCalculationEngine;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class ContractCheckerApplicationTests {

    @Autowired
    private ApplicationContext context;

    @Test
    void contextLoadsAndCriticalBeansArePresent() {
        // Dieser Smoke-Test stellt sicher, dass die Applikation nicht nur startet,
        // sondern auch alle kritischen Architektur-Komponenten (Beans) fehlerfrei geladen wurden.
        // Fehlt hier ein Bean (z.B. durch einen fehlerhaften @Profile oder Dependency-Injection Fehler), 
        // knallt der Build bereits lokal und nicht erst in Produktion.
        
        assertThat(context.getBean(AiWebhookController.class)).isNotNull();
        assertThat(context.getBean(ChatbotService.class)).isNotNull();
        assertThat(context.getBean(ContractService.class)).isNotNull();
        assertThat(context.getBean(AiGatewayClient.class)).isNotNull();
        assertThat(context.getBean(LegalComplianceEngine.class)).isNotNull();
        assertThat(context.getBean(TcoCalculationEngine.class)).isNotNull();
    }
}
