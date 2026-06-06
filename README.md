# Projektdokumentation – TrainSmart

> Intelligentes Trainingslog für Mehrsportler mit datenbasierten Tagesempfehlungen und Progressive-Overload-Tracking.

🔗 **Live-Demo:** [trainsmartv1.netlify.app](https://trainsmartv1.netlify.app)
📦 **Repository:** [github.com/albushgango/TrainSmart](https://github.com/albushgango/TrainSmart)

---

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

---

## 1. Ausgangslage

Ich bin Mehrsportler – Fussball 3× pro Woche, Krafttraining 2×, dazu unregelmässig Laufen mit Intervallen. Bestehende Tracking-Apps fokussieren auf eine Sportart: Strava für Cardio, Hevy für Gym, Garmin Connect für Daten meiner Forerunner-265-Uhr. Keine sieht das **Gesamtbild meiner Belastung**, was zu Übertraining oder unausgewogenen Wochen führt.

- **Problem:** Fragmentierte Trainings-Erfassung über mehrere Apps. Keine kombinierte Sicht auf Trainings-Load aller Sportarten. Keine Empfehlung, ob heute eine harte Einheit, lockeres Training oder Pause sinnvoll ist. Progressive Overload im Gym wird in einer separaten App geführt, ohne Verknüpfung zur restlichen Belastung.

- **Ziele:**
  - Alle Sportarten in **einer** App tracken
  - Tagesempfehlung (Heavy / Light / Rest) basierend auf Wochenload aller Sportarten
  - Progressive Overload für Krafttraining inline beim Logging erfassen
  - Mobile-first, schneller Workflow (Session loggen in <30 Sekunden)
  - Statistiken über Zeit (Wochenload, Sport-Verteilung, Aktivitäts-Heatmap, Personal Records, Gewichts-Verlauf pro Übung)

- **Primäre Zielgruppe:** Mehrsportler im Alter 20-40, die mehrere Sportarten kombinieren und ihre Gesamtbelastung im Blick behalten wollen. Konkrete Persona: Albushi, ZHAW-Student, Fussball + Gym + Laufen.

- **Weitere Stakeholder:** Hobby-Athleten ohne Profi-Coach, die Übertraining vermeiden möchten und Wert auf Konsistenz legen.

---

## 2. Lösungsidee

TrainSmart ist eine **Mobile-First Web-App** mit PWA-Support, die alle Trainings-Sessions in einer einheitlichen Datenbasis erfasst und daraus eine tägliche Empfehlung berechnet.

- **Kernfunktionalität:**
  - **Session-Logging:** Sport, Subtyp (Push/Pull/Legs/Easy/Tempo/...), Datum, Dauer, RPE (Rate of Perceived Exertion 1-10), Notiz
  - **Tagesempfehlung Heavy/Light/Rest:** berechnet aus Wochenload der letzten 7 Tage (Dauer × RPE) und gestrigem Trainingsstatus
  - **Trainings-Splits:** vordefinierte Splits (Push/Pull/Legs, Arnold, Upper/Lower, Bro Split, Full Body) + Custom-Split. App schlägt nächsten Split-Tag vor
  - **Progressive Overload Tracking:** Übungen pro Kraft-Session erfassen mit Sätzen, Wiederholungen, Gewicht. Vergleich zum letzten Eintrag derselben Übung
  - **Statistik-Dashboard:** Wochenload-Bar-Chart, Sport-Verteilung, 90-Tage-Heatmap, Personal Records, Gewichts-Verlaufs-Charts pro Übung mit Mini-Sparklines
  - **Profil-Verwaltung:** aktiver Split, Wochenziel (Sessions/Woche)

- **Annahmen:**
  - RPE (1-10) ist als subjektives Mass für Trainingsintensität präzise genug für eine Hobby-Sport-App – auch ohne Herzfrequenz-Sensor
  - Wochenload als `Dauer × RPE` ist ein ausreichender Indikator für Übertrainings-Risiko
  - Single-User ist ausreichend für den Use Case (Trainings-Tagebuch ist persönlich)
  - Mobile-First ist sinnvoll, weil Sessions meist direkt nach dem Training auf dem Handy erfasst werden

- **Abgrenzung (explizit nicht im Umfang):**
  - Kein Login/Authentifizierung – Single-User
  - Keine Garmin-/Strava-Direkt-Integration (manuelles Erfassen reicht)
  - Kein GPS-Tracking während des Trainings
  - Keine Push-Notifications oder Reminder
  - Keine Ernährungs-/Kalorien-Tracking (Fokus auf Training)
  - Keine Multi-User-Funktionen (kein Teilen, kein Vergleich mit Freunden)

---

## 3. Vorgehen & Artefakte

Die Entwicklung folgte den fünf Phasen der Modul-Methodik. Phasen 1-3 wurden in den Übungsstunden vorbereitet (vgl. [SW9-Abgabe](#71-mockup-aus-sw9)), Phase 4 (Prototype) ist Hauptinhalt der Übungen ab SW10, Phase 5 (Validate) wurde am 20.05.2026 durchgeführt.

### 3.1 Understand & Define

- **Zielgruppenverständnis:** Eigene Lebenssituation als Ausgangspunkt (Trainings-Mehrsportler, Garmin-Nutzer). Recherche bestehender Apps zeigte: Hevy (Gym-only), Strava (Cardio-only), Garmin Connect (Geräte-zentrisch). Keine kombiniert Sport-übergreifenden Load mit Übungs-spezifischer Progression.

- **(Proto-)Personas:**

  **Persona 1 — Albi (Primär)**
  - 25 Jahre, ZHAW-Student Wirtschaftsinformatik
  - Sport: Fussball 3×, Krafttraining 2×, Laufen 1× pro Woche
  - Tools: iPhone 15, Garmin Forerunner 265 + HRM-600
  - **Pain Points:** Wechselt zwischen 3 Apps, keine sieht das Gesamtbild. Übertrainings-Anfälligkeit wenn Gym + Fussball am gleichen Tag hart waren.
  - **Ziel:** App, die ihm beim Aufstehen sagt "heute solltest du locker oder hart trainieren oder pausieren".

  **Persona 2 — Sandra (Sekundär)**
  - 32 Jahre, Office-Managerin
  - Sport: Yoga 2×, Schwimmen 1×, Wandern am Wochenende
  - **Pain Points:** Apps zu kompliziert, will nur einfache Übersicht über Wochenkonsistenz.
  - **Ziel:** Wochenziel halten (3 Sessions/Woche), nicht überfordern.

- **Wesentliche Erkenntnisse:**
  - **"Was soll ich heute machen?"** ist die wichtigste tägliche Frage – sie sollte beim App-Start sofort beantwortet werden
  - **Progressive Overload ist ein eigener Datenraum** (Übung × Gewicht × Zeit) und gehört eng an die Session geknüpft
  - **Logging muss schnell sein** – < 30 Sekunden ohne Klick-Marathon, sonst wird's nach dem Training nicht mehr erfasst
  - **Übertraining-Vermeidung** ist wichtiger als maximale Performance bei Hobby-Sportlern

### 3.2 Sketch

In SW9 wurden mit der **Crazy-8s-Methode** acht Lösungsvarianten für die Hauptansicht (Tagesempfehlung) skizziert. Die vollständige Skizzen-Sammlung mit handgezeichnetem Original ist im Anhang ([SW9-Abgabe](#71-mockup-aus-sw9)) dokumentiert.

![Handgezeichnete Crazy-8s-Skizzen aus SW9](docs/crazy-8s-sketch.jpeg)

| #   | Variante            | Beschreibung                                                                      |
| --- | ------------------- | --------------------------------------------------------------------------------- |
| 1   | Ampel-Karte         | Empfehlung als Ampelfarbe (rot/gelb/grün) mit letzten 3 Tagen darunter            |
| 2   | Wochenstreifen      | Mo–So mit Trainings-Punkten, Empfehlung darunter                                  |
| 3   | Load-Ring           | Zentrale numerische Score (z.B. 72/100) mit Light/Heavy darunter                  |
| 4   | **Vollbild-Card ★** | Empfehlung dominiert den Screen ("REST" gross), darunter Details-Link             |
| 5   | Kompakt-Liste       | Empfehlung oben + Sport-Übersicht (Gym ✓ / Laufen ✗ / Fussball ✓)                 |
| 6   | Score-Balken        | Detaillierter Load-Score als Balken + Trend                                       |
| 7   | Coach-Nachricht     | Personalisierte Begründungs-Nachricht ("Du hast die letzten 2 Tage trainiert...") |
| 8   | Kalender-Ansicht    | Monatskalender mit heutigem Tag hervorgehoben                                     |

**Selbstevaluation per Dot-Voting** (3 Punkte verteilt): Variante 4 erhielt 2 Punkte (★), Varianten 1 und 5 je 1 Punkt.

### 3.3 Decide

- **Gewählte Variante:** **Variante 4 – Vollbild-Card**

- **Begründung:**
  - **Mobile-first:** Eine Information dominiert den Screen, kein Scrollen nötig
  - **Kein Suchen:** Empfehlung ist beim App-Start die erste sichtbare Information
  - **Beste Balance** aus Klarheit (Variante 1) und Kontext (Variante 5)
  - Numerische Scores (Variante 3, 6) sind zu abstrakt für tägliche Entscheidung

- **End-to-End-Ablauf (User Journey):**

  ```
  Dashboard → Session-Detail tippen → Session loggen → Toast-Bestätigung → Liste
  ```

  Visualisiert als Sequenz:

  ```mermaid
  journey
      title Hauptworkflow: Session loggen
      section Vorbereitung
        App öffnen: 5: User
        Tagesempfehlung sehen: 5: User
        "+ Session loggen" tippen: 5: User
      section Erfassen
        Sportart wählen (vorausgewählt): 5: User
        Subtyp wählen (Vorschlag aus Split): 5: User
        Datum (Quick-Date Pill): 5: User
        Dauer + RPE eingeben: 4: User
        Übungen erfassen (bei Kraft): 4: User
        "Speichern" tippen: 5: User
      section Bestätigung
        Toast "Session gespeichert": 5: User
        Liste mit neuer Session: 5: User
  ```

- **Mockup:** Das in SW10 ausgearbeitete UI-Mockup liegt in Figma: **[TrainSmart – UI Mockup SW10](https://www.figma.com/design/RVQ0oce2SmIBvRvHFZyC7u/TrainSmart-%E2%80%93-UI-Mockup-SW10?node-id=17-2)**. Es umfasst sechs Screens (Dashboard, Tagesdetail, Session loggen, Trainings-Log, Wochenplaner, Statistiken). Die handgezeichnete Vorstufe (Crazy-8s) ist in [Anhang 7.1](#71-mockup-aus-sw9) dokumentiert.

![TrainSmart UI-Mockup (SW10, Figma)](docs/mockup-sw10.png)

_Low-Fidelity-Mockup aus SW10. Einige Konzepte wurden in der Umsetzung bewusst angepasst – u. a. wurde "Wochenplaner" zu "Profil" und der numerische "Load Score" zu einer kategorischen Empfehlung auf RPE-Basis (siehe Designentscheidungen in Kap. 3.4.1)._

### 3.4 Prototype

#### 3.4.1 Entwurf (Design)

Beschreibt die **gestaltete und implementierte App** – nicht das Mockup. An einigen Stellen wurde während der Implementierung bewusst vom Mockup abgewichen (siehe Designentscheidungen).

- **Informationsarchitektur:**

  Vier Hauptbereiche, erreichbar über persistente Bottom-Navigation:

  ```
  /          Dashboard         Tagesempfehlung, Wochenkalender, Wochenziel, Sessions
  /log       Trainings-Log     Liste aller Sessions, Filter nach Sportart, Export
  /log/new   Session loggen    Form für neue Session (mit Übungen bei Kraft)
  /log/[id]  Session-Detail    Read/Edit-Toggle, Übungen-Verwaltung, Lösch-Dialog
  /stats     Statistiken       3 Tabs: Übersicht / Aktivität / Fortschritt
  /profil    Profil            Trainings-Split + Wochenziel
  /export    CSV-Export        Server-Endpoint, kein UI
  ```

- **User Interface Design:**

  Dark-Theme mit Lime-Akzentfarbe und sport-spezifischen Highlights (Kraft=Rot, Laufen=Lime, Rad=Cyan, Schwimmen=Blau). ALL-CAPS-Headers, klare Tab-Navigation, subtile Glow-Effekte für aktive Zustände.

  **Wichtige Screens:**
  - **Dashboard**: ALL-CAPS-Header ("DASHBOARD"), klickbarer Wochenkalender (7 Pills mit Aktivitäts-Punkten), Empfehlungs-Card mit farbigem Glow, Wochenziel-Fortschrittsbalken, Tag-spezifische Sessions-Liste
  - **Session loggen**: Sport-Pills, Subtyp-Pills (sport-abhängig), Quick-Date-Pills (Heute/Gestern/Vorgestern), Combobox für Übungen mit gruppierten Vorschlägen
  - **Statistiken**: Tab-Navigation mit Lime-Underline, SVG-Charts (Bar-Chart, Heatmap, Linien-Chart, Mini-Sparklines)

  **Screenshots der Live-App** (produktive Netlify-Version):

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/01-dashboard.png" alt="Dashboard"><br><sub><b>Dashboard</b> – Tagesempfehlung mit „… vorbereiten"-Button, Wochenkalender, Wochenziel</sub></td>
    <td width="50%"><img src="docs/screenshots/02-session-loggen.png" alt="Session loggen"><br><sub><b>Session loggen</b> – Basisdaten in zwei Spalten (Sportart/Subtyp · Datum/Dauer), RPE-Slider</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/03-fokus-modus.png" alt="Fokus-Modus"><br><sub><b>Live-Training im Fokus-Modus</b> (4.20) – Vollbild, Pausen-Timer, Sätze abhaken; nächster Satz bis Pausenende gesperrt</sub></td>
    <td><img src="docs/screenshots/04-stats-uebersicht.png" alt="Stats Übersicht"><br><sub><b>Stats · Übersicht</b> (4.19) – Zeitraum-Filter (Woche/4/8 Wochen), Load-Chart, Sport-Verteilung</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/05-stats-fortschritt.png" alt="Stats Fortschritt"><br><sub><b>Stats · Fortschritt</b> (4.7) – Personal Records + Gewichts-Verlauf je Übung (inkl. Körpergewicht)</sub></td>
    <td><img src="docs/screenshots/06-stats-aktivitaet.png" alt="Stats Aktivität"><br><sub><b>Stats · Aktivität</b> – 90-Tage-Heatmap, alle Wochentage beschriftet</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/07-profil-eigener-split.png" alt="Profil – Eigener Split"><br><sub><b>Profil · Eigener Split</b> – kontrollierte Tag-Auswahl (Such-Combobox), Wochenziel, HR-Zonen</sub></td>
    <td></td>
  </tr>
</table>

- **Designentscheidungen:**

  | Entscheidung                              | Begründung                                                                                                                                                                                        |
  | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | "Planer"-Tab des Mockups → "Profil"-Tab   | Während Implementation zeigte sich: Trainings-Splits + Wochenziel-Verwaltung haben grösseren Mehrwert als ein Wochenplaner. Das eigentliche Planen passiert via Split-Vorschlag auf dem Dashboard |
  | Vollbild-Card kompakter als im Mockup     | Wochenkalender und Wochenziel als zusätzliche Dashboard-Elemente kamen dazu. Empfehlung bleibt prominent, dominiert den Screen aber nicht mehr exklusiv                                           |
  | Numerischer Load-Score (72/100) verworfen | Eigene Erfahrung beim Bauen: Zahl ist zu abstrakt für tägliche Entscheidung. Stattdessen klare Kategorien (Heavy/Light/Rest/Erledigt)                                                             |
  | Lime als Akzentfarbe statt Marken-Blau    | "Athletic"-Vibe, hebt sich von typischen Sport-Apps (meist Orange/Rot) ab                                                                                                                         |
  | PWA-Manifest als Erweiterung              | App lässt sich auf iPhone "Zum Home-Bildschirm" hinzufügen → fühlt sich wie native App an, kein App-Store-Review nötig                                                                            |
  | Keine externe Chart-Library               | SVG-Charts selbst gebaut. Spart 200KB Bundle, volle Kontrolle über Dark-Theme-Farben, kein Versions-Risiko                                                                                        |

#### 3.4.2 Umsetzung (Technik)

- **Technologie-Stack:**
  - **Frontend:** SvelteKit 2 + Svelte 5 (Runes-API: `$state`, `$props`, `$derived`, `$effect`)
  - **Styling:** Reines CSS (keine UI-Library), zentrale CSS-Custom-Properties im Layout
  - **Backend:** SvelteKit Server (load functions + form actions, `+server.js` für CSV-Endpoint)
  - **Datenbank:** MongoDB Atlas via Mongoose
  - **Sprache:** JavaScript (kein TypeScript – bewusste Vereinfachung für Prototyp-Scope)

- **Tooling:**
  - VS Code als Entwicklungsumgebung
  - Claude Code (Anthropic CLI-Agent) als KI-Tool für Code-Generation, Refactoring, Bug-Fixing
  - Cowork (Anthropic Web-Interface) für Konzeption, Architektur-Diskussionen, Dokumentation
  - Git/GitHub für Versionsverwaltung
  - Netlify für Deployment (CD per Git-Push)
  - MongoDB Compass für lokale DB-Inspektion
  - Details zum KI-Einsatz: siehe [Kapitel 6](#6-ki-deklaration)

- **Struktur & Komponenten:**

  ```
  src/
  ├── app.html                       # PWA-Meta-Tags, Theme-Color, Apple-Touch-Icons
  ├── lib/
  │   ├── Toast.svelte               # Globale Toast-Komponente
  │   ├── toast.svelte.js            # Reaktiver Toast-Store (Svelte-5-Runes)
  │   ├── splits.js                  # Trainings-Split-Definitionen + Helpers
  │   ├── uebungen.js                # 60 vordefinierte Gym-Übungen + Subtyp-Filter
  │   └── server/
  │       ├── db.js                  # MongoDB-Connection (Singleton)
  │       └── models/
  │           ├── session.js         # Mongoose-Schema Session
  │           ├── uebung.js          # Mongoose-Schema Übung (mit sessionId-Ref)
  │           └── profil.js          # Mongoose-Schema Profil (Singleton)
  ├── routes/
  │   ├── +layout.svelte             # Bottom-Nav, Theme, Toast-Mount
  │   ├── +page.svelte               # Dashboard
  │   ├── +page.server.js            # Empfehlungs-Logik, Wochenkalender, Streak
  │   ├── log/
  │   │   ├── +page.svelte           # Trainings-Log mit Sport-Filter
  │   │   ├── +page.server.js
  │   │   ├── new/                   # Neue Session erfassen (mit Übungen)
  │   │   └── [id]/                  # Session-Detail mit Edit/Delete
  │   ├── stats/                     # Statistik-Tabs (Übersicht/Aktivität/Fortschritt)
  │   ├── profil/                    # Trainings-Split + Wochenziel
  │   └── export/+server.js          # CSV-Endpoint
  └── static/
      ├── icon.svg, icon-192.svg     # PWA-Icons
      ├── manifest.webmanifest       # PWA-Manifest
      └── robots.txt
  ```

  **Wiederverwendete Komponenten und Konzepte:**
  - `Toast.svelte` mit Store in `toast.svelte.js` – global eingebunden im Layout
  - CSS-Custom-Properties (`--accent`, `--bg-card`, `--radius-md` etc.) – konsistente Theming-Variablen
  - Konstanten-Module (`splits.js`, `uebungen.js`) – einmal definiert, in mehreren Pages genutzt

- **Daten & Schnittstellen:**

  Drei Mongoose-Collections in MongoDB Atlas:

  ```mermaid
  erDiagram
      Session ||--o{ Uebung : "hat (bei Kraft)"
      Profil ||..|| Session : "konfiguriert Subtyp-Vorschlag"

      Session {
          ObjectId _id PK
          String sport "Kraft|Laufen|Rad|Schwimmen"
          String subtyp "z.B. Push, Pull, Easy"
          Date datum
          Number dauer "Minuten"
          Number rpe "1-10"
          String notiz
          Date createdAt
          Date updatedAt
      }

      Uebung {
          ObjectId _id PK
          ObjectId sessionId FK "→ Session"
          String name "z.B. Bench Press"
          Number saetze
          Number wiederholungen
          Number gewicht "kg"
          String notiz
          Date createdAt
          Date updatedAt
      }

      Profil {
          ObjectId _id PK
          String aktiverSplit "ID aus SPLITS-Konstante"
          String[] customSplitTage "bei Custom-Split"
          Number wochenziel "Sessions/Woche"
      }
  ```

  **Schnittstellen:**
  - **SvelteKit Server-Load-Functions** (`+page.server.js`) für SSR-Daten
  - **SvelteKit Form Actions** (`actions.default`, `actions.update`, `actions.delete`, `actions.uebungHinzufuegen` etc.) für Mutationen
  - **CSV-Export-Endpoint** (`/export/+server.js`) als GET-Handler mit `Content-Disposition: attachment`
  - **Singleton-Connection** zur MongoDB (Connection-Pooling über Mongoose)

- **Architektur:**

  ```mermaid
  graph LR
      Client[Browser/PWA] -->|HTTPS| CDN[Netlify CDN]
      CDN --> Function[Netlify Function<br/>SvelteKit SSR Server]
      Function -->|Mongoose Driver| Atlas[(MongoDB Atlas<br/>Shared Cluster)]
      Client -.->|installs as PWA| Home[iOS/Android Home Screen]
      GitHub[GitHub Repo] -->|Push trigger| Build[Netlify Build]
      Build --> CDN
  ```

  Single-Region-Deployment auf Netlify (eu-central). MongoDB Atlas als Managed-DB ebenfalls in EU. Keine separaten Backend-Services oder Microservices.

- **Deployment:**
  - **Live-URL:** [trainsmartv1.netlify.app](https://trainsmartv1.netlify.app)
  - **CI/CD:** Push auf `main` triggert automatischen Netlify-Build (~2 Min)
  - **Konfiguration:** `netlify.toml` mit Node-20-Pinning, `@sveltejs/adapter-netlify`
  - **Env-Variable:** `MONGODB_URI` im Netlify-Dashboard (Atlas Connection-String)
  - **PWA:** Manifest + Service-Worker-Hooks für Home-Screen-Installation

- **Besondere Entscheidungen:**

  | Entscheidung                                                 | Trade-off                                                                                                                        |
  | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
  | Übungen-Liste hardcoded in `$lib/uebungen.js` (60 Einträge)  | Schneller Build, keine extra Collection. Trade-off: Einträge nur via Code-Update änderbar (vertretbar bei Single-User-App)       |
  | Profil als Singleton-Dokument                                | Keine Auth = kein User-ID-Schlüssel nötig. Alternative wäre Local-Storage gewesen, aber DB-Persistenz ist plattform-übergreifend |
  | `split: false` im Netlify-Adapter                            | Eine einzige Function für alle Server-Routes. Einfacherer Cold-Start als 10+ separate Functions                                  |
  | CSV-Endpoint unter `/export` statt `/log/export`             | Routing-Konflikt mit dynamischer Route `/log/[id]` auf Netlify-Adapter vermieden                                                 |
  | Subtilere Borders (`rgba(... 0.08)`) statt voller Hex-Farben | Cleanerer Look bei dunklem Theme; Cards heben sich subtil ab statt mit harten Linien                                             |

### 3.5 Validate

Die Usability Evaluation wurde in der PT-Kleinklasse am **20.05.2026** durchgeführt und ist direkt in dieser README dokumentiert. Grundlage waren die Anforderungen aus SW14: getestete Version festhalten, Ziele definieren, Vorgehen beschreiben, Stichprobe dokumentieren, Szenarien ausformulieren, Beobachtungen sammeln, Issues priorisieren und Verbesserungen ableiten.

- **URL der getesteten Version:** [trainsmartv1.netlify.app](https://trainsmartv1.netlify.app)
- **Zustand der evaluierten Version:** Produktive Netlify-Version am 20.05.2026. Die ausgefüllten Protokolle liegen als Dokumentation zusätzlich unter `docs/usability-evaluation-protokoll_donart_imeri.docx` und `docs/usability-evaluation-protokoll_adi_lama.docx`. Die App wurde **nach** der Evaluation weiterentwickelt (siehe Erweiterungen 4.15–4.18); die evaluierte Version entspricht dem Stand vor diesen Änderungen.
- **Testform:** Moderierter On-site-Test mit Think-Aloud-Methode. Die Testperson bedient den Prototyp selbst und spricht laut aus, was sie erwartet, sucht, versteht oder nicht versteht.
- **Infrastruktur:** Smartphone oder Notebook mit Browser, stabile Internetverbindung, geöffnete TrainSmart-App, Protokollvorlage/Feedback-Grid.
- **Zeitbudget:** ca. 10 Minuten pro Testperson, gemäss Übungssetting.
- **Testleitung:** Albushi beobachtet, gibt die Aufgaben schriftlich, greift nur bei Blockern ein und protokolliert Verhalten, Aussagen und Probleme.

#### 3.5.1 Ziele und Fragestellungen

Die Evaluation fokussiert auf die wichtigsten End-to-End-Workflows, die für den Prototyp und die Abgabe relevant sind.

1. **Session loggen:** Finden Testpersonen den Einstieg zum Erfassen einer neuen Trainingseinheit und können sie eine Session vollständig speichern?
2. **Krafttraining mit Übungen:** Verstehen Testpersonen, wie sie bei einer Kraft-Session Übungen, Sätze, Wiederholungen und Gewicht erfassen?
3. **Trainingsübersicht:** Finden Testpersonen eine gespeicherte Session im Log wieder und verstehen sie Filter bzw. Detailansicht?
4. **Tagesempfehlung:** Verstehen Testpersonen auf dem Dashboard, ob heute Heavy, Light oder Rest sinnvoll ist und warum?
5. **Fortschritt/Stats:** Können Testpersonen erkennen, wo Trainingsfortschritt und Wochenload sichtbar werden?
6. **Profil/Split:** Ist verständlich, wo persönliche Trainingslogik wie Wochenziel und Kraft-Split eingestellt wird?

#### 3.5.2 Stichprobe

Die Evaluation wurde mit zwei Mitstudierenden durchgeführt. TP1 hat ein ausführliches Protokoll ausgefüllt. TP2 hat die Szenario-Aufgaben ebenfalls durchgespielt und zusätzlich qualitatives Feedback aus Sicht eines sehr aktiven Gym-Nutzers gegeben. Dadurch konnten sowohl der allgemeine Workflow als auch der wichtigste Spezialfall "Krafttraining / Progressive Overload" geprüft werden.

| Testperson        | Profil     | Sportbezug                              | Gerät / Browser    | Status                                    |
| ----------------- | ---------- | --------------------------------------- | ------------------ | ----------------------------------------- |
| TP1: Donart Imeri | Mitstudent | Fitness                                 | nicht dokumentiert | Szenario-Test durchgeführt                |
| TP2: Adi Lama     | Mitstudent | sehr aktiver Gym-Nutzer / Krafttraining | nicht dokumentiert | Szenario-Test + Gym-Feedback durchgeführt |

#### 3.5.3 Testaufgaben / Szenarien

Die Aufgaben sind bewusst als Alltagssituationen formuliert und nennen möglichst nicht direkt die UI-Begriffe oder Lösungsschritte.

Für das 10-Minuten-Setting werden **Aufgaben 1-4** als Kernaufgaben verwendet. **Aufgaben 5-6** sind Zusatzaufgaben, falls eine Testperson schnell ist oder ein zweiter Testdurchlauf mehr Zeit bietet.

**Aufgabe 1: Training nachtragen**  
Du hast gestern ein Krafttraining gemacht: 65 Minuten, anstrengend aber nicht maximal. Du möchtest dieses Training in deiner Trainings-App festhalten. Erfasse zusätzlich zwei Übungen: Bankdrücken mit 4 Sätzen à 8 Wiederholungen und Kniebeugen mit 3 Sätzen à 10 Wiederholungen.

**Aufgabe 2: Gespeichertes Training wiederfinden**  
Du möchtest kontrollieren, ob dein gerade erfasstes Training gespeichert wurde. Suche den Eintrag und öffne die Details.

**Aufgabe 3: Training korrigieren**  
Dir fällt auf, dass die Dauer des Trainings eigentlich 70 Minuten war. Passe den Eintrag entsprechend an.

**Aufgabe 4: Tagesentscheidung treffen**  
Du öffnest die App am Morgen und willst wissen, ob heute eher ein hartes Training, ein lockeres Training oder Pause sinnvoll ist. Finde die Information und erkläre kurz, was du daraus ableitest.

**Aufgabe 5: Fortschritt prüfen**  
Du möchtest wissen, ob du bei Kraftübungen Fortschritte machst und wie deine letzte Trainingsbelastung aussieht. Suche die passende Übersicht und beschreibe, welche Informationen dir helfen.

**Aufgabe 6: Trainingsprofil anpassen**  
Du möchtest ein Wochenziel setzen und mit einem Push/Pull/Legs-Split trainieren. Finde heraus, wo du diese Einstellungen anpassen würdest.

#### 3.5.4 Messwerte und Beobachtungen

Während der Tests werden pro Aufgabe folgende Punkte notiert:

- **Erfolg:** geschafft / mit Hilfe geschafft / nicht geschafft
- **Zeitbedarf:** grob in Minuten oder Sekunden
- **Auffälligkeiten:** Suchbewegungen, Missverständnisse, falsche Klicks, sichtbare Unsicherheit
- **Originalaussagen:** kurze Zitate oder sinngemässe Aussagen der Testperson
- **Schweregrad:** 0 = kein Problem, 1 = kosmetisch, 2 = kleines Problem, 3 = grosses Problem, 4 = kritisch

| Aufgabe                     | TP1                     | TP2                              | Beobachtung / Issue                                                                                                              | Schweregrad |
| --------------------------- | ----------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1 Session erfassen          | geschafft, ca. 120 Sek. | geschafft, ca. 120 Sek.          | Post-Workout-Logging funktioniert. Adi wünscht sich zusätzlich einen aktiven Trainingsmodus während dem Gym.                     | 2           |
| 2 Session wiederfinden      | geschafft, ca. 10 Sek.  | geschafft, ca. 10 Sek.           | Einträge sind gut auffindbar. Für Gym wären zusätzliche Split-/Übungsinfos in der Liste nützlich.                                | 1           |
| 3 Session korrigieren       | geschafft, ca. 10 Sek.  | geschafft, ca. 15 Sek.           | Bearbeiten und Speichern wurden verstanden.                                                                                      | 0           |
| 4 Tagesempfehlung verstehen | geschafft, ca. 20 Sek.  | geschafft, aber teilweise unklar | Empfehlung ist sichtbar, sollte aber stärker erklären bzw. direkt zu einem Trainingsvorschlag führen.                            | 3           |
| 5 Fortschritt prüfen        | geschafft, ca. 10 Sek.  | geschafft, ca. 15 Sek.           | Fortschritt wird gefunden und als nützlich bewertet. Donart wünscht detailliertere Diagramme, Adi anklickbare Aktivitäts-Punkte. | 2           |
| 6 Profil anpassen           | geschafft, ca. 30 Sek.  | geschafft, ca. 30 Sek.           | Wochenziel und Trainings-Split werden gefunden und als nützlich verstanden.                                                      | 0           |

#### 3.5.5 Feedback-Grid

| Positiv / hat gut funktioniert                                                                                                                                                            | Negativ / hat gestört                                                                                                                                                                                                                               | Neue Ideen / Anforderungen                                                                                                                                                                                                                                                                                     | Unklar / offene Fragen                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Die Hauptworkflows funktionierten bei beiden Testpersonen. Donart fand die Bedienung natürlich und simpel. Adi bewertete Gym-Splits, Wochenziel und Übungsfilter nach Split sehr positiv. | Die Desktop/Tablet-Ansicht wirkt noch zu stark wie eine Handy-App. Einzelne nicht editierbare Bereiche wirken anklickbar. Die Empfehlung auf der Hauptseite ist noch zu wenig handlungsorientiert. Rad und Schwimmen wirken noch weniger ausgebaut. | Trainingsplan mit Geräten bzw. Übungen empfehlen. Empfehlung anklickbar machen und daraus ein vorgeschlagenes Training erzeugen. Übungsvorschau mit Standard-Sets anzeigen. Live-Workout-Modus für Sets, Wiederholungen und Gewicht. Aktivitäts-Punkte anklickbar machen. Später Gewicht und Kalorien tracken. | Bei Donart gab es keine offenen Fragen. Bei Adi war unklar, ob die Tagesempfehlung nur informieren soll oder ob daraus direkt ein Training gestartet werden kann. |

#### 3.5.6 Issue Map und Handlungsempfehlungen

| Ort / Screen                  | Problem                                                                                                | Ursache / Vermutung                                                                | Empfehlung                                                                                               | Priorität |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------- |
| Dashboard / Tagesempfehlung   | Empfehlung ist nützlich, aber noch nicht direkt handlungsorientiert                                    | Empfehlung zeigt "Heavy/Light/Rest", bietet aber keinen nächsten konkreten Schritt | Empfehlung klickbar machen und basierend auf Wochenziel + Split ein konkretes Training vorschlagen       | hoch      |
| Neue Session / Krafttraining  | Übungsvorschläge könnten noch stärker vorbereitet sein                                                 | Split ist bekannt, daraus könnten konkrete Übungen vorgeschlagen werden            | Pro Split automatisch Übungen anzeigen, z.B. 2 Sets als Standard, weitere Sets manuell hinzufügbar       | hoch      |
| Neue Session / Krafttraining  | Gym-Nutzer möchte Übungen nicht erst nach dem Training erfassen, sondern während des Trainings tracken | Aktueller Workflow ist eher ein Trainings-Tagebuch nach dem Training               | Optionalen "Training starten"-Modus ergänzen: Übungsvorschau, Sets abhaken, Gewicht/Wdh direkt eintragen | mittel    |
| Layout / Responsive Design    | Desktop/Tablet-Ansicht nutzt den Platz noch nicht optimal                                              | App ist stark mobile-first gebaut                                                  | Für grössere Screens eigenes Layout mit breiterer Statistik-/Listenansicht bauen                         | mittel    |
| Interaktive Elemente / Felder | Einzelne Bereiche wirken anklickbar, obwohl dort nichts bearbeitet werden kann                         | Visuelles Styling unterscheidet nicht klar genug zwischen Anzeige und Eingabe      | Nur echte Eingabefelder interaktiv wirken lassen; reine Anzeigeelemente visueller abgrenzen              | tief      |
| Loggen / Sportarten           | Rad und Schwimmen wirken sichtbar, obwohl sie noch weniger ausgebaut sind                              | Alle Sportarten werden gleich prominent angezeigt                                  | Rad/Schwimmen temporär reduzieren, als "später" markieren oder Funktionalität klarer begrenzen           | tief      |
| Stats / Aktivität             | Grüne Aktivitäts-Punkte sind nicht direkt anklickbar                                                   | Heatmap zeigt Aktivität, führt aber nicht zur Session                              | Punkte/Tage anklickbar machen und passende Sessions öffnen                                               | mittel    |
| Stats / Fortschritt           | Gewichts-Fortschritt könnte detaillierter dargestellt werden                                           | Aktuelle Diagramme geben Überblick, aber wenig Detailtiefe                         | Fortschrittsdiagramme ausbauen und Detailansicht pro Übung verbessern                                    | mittel    |
| Allgemeines UI                | Es gibt keinen Hell-/Dunkelmodus-Wechsel                                                               | Dark Theme ist fest vorgegeben                                                     | Optionalen Theme-Switch als spätere Komfortfunktion prüfen                                               | tief      |

#### 3.5.7 Zusammenfassung der Resultate

Die Szenario-Tests zeigen, dass die Kernworkflows grundsätzlich funktionieren: Session erfassen, Eintrag wiederfinden, bearbeiten, Tagesempfehlung ansehen und Profil anpassen. Besonders stark wahrgenommen werden die Gym-spezifischen Funktionen: Wochenziel, Trainings-Split und gefilterte Übungsauswahl passen gut zum Use Case eines aktiven Kraftsportlers. Gleichzeitig zeigt sich, dass die Tagesempfehlung noch stärker in eine konkrete Handlung übersetzt werden sollte. Besonders wertvoll wäre ein Ablauf, bei dem aus Wochenziel und Split automatisch ein Training vorgeschlagen wird, das direkt gestartet und während des Trainings getrackt werden kann.

#### 3.5.8 Abgeleitete Verbesserungen

Aus der Evaluation wurden die folgenden Verbesserungen abgeleitet und priorisiert. Die hoch priorisierten Punkte sowie zwei weitere wurden **nach der Evaluation umgesetzt** (Details in Kapitel 4); die übrigen sind als GitHub-Issues für die nächste Iteration festgehalten.

**✅ Nach der Evaluation umgesetzt:**

1. **Tagesempfehlung klickbar und handlungsorientiert (hoch):** Klick auf die Empfehlung führt zu einem konkret vorbereiteten Training (siehe Kap. 4.15).
2. **Automatische Gym-Workout-Vorschläge (hoch):** Übungen werden passend zum aktiven Split vorgeschlagen (siehe Kap. 4.16).
3. **Live-Workout-Modus (mittel):** Training aktiv starten und Sets während dem Gym abhaken (siehe Kap. 4.17).
4. **Unfertige Sportarten zurückgenommen (tief):** Erfassung vorerst auf Kraft & Laufen fokussiert (siehe Kap. 4.18).
5. **Responsive Layout verbessert (mittel):** Desktop-/Tablet-Ansicht nutzt den Platz besser; das Session-Formular wurde neu ausgerichtet (siehe Kap. 4.21).

**🔜 Für die nächste Iteration festgehalten (als GitHub-Issues):**

6. **Stats noch interaktiver machen (mittel):** Aktivitäts-Punkte der Heatmap sollen direkt zur passenden Session führen.
7. **Spätere Erweiterungen sammeln (tief):** Körpergewicht- und Kalorien-Tracking als mögliche Zukunftsfunktionen.

Bereits vor der formalen Evaluation aus eigenem Testen umgesetzt:

- **Datum-Validierung:** Sessions können nicht mehr versehentlich in der Zukunft erfasst werden.
- **Übungs-Combobox:** Übungsvorschläge sind beim Erfassen und Bearbeiten besser sichtbar.
- **CSV-Export:** Export-Route wurde auf `/export` verschoben, damit sie auf Netlify nicht mit `/log/[id]` kollidiert.

---

## 4. Erweiterungen

Die folgenden Erweiterungen wurden über den Mindestumfang der Übungen ab SW8 hinaus umgesetzt. Jede ist eigenständig und schmälert den Mindestumfang nicht.

### 4.1 Klickbarer Wochenkalender auf dem Dashboard

- **Beschreibung & Nutzen:** Direkt unter dem Dashboard-Header zeigt ein 7-Tage-Pill-Streifen die aktuelle Woche (Mo-So). Tage mit erfassten Sessions haben einen Lime-Punkt. Klick auf einen Tag filtert die Sessions-Liste unten auf diesen Tag. So sieht man auf einen Blick, an welchen Tagen man trainiert hat und kann gezielt zu einer Session navigieren.
- **Wo umgesetzt:**
  - Frontend: [`src/routes/+page.svelte`](src/routes/+page.svelte), Sektion "Wochenkalender"
  - Backend: [`src/routes/+page.server.js`](src/routes/+page.server.js), Funktionen `aktuellerWochenStart()`, `baueWochenTage()`, `wochenSessions`
- **Referenz:** Evaluierte Netlify-Version vom 20.05.2026 und Usability-Protokolle unter `docs/`
- **Aus Evaluation abgeleitet?:** Nein, eigene Initiative

### 4.2 Tagesempfehlung mit Heuristik

- **Beschreibung & Nutzen:** Berechnet aus Wochenload (Dauer × RPE der letzten 7 Tage), gestrigem Trainingsstatus und heutigem Trainingsstatus eine kategorische Empfehlung: **Heavy** (loslegen), **Light** (lockeres Training), **Rest** (Erholung), **Erledigt** (heute schon trainiert). Bei aktivem Split wird zusätzlich der nächste Split-Tag vorgeschlagen.
- **Wo umgesetzt:**
  - Backend: [`src/routes/+page.server.js`](src/routes/+page.server.js), Funktion `berechneEmpfehlung()`
  - Frontend: Empfehlungs-Card mit farbigem Glow je nach Empfehlung
- **Referenz:** Mockup aus SW9 (Vollbild-Card)
- **Aus Evaluation abgeleitet?:** Nein, Kernidee aus Sketch-Phase

### 4.3 Streak-Tracking _(vorerst aus der UI entfernt)_

- **Beschreibung & Nutzen:** Zählt aufeinanderfolgende Wochen mit mindestens einer geloggten Session. Das Badge wurde **vor der Abgabe bewusst aus der UI entfernt**, um den Fokus auf die Kernfunktionen zu legen. Geplant ist die Rückkehr als interaktive Tages-Streak (klickbare Tageskacheln) inkl. Schrittzähler/Kalorien (siehe Backlog).
- **Wo umgesetzt:** Backend [`src/routes/+page.server.js`](src/routes/+page.server.js), Funktion `berechneStreak()` (liefert weiterhin Daten; UI-Badge entfernt)
- **Aus Evaluation abgeleitet?:** Nein

### 4.4 Wochenziel mit Fortschrittsbalken

- **Beschreibung & Nutzen:** User definiert im Profil ein Wochenziel (1-14 Sessions). Auf dem Dashboard erscheint ein Lime-Fortschrittsbalken mit aktuellem Stand "X / Y Sessions diese Woche". Bei 100% wechselt der Balken auf Grün-Lime-Gradient mit "Wochenziel erreicht! 🎉".
- **Wo umgesetzt:**
  - Datenbank: [`src/lib/server/models/profil.js`](src/lib/server/models/profil.js), Feld `wochenziel`
  - Frontend: [`src/routes/profil/+page.svelte`](src/routes/profil/+page.svelte) (Eingabe), [`src/routes/+page.svelte`](src/routes/+page.svelte) (Anzeige)
  - Backend: Sessions-Zählung in [`src/routes/+page.server.js`](src/routes/+page.server.js)
- **Aus Evaluation abgeleitet?:** Nein

### 4.5 Trainings-Splits-System

- **Beschreibung & Nutzen:** Vordefinierte Splits (Push/Pull/Legs, Arnold, Upper/Lower, Bro Split, Full Body) plus Custom-Split-Editor. App schlägt nach jeder Kraft-Session den nächsten Split-Tag vor. Im Loggen-Form werden die Subtyp-Pills automatisch passend zum aktiven Split angezeigt.
- **Wo umgesetzt:**
  - Konstanten: [`src/lib/splits.js`](src/lib/splits.js), Objekt `SPLITS`, Funktion `naechsterSplitTag()`
  - Datenbank: [`src/lib/server/models/profil.js`](src/lib/server/models/profil.js), Felder `aktiverSplit`, `customSplitTage`
  - Frontend: [`src/routes/profil/+page.svelte`](src/routes/profil/+page.svelte) (Auswahl), [`src/routes/log/new/+page.svelte`](src/routes/log/new/+page.svelte) (Subtyp-Pills)
- **Aus Evaluation abgeleitet?:** Nein, Wunsch aus Persona-Analyse (Albi nutzt PPL/Arnold)

### 4.6 Subtyp-Filterung der Übungen

- **Beschreibung & Nutzen:** Beim Übungen-Erfassen werden nur Übungen angezeigt, die zum gewählten Subtyp passen. Push-Day → nur Brust/Schultern/Trizeps. Toggle-Button "alle anzeigen" hebt den Filter bei Bedarf auf. Reduziert visuelle Last und beschleunigt Suche.
- **Wo umgesetzt:**
  - Konstanten: [`src/lib/uebungen.js`](src/lib/uebungen.js), Objekt `SUBTYP_GRUPPEN`, Funktion `filtereUebungen(suchtext, subtyp)`
  - Frontend: [`src/routes/log/new/+page.svelte`](src/routes/log/new/+page.svelte), [`src/routes/log/[id]/+page.svelte`](src/routes/log/[id]/+page.svelte) (Combobox mit Toggle)
- **Aus Evaluation abgeleitet?:** Nein, eigener Verbesserungsvorschlag während Bauphase

### 4.7 Progressive-Overload-Tracking

- **Beschreibung & Nutzen:** Pro Kraft-Session können beliebig viele Übungen erfasst werden (Sätze × Wiederholungen × Gewicht). Im Detail-Modus wird automatisch der **letzte Eintrag derselben Übung** angezeigt mit Differenz zum aktuellen ("+2.5 kg"). Im Stats-Fortschritt-Tab gibt es pro Übung einen kompletten Verlauf mit Linien-Chart und chronologischer Eintrags-Liste.
- **Wo umgesetzt:**
  - Datenbank: [`src/lib/server/models/uebung.js`](src/lib/server/models/uebung.js) – eigenes Schema mit `sessionId`-Referenz
  - Frontend Erfassen: [`src/routes/log/new/+page.svelte`](src/routes/log/new/+page.svelte) (Combobox + Werte-Grid)
  - Frontend Verwalten: [`src/routes/log/[id]/+page.svelte`](src/routes/log/[id]/+page.svelte) (Edit/Delete pro Übung)
  - Frontend Verlauf: [`src/routes/stats/+page.svelte`](src/routes/stats/+page.svelte) (Fortschritt-Tab)
  - Backend: Aggregations-Logik in [`src/routes/stats/+page.server.js`](src/routes/stats/+page.server.js) und [`src/routes/log/[id]/+page.server.js`](src/routes/log/[id]/+page.server.js)
- **Aus Evaluation abgeleitet?:** Nein, eigener Wunsch (User-Story: "Ich will sehen, ob ich stärker werde")

### 4.8 Statistik-Dashboard mit drei Tabs

- **Beschreibung & Nutzen:** `/stats` ist in drei Tabs gegliedert:
  - **Übersicht:** Total-Stats (Sessions, Stunden, Ø RPE), 8-Wochen-Bar-Chart des Wochenloads, Sport-Verteilung als Stacked Bar
  - **Aktivität:** 90-Tage-Calendar-Heatmap mit 5-Stufen-Intensität (GitHub-Style)
  - **Fortschritt:** Sport-Filter-Pills, Personal Records pro Sport, Übungs-Verlaufs-Liste mit Mini-Sparklines und expandierbaren Linien-Charts
- **Wo umgesetzt:**
  - [`src/routes/stats/+page.svelte`](src/routes/stats/+page.svelte) (UI mit allen drei Tabs)
  - [`src/routes/stats/+page.server.js`](src/routes/stats/+page.server.js) (Aggregations-Logik mit MongoDB-Queries)
  - SVG-Charts inline gebaut (kein Chart.js)
- **Aus Evaluation abgeleitet?:** Nein

### 4.9 CSV-Export

- **Beschreibung & Nutzen:** Klick auf Download-Icon in `/log` lädt eine CSV mit allen Sessions (inkl. Übungen-Spalte als kompaktem String pro Zeile) herunter. UTF-8 BOM für korrekte Excel-Erkennung. Datei-Name enthält das aktuelle Datum.
- **Wo umgesetzt:**
  - Backend: [`src/routes/export/+server.js`](src/routes/export/+server.js) (GET-Handler mit `Content-Disposition`)
  - Frontend: Download-Button in [`src/routes/log/+page.svelte`](src/routes/log/+page.svelte)
- **Aus Evaluation abgeleitet?:** Nein

### 4.10 PWA-Manifest

- **Beschreibung & Nutzen:** App lässt sich auf iPhone/Android via "Zum Home-Bildschirm" als Standalone-App installieren. Im Standalone-Modus läuft sie ohne Browser-Chrome wie eine native App. Dunkle Status-Bar passt zum App-Theme.
- **Wo umgesetzt:**
  - [`static/manifest.webmanifest`](static/manifest.webmanifest) (PWA-Metadaten)
  - [`static/icon.svg`](static/icon.svg), [`static/icon-192.svg`](static/icon-192.svg) (eigene "TS"-Logos)
  - [`src/app.html`](src/app.html) (Apple-Touch-Icon, theme-color, apple-mobile-web-app-capable)
- **Aus Evaluation abgeleitet?:** Nein

### 4.11 Globales Toast-Feedback-System

- **Beschreibung & Nutzen:** Nach jeder schreibenden Aktion (Session speichern, Übung hinzufügen, Profil ändern, Löschen) erscheint ein Toast unten am Bildschirm mit Erfolgs- oder Fehlermeldung. Verschwindet nach 3 Sekunden automatisch. Drei Typen: Erfolg (Lime), Fehler (Rot), Info (Cyan).
- **Wo umgesetzt:**
  - [`src/lib/Toast.svelte`](src/lib/Toast.svelte) (Komponente)
  - [`src/lib/toast.svelte.js`](src/lib/toast.svelte.js) (Reaktiver Store mit Svelte-5-Runes)
  - [`src/routes/+layout.svelte`](src/routes/+layout.svelte) (URL-Parameter-Auslöser nach Form-Action-Redirects)
- **Aus Evaluation abgeleitet?:** Nein

### 4.12 Garmin TCX-Import mit erweiterten Lauf-Analysen

- **Beschreibung & Nutzen:** Komplette Lauf-Activity aus Garmin Connect ohne manuelles Tippen importieren. User exportiert die TCX-Datei aus Garmin Connect (3 Klicks), lädt sie unter `/log/import` hoch. App parsed die Datei, zeigt eine Vorschau mit allen extrahierten Werten, User ergänzt nur RPE / Subtyp / Notiz und klickt "Importieren". Detail-Seite zeigt anschliessend zusätzlich zur normalen Session-Anzeige eine **km-Splits-Tabelle** (Pace pro km als Balken-Visualisierung), einen **HR-Verlaufs-Chart**, einen **Pace-Verlaufs-Chart** (invertiert: unten = schneller) und ein **Höhenprofil**.

  Extrahierte Felder (direkt aus TCX-Activity-Summary):
  - Sport (Mapping `Running` → `Laufen`, `Biking` → `Rad`, `Swimming` → `Schwimmen`)
  - Datum, Dauer, Distanz, Ø HR, Max HR, Kalorien

  Aggregierte Felder (aus Trackpoints):
  - Höhenmeter (kumulative positive Anstiege)
  - Ø Schrittfrequenz (Cadence), Ø Watts (Power)
  - km-Splits mit Pace und avg HR pro km
  - Reduzierter Verlauf (max. 80 gleichmässig gesamplete Punkte) mit Distanz, HR, Pace, Höhe

- **Wo umgesetzt:**
  - Parser: [`src/lib/server/tcxParser.js`](src/lib/server/tcxParser.js) — XML-Parsing mit `fast-xml-parser`, Sport-Mapping, Trackpoint-Aggregation, Splits-Berechnung, Verlaufs-Reduktion
  - Schema: [`src/lib/server/models/session.js`](src/lib/server/models/session.js) — Sub-Schemas `splitSchema`, `verlaufPunktSchema`, `laufDatenSchema` + neue Felder `maxHr`, `calories`, `avgCadence`, `avgWatts`
  - Route: [`src/routes/log/import/+page.svelte`](src/routes/log/import/+page.svelte) — 2-Step-Flow (Upload → Vorschau mit RPE-Eingabe → Save)
  - Server-Actions: [`src/routes/log/import/+page.server.js`](src/routes/log/import/+page.server.js) — `parsen` (Datei → JSON) und `speichern` (JSON → DB)
  - Detail-Anzeige: [`src/routes/log/[id]/+page.svelte`](src/routes/log/[id]/+page.svelte) — Splits-Tabelle und 3 SVG-Charts (HR, Pace, Höhenprofil)
  - Import-Button: [`src/routes/log/+page.svelte`](src/routes/log/+page.svelte) — Pfeil-Hoch-Icon im Header
- **Referenz:** Test-Datei `activity_22807229628.tcx` (Garmin Forerunner 265 Export)
- **Aus Evaluation abgeleitet?:** Nein, eigene Initiative für besseres Lauf-Tracking ohne manuelles Eintippen

### 4.13 Lauf-spezifisches Tracking mit Pace-Verlauf

- **Beschreibung & Nutzen:** Bei Sport=Laufen werden im Loggen-Form drei zusätzliche Felder angezeigt: **Distanz** (km), **avg HR** (bpm – passt zur Garmin-HRM-600 des Entwicklers), **Höhenmeter** (m). Pace und Geschwindigkeit werden live während der Eingabe berechnet (z.B. "5:30 min/km · 10.9 km/h"). Im Stats-Fortschritt-Tab gibt es einen eigenen Lauf-Bereich mit vier Lauf-spezifischen Personal Records (Längste Distanz, Schnellste Pace, Höchste Ø HR, Meiste Höhenmeter), einem Pace-Verlaufs-Chart (invertierte Y-Achse: niedriger = schneller) und einem Distanz-Verlaufs-Chart über alle gespeicherten Lauf-Sessions. Lauf-Cards in der Sessions-Liste zeigen Distanz prominent statt nur Dauer.
- **Wo umgesetzt:**
  - Helpers: [`src/lib/lauf.js`](src/lib/lauf.js) – `paceProKm()`, `geschwindigkeitKmh()`, `schnellstePace()`
  - Datenbank: [`src/lib/server/models/session.js`](src/lib/server/models/session.js) – Felder `distanz`, `avgHr`, `hoehenmeter` (alle optional)
  - Frontend Erfassen: [`src/routes/log/new/+page.svelte`](src/routes/log/new/+page.svelte) – Lauf-Sektion mit Live-Pace-Vorschau
  - Frontend Detail: [`src/routes/log/[id]/+page.svelte`](src/routes/log/[id]/+page.svelte) – Lauf-Daten in Read- und Edit-Modus
  - Frontend Stats: [`src/routes/stats/+page.svelte`](src/routes/stats/+page.svelte) – Lauf-Records, Pace-Chart, Distanz-Chart, Sessions-Detail-Liste
  - Backend: Aggregations-Logik in [`src/routes/stats/+page.server.js`](src/routes/stats/+page.server.js)
- **Aus Evaluation abgeleitet?:** Nein, eigene Initiative basierend auf Sport-Profil (Garmin-HRM-Nutzer, Laufintervalle)

### 4.14 Sport-Filter im Trainings-Log

- **Beschreibung & Nutzen:** Pill-Leiste oben in `/log`: "Alle / Kraft / Laufen / Rad / Schwimmen". Aktive Pill nimmt die Sport-spezifische Akzentfarbe an. Filter via URL-Parameter (`?sport=Kraft`) → teilbar und reload-stabil.
- **Wo umgesetzt:**
  - Backend: [`src/routes/log/+page.server.js`](src/routes/log/+page.server.js) (URL-Parameter-Validierung + MongoDB-Query)
  - Frontend: [`src/routes/log/+page.svelte`](src/routes/log/+page.svelte) (Filter-Pills)
- **Aus Evaluation abgeleitet?:** Nein

---

> Die folgenden vier Erweiterungen (4.15–4.18) wurden **nach** der Usability-Evaluation umgesetzt und gehen direkt auf die dort identifizierten Issues zurück (vgl. Kapitel 3.5.6 Issue Map und 3.5.8 Abgeleitete Verbesserungen).

### 4.15 Klickbare, handlungsorientierte Tagesempfehlung

- **Beschreibung & Nutzen:** Die Empfehlungs-Card auf dem Dashboard ist nicht mehr nur Information. Bei "Heavy"/"Light" zeigt sie einen Aktions-Button ("[Split-Tag] vorbereiten →"), der direkt zur Session-Erfassung führt – mit vorausgewähltem Sport (Kraft) und dem nächsten Split-Tag als Subtyp. Aus der Tagesentscheidung wird so in einem Klick ein konkret vorbereitetes Training. Bei "Rest"/"Erledigt" wird kein Button gezeigt.
- **Wo umgesetzt:**
  - Frontend: [`src/routes/+page.svelte`](src/routes/+page.svelte) (`empfehlungHref`, `kannTrainingVorbereiten`, Aktions-Button in der Empfehlungs-Card)
  - Backend: [`src/routes/+page.server.js`](src/routes/+page.server.js) (`berechneEmpfehlung` liefert `naechsterTag`), [`src/routes/log/new/+page.server.js`](src/routes/log/new/+page.server.js) (Übernahme der Parameter `sport`/`subtyp`/`quelle`)
- **Referenz:** Issue "Dashboard / Tagesempfehlung" (Priorität hoch) in Kap. 3.5.6
- **Aus Evaluation abgeleitet?:** Ja – höchstpriorisiertes Issue (insb. TP2 Adi Lama).

### 4.16 Split-basierte Workout-Vorschläge

- **Beschreibung & Nutzen:** Beim Erfassen einer Kraft-Session schlägt die App passend zum gewählten Subtyp (Split-Tag) automatisch konkrete Übungen vor. Per Klick werden sie als Workout mit Standard-Sätzen übernommen, statt jede Übung einzeln zu suchen – deutlich schnellerer Einstieg ins Logging.
- **Wo umgesetzt:**
  - Logik: [`src/lib/uebungen.js`](src/lib/uebungen.js) (`workoutVorschlagFuer(subtyp)`)
  - Frontend: [`src/routes/log/new/+page.svelte`](src/routes/log/new/+page.svelte) (`workoutVorschlag`, `workoutVorschlagUebernehmen()`)
- **Referenz:** Issue "Neue Session / Krafttraining" (Priorität hoch) in Kap. 3.5.6
- **Aus Evaluation abgeleitet?:** Ja.

### 4.17 Live-Workout-Modus

- **Beschreibung & Nutzen:** Optionaler "Training starten"-Modus: Statt nur nachzutragen, kann ein Training aktiv begleitet werden. Pro Übung werden Sets angezeigt, die man während dem Gym abhakt (✓) und mit Gewicht/Wiederholungen füllt; nach jedem erledigten Set startet ein Pausen-Timer. Gespeichert werden die erledigten Sets (das schwerste Set als Referenzwert plus eine Live-Sets-Notiz).
- **Wo umgesetzt:**
  - Frontend: [`src/routes/log/new/+page.svelte`](src/routes/log/new/+page.svelte) (Live-Sets, Set abhaken, Pausen-Timer)
  - Backend: [`src/routes/log/new/+page.server.js`](src/routes/log/new/+page.server.js) (Verarbeitung der Sets, schwerstes Set, Live-Sets-Notiz)
- **Referenz:** Issue "Neue Session / Gym-Workflow" (Priorität mittel) in Kap. 3.5.6
- **Aus Evaluation abgeleitet?:** Ja – Wunsch von TP2 (sehr aktiver Gym-Nutzer).

### 4.18 Fokus auf ausgebaute Sportarten (Kraft & Laufen)

- **Beschreibung & Nutzen:** Rad und Schwimmen wurden in den Erfassungs-Flows zurückgenommen, solange sie nicht vollständig ausgebaut sind. Beim Loggen sind nur noch Kraft und Laufen aktiv; eine klare Meldung erklärt, dass Rad/Schwimmen später ergänzt werden. Das beseitigt die im Test bemängelte Erwartungs-Lücke ("sieht ausgebaut aus, ist es aber nicht").
- **Wo umgesetzt:**
  - Backend: [`src/routes/log/new/+page.server.js`](src/routes/log/new/+page.server.js) (`AKTIVE_SPORTARTEN`-Whitelist + erklärende Fehlermeldung)
  - Frontend: [`src/routes/log/new/+page.svelte`](src/routes/log/new/+page.svelte) (Sport-Auswahl)
- **Referenz:** Issue "Loggen / Sportarten" (Priorität tief) in Kap. 3.5.6
- **Aus Evaluation abgeleitet?:** Ja.

### 4.19 Zeitraum-Filter in der Statistik-Übersicht

- **Beschreibung & Nutzen:** Die Übersicht (Totals, Load-Chart, Sport-Verteilung) lässt sich per Pills nach Zeitraum filtern: „Letzte Woche", „4 Wochen", „8 Wochen". Bei „Letzte Woche" wechselt das Balkendiagramm **adaptiv** von Wochen- auf Tagesbalken (Mo–So), damit auch der kurze Zeitraum aussagekräftig bleibt. Zusätzlich wird die Chart-Höhe auf grossen Screens gedeckelt.
- **Wo umgesetzt:**
  - Frontend: [`src/routes/stats/+page.svelte`](src/routes/stats/+page.svelte) (reaktive `$derived`-Aggregation nach Zeitraum)
  - Backend: [`src/routes/stats/+page.server.js`](src/routes/stats/+page.server.js) (leichte Session-Liste `uebersichtSessions`)
- **Aus Evaluation abgeleitet?:** Teilweise – greift „Stats aussagekräftiger machen" auf.

### 4.20 Vollbild-Fokus-Modus fürs Live-Training

- **Beschreibung & Nutzen:** Beim Start eines Live-Trainings wechselt die Erfassung in eine **ablenkungsfreie Vollbild-Ansicht** – Navigation, Basisdaten und Vorschläge sind ausgeblendet, sichtbar bleiben nur aktive Übung, Sätze und Pausen-Timer. Ein **erzwungener Pausen-Flow** sperrt nach jedem erledigten Satz die offenen Sätze (ausgegraut) und scrollt zum Timer; freigeschaltet wird erst nach Ablauf oder „Pause skippen".
- **Wo umgesetzt:**
  - Frontend: [`src/routes/log/new/+page.svelte`](src/routes/log/new/+page.svelte) (`form-fokus`-Overlay, `pauseAktiv`-Satzsperre, Auto-Scroll zum Timer)
- **Aus Evaluation abgeleitet?:** Ja – Weiterentwicklung des Live-Workout-Modus (überladene Ansicht reduziert).

### 4.21 Navigation-Guard und Layout-Feinschliff

- **Beschreibung & Nutzen:** Ein **Navigation-Guard** warnt vor Datenverlust, wenn `/log/new` mit laufendem Training oder erfassten Übungen verlassen wird. Dazu kommt Layout-Politur: das Basisdaten-Formular ist auf dem Desktop neu in zwei ausgewogenen Spalten ausgerichtet, und Körpergewichts-Übungen im Fortschritt zeigen Sätze × Wdh statt „0 kg".
- **Wo umgesetzt:**
  - Frontend: [`src/routes/log/new/+page.svelte`](src/routes/log/new/+page.svelte) (`beforeNavigate` + `beforeunload`, Grid-Layout), [`src/routes/stats/+page.svelte`](src/routes/stats/+page.svelte) (Körpergewichts-Darstellung)
- **Aus Evaluation abgeleitet?:** Teilweise – adressiert „Responsive Layout".

---

## 5. Projektorganisation

- **Repository & Struktur:**
  - GitHub: [albushgango/TrainSmart](https://github.com/albushgango/TrainSmart) (öffentlich)
  - Strukturübersicht siehe Kapitel [3.4.2](#342-umsetzung-technik) "Struktur & Komponenten"

- **Issue-Management:** Die in der Usability-Evaluation (Kap. 3.5.6) identifizierten Probleme sind als [**GitHub-Issues**](https://github.com/albushgango/TrainSmart/issues?q=is%3Aissue) festgehalten – mit Labels für Herkunft (`usability-evaluation`) und Priorität (`prio: hoch/mittel/tief`). Die nach der Evaluation umgesetzten Punkte (Erweiterungen 4.15–4.18) sind als **geschlossene** Issues dokumentiert, die noch offenen (z.B. anklickbare Aktivitäts-Punkte, optionaler Hell-/Dunkelmodus) als **offene** Issues für die nächste Iteration. So bleibt der Weg von der Beobachtung bis zur Umsetzung nachvollziehbar.

- **Commit-Praxis:** Conventional-Commit-Stil mit deutschen Beschreibungs-Texten:
  - `feat:` für neue Features
  - `fix:` für Bug-Fixes
  - `chore:` für Infrastruktur (Build, Konfiguration, Theme)
  - `docs:` für Dokumentations-Änderungen

  Beispiele aus dem Verlauf:

  ```
  feat: Statistiken mit Tabs, Charts und Progressive-Overload
  fix: drei Live-Test-Bugs (CSV-Export Route, Datum-Future, Übungs-Liste)
  chore: Netlify-Adapter und Build-Konfiguration
  docs: README mit Setup, KI-Deklaration und Netlify-Deployment
  ```

  Atomare Commits: Jeder Commit ist eigenständig kompilierbar/lauffähig. Saubere Trennung zwischen Modell-Änderungen, Page-Implementierung und Dokumentation.

- **KI-gestützter Entwicklungs-Workflow:** Die Umsetzung erfolgte mit einem bewusst konfigurierten KI-Agenten-Setup in VS Code (Claude Code) – nicht als blosses „Fragen-und-Kopieren", sondern als reproduzierbarer Workflow:
  - **Versionierte Kontextquelle:** Eine `CLAUDE.md` im Repo-Root hält Tech-Stack, Code-Konventionen und Projektstatus fest und wird bei jedem Session-Start automatisch als Kontext geladen.
  - **Persistentes Memory:** Ein dateibasiertes Memory-System hält Präferenzen und Projektentscheide sessionübergreifend.
  - **Versionierte Konventionen:** Conventional Commits machen die (teils KI-unterstützte) Historie nachvollziehbar.

  Die inhaltliche Reflexion zu Nutzen, Grenzen und Verantwortung steht in der [KI-Deklaration](#6-ki-deklaration).

---

## 6. KI-Deklaration

### 6.1 KI-Tools

- **Eingesetzte Tools:**
  - **Anthropic Claude Sonnet 4.5 / 4.6** via **Cowork** (Web-Interface) – für Konzeption, Architektur-Diskussionen, Mockup-Reflexion, Doku
  - **Anthropic Claude Code** (CLI-Agent) – für Code-Implementation, Refactoring, Bug-Fixing, Build-Tests
  - **VS Code** als IDE (ohne Copilot-Plugin – Claude Code läuft separat)

- **Zweck & Umfang:**
  - **Code-Implementation (~70% des Codes):** Komponenten, Routes, Server-Logik wurden initial von Claude Code generiert basierend auf vom Entwickler vorgegebenen Konzepten und Wünschen
  - **Refactoring (~20%):** Code-Verbesserungen, CSS-Konsolidierung, Theme-Polish wurden iterativ mit Claude Code durchgeführt
  - **Bug-Fixing (~10%):** Live-Test-Bugs wurden mit Claude Code analysiert und gefixt
  - **Dokumentation (~80% der README):** Diese Datei wurde von Claude generiert basierend auf Cowork-Konversationen und Repo-Inhalt
  - **Konzeption:** Architektur-Entscheidungen (z.B. Übungs-Liste hardcoded vs. DB-Collection), UX-Patterns (Combobox vs. native datalist) wurden in Cowork diskutiert und entschieden
  - **Mockup (Crazy-8s):** Wurde **eigenständig vom Entwickler** mit Stift und Papier erstellt (siehe Anhang 7.1). Reflexion und Auswertung in Cowork
  - **Datenmodell:** Wurde **gemeinsam** entwickelt – Entscheidungen über Schemas, Relationen, Validation vom Entwickler getroffen, Implementation von Claude Code

- **Eigene Leistung (Abgrenzung):**
  - **Konzept und Lösungsidee:** komplett eigenständig (Persönliches Bedürfnis als Mehrsportler)
  - **Mockup (Crazy-8s, Dot-Voting, ausgearbeitete Skizze):** eigenständig erstellt (SW9-Übungsstunde)
  - **Datenmodell-Design:** Entscheidungen über Schemas und Beziehungen vom Entwickler
  - **Architektur-Entscheidungen:** Wahl von SvelteKit, MongoDB, Netlify; Single-User vs. Multi-User; PWA-Ansatz
  - **Code-Reviews:** Jede von Claude generierte Code-Änderung wurde durchgesehen, Diffs vor Commits geprüft
  - **Bug-Reports:** Beim Live-Testen identifizierte Bugs (CSV-404, Datum-Future, Übungs-Liste) wurden vom Entwickler entdeckt und reportet
  - **UX-Feedback und Polish-Wünsche:** Design-Iterations-Wünsche (ALL-CAPS-Headers, Mini-Sparkline, Wochenkalender klickbar, Tab-Navigation) kamen vom Entwickler
  - **Evaluation und Tester-Auswahl** (Phase 5): wird komplett vom Entwickler durchgeführt

### 6.2 Prompt-Vorgehen

**Grundlegende Vorgehensweise:**

1. **Persistenter Kontext via [`CLAUDE.md`](CLAUDE.md):** Datei im Repo-Root mit Tech-Stack, Code-Konventionen, aktuellem Projekt-Status, Nächste-Schritte-Liste. Wird von Claude Code automatisch beim Session-Start gelesen → keine wiederholten Kontext-Einführungen nötig.

2. **Memory-System (Cowork):** Nutzer-Präferenzen werden in `.claude/projects/.../memory/` als Markdown-Dateien persistiert (z.B. "Funktion vor Polish", "Dark-Theme bevorzugt"). Sessions-übergreifend verfügbar.

3. **Iteratives Plan-First-Vorgehen:**
   - Phase 1: User beschreibt Anforderung
   - Phase 2: Claude schlägt Plan mit Trade-offs vor
   - Phase 3: User bestätigt oder modifiziert
   - Phase 4: Claude implementiert mit Build-Tests
   - Phase 5: User testet, gibt Feedback

4. **Atomare Aufgaben:** Statt "baue die ganze App" wurde stets ein klares Teilziel gesetzt ("baue die Stats-Page mit 3 Tabs").

**Beispiel-Prompts:**

```
"Hier sind 8 Crazy-8s-Skizzen meines Mockups (siehe SW9-PDF).
Welche Variante würdest du als Senior-Dev priorisieren und warum?"

"Mein Datum-Input erlaubt zukünftige Daten. Fix das auf
Client- UND Server-Seite."

"Ich will einen klickbaren Wochenkalender auf der Home-Page.
Schlage Konzept vor, dann bauen."
```

**Qualitätssicherung:**

- Build-Test (`npm run build`) nach jeder grösseren Änderung
- Manuelle Code-Reviews vor jedem Commit
- Live-Tests auf dem Smartphone nach Deployment
- Conventional Commits für nachvollziehbare History

### 6.3 Reflexion

**Nutzen:**

- Erhebliche Geschwindigkeit bei Implementation – Komponenten und Routes in Stunden statt Tagen
- Konsistente Code-Qualität durch Pattern-Wiederholung (z.B. einheitliches Toast-Trigger-Verfahren über alle Form-Actions)
- "Senior-Dev"-Reflexion auf Architektur-Fragen, ohne separate Code-Reviewer
- Schneller Wissens-Transfer: KI erklärt SvelteKit-spezifische Konzepte (Form Actions, Load Functions, Runes) im Projektkontext

**Grenzen:**

- **Architektur-Entscheidungen muss der Entwickler treffen** – KI schlägt Optionen vor, Trade-offs müssen aber bewusst gewählt werden
- **Mockup/UX-Entscheidungen** sind subjektiv und schwer von KI alleine zu treffen → wurden bewusst eigenständig im SW9-Prozess gemacht
- **Domänen-Wissen** (RPE-Skala, Trainings-Splits) brachte der Entwickler ein
- **Kontext-Drift bei langen Sessions** – Cowork-Sessions können nach Stunden ungenau werden, daher Memory-System genutzt
- **Tendenz zu Over-Engineering** – KI baut manchmal mehr als nötig (z.B. zusätzliche Edge-Cases). Wurde durch klare Anforderungen ("nur diese 3 Bugs fixen") eingegrenzt

**Risiken & Qualitätssicherung:**

- **Unvollständige Tests:** KI generiert keine automatischen Tests, manuelles Testen ist Verantwortung des Entwicklers
- **Code ohne Verständnis:** Risiko, dass Code "funktioniert ohne dass Entwickler ihn versteht". Mitigation: jede Komponente nach Generation gelesen, Fragen gestellt, Diffs vor Commit geprüft
- **Halluzinationen bei Library-APIs:** KI kann nicht-existierende Funktionen erfinden – mitigiert durch Build-Tests nach jeder Änderung
- **Urheberrecht von Code-Snippets:** SvelteKit-Standard-Patterns sind frei nutzbar; keine direkt kopierten Code-Beispiele aus Tutorials
- **Datenschutz:** Keine sensitiven Nutzerdaten in den Prompts (Trainings-Daten der Test-Atlas-Instanz sind eigene/Demo-Daten)

**Persönliches Fazit:**

KI hat den Entwicklungs-Aufwand massiv reduziert und mir erlaubt, in kurzer Zeit eine deutlich umfangreichere App zu bauen als ohne. Ich habe dabei aktiv gelernt – Svelte-5-Runes, SvelteKit Form Actions, MongoDB Aggregations – weil ich jede Code-Änderung nachvollzogen habe. Die App ist nicht "von KI gebaut", sondern "**mit KI gebaut**", wobei alle wichtigen Entscheidungen bei mir lagen.

---

## 7. Anhang

### 7.1 Mockup aus SW9

Das vollständige SW9-Abgabe-Dokument mit Crazy-8s-Skizzen, Dot-Voting, Reflexion und ausgearbeitetem 3-Screen-Flow liegt im Repo unter [`docs/SW9_Abgabe_TrainSmart.pdf`](docs/SW9_Abgabe_TrainSmart.pdf). Das daraus in SW10 ausgearbeitete UI-Mockup liegt in Figma: **[TrainSmart – UI Mockup SW10](https://www.figma.com/design/RVQ0oce2SmIBvRvHFZyC7u/TrainSmart-%E2%80%93-UI-Mockup-SW10?node-id=17-2)** (Screenshot in Kap. 3.3).

**Kurzfassung:**

- 8 Crazy-8s-Varianten (Ampel-Karte, Wochenstreifen, Load-Ring, **Vollbild-Card ★**, Kompakt-Liste, Score-Balken, Coach-Nachricht, Kalender-Ansicht)
- Selbstevaluation per Dot-Voting (3 Punkte): Variante 4 als Gewinnerin (★), Varianten 1 und 5 mit je einem Dot
- Reflexion: Begründung der Wahl
- Ausgearbeitete 3-Screen-Skizze (Dashboard → Detail-Ansicht → Session loggen)

### 7.2 Setup (lokale Entwicklung)

Voraussetzungen:

- Node.js 20+
- MongoDB lokal **oder** ein MongoDB-Atlas-Account

Installation:

```bash
git clone https://github.com/albushgango/TrainSmart.git
cd TrainSmart
npm install
```

Environment Variable im Projekt-Root als `.env.local`:

```
MONGODB_URI=mongodb://localhost:27017/trainsmart
```

Für MongoDB Atlas:

```
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/trainsmart?retryWrites=true&w=majority
```

Dev-Server:

```bash
npm run dev
```

App öffnet auf `http://localhost:5173`.

Production-Build (lokal testen):

```bash
npm run build
npm run preview
```

### 7.3 Quellen

- **SvelteKit Dokumentation:** [svelte.dev/docs/kit](https://svelte.dev/docs/kit)
- **Mongoose Dokumentation:** [mongoosejs.com/docs](https://mongoosejs.com/docs)
- **Netlify Adapter Docs:** [github.com/sveltejs/kit/tree/main/packages/adapter-netlify](https://github.com/sveltejs/kit/tree/main/packages/adapter-netlify)
- **Mermaid für Diagramme:** [mermaid.js.org](https://mermaid.js.org)

### 7.4 Lizenz

Privates Studienprojekt – keine offene Lizenz. Code zur Einsicht im Rahmen der ZHAW-Bewertung freigegeben.
