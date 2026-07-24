package de.ihrezuhauseberatung.contractchecker.config;

import java.util.UUID;

public class TenantContext {

    private static final ThreadLocal<UUID> currentTenant = new ThreadLocal<>();
    private static final ThreadLocal<UUID> currentUser = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> bypassRls = ThreadLocal.withInitial(() -> false);

    public static void setCurrentTenant(UUID tenantId) {
        currentTenant.set(tenantId);
    }

    public static UUID getCurrentTenant() {
        return currentTenant.get();
    }

    public static void setCurrentUser(UUID userId) {
        currentUser.set(userId);
    }

    public static UUID getCurrentUser() {
        return currentUser.get();
    }

    public static void setBypassRls(boolean bypass) {
        bypassRls.set(bypass);
    }

    public static boolean isBypassRls() {
        return bypassRls.get();
    }

    public static void clear() {
        currentTenant.remove();
        currentUser.remove();
        bypassRls.remove();
    }
}
