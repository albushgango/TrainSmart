# Projektdokumentation – TrainSmart

## Inhaltsverzeichnis

1. [Ausgangslage](#1-ausgangslage)
2. [Lösungsidee](#2-lösungsidee)
3. [Vorgehen & Artefakte](#3-vorgehen--artefakte)
    1. [Understand & Define](#31-understand--define)
    2. [Sketch](#32-sketch)
    3. [Decide](#33-decide)
    4. [Prototype](#34-prototype)
    5. [Validate](#35-validate)
4. [Erweiterungen](#4-erweiterungen)
5. [Projektorganisation](#5-projektorganisation)
6. [KI-Deklaration](#6-ki-deklaration)
7. [Anhang](#7-anhang)

> **Hinweis:** Massgeblich sind die im **Unterricht** und auf **Moodle** kommunizierten Anforderungen.

<!-- WICHTIG: DIE KAPITELSTRUKTUR DARF NICHT VERÄNDERT WERDEN! -->

---

## 1. Ausgangslage

- **Problem:** Aktive Hobbyathleten, die mehrere Sportarten parallel betreiben (z.B. Fussball, Krafttraining, Laufen), haben keinen einheitlichen Überblick über ihre wöchentliche Trainingsbelastung. Bestehende Apps sind sport-spezifisch und decken jeweils nur einen Bereich ab. Es fehlt eine einfache Lösung, die Wochenstruktur und tägliche Trainingsempfehlungen sportartenübergreifend kombiniert – und dabei auch Fortschritte im Kraft- und Ausdauerbereich nachvollziehbar macht.

- **Ziele:**
  - Trainingseinheiten über alle Sportarten in einer App erfassen
  - Wöchentliche Belastung visualisieren und tägliche Empfehlung (Heavy / Light / Rest) ausgeben
  - Progressive Overload im Gym tracken (Gewicht, Sätze, Wiederholungen)
  - Lauffortschritt tracken inkl. GPX-Import aus Garmin Connect
  - Funktionsfähiger, online deployter Prototyp mit Nutzerevaluation

- **Primäre Zielgruppe:** Aktive Hobbyathleten (18–35 Jahre) die regelmässig mehrere Sportarten betreiben und ihren Trainingsalltag strukturierter gestalten möchten – ohne komplexe Profi-Tools oder teure Hardware-Abhängigkeiten.

- **Weitere Stakeholder:** Dozierende ZHAW (Bewertung), Testpersonen für Usability-Evaluation

---

## 2. Lösungsidee

- **Kernfunktionalität:**
  - **Dashboard:** Tagesempfehlung (Heavy / Light / Rest) basierend auf der bisherigen Wochenbelastung sowie Wochenübersicht aller geplanten und absolvierten Einheiten
  - **Wochenplaner:** Fixe Einheiten (z.B. Fussball-Training) eintragen und Woche vorausplanen
  - **Trainingslog:** Einheiten erfassen (Sportart, Dauer, Intensität/RPE) – Create & Update
  - **Gym Progressive Overload:** Übungen mit Gewicht, Sätzen und Wiederholungen loggen; Verlauf pro Übung und Steigerungsvorschläge
  - **Lauf-Tracking:** Laufeinheiten mit Distanz, Zeit, Pace und Durchschnitts-HR erfassen; GPX-Import aus Garmin Connect
  - **Statistiken:** Belastungsverlauf und Fortschritt über Zeit visualisieren
  - **Profil:** Persönliche Angaben und Ziele hinterlegen

- **Annahmen:**
  - Nutzer tragen Daten manuell ein oder importieren GPX-Dateien aus Garmin Connect
  - Eine einfache regelbasierte Logik reicht für die tägliche Empfehlung im Mindestumfang
  - Nutzer sind motiviert genug, Einheiten nach dem Training einzutragen

- **Abgrenzung:**
  - Keine direkte Hardware-Integration (kein Live-Sync mit Garmin/Strava API)
  - Keine Ernährungsdaten (kein Ersatz für Yazio)
  - Keine Echtzeit-Laktatschwellen-Berechnung (setzt Sensor-Hardware voraus)
  - Keine Social/Community-Features

---

## 3. Vorgehen & Artefakte

### 3.1 Understand & Define

**Zielgruppenverständnis:**

*Problemraumanalyse*

| Nutzer:innen | Bedürfnisse | Kontext / Herausforderungen | HMW |
|---|---|---|---|
| Aktiver Hobbyathlet (Fussball, Gym, Laufen) | Trainingsbelastung im Blick behalten; täglich wissen, wie intensiv trainiert werden soll | Verschiedene Apps für verschiedene Sportarten; kein Gesamtbild; Erholung schwer einschätzbar; Risiko von Übertraining | Wie könnten wir aktiven Multisportlern helfen, ihre Belastung über alle Sportarten täglich klug zu steuern? |

*Proto-Persona*

**Name:** Alex, 26 Jahre  
**Situation:** Spielt 3× pro Woche Fussball, geht zusätzlich ins Gym und läuft (inkl. Intervalle und Sprints). Nutzt Yazio für Kalorien-Tracking und eine Garmin Forerunner 265 mit HRM-600 fürs Laufen.  
**Bedürfnis:** Will «schlau» trainieren – also wissen, wann der Körper intensive Einheiten verträgt und wann Erholung sinnvoller ist.  
**Frustration:** Muss mehrere Apps gleichzeitig nutzen und hat keinen Gesamtüberblick. Gym-Fortschritte werden gar nicht systematisch getrackt.  
**Ziel:** Eine einzige App für alle Sportarten – mit Fortschrittsübersicht und täglicher Trainingsempfehlung.

**Wesentliche Erkenntnisse:**
- Aktive Hobbyathleten mit mehreren Sportarten haben keinen einheitlichen Überblick über ihre Gesamtbelastung
- Bestehende Tools sind sport-spezifisch und decken nur einen Bereich ab
- Es fehlt eine einfache, zugängliche Lösung die Wochenstruktur und tägliche Empfehlungen kombiniert
- Gym-Progressive-Overload und Laufprogression werden von keinem einfachen Tool gemeinsam abgedeckt
- GPX-Export aus Garmin Connect ermöglicht datenreichen Lauf-Import ohne API-Abhängigkeit

*Recherche bestehender Lösungen*

| App / Tool | Was kann es? | Warum reicht es nicht? |
|---|---|---|
| Strava | Laufen & Radfahren tracken, Community, Segmente | Kein Gym-Tracking, keine tägliche Empfehlung, sport-spezifisch |
| Garmin Connect | Umfassendes Aktivitäts- und Gesundheitstracking | Hardware-gebunden, zu komplex, nicht auf Multisport-Alltag für Hobbyathleten ausgerichtet |
| Hevy / Strong | Krafttraining loggen (Übungen, Sätze, Gewichte) | Nur Gym, kein Laufen oder Teamsport, keine Belastungsübersicht |
| TrainingPeaks | Periodisierung, TSS/CTL für Ausdauersport | Für Leistungssportler, sehr komplex, kostenpflichtig |
| Yazio | Kalorien- und Ernährungstracking | Nur Ernährung, kein Trainings-Tracking |

**Lücke:** Keine der analysierten Lösungen bietet eine einfache, hardware-unabhängige App die Multisport-Tracking mit intelligenter Tagesempfehlung, Gym-Progressive-Overload und Laufprogression in einem kombiniert.

---

### 3.2 Sketch

_Wird in Woche 9 ergänzt (Sketch & Decide)_

- **Variantenüberblick:** _[kurz]_
- **Skizzen:** _[Mehrere Varianten; Unterschiede kurz dokumentieren]_

---

### 3.3 Decide

_Wird in Woche 9/10 ergänzt_

- **Gewählte Variante & Begründung:** _[Entscheidkriterien nennen]_
- **End-to-End-Ablauf:** _[Beschreibung inkl. User Journey Map]_
- **Mockup:** _[URL Figma; Screenshots mit kurzen Beschreibungen]_

---

### 3.4 Prototype

_Wird ab Woche 11 ergänzt_

#### 3.4.1 Entwurf (Design)

- **Informationsarchitektur:** _[Seiten/Navigation]_
- **User Interface Design:** _[Screenshots mit Erläuterungen]_
- **Designentscheidungen:** _[zentrale Entscheidungen und Begründungen]_

#### 3.4.2 Umsetzung (Technik)

- **Technologie-Stack:** SvelteKit, HTML/CSS/JavaScript
- **Tooling:** Visual Studio Code, Git & GitHub, Supabase (Datenbank), Vercel (Deployment)
- **Struktur & Komponenten:** _[Seiten, Routen, State/Stores, wichtige Komponenten]_
- **Daten & Schnittstellen:** _[Wie werden Daten gespeichert, verwaltet, abgerufen?]_
- **Deployment:** _[URL wird nach erstem Deployment ergänzt]_
- **Besondere Entscheidungen:** _[z.B. Trade-offs, Vereinfachungen]_

---

### 3.5 Validate

_Wird in Woche 14 ergänzt (Pflichttermin: Deployment Version 1 bis 19.05.2026)_

- **URL der getesteten Version:** _[wird ergänzt]_
- **Ziele der Prüfung:** _[welche Fragen sollen beantwortet werden?]_
- **Vorgehen:** _[moderiert/unmoderiert; remote/on-site]_
- **Stichprobe:** _[Mit wem wurde getestet? Profil; Anzahl]_
- **Aufgaben/Szenarien:** _[Ausformulierte Testaufgaben]_
- **Kennzahlen & Beobachtungen:** _[Erfolgsquote, Zeitbedarf, qualitative Findings]_
- **Zusammenfassung der Resultate:** _[Wichtigste Erkenntnisse]_
- **Abgeleitete Verbesserungen:** _[Priorisierte Verbesserungsvorschläge]_

---

## 4. Erweiterungen

### 4.1 Gym Progressive Overload

- **Beschreibung & Nutzen:** Übungen werden mit Gewicht, Sätzen und Wiederholungen geloggt. Die App zeigt den Verlauf pro Übung und schlägt beim nächsten Training eine Steigerung vor. Direkter Mehrwert für Hobbyathleten die im Gym Fortschritte machen wollen.
- **Wo umgesetzt:** _[wird nach Umsetzung ergänzt]_
- **Referenz:** _[wird nach Umsetzung ergänzt]_
- **Aus Evaluation abgeleitet?:** Nein – von Anfang an geplant

### 4.2 GPX-Import aus Garmin Connect

- **Beschreibung & Nutzen:** Laufaktivitäten können als GPX-Datei aus Garmin Connect exportiert und in TrainSmart importiert werden. Die App liest Distanz, Zeit, Pace und HR automatisch aus. Kein API-Approval-Prozess nötig, da File-basiert. Nutzer mit Garmin-Gerät profitieren von präzisen Daten ohne manuelle Eingabe.
- **Wo umgesetzt:** _[wird nach Umsetzung ergänzt]_
- **Referenz:** _[wird nach Umsetzung ergänzt]_
- **Aus Evaluation abgeleitet?:** Nein – von Anfang an geplant

---

## 5. Projektorganisation

- **Repository & Struktur:** [github.com/albushgango/TrainSmart](https://github.com/albushgango/TrainSmart)
- **Issue-Management:** GitHub Issues für Feature-Tracking und Bugfixes
- **Commit-Praxis:** Sprechende Commits mit Präfix (feat:, fix:, docs:, refactor:)

---

## 6. KI-Deklaration

### 6.1 KI-Tools

- **Eingesetzte Tools:** Claude (Anthropic) via Cowork (Planung, Ideenfindung, Dokumentation) und Claude Code (Implementierung, Code-Unterstützung)
- **Zweck & Umfang:** KI wurde eingesetzt für Ideenfindung und Problemraumanalyse, Erstellung der Projektdokumentation, Code-Unterstützung bei der SvelteKit-Implementierung sowie Unterstützung beim Debugging. Konkret KI-unterstützt: Dokumentationsstruktur und -texte (überarbeitet und angepasst), Codegerüst und Komponenten (geprüft und angepasst).
- **Eigene Leistung (Abgrenzung):** Alle inhaltlichen Entscheide (Projektidee, Feature-Auswahl, Designentscheide, Evaluations-Durchführung) wurden eigenständig erarbeitet. KI-generierte Inhalte wurden kritisch geprüft und angepasst.

### 6.2 Prompt-Vorgehen

Für die Planung und Dokumentation wurde Claude via Cowork als interaktiver Gesprächspartner eingesetzt. Ausgangspunkt war die persönliche Problemschilderung (Multisport-Alltag), woraus gemeinsam Problemraum, HMW-Fragen und Projektidee entwickelt wurden. Für die Implementierung wurde Claude Code mit konkreten Feature-Beschreibungen und bestehendem Code-Kontext als Unterstützung genutzt.

### 6.3 Reflexion

_[Wird nach Projektabschluss ergänzt: Nutzen, Grenzen, Risiken, Qualitätssicherung]_

---

## 7. Anhang

- **Quellen:** _[verwendete Vorlagen/Assets; Lizenz/Urheberrecht]_
- **Testskript & Materialien:** _[wird in Woche 14 ergänzt]_
- **Rohdaten/Auswertung:** _[wird in Woche 14 ergänzt]_
