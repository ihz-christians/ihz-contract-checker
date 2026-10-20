# B2C Go-to-Market (GTM) Strategy & Feedback

This file captures the strategic business context provided in the prompt to ensure tech decisions align with the business goals.

## Core Truths
1. **Focus is the biggest risk**, not technology.
2. The product has massive potential (LMS, LiveKit, Observability, RLS, AI), but pitching it all at once will kill sales.
3. The real value for High-Volume Sales Agencies (D2D, Cold Calling, Telesales): "Get salespeople ready in < 24-48h (Recruiting Self-Filtering + Video Training)."

## Target ICP (Phase 1 LMS & Recruiting)
**Gemeinsames Pain-Profil:** High-Volume, skriptgetriebene Vertriebsorganisationen (DACH · 5–50 Reps/Agents; B2B-Käufer: Agenturinhaber)
* **D2D- & Vor-Ort-Direktvertrieb (ca. 7.500 Einheiten):** Glasfaser, Energie, Telekommunikation, Solar/PV, Face-to-Face Promotion/Fundraising
* **Outbound Telesales & Callcenter (ca. 3.500 Standorte):** Aktiver Telefonvertrieb, B2C/B2B-Tarifwechsel, Abo-/Vertragsteams
* **B2B Cold Calling & SDR-Agenturen (ca. 3.000 Agenturen):** Appointment Setting, Kaltakquise für Agenturen/B2B-Dienstleister
* **Gemeinsamer Nenner:** 40–80 % Fluktuation in den ersten 60 Tagen, Inhaber verbrennt 15h+/Woche im Coaching, teures Verbrennen von Leads/Türen.
* **Marktdimensionen (DACH):**
  * **TAM:** > 25 Mrd. € Handelsvolumen, > 18.000 vertriebsorganisierte Betriebe (~75 Mio. € Software-TAM).
  * **SAM:** 14.000 Zielagenturen mit 5–50 Reps $\rightarrow$ **50–65 Mio. € B2B-SaaS-SAM** (bei ø 350 €/Mo bzw. 4.200 € ARR).
  * **SOM:** 100 Agenturen = **420k € ARR** (Breakeven bei nur **0,7 %** SAM-Marktdurchdringung); Series-A Korridor: 1.000 Agenturen = 4,2 Mio. € SaaS-ARR.
* **Wedge-Hebel:** Kein CRM-/Dialer-Wechsel nötig. Kandidaten filtern sich vor Tag 1 über Video-Checks selbst aus.

## Rollout Phases (Crucial for Tech Priorities)

### Phase 1: The Core (Sell this NOW)
*   Trainee & Admin Onboarding
*   Video Uploads & Viewing
*   Recruiting Integration (Leads directly into LMS)
*   *Tech focus:* Stability, clean UI, bulletproof DB (RLS).

### Phase 2: Performance Layer
*   Tracking & Analytics
*   Gamification

### Phase 3: The "Moat" (Trust Layer & AI)
*   NFC ID for salespeople
*   Customer scans NFC -> verifies identity -> leaves review.
*   Reviews feed back into LMS for team leader visibility.
*   *Tech focus:* Privacy (GDPR), Fraud prevention, Virtual Live-Customers, AI extraction.

## Pitching Rule
Never pitch the architecture (S3, Observability, AI-native, Multitenant). Pitch the outcome: **"Less onboarding time, more sales control, transparent door-to-door sales."**
