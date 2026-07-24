# CPAI Dashboard SSO Integration

## Overview
This Consumer Protection AI (CPAI) Dashboard has been successfully upgraded to the **Normalis Firebase SSO Standard**, fully aligning it with the B2C Landing Page and the B2B LMS platforms.

This means this frontend does not maintain its own isolated user database anymore. Instead, it utilizes the exact same Identity Provider (Firebase) as the rest of the ecosystem.

## Architectural Changes

### 1. Replaced the Local/Mock Auth State
Previously, src/contexts/AuthContext.tsx operated on hardcoded DEMO_USERS (kunde@example.com) and used localStorage to spoof state. 
This was ripped out and replaced by a live Firebase stream (onAuthStateChanged).

### 2. Google Authentication (1-Click Login)
The LoginForm.tsx component was updated to include a 'Mit Google anmelden' button, invoking loginWithGoogle from the context (which triggers signInWithPopup). 

### 3. Ecosystem Navigation (The B2C Funnel)
- Users starting on the public **Contract Checker** (01_b2c_contractchecker/02_frontend-contractchecker) will now see an **'Anmelden'** button in their top right header.
- This button directly redirects them to this CPAI Dashboard (/login).
- Once logged in, Firebase persists the IndexedDB session. If the user navigates back to the Contract Checker, the checker's interceptors automatically pull the active Firebase JWT and recognize the user as authenticated.
- In the CPAI Dashboard sidebar (AppSidebar.tsx), a new 'Zur Startseite' (External Link) button was added to easily jump back to the main domain.

## Duplication Note
During analysis, it was verified that 04_ai_services/01_kundenbereich-B2C and 04_ai_services/02_frontend_CPAI were exact byte-for-byte duplicates. 
We integrated the logic into 01_kundenbereich-B2C as the canonical B2C repository going forward. 02_frontend_CPAI can be safely deleted or ignored.
