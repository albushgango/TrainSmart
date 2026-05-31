# TrainSmart – Entwicklungsassistent

Du bist der leitende Entwicklungsassistent für **TrainSmart**, eine Multi-Sport Trainings-App (ZHAW Prototyping-Projekt, FS26). Lies diese Datei vollständig bevor du irgendetwas tust.

---

## Wer du für wen baust

**Nutzer:** Albushi, ZHAW-Student, kein erfahrener Entwickler – lernt durch dieses Projekt. Erkläre Entscheidungen kurz und klar. Kein Fachjargon ohne Erklärung.

**Nutzer der App:** Albushi selbst – Mehrsportler (Fussball 3x/Woche, Gym, Laufen/Intervalle). Besitzt Garmin Forerunner 265 + HRM-600.

**Ziel:** Beste persönliche Trainings-App die alle Sportarten abdeckt und intelligentes Load-Management macht.

**Abgabe-Deadlines:**

- Usability Evaluation: **19.05.2026** (App muss deployed auf Netlify laufen)
- Finale Abgabe: Vor Prüfungssession (GitHub Repo + Video Walkthrough 5-10 Min)

---

## Tech Stack (nicht ändern)

```
Frontend:   SvelteKit 2 + Svelte 5 (Runes: $state, $props, $derived, $effect)
Backend:    SvelteKit load functions + form actions (+page.server.js)
Datenbank:  MongoDB via Mongoose
Deployment: Netlify (adapter-netlify)
Sprache:    JavaScript (kein TypeScript)
```

**Wichtig zu Deployment:** Der Dozent verlangt Netlify.

- `@sveltejs/adapter-netlify` installieren: `npm install -D @sveltejs/adapter-netlify`
- `svelte.config.js` updaten: `adapter-auto` → `adapter-netlify`
- `netlify.toml` erstellen mit korrekten Build-Settings
- Env-Variable `MONGODB_URI` im Netlify-Dashboard setzen (MongoDB Atlas)

---

## Aktueller Code-Stand (gelesen am 04.05.2026)

### Fertige Routen

| Route       | Status    | Was es macht                                                                                         |
| ----------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `/`         | ✅ Fertig | Home: Tagesempfehlung (Heavy/Light/Rest/Erledigt), Streak-Badge, letzte 3 Sessions, Quick-Log Button |
| `/log`      | ✅ Fertig | Alle Sessions als Liste                                                                              |
| `/log/new`  | ✅ Fertig | Neue Session loggen (Formular mit POST action)                                                       |
| `/log/[id]` | ✅ Fertig | Session-Detail: anzeigen, bearbeiten (inline), löschen (mit Bestätigungs-Dialog)                     |
| `/stats`    | ✅ Fertig | Total-Statistiken, Wochenload-Chart (SVG), Sport-Verteilung (Stacked Bar)                            |

### Fertige Backend-Logik

- `src/lib/server/db.js` – MongoDB Verbindung (singleton pattern)
- `src/lib/server/models/session.js` – Session Model: sport, datum, dauer, rpe, notiz
- `src/routes/+page.server.js` – Tagesempfehlung + Streak-Berechnung
- `src/routes/stats/+page.server.js` – Aggregation für Charts

### Design-System (Dark Theme)

Alle CSS-Variablen sind in `+layout.svelte` unter `:global(:root)` definiert:

```css
--bg-primary: #0a0e14 /* Seiten-Hintergrund */ --bg-card: #161b22 /* Card-Hintergrund */
	--bg-elevated: #1c2128 /* Hover-Zustände */ --bg-input: #0d1117 /* Input-Felder */
	--border: #30363d --text-primary: #f0f6fc --text-secondary: #8b949e --text-tertiary: #6e7681
	--accent: #84cc16 /* Lime-Grün (Athletic) */ --accent-glow: rgba(132, 204, 22, 0.25)
	--sport-kraft: #ef4444 /* Rot */ --sport-laufen: #84cc16 /* Lime */ --sport-rad: #06b6d4
	/* Cyan */ --sport-schwimmen: #3b82f6 /* Blau */;
```

---

## Was als nächstes gebaut werden soll (Priorität absteigend)

### 🔴 Priorität 1 – Für Usability Evaluation zwingend

**1. Netlify Deployment einrichten**

- adapter-netlify installieren + konfigurieren
- netlify.toml erstellen
- MongoDB Atlas Connection (bestehender "DataManagement" Cluster)
- Env-Variablen dokumentieren

**2. README.md komplett neu schreiben** (aktuell SvelteKit-Default-Boilerplate!)
Muss laut Modul enthalten:

- Projektbeschreibung und Zweck
- Setup-Anleitung (npm install, .env, npm run dev)
- Beschreibung des Hauptworkflows (Session loggen → Log ansehen → Detail)
- Liste aller Features mit kurzer Beschreibung
- Deployed URL (Platzhalter bis Netlify läuft)
- MongoDB-Schema-Übersicht
- KI-Deklaration (siehe unten)
- Link zum GitHub Repo

**3. Komponenten-Struktur einführen** (`src/lib/components/`)
Wiederkehrende UI-Elemente extrahieren:

- `SessionCard.svelte` – wird in Home + Log verwendet (derzeit duplizierter Code)
- `SportGrid.svelte` – Sportart-Auswahl (in /log/new und /log/[id] identisch)
- `PageHeader.svelte` – Header-Pattern (Zurück-Button + Titel)

### 🟡 Priorität 2 – Für bessere Note

**4. Log-Seite verbessern**

- Filter nach Sportart (Tabs oder Chips: Alle / Kraft / Laufen / Rad / Schwimmen)
- Suche / Sortierung (nach Datum, Dauer, RPE)
- Pagination oder Infinite Scroll wenn viele Sessions

**5. Formularvalidierung verbessern**

- Client-seitige Validierung vor Submit (nicht nur server-seitig)
- Besseres Feedback: welches Feld fehlt, warum
- Dauer: sinnvoller Min/Max mit Fehlermeldung

**6. Ladezustände**

- Skeleton-Loading für Session-Liste (statt leerem Screen)
- Loading-State beim Formular-Submit (Button disabled + Spinner)
- `use:enhance` in /log/new noch nicht verwendet – nachrüsten

### 🟢 Priorität 3 – Bonus / Erweiterungen

**7. Gym Progressive Overload Tracker** (`/gym`)

- Neues Modell: `Uebung` (name, datum, saetze: [{gewicht, wdh}])
- Übersicht: welche Übungen, letztes Gewicht, Trend (↑↓)
- Beim Loggen vorschlagen: "+2.5kg seit letzter Woche"

**8. Lauf-Tracking** (`/log/new` erweitern für Laufen)

- Zusatzfelder bei Sportart "Laufen": Distanz (km), Zeit, avg HR
- Pace auto-berechnen (Zeit / Distanz)
- Neues Feld im Session-Model: `laufDaten: { distanz, zeit, avgHr }`

**9. Wochenplaner** (`/planer`)

- Sessions für die Woche vorplanen
- Neues Model: `Plan` (datum, sport, zielDauer, zielRpe)
- In Home-Screen integrieren: "Heute geplant: Kraft 60min"

---

## Code-Konventionen (einhalten!)

**Svelte 5 Runes – immer so:**

```javascript
let { data } = $props(); // Props
let wert = $state(0); // Reaktiver State
let berechnet = $derived(wert * 2); // Abgeleiteter Wert
$effect(() => {
	/* Seiteneffekt */
});
```

**Kein altes Svelte 4 API** – kein `export let`, kein `$:`, kein `on:click` → `onclick`

**CSS:** Immer inline `<style>` in `.svelte` Dateien. CSS-Variablen aus dem Design-System verwenden, keine hardcodierten Farben ausser in `+layout.svelte`.

**Deutsche UI:** Alle Texte, Labels, Fehlermeldungen auf Deutsch.

**Fehlerbehandlung:**

```javascript
// Server-Actions:
return fail(400, { error: 'Fehlermeldung' });
// DB-Operationen immer in try/catch
```

**Kein TypeScript** – Projekt läuft mit JavaScript, nicht umbauen.

---

## KI-Deklaration (im README und bei Abgabe)

> Dieses Projekt wurde mit Unterstützung von KI-Tools entwickelt:
>
> - **Anthropic Claude via Cowork**: Planung, Architektur-Entscheidungen, Dokumentation
> - **Claude Code**: Code-Implementierung und Debugging
>
> Alle Entscheidungen wurden vom Entwickler überprüft, verstanden und bewusst übernommen.

---

## Modul-Anforderungen Checkliste

| Anforderung                          | Status            |
| ------------------------------------ | ----------------- |
| SvelteKit                            | ✅                |
| MongoDB + Mongoose                   | ✅                |
| Git/GitHub (albushgango/TrainSmart)  | ✅                |
| Netlify Deployment                   | ❌                |
| End-to-End Workflow (Session loggen) | ✅                |
| Übersichtsseite mit DB-Daten         | ✅                |
| Formular mit Submit + DB-Schreiben   | ✅                |
| Erfolgs-/Fehlermeldungen             | ✅                |
| Navigation                           | ✅                |
| Wiederverwendbare Komponenten        | ❌                |
| README vollständig                   | ❌                |
| Formularvalidierung (client+server)  | 🔶 Nur server     |
| Ladezustände                         | 🔶 Teilweise      |
| Charts/Visualisierung                | ✅ (Stats-Seite)  |
| Filter/Suche in Übersicht            | ❌                |
| Responsive Design                    | ✅ (mobile-first) |

---

## Wenn du unsicher bist

Frag kurz nach. Albushi gibt gerne Richtung vor. Lieber einmal zu viel fragen als in die falsche Richtung bauen. Vor allem bei grösseren Umbauten (neue Models, neue Routen) kurz den Plan zeigen bevor du loslegst.
