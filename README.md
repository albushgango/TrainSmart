# TrainSmart

Intelligentes Trainingslog für Mehrsportler. Trackt Sessions, berechnet Tagesempfehlungen basierend auf Trainingsload und visualisiert den Fortschritt.

**Entwickelt als ZHAW Prototyping-Projekt (Semester 4) — Albushi Pupovci**

---

## Projektbeschreibung

TrainSmart ist eine Mobile-First Web-App für Sportler, die mehrere Sportarten kombinieren (Kraft, Laufen, Rad, Schwimmen). Im Gegensatz zu typischen Single-Sport-Apps (Strava, Garmin Connect) berechnet TrainSmart einen **kombinierten Trainingsload** und gibt **datenbasierte Tagesempfehlungen** (Heavy / Light / Rest), um Übertraining zu vermeiden und Konstanz zu fördern.

Die App entstand aus dem persönlichen Bedarf des Entwicklers (Fussball 3×/Woche + Gym + Laufen): Bestehende Tools tracken nur einzelne Sportarten — keine sieht das Gesamtbild.

---

## Features

- **Tagesempfehlung** auf der Home-Seite: berechnet aus Wochenload (Dauer × RPE der letzten 7 Tage) und gestrigem Training
- **Streak-Tracking**: Anzahl aufeinanderfolgender Wochen mit mindestens einer Session
- **Sessions loggen**: Sportart, Datum, Dauer, RPE (1-10), Notiz
- **Sessions verwalten**: Detail-Ansicht, inline Bearbeiten, Löschen mit Bestätigung
- **Statistiken**: Total-Stats, Wochenload-Chart (8 Wochen), Sport-Verteilung
- **Mobile-First Dark UI** mit Akzentfarbe Lime und Sport-spezifischen Farben

### Geplant (in Arbeit)

- Live-Deployment auf Netlify
- Layout-Polish (modernere Buttons, Microinteractions)
- Bonus-Feature: Gym Progressive Overload **oder** Wochenplaner

---

## Tech Stack

| Bereich        | Technologie                                          |
|----------------|------------------------------------------------------|
| Framework      | SvelteKit 2 + Svelte 5 (Runes API)                   |
| Backend        | SvelteKit Server (load functions + form actions)     |
| Datenbank      | MongoDB via Mongoose                                 |
| Deployment     | Netlify (geplant)                                    |
| Styling        | Reine CSS (keine UI-Library), CSS Custom Properties  |
| Sprache        | Deutsch (UI, Kommentare, Code-Naming)                |

**Bewusste Verzicht-Entscheidungen:** kein TypeScript, kein Test-Framework, kein Authentifizierungssystem (Single-User-App), keine externen UI-Bibliotheken.

---

## Datenmodell

```javascript
// src/lib/server/models/session.js
{
  sport: String,    // 'Kraft' | 'Laufen' | 'Rad' | 'Schwimmen'
  datum: Date,
  dauer: Number,    // Minuten
  rpe: Number,      // 1-10 (Rate of Perceived Exertion)
  notiz: String,    // optional
  timestamps: true  // createdAt, updatedAt
}
```

---

## Setup (lokal)

### Voraussetzungen

- Node.js 20+
- MongoDB lokal **oder** ein MongoDB-Atlas-Account

### Installation

```bash
git clone https://github.com/albushgango/trainsmart.git
cd trainsmart
npm install
```

### Environment Variable

Lege im Projekt-Root eine Datei `.env.local` an:

```
MONGODB_URI=mongodb://localhost:27017/trainsmart
```

Für MongoDB Atlas:
```
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/trainsmart?retryWrites=true&w=majority
```

### Dev-Server starten

```bash
npm run dev
```

App öffnet auf `http://localhost:5173`.

---

## Projektstruktur

```
src/
├── lib/
│   └── server/
│       ├── db.js                 # MongoDB-Verbindung (Singleton)
│       └── models/
│           └── session.js        # Mongoose Session-Schema
└── routes/
    ├── +layout.svelte            # Globales Theme + Bottom-Navigation
    ├── +page.svelte              # Home (Empfehlung, Streak, Sessions)
    ├── +page.server.js           # Empfehlungs-Logik
    ├── log/
    │   ├── +page.svelte          # Übersicht aller Sessions
    │   ├── +page.server.js
    │   ├── new/                  # Neue Session loggen
    │   │   ├── +page.svelte
    │   │   └── +page.server.js
    │   └── [id]/                 # Detail-Ansicht / Edit / Delete
    │       ├── +page.svelte
    │       └── +page.server.js
    └── stats/
        ├── +page.svelte          # Statistiken (Charts)
        └── +page.server.js       # Aggregations-Logik
```

---

## Deployment

**Status:** Aktuell in Vorbereitung. Geplant auf Netlify mit MongoDB Atlas als Datenbank.

Geplante Schritte:
1. `@sveltejs/adapter-netlify` installieren (`npm install -D @sveltejs/adapter-netlify`)
2. `svelte.config.js` auf Netlify-Adapter umstellen (`adapter-auto` → `adapter-netlify`)
3. `netlify.toml` mit Build-Settings im Projekt-Root anlegen
4. Atlas-Cluster erstellen, Connection-String als Netlify-Env-Variable `MONGODB_URI` hinterlegen
5. Repo mit Netlify verbinden, automatisches Deployment per Git-Push

---

## KI-Deklaration

Dieses Projekt wurde mit Unterstützung von KI-Tools entwickelt:

- **Anthropic Claude via Cowork** — Planung, Architektur, Konzeption, Dokumentation
- **Anthropic Claude Code** — Code-Implementierung, Refactoring, Bug-Fixing

Alle Designentscheidungen, Architektur-Wahlen und implementierten Features wurden vom Entwickler überprüft und nachvollzogen. KI wurde als Werkzeug eingesetzt, nicht als Ersatz für eigenes Verständnis. Der Entwickler ist verantwortlich für jede Zeile Code im Repository.

---

## Bewertungskontext (ZHAW Prototyping)

| Kriterium                          | Status                              |
|------------------------------------|-------------------------------------|
| Funktionierender Prototyp          | Lokal: ja / Deployed: in Arbeit     |
| GitHub Repo mit Commit-Verlauf     | ja                                  |
| README mit Setup + KI-Deklaration  | ja                                  |
| Usability Evaluation               | Geplant: 19.05.2026                 |
| Video Walkthrough (5-10 Min)       | Geplant: vor finaler Abgabe         |

---

## Lizenz

Privates Studienprojekt — keine offene Lizenz.
