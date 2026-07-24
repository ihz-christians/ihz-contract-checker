package de.ihrezuhauseberatung.contractchecker.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withAccepted;

class AiGatewayClientTest {

    private AiGatewayClient aiGatewayClient;
    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        
        // Wir injizieren die URL unseres Python-Gateways
        aiGatewayClient = new AiGatewayClient(builder, "http://python-gateway:8000");
    }

    @Test
    void shouldSendAnalysisRequestToPythonGateway() {
        // Arrange
        String expectedPayload = """
                {"task_id":"123","s3_url":"s3://bucket/test.pdf","callback_url":"http://spring-boot:8080/api/internal/webhooks/ai-result","tenant_id":"tenant-1"}""";

        mockServer.expect(requestTo("http://python-gateway:8000/api/v1/analyze"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().json(expectedPayload))
                .andRespond(withAccepted()); // Erwartet 202 Accepted von Python

        // Act
        boolean success = aiGatewayClient.startAnalysis("123", "s3://bucket/test.pdf", null, "http://spring-boot:8080/api/internal/webhooks/ai-result", "tenant-1");

        // Assert
        assertThat(success).isTrue();
        mockServer.verify(); // Prüft, ob der Request genau so rausging
    }
}
