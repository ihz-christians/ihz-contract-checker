package de.ihrezuhauseberatung.contractchecker.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class OpsMetricsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getMetrics_missingSecret_shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/ops/metrics"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", notNullValue()));
    }

    @Test
    void getMetrics_invalidSecret_shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/ops/metrics")
                .header("X-Ops-Secret", "wrong-key"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", notNullValue()));
    }

    @Test
    void getMetrics_validSecret_shouldReturnMetricsAndOk() throws Exception {
        mockMvc.perform(get("/api/admin/ops/metrics")
                .header("X-Ops-Secret", "super-secure-ops-token-2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.system", notNullValue()))
                .andExpect(jsonPath("$.database", notNullValue()))
                .andExpect(jsonPath("$.tasks", notNullValue()))
                .andExpect(jsonPath("$.tenants", notNullValue()))
                .andExpect(jsonPath("$.rlsEnforced", notNullValue()));
    }

    @Test
    void corsOptionsRequest_shouldReturnAllowedHeadersAndMethods() throws Exception {
        mockMvc.perform(options("/api/admin/ops/metrics")
                .header("Origin", "http://localhost:8090")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "X-Ops-Secret"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Origin"))
                .andExpect(header().string("Access-Control-Allow-Methods", org.hamcrest.Matchers.containsString("GET")))
                .andExpect(header().string("Access-Control-Allow-Headers", org.hamcrest.Matchers.containsString("X-Ops-Secret")));
    }
}
