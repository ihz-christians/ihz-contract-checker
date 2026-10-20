# 📋 B2C Contract Checker — Projektkonzept & Praxis-Hintergrund

Dieses Dokument beschreibt die Motivation, den praktischen Nutzen und die Architektur des **B2C Contract Checkers** in klarer, verständlicher Sprache.

---

## 1. Ausgangslage & Problem aus dem Alltag

Wer Verträge (z. B. für Strom, Gas, Internet oder Mobilfunk) vergleichen oder kündigen möchte, stößt regelmäßig auf dieselben Hürden:
* **Wichtige Angaben verstecken sich im Kleingedruckten:** Vertragslaufzeiten, Kündigungsfristen, Grund- und Arbeitspreise sowie Klauseln zur automatischen Verlängerung stehen oft verstreut über mehrere Seiten.
* **Manuelle Fleißarbeit:** Im Kundenservice, bei Maklern oder in Beratungsstellen werden eingehende Verträge meist Seite für Seite durchgelesen, Werte per Hand in Tabellen eingetragen und Fristen im Kalender nachgerechnet. Das kostet pro Vertrag schnell 20 bis 30 Minuten.
* **Flüchtigkeitsfehler:** Kündigungsfristen oder Fristen für Sonderkündigungen (z. B. nach einer Preiserhöhung) werden leicht übersehen. Verpasst der Kunde die Frist, verlängert sich der Vertrag oft ungewollt um ein weiteres Jahr.

---

## 2. Der Lösungsansatz

Das Ziel dieses Projekts ist es, diesen Ablauf einmal von Anfang bis Ende praxistauglich digital abzubilden:

1. **PDF hochladen:** Der Nutzer oder Berater lädt den bestehenden Vertrag einfach als PDF hoch.
2. **Automatische Erkennung:** Ein schlanker Dienst liest den Text aus dem PDF und zieht mithilfe strukturierter KI-Unterstützung (Gemini) die relevanten Vertragsdaten heraus (Anbieter, Tarifname, Preise, Laufzeit, Kündigungsfrist).
3. **Kosten auf einen Blick:** Das System berechnet die monatlichen und jährlichen Gesamtkosten über die Vertragslaufzeit und zeigt Fristen übersichtlich an.
4. **Sofort handeln:** Mit einem Klick lässt sich ein rechtssicheres Kündigungs- oder Widerspruchsschreiben als fertiges PDF erzeugen.
5. **Rückfragen im Chat:** Bei Unklarheiten (z. B. *„Gibt es eine Preisgarantie?“*) kann der Nutzer direkt im Web-Assistenten Fragen zum eigenen Vertrag stellen.

---

## 3. Der praktische Nutzen

| Bereich | Bisherige Arbeitsweise | Mit dem Contract Checker | Konkreter Vorteil |
| :--- | :--- | :--- | :--- |
| **Erfassung** | Manuelles Durchlesen & Abtippen | PDF-Upload mit automatischer Texterkennung | Spart 15–25 Minuten pro Vertrag |
| **Kostenübersicht** | Rechnen in Excel | Automatische Berechnung der Gesamtkosten | Klare Vergleichbarkeit auf einen Blick |
| **Kündigung** | Briefvorlage in Word manuell anpassen | Fertiges PDF-Schreiben auf Knopfdruck | Keine Tippfehler bei Kundennummern |
| **Datenschutz** | Kundendaten in geteilten Tabellen | Strikte Mandantentrennung auf Datenbankebene | Kundendaten bleiben sicher isoliert |

---

## 4. Warum diese technische Architektur?

In der Softwareberatung zählt Pragmatismus: Die Technik muss zum Problem passen und wartbar sein.

* **Java 21 & Spring Boot 3:**  
  Spring Boot ist der bewährte Standard für robuste Web-Anwendungen im Firmenumfeld. Es übernimmt die Benutzeroberfläche, die Benutzerverwaltung, die Validierung und die zuverlässige Erstellung der Kündigungs-PDFs.
* **Python & FastAPI (KI-Gateway):**  
  Python bietet im Bereich Dokumentenanalyse und KI-Anbindung (PyMuPDF, Pydantic, LLM-Schnittstellen) die stärksten Bibliotheken. Durch die Trennung bleibt das Java-Backend schlank und unabhängig von Änderungen an KI-Modellen.
* **PostgreSQL mit Mandantentrennung (Row-Level Security):**  
  Wenn verschiedene Berater oder Teams das System nutzen, dürfen Daten niemals versehentlich beim falschen Nutzer landen. PostgreSQL erzwingt diese Trennung direkt im Datenbanksystem – nicht nur über Anwendungs-Code.
* **Einfacher lokaler Start (`./devlocal`):**  
  Statt einer komplizierten Installationsanleitung reicht ein einziges Skript: `./devlocal doctor` prüft die Umgebung, `./devlocal start` startet Datenbank, Speicher und Services.

---

## 5. Nächste sinnvolle Schritte für den Produktiveinsatz

Wenn dieses System in einer echten Organisation (z. B. Stadtwerke, Maklerpool oder Kundenservice) ausgerollt werden soll, wären folgende Schritte die nächsten logischen Meilensteine:
1. **Schnittstellen zu bestehenden Systemen:** Anbindung an vorhandene CRM- oder Ticket-Systeme (z. B. via REST-Webhooks), damit geprüfte Verträge direkt im Kundenkonto landen.
2. **Zentrales Firmen-Login (SSO):** Anbindung an das Firmen-Benutzerverzeichnis (z. B. Microsoft Entra ID / Keycloak), damit Mitarbeiter kein separates Passwort benötigen.
3. **Automatischer Fristen-Reminder:** E-Mail-Benachrichtigung an den Kunden 6 Wochen vor Ablauf der Kündigungsfrist mit passenden Wechselempfehlungen.
