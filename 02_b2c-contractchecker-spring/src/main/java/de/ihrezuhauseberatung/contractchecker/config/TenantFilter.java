package de.ihrezuhauseberatung.contractchecker.config;

import jakarta.servlet.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class TenantFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            TenantContext.setCurrentTenant(userDetails.getTenantId());
            TenantContext.setCurrentUser(userDetails.getUserId());
        } else {
            // For unauthenticated endpoints (like resources, login, registration)
            TenantContext.clear();
        }

        try {
            chain.doFilter(request, response);
        } finally {
            // CRITICAL: Always clear context at the end of the request to prevent ThreadLocal leaks
            TenantContext.clear();
        }
    }
}
