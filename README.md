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

Die Entwicklung folgte den fünf Phasen der Modul-Methodik. Phasen 1-3 wurden in den Übungsstunden vorbereitet (vgl. [SW9-Abgabe](#71-mockup-aus-sw9)), Phase 4 (Prototype) ist Hauptinhalt der Übungen ab SW10, Phase 5 (Validate) folgt vor der finalen Abgabe.

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

| # | Variante | Beschreibung |
|---|---|---|
| 1 | Ampel-Karte | Empfehlung als Ampelfarbe (rot/gelb/grün) mit letzten 3 Tagen darunter |
| 2 | Wochenstreifen | Mo–So mit Trainings-Punkten, Empfehlung darunter |
| 3 | Load-Ring | Zentrale numerische Score (z.B. 72/100) mit Light/Heavy darunter |
| 4 | **Vollbild-Card ★** | Empfehlung dominiert den Screen ("REST" gross), darunter Details-Link |
| 5 | Kompakt-Liste | Empfehlung oben + Sport-Übersicht (Gym ✓ / Laufen ✗ / Fussball ✓) |
| 6 | Score-Balken | Detaillierter Load-Score als Balken + Trend |
| 7 | Coach-Nachricht | Personalisierte Begründungs-Nachricht ("Du hast die letzten 2 Tage trainiert...") |
| 8 | Kalender-Ansicht | Monatskalender mit heutigem Tag hervorgehoben |

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

- **Mockup:** Drei-Screen-Flow (Dashboard → Detail → Session loggen) wurde in SW9 ausgearbeitet. Siehe [Anhang 7.1](#71-mockup-aus-sw9) für die handgezeichnete Skizze und die ausgearbeiteten Screens.

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
    - **Dashboard**: ALL-CAPS-Header ("DASHBOARD"), Streak-Pill oben rechts, klickbarer Wochenkalender (7 Pills mit Aktivitäts-Punkten), Empfehlungs-Card mit farbigem Glow, Wochenziel-Fortschrittsbalken, Tag-spezifische Sessions-Liste
    - **Session loggen**: Sport-Pills, Subtyp-Pills (sport-abhängig), Quick-Date-Pills (Heute/Gestern/Vorgestern), Combobox für Übungen mit gruppierten Vorschlägen
    - **Statistiken**: Tab-Navigation mit Lime-Underline, SVG-Charts (Bar-Chart, Heatmap, Linien-Chart, Mini-Sparklines)

- **Designentscheidungen:**

    | Entscheidung | Begründung |
    |---|---|
    | "Planer"-Tab des Mockups → "Profil"-Tab | Während Implementation zeigte sich: Trainings-Splits + Wochenziel-Verwaltung haben grösseren Mehrwert als ein Wochenplaner. Das eigentliche Planen passiert via Split-Vorschlag auf dem Dashboard |
    | Vollbild-Card kompakter als im Mockup | Wochenkalender und Wochenziel als zusätzliche Dashboard-Elemente kamen dazu. Empfehlung bleibt prominent, dominiert den Screen aber nicht mehr exklusiv |
    | Numerischer Load-Score (72/100) verworfen | Eigene Erfahrung beim Bauen: Zahl ist zu abstrakt für tägliche Entscheidung. Stattdessen klare Kategorien (Heavy/Light/Rest/Erledigt) |
    | Lime als Akzentfarbe statt Marken-Blau | "Athletic"-Vibe, hebt sich von typischen Sport-Apps (meist Orange/Rot) ab |
    | PWA-Manifest als Erweiterung | App lässt sich auf iPhone "Zum Home-Bildschirm" hinzufügen → fühlt sich wie native App an, kein App-Store-Review nötig |
    | Keine externe Chart-Library | SVG-Charts selbst gebaut. Spart 200KB Bundle, volle Kontrolle über Dark-Theme-Farben, kein Versions-Risiko |

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

    | Entscheidung | Trade-off |
    |---|---|
    | Übungen-Liste hardcoded in `$lib/uebungen.js` (60 Einträge) | Schneller Build, keine extra Collection. Trade-off: Einträge nur via Code-Update änderbar (vertretbar bei Single-User-App) |
    | Profil als Singleton-Dokument | Keine Auth = kein User-ID-Schlüssel nötig. Alternative wäre Local-Storage gewesen, aber DB-Persistenz ist plattform-übergreifend |
    | `split: false` im Netlify-Adapter | Eine einzige Function für alle Server-Routes. Einfacherer Cold-Start als 10+ separate Functions |
    | CSV-Endpoint unter `/export` statt `/log/export` | Routing-Konflikt mit dynamischer Route `/log/[id]` auf Netlify-Adapter vermieden |
    | Subtilere Borders (`rgba(... 0.08)`) statt voller Hex-Farben | Cleanerer Look bei dunklem Theme; Cards heben sich subtil ab statt mit harten Linien |

### 3.5 Validate

> **Hinweis:** Die Evaluation wird vor der finalen Abgabe durchgeführt. Diese Sektion wird mit den Resultaten ergänzt.

- **URL der getesteten Version:** Wird die produktive Version unter [trainsmartv1.netlify.app](https://trainsmartv1.netlify.app) zum Zeitpunkt des Tests sein. Falls eine separate Test-Version sinnvoll ist (z.B. mit Demo-Daten-Seed), wird diese ergänzt.

- **Ziele der Prüfung:**
    1. Ist der Hauptworkflow (Session loggen) intuitiv und in <30 Sekunden machbar?
    2. Wird die Tagesempfehlung verstanden und als nützlich empfunden?
    3. Ist die Übungs-Erfassung (Combobox + Werte) ohne Erklärung bedienbar?
    4. Bietet das Statistik-Dashboard (besonders Fortschritts-Tab) einen klaren Mehrwert?

- **Vorgehen:** Moderierter, on-site Usability-Test mit Think-Aloud-Methode. Tester nutzt die App auf einem iPhone, beschreibt laut was er macht und denkt. Beobachter (ich) protokolliert.

- **Stichprobe:** 2-3 Personen aus dem persönlichen Umfeld
    - 1× Aktiver Mehrsportler (ähnliches Profil zur Primärpersona)
    - 1× Gelegenheits-Sportler (entspricht Sekundärpersona Sandra)
    - 1× Nicht-Sportler (für Bedienbarkeits-Baseline)

- **Aufgaben/Szenarien (geplant):**
    1. *"Stell dir vor, du hast gerade Krafttraining absolviert. Logge die Session inkl. mindestens 2 Übungen."*
    2. *"Du willst wissen, ob du heute trainieren solltest. Wo findest du die Antwort?"*
    3. *"Wo kannst du sehen, wie sich dein Bench-Press-Gewicht entwickelt hat?"*
    4. *"Du hast einen 'Push/Pull/Legs'-Split. Wo aktivierst du das?"*

- **Kennzahlen & Beobachtungen:** Wird ergänzt nach Durchführung.

- **Zusammenfassung der Resultate:** Wird ergänzt nach Durchführung.

- **Abgeleitete Verbesserungen:** Wird ergänzt nach Durchführung. Bereits in der Entwicklung umgesetzte Verbesserungen aus eigenem Test:
    - **Datum-Validierung** ergänzt: User konnte Sessions in der Zukunft loggen → `max`-Attribut + Server-Validierung
    - **Übungs-Combobox** auf der Detail-Seite zeigt jetzt alle 60 Vorschläge (vorher nur History) → Custom-Dropdown statt nativem `<datalist>`
    - **CSV-Export** Routing-Konflikt → Endpoint von `/log/export` nach `/export` verschoben

---

## 4. Erweiterungen

Die folgenden Erweiterungen wurden über den Mindestumfang der Übungen ab SW8 hinaus umgesetzt. Jede ist eigenständig und schmälert den Mindestumfang nicht.

### 4.1 Klickbarer Wochenkalender auf dem Dashboard

- **Beschreibung & Nutzen:** Direkt unter dem Dashboard-Header zeigt ein 7-Tage-Pill-Streifen die aktuelle Woche (Mo-So). Tage mit erfassten Sessions haben einen Lime-Punkt. Klick auf einen Tag filtert die Sessions-Liste unten auf diesen Tag. So sieht man auf einen Blick, an welchen Tagen man trainiert hat und kann gezielt zu einer Session navigieren.
- **Wo umgesetzt:**
    - Frontend: [`src/routes/+page.svelte`](src/routes/+page.svelte), Sektion "Wochenkalender"
    - Backend: [`src/routes/+page.server.js`](src/routes/+page.server.js), Funktionen `aktuellerWochenStart()`, `baueWochenTage()`, `wochenSessions`
- **Referenz:** Screenshot wird nach Evaluation ergänzt
- **Aus Evaluation abgeleitet?:** Nein, eigene Initiative

### 4.2 Tagesempfehlung mit Heuristik

- **Beschreibung & Nutzen:** Berechnet aus Wochenload (Dauer × RPE der letzten 7 Tage), gestrigem Trainingsstatus und heutigem Trainingsstatus eine kategorische Empfehlung: **Heavy** (loslegen), **Light** (lockeres Training), **Rest** (Erholung), **Erledigt** (heute schon trainiert). Bei aktivem Split wird zusätzlich der nächste Split-Tag vorgeschlagen.
- **Wo umgesetzt:**
    - Backend: [`src/routes/+page.server.js`](src/routes/+page.server.js), Funktion `berechneEmpfehlung()`
    - Frontend: Empfehlungs-Card mit farbigem Glow je nach Empfehlung
- **Referenz:** Mockup aus SW9 (Vollbild-Card)
- **Aus Evaluation abgeleitet?:** Nein, Kernidee aus Sketch-Phase

### 4.3 Streak-Tracking

- **Beschreibung & Nutzen:** Zählt aufeinanderfolgende Wochen mit mindestens einer geloggten Session. Wird als Pill-Badge mit Flame-Icon oben rechts auf dem Dashboard angezeigt. Motivations-Element für Trainings-Konsistenz.
- **Wo umgesetzt:** Backend [`src/routes/+page.server.js`](src/routes/+page.server.js), Funktion `berechneStreak()`
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

### 4.14 Garmin TCX-Import mit erweiterten Lauf-Analysen

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

### 4.12 Sport-Filter im Trainings-Log

- **Beschreibung & Nutzen:** Pill-Leiste oben in `/log`: "Alle / Kraft / Laufen / Rad / Schwimmen". Aktive Pill nimmt die Sport-spezifische Akzentfarbe an. Filter via URL-Parameter (`?sport=Kraft`) → teilbar und reload-stabil.
- **Wo umgesetzt:**
    - Backend: [`src/routes/log/+page.server.js`](src/routes/log/+page.server.js) (URL-Parameter-Validierung + MongoDB-Query)
    - Frontend: [`src/routes/log/+page.svelte`](src/routes/log/+page.svelte) (Filter-Pills)
- **Aus Evaluation abgeleitet?:** Nein

---

## 5. Projektorganisation

- **Repository & Struktur:**
    - GitHub: [albushgango/TrainSmart](https://github.com/albushgango/TrainSmart) (öffentlich)
    - Strukturübersicht siehe Kapitel [3.4.2](#342-umsetzung-technik) "Struktur & Komponenten"

- **Issue-Management:** Während der Entwicklung wurden Issues vorerst direkt in den Cowork-Sessions besprochen und sofort gefixt. Vor finaler Abgabe werden für nicht umgesetzte Erweiterungen (z.B. Pace-Tracking-Idee, Workout-Timer) GitHub-Issues angelegt, um die Entscheidungen sichtbar zu machen.

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

Das vollständige SW9-Abgabe-Dokument mit Crazy-8s-Skizzen, Dot-Voting, Reflexion und ausgearbeitetem 3-Screen-Flow findet sich unter:

```
SW9_Abgabe_TrainSmart.pdf
```

(Im Repo unter `docs/`, falls hochgeladen, sonst in der separaten Moodle-Abgabe verlinkt.)

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
