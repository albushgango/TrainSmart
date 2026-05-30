<script>
    import { subtypenFuer } from '$lib/splits.js';
    import { filtereUebungen, SUBTYP_GRUPPEN, workoutVorschlagFuer } from '$lib/uebungen.js';
    import { paceProKm, geschwindigkeitKmh } from '$lib/lauf.js';

    let { data, form } = $props();
    let rpe = $state(5);
    const AKTIVE_SPORTARTEN = ['Kraft', 'Laufen'];
    const sichtbarerSport = (wert) => AKTIVE_SPORTARTEN.includes(wert) ? wert : '';
    // Sport mit zuletzt geloggtem Sport vorbelegen — User wechselt selten zwischen Sportarten
    let sport = $state(sichtbarerSport(data.vorgeschlagenerSport));
    // Subtyp-Vorschlag (z.B. nächster Split-Tag bei Kraft)
    let subtyp = $state(data.vorgeschlagenerSubtyp ?? '');
    let customSubtyp = $state('');

    /** Heute als YYYY-MM-DD String (für value des date-inputs) */
    function dateString(offset = 0) {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        return d.toISOString().split('T')[0];
    }

    let datum = $state(dateString(0));

    const sportEmoji = {
        Kraft: '🏋️',
        Laufen: '🏃',
        Rad: '🚴',
        Schwimmen: '🏊'
    };

    const quickDates = [
        { label: 'Heute', offset: 0 },
        { label: 'Gestern', offset: -1 },
        { label: 'Vorgestern', offset: -2 }
    ];

    // Subtypen ableiten: Standard für Sport + aktive Split-Tage (nur bei Kraft relevant)
    let verfuegbareSubtypen = $derived(
        sport ? subtypenFuer(sport, sport === 'Kraft' ? data.aktiveSplitTage : []) : []
    );

    // Wenn ein Custom-Subtyp eingegeben wird, nimm den als finalen Wert
    let finalerSubtyp = $derived(customSubtyp.trim() || subtyp);
    let kamVonEmpfehlung = $derived(data.vorschlagQuelle === 'empfehlung');

    // ────────── Übungen-Erfassung (nur bei Kraft) ──────────
    /** @type {Array<{name: string, saetze: number, wiederholungen: number, gewicht: number, sets?: Array<{nr: number, wiederholungen: number, gewicht: number, erledigt: boolean}>}>} */
    let uebungen = $state([]);
    let liveTrackingAktiv = $state(false);
    let liveStartZeit = $state(null);
    let liveNow = $state(Date.now());
    const PAUSEN_DAUER_SEK = 180;
    const GEWICHT_SCHRITTE = [-10, -5, -2.5, 2.5, 5, 10];
    const WDH_SCHRITTE = [-5, -1, 1, 5];
    let pauseEndZeit = $state(null);
    let pauseGesamtSek = $state(PAUSEN_DAUER_SEK);
    let aktiverLiveEditor = $state(null);

    // Form-State für neue Übung
    let neueUebungAktiv = $state(false);
    let uebungSuche = $state('');
    let dropdownOffen = $state(false);
    let saetzeInput = $state(4);
    let wdhInput = $state(8);
    let gewichtInput = $state(0);
    // Toggle: wenn aktiv, ignoriert die Filterung den Subtyp und zeigt alle Übungen
    let alleUebungenZeigen = $state(false);

    // Gefilterte Übungen — berücksichtigt Subtyp (sofern Toggle nicht "alle" ist)
    let gefiltert = $derived(
        filtereUebungen(uebungSuche, alleUebungenZeigen ? '' : finalerSubtyp)
    );

    let workoutVorschlag = $derived(
        sport === 'Kraft' && finalerSubtyp ? workoutVorschlagFuer(finalerSubtyp) : []
    );

    let aktuellerVorschlagKey = $derived(`${finalerSubtyp}:${workoutVorschlag.join('|')}`);
    let vorschlagAnpassung = $state(null);
    let vorschlagAnpassungKey = $state('');
    let letzterVorschlagKey = $state('');
    let vorschlagSuche = $state('');
    let vorschlagDropdownOffen = $state(false);

    $effect(() => {
        const key = aktuellerVorschlagKey;
        if (key !== letzterVorschlagKey) {
            vorschlagAnpassung = null;
            vorschlagAnpassungKey = '';
            letzterVorschlagKey = key;
            vorschlagSuche = '';
            vorschlagDropdownOffen = false;
        }
    });

    let bearbeiteterVorschlag = $derived(
        vorschlagAnpassungKey === aktuellerVorschlagKey && vorschlagAnpassung
            ? vorschlagAnpassung
            : workoutVorschlag
    );

    let vorschlagGefiltert = $derived(filtereUebungen(vorschlagSuche, finalerSubtyp));

    let vorschlagVollstaendigUebernommen = $derived(
        bearbeiteterVorschlag.length > 0 &&
        bearbeiteterVorschlag.every(name => uebungen.some(u => u.name === name))
    );

    let vorschlagUebernahmeMoeglich = $derived(
        bearbeiteterVorschlag.some(name => !uebungen.some(u => u.name === name))
    );

    function zahlOderFallback(wert, fallback) {
        const zahl = Number(wert);
        return Number.isFinite(zahl) ? zahl : fallback;
    }

    function begrenze(wert, min, max) {
        return Math.max(min, Math.min(max, wert));
    }

    function normalisiereSetWert(feld, wert) {
        const fallback = feld === 'wiederholungen' ? 1 : 0;
        const zahl = zahlOderFallback(wert, fallback);

        if (feld === 'wiederholungen') {
            return begrenze(Math.round(zahl), 1, 100);
        }

        return begrenze(Math.round(zahl * 2) / 2, 0, 1000);
    }

    function formatiereGewicht(wert) {
        const zahl = normalisiereSetWert('gewicht', wert);
        return Number.isInteger(zahl) ? String(zahl) : zahl.toFixed(1);
    }

    function formatiereLiveWert(feld, wert) {
        if (feld === 'wiederholungen') return String(normalisiereSetWert(feld, wert));
        return formatiereGewicht(wert);
    }

    function formatiereSchritt(wert) {
        const prefix = wert > 0 ? '+' : '';
        const zahl = Number.isInteger(wert) ? String(wert) : wert.toFixed(1);
        return `${prefix}${zahl}`;
    }

    function liveEditorKey(uebungIdx, satzIdx, feld) {
        return `${uebungIdx}:${satzIdx}:${feld}`;
    }

    function istLiveEditorAktiv(uebungIdx, satzIdx, feld) {
        return aktiverLiveEditor?.key === liveEditorKey(uebungIdx, satzIdx, feld);
    }

    function liveEditorOeffnen(uebungIdx, satzIdx, feld) {
        const key = liveEditorKey(uebungIdx, satzIdx, feld);
        aktiverLiveEditor = aktiverLiveEditor?.key === key ? null : { key, uebungIdx, satzIdx, feld };
    }

    function liveEditorSchliessen() {
        aktiverLiveEditor = null;
    }

    function liveEditorLabel(feld) {
        return feld === 'gewicht' ? 'Gewicht' : 'Wiederholungen';
    }

    function liveEditorEinheit(feld) {
        return feld === 'gewicht' ? 'kg' : 'Wdh.';
    }

    function liveEditorSchritte(feld) {
        return feld === 'gewicht' ? GEWICHT_SCHRITTE : WDH_SCHRITTE;
    }

    function liveEditorBasisSchritt(feld) {
        return feld === 'gewicht' ? 2.5 : 1;
    }

    function liveSetWert(uebungIdx, satzIdx, feld) {
        const uebung = uebungen[uebungIdx];
        const set = uebung ? uebungMitSets(uebung).sets[satzIdx] : null;
        return normalisiereSetWert(feld, set?.[feld]);
    }

    function liveWertAnpassen(uebungIdx, satzIdx, feld, schritt) {
        const aktuellerWert = liveSetWert(uebungIdx, satzIdx, feld);
        satzAktualisieren(uebungIdx, satzIdx, feld, aktuellerWert + schritt);
    }

    function formatiereSekunden(sekunden) {
        const rest = Math.max(0, Math.round(sekunden));
        const minuten = Math.floor(rest / 60);
        const sek = String(rest % 60).padStart(2, '0');
        return `${minuten}:${sek}`;
    }

    function aktuellePauseRestSek() {
        return pauseEndZeit ? Math.max(0, Math.ceil((pauseEndZeit - Date.now()) / 1000)) : 0;
    }

    function pauseStarten(sekunden = PAUSEN_DAUER_SEK) {
        if (!liveTrackingAktiv) return;
        const dauer = Math.max(1, Math.round(sekunden));
        const jetzt = Date.now();
        pauseGesamtSek = dauer;
        pauseEndZeit = jetzt + dauer * 1000;
        liveNow = jetzt;
    }

    function pauseSkippen() {
        pauseEndZeit = null;
        pauseGesamtSek = PAUSEN_DAUER_SEK;
        liveNow = Date.now();
    }

    function pauseAendern(deltaSekunden) {
        const neuerRest = Math.max(0, aktuellePauseRestSek() + deltaSekunden);
        if (neuerRest === 0) {
            pauseSkippen();
            return;
        }

        const jetzt = Date.now();
        pauseGesamtSek = Math.max(neuerRest, pauseGesamtSek + deltaSekunden);
        pauseEndZeit = jetzt + neuerRest * 1000;
        liveNow = jetzt;
    }

    function neueSaetze(anzahl = 2, wiederholungen = 8, gewicht = 0) {
        const total = Math.max(1, Math.min(20, Math.round(zahlOderFallback(anzahl, 2))));
        const reps = Math.max(1, Math.round(zahlOderFallback(wiederholungen, 8)));
        const kg = Math.max(0, zahlOderFallback(gewicht, 0));

        return Array.from({ length: total }, (_, idx) => ({
            nr: idx + 1,
            wiederholungen: reps,
            gewicht: kg,
            erledigt: false
        }));
    }

    function uebungMitSets(u) {
        const sets = Array.isArray(u.sets) && u.sets.length > 0
            ? u.sets
            : neueSaetze(u.saetze, u.wiederholungen, u.gewicht);

        return {
            ...u,
            sets: sets.map((set, idx) => ({
                nr: idx + 1,
                wiederholungen: Math.max(1, Math.round(zahlOderFallback(set.wiederholungen, u.wiederholungen || 8))),
                gewicht: Math.max(0, zahlOderFallback(set.gewicht, u.gewicht || 0)),
                erledigt: Boolean(set.erledigt)
            }))
        };
    }

    function uebungMitZusammenfassung(u) {
        const mitSets = uebungMitSets(u);
        const erledigteSets = mitSets.sets.filter(set => set.erledigt);
        const relevanteSets = erledigteSets.length > 0 ? erledigteSets : mitSets.sets;
        const referenzSet = relevanteSets.reduce((bestes, set) =>
            Number(set.gewicht) >= Number(bestes.gewicht) ? set : bestes, relevanteSets[0]
        );

        return {
            ...mitSets,
            saetze: erledigteSets.length || mitSets.sets.length,
            wiederholungen: Math.max(1, Math.round(zahlOderFallback(referenzSet?.wiederholungen, mitSets.wiederholungen || 8))),
            gewicht: Math.max(0, zahlOderFallback(referenzSet?.gewicht, mitSets.gewicht || 0))
        };
    }

    let speicherUebungen = $derived(uebungen.map(uebungMitZusammenfassung));

    function uebungWaehlen(name) {
        uebungSuche = name;
        dropdownOffen = false;
    }

    function uebungSpeichern() {
        const name = uebungSuche.trim();
        if (!name) return;
        if (!Number.isFinite(saetzeInput) || saetzeInput < 1) return;
        if (!Number.isFinite(wdhInput) || wdhInput < 1) return;
        if (!Number.isFinite(gewichtInput) || gewichtInput < 0) return;

        uebungen = [...uebungen, {
            name,
            saetze: saetzeInput,
            wiederholungen: wdhInput,
            gewicht: gewichtInput,
            sets: neueSaetze(saetzeInput, wdhInput, gewichtInput)
        }];

        // Form leeren für nächste Übung
        uebungSuche = '';
        saetzeInput = 4;
        wdhInput = 8;
        gewichtInput = 0;
        dropdownOffen = false;
        neueUebungAktiv = false;
    }

    function workoutVorschlagUebernehmen() {
        const bestehendeNamen = new Set(uebungen.map(u => u.name));
        const neueUebungen = bearbeiteterVorschlag
            .filter(name => !bestehendeNamen.has(name))
            .map(name => ({
                name,
                saetze: 2,
                wiederholungen: 8,
                gewicht: 0,
                sets: neueSaetze(2, 8, 0)
            }));

        if (neueUebungen.length === 0) return;
        uebungen = [...uebungen, ...neueUebungen];
        neueUebungAktiv = false;
    }

    function vorschlagUebungEntfernen(name) {
        vorschlagAnpassung = bearbeiteterVorschlag.filter(n => n !== name);
        vorschlagAnpassungKey = aktuellerVorschlagKey;
    }

    function vorschlagUebungHinzufuegen(name = vorschlagSuche) {
        const finalerName = String(name ?? '').trim();
        if (!finalerName) return;
        if (bearbeiteterVorschlag.some(n => n.toLowerCase() === finalerName.toLowerCase())) return;

        vorschlagAnpassung = [...bearbeiteterVorschlag, finalerName];
        vorschlagAnpassungKey = aktuellerVorschlagKey;
        vorschlagSuche = '';
        vorschlagDropdownOffen = false;
    }

    function uebungAktualisieren(idx, feld, wert) {
        const zahl = Number(wert);
        uebungen = uebungen.map((u, i) => {
            if (i !== idx) return u;
            const aktualisiert = { ...u, [feld]: Number.isFinite(zahl) ? zahl : 0 };
            if (!liveTrackingAktiv) {
                aktualisiert.sets = neueSaetze(
                    aktualisiert.saetze,
                    aktualisiert.wiederholungen,
                    aktualisiert.gewicht
                );
            }
            return uebungMitZusammenfassung(aktualisiert);
        });
    }

    function trainingStarten() {
        if (uebungen.length === 0) return;
        const start = Date.now();
        uebungen = uebungen.map(uebungMitZusammenfassung);
        liveTrackingAktiv = true;
        liveStartZeit = start;
        liveNow = start;
        pauseEndZeit = null;
        pauseGesamtSek = PAUSEN_DAUER_SEK;
        aktiverLiveEditor = null;
        neueUebungAktiv = false;
        if (!dauerInput) dauerInput = '1';
    }

    function trainingBeenden() {
        const finalDauer = liveDauerMin || dauerInput || 1;
        liveTrackingAktiv = false;
        liveStartZeit = null;
        pauseEndZeit = null;
        pauseGesamtSek = PAUSEN_DAUER_SEK;
        aktiverLiveEditor = null;
        dauerInput = String(finalDauer);
    }

    function satzAktualisieren(uebungIdx, satzIdx, feld, wert) {
        const neuerWert = normalisiereSetWert(feld, wert);
        uebungen = uebungen.map((u, i) => {
            if (i !== uebungIdx) return u;
            const mitSets = uebungMitSets(u);
            const sets = mitSets.sets.map((set, j) =>
                j === satzIdx
                    ? { ...set, [feld]: neuerWert }
                    : set
            );
            return uebungMitZusammenfassung({ ...mitSets, sets });
        });
    }

    function satzErledigtUmschalten(uebungIdx, satzIdx) {
        let startetPause = false;
        uebungen = uebungen.map((u, i) => {
            if (i !== uebungIdx) return u;
            const mitSets = uebungMitSets(u);
            const sets = mitSets.sets.map((set, j) => {
                if (j !== satzIdx) return set;
                const erledigt = !set.erledigt;
                if (erledigt) startetPause = true;
                return { ...set, erledigt };
            });
            return uebungMitZusammenfassung({ ...mitSets, sets });
        });

        if (startetPause) pauseStarten();
    }

    function satzHinzufuegen(uebungIdx) {
        uebungen = uebungen.map((u, i) => {
            if (i !== uebungIdx) return u;
            const mitSets = uebungMitSets(u);
            const letzter = mitSets.sets[mitSets.sets.length - 1] ?? {
                wiederholungen: mitSets.wiederholungen,
                gewicht: mitSets.gewicht
            };
            const sets = [
                ...mitSets.sets,
                {
                    nr: mitSets.sets.length + 1,
                    wiederholungen: letzter.wiederholungen,
                    gewicht: letzter.gewicht,
                    erledigt: false
                }
            ];
            return uebungMitZusammenfassung({ ...mitSets, sets });
        });
    }

    function satzEntfernen(uebungIdx, satzIdx) {
        if (aktiverLiveEditor?.uebungIdx === uebungIdx) {
            aktiverLiveEditor = null;
        }

        uebungen = uebungen.map((u, i) => {
            if (i !== uebungIdx) return u;
            const mitSets = uebungMitSets(u);
            if (mitSets.sets.length <= 1) return mitSets;
            const sets = mitSets.sets
                .filter((_, j) => j !== satzIdx)
                .map((set, j) => ({ ...set, nr: j + 1 }));
            return uebungMitZusammenfassung({ ...mitSets, sets });
        });
    }

    function uebungEntfernen(idx) {
        if (aktiverLiveEditor) {
            aktiverLiveEditor = null;
        }
        uebungen = uebungen.filter((_, i) => i !== idx);
    }

    function neueUebungAbbrechen() {
        uebungSuche = '';
        saetzeInput = 4;
        wdhInput = 8;
        gewichtInput = 0;
        dropdownOffen = false;
        neueUebungAktiv = false;
    }

    // ────────── Lauf-spezifische Felder (nur sichtbar bei Sport='Laufen' / 'Rad') ──────────
    let distanz = $state('');     // km, als String für freie Eingabe
    let avgHr = $state('');       // bpm
    let hoehenmeter = $state(''); // m
    let dauerInput = $state(''); // für Live-Pace-Berechnung

    let liveDauerMin = $derived(
        liveStartZeit ? Math.max(1, Math.round((liveNow - liveStartZeit) / 60000)) : Number(dauerInput) || 0
    );
    let liveTotalSaetze = $derived(
        uebungen.reduce((sum, u) => sum + (uebungMitSets(u).sets.length || 0), 0)
    );
    let liveErledigteSaetze = $derived(
        uebungen.reduce((sum, u) => sum + uebungMitSets(u).sets.filter(set => set.erledigt).length, 0)
    );
    let liveFortschritt = $derived(
        liveTotalSaetze > 0 ? Math.round((liveErledigteSaetze / liveTotalSaetze) * 100) : 0
    );
    let pauseRestSek = $derived(
        liveTrackingAktiv && pauseEndZeit ? Math.max(0, Math.ceil((pauseEndZeit - liveNow) / 1000)) : 0
    );
    let pauseAktiv = $derived(pauseRestSek > 0);
    let pauseFortschritt = $derived(
        pauseGesamtSek > 0 ? begrenze((pauseRestSek / pauseGesamtSek) * 100, 0, 100) : 0
    );
    let pauseAnzeige = $derived(formatiereSekunden(pauseRestSek));

    $effect(() => {
        if (!liveTrackingAktiv) return;
        const interval = setInterval(() => {
            liveNow = Date.now();
        }, 1000);

        return () => clearInterval(interval);
    });

    $effect(() => {
        if (liveTrackingAktiv && liveDauerMin > 0) {
            dauerInput = String(liveDauerMin);
        }
    });

    // Live-Berechnungen
    let livePace = $derived.by(() => {
        const d = Number(dauerInput);
        const km = Number(distanz);
        return paceProKm(d, km);
    });

    let liveSpeed = $derived.by(() => {
        const d = Number(dauerInput);
        const km = Number(distanz);
        return geschwindigkeitKmh(d, km);
    });

    // Sport-Klassifizierung für UI-Logik
    let istLaufen = $derived(sport === 'Laufen');
    let istRad = $derived(sport === 'Rad');
    let zeigtDistanzFeld = $derived(istLaufen || istRad);
</script>

<div class="page">
    <header>
        <a href="/log" class="back" aria-label="Abbrechen">←</a>
        <h1>NEUE SESSION</h1>
    </header>

    {#if form?.error}
        <p class="error">{form.error}</p>
    {/if}

    <form method="POST">
        {#if kamVonEmpfehlung}
            <div class="coach-hinweis">
                <span class="coach-label">Aus deiner Tagesempfehlung</span>
                <strong>{finalerSubtyp ? `${finalerSubtyp} vorbereiten` : 'Training vorbereiten'}</strong>
                <p>Sport und Split sind bereits vorausgewählt. Du kannst alles anpassen, bevor du speicherst.</p>
            </div>
        {/if}

        <div class="form-grid">
            <section class="basis-panel" aria-label="Basisdaten">
                <div class="panel-heading">
                    <span>Basisdaten</span>
                    <strong>{sport || 'Session'}</strong>
                </div>

                <div class="basis-grid">
                    <div class="basis-block sport-block">
                        <div class="field-label section-label">Sportart</div>
                        <div class="sport-grid">
                            {#each AKTIVE_SPORTARTEN as s}
                                <label class="sport-btn" class:gewaehlt={sport === s}>
                                    <input type="radio" name="sport" value={s} bind:group={sport} required />
                                    <span class="sport-icon">{sportEmoji[s]}</span>
                                    <span>{s}</span>
                                </label>
                            {/each}
                        </div>
                    </div>

                    <!-- Subtyp-Auswahl (nur wenn Sport gewählt ist) -->
                    {#if verfuegbareSubtypen.length > 0}
                        <div class="basis-block split-block">
                            <div class="field-label section-label">
                                Subtyp <span class="optional">(optional)</span>
                                {#if data.vorgeschlagenerSubtyp && sport === 'Kraft'}
                                    <span class="vorschlag-hinweis">→ {data.vorgeschlagenerSubtyp} laut Split</span>
                                {/if}
                            </div>
                            <div class="subtyp-pills">
                                {#each verfuegbareSubtypen as st}
                                    <button type="button"
                                        class="subtyp-pill"
                                        class:gewaehlt={subtyp === st && !customSubtyp}
                                        onclick={() => { subtyp = st; customSubtyp = ''; }}>
                                        {st}
                                    </button>
                                {/each}
                            </div>
                            <input type="text"
                                placeholder="Eigener Subtyp..."
                                bind:value={customSubtyp}
                                class="custom-subtyp" />
                            <!-- Versteckter Input mit finalem Subtyp-Wert für Form-Submit -->
                            <input type="hidden" name="subtyp" value={finalerSubtyp} />
                        </div>
                    {/if}

                    <div class="basis-block zeit-block">
                        <label for="datum" class="field-label">Datum</label>
                        <div class="quick-dates">
                            {#each quickDates as { label, offset }}
                                <button type="button"
                                    class="quick-date-btn"
                                    class:gewaehlt={datum === dateString(offset)}
                                    onclick={() => (datum = dateString(offset))}>
                                    {label}
                                </button>
                            {/each}
                        </div>
                        <input type="date" id="datum" name="datum" bind:value={datum}
                            max={dateString(0)} required />

                        <label for="dauer" class="field-label">Dauer (Minuten)</label>
                        <input type="number" id="dauer" name="dauer" min="1" max="600"
                            placeholder="60" required bind:value={dauerInput} />
                    </div>

                    <!-- Lauf-/Rad-spezifische Felder mit Live-Pace-Vorschau -->
                    {#if zeigtDistanzFeld}
                        <div class="basis-block lauf-block">
                            <div class="lauf-sektion">
                                <div class="lauf-header">
                                    <span class="lauf-titel">{istLaufen ? '🏃 Lauf-Daten' : '🚴 Rad-Daten'}</span>
                                    <span class="lauf-optional">optional</span>
                                </div>

                                <div class="lauf-grid">
                                    <div class="lauf-feld">
                                        <input type="number" name="distanz" min="0" max="500" step="0.01"
                                            placeholder="0.00" bind:value={distanz} />
                                        <span class="lauf-feld-label">Distanz (km)</span>
                                    </div>
                                    <div class="lauf-feld">
                                        <input type="number" name="avgHr" min="30" max="250"
                                            placeholder="—" bind:value={avgHr} />
                                        <span class="lauf-feld-label">Ø HR (bpm)</span>
                                    </div>
                                    {#if istLaufen}
                                        <div class="lauf-feld">
                                            <input type="number" name="hoehenmeter" min="0" max="10000"
                                                placeholder="—" bind:value={hoehenmeter} />
                                            <span class="lauf-feld-label">Höhenmeter</span>
                                        </div>
                                    {/if}
                                </div>

                                {#if livePace || liveSpeed}
                                    <div class="lauf-vorschau">
                                        {#if istLaufen && livePace}
                                            <div class="lv-item">
                                                <span class="lv-label">Pace</span>
                                                <span class="lv-wert">{livePace.formatted} <span class="lv-einheit">min/km</span></span>
                                            </div>
                                        {/if}
                                        {#if liveSpeed}
                                            <div class="lv-item">
                                                <span class="lv-label">{istLaufen ? 'Tempo' : 'Schnitt'}</span>
                                                <span class="lv-wert">{liveSpeed} <span class="lv-einheit">km/h</span></span>
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <div class="basis-block intensitaet-block">
                        <label for="rpe" class="field-label">
                            Intensität <span class="rpe-wert">RPE {rpe}/10</span>
                        </label>
                        <input type="range" id="rpe" name="rpe" min="1" max="10" bind:value={rpe} />
                        <div class="rpe-skala">
                            <span>locker</span>
                            <span>maximal</span>
                        </div>
                    </div>
                </div>
            </section>

            <section class="details-panel" aria-label="Trainingsinhalt">

                <!-- Übungen erfassen (nur bei Kraft) -->
                {#if sport === 'Kraft'}
                    <div class="panel-heading">
                        <span>Trainingsplan</span>
                        <strong>{finalerSubtyp || 'Kraft'}</strong>
                    </div>
                    <div class="field-label section-label">
                        Übungen <span class="optional">(optional)</span>
                    </div>

                    {#if uebungen.length > 0}
                        <div class="live-card" class:aktiv={liveTrackingAktiv}>
                            <div class="live-kopf">
                                <div>
                                    <span class="live-label">Live Tracking</span>
                                    <strong>{liveTrackingAktiv ? 'Training läuft' : 'Bereit fürs Gym'}</strong>
                                    <p>
                                        {liveTrackingAktiv
                                            ? 'Trage Gewicht und Wiederholungen direkt während dem Training ein.'
                                            : 'Starte den Gym-Modus, sobald dein Trainingsplan bereit ist.'}
                                    </p>
                                </div>
                                <div class="live-metriken">
                                    <span><strong>{liveDauerMin || 0}</strong> min</span>
                                    <span><strong>{liveErledigteSaetze}</strong>/{liveTotalSaetze} Sätze</span>
                                </div>
                            </div>

                            <div class="live-progress">
                                <span style="width: {liveFortschritt}%"></span>
                            </div>

                            {#if pauseAktiv}
                                <div class="rest-timer" aria-live="polite">
                                    <div class="rest-ring" style="--pause-progress: {pauseFortschritt}%;">
                                        <span>{pauseAnzeige}</span>
                                    </div>
                                    <div class="rest-info">
                                        <span>Pause</span>
                                        <strong>Erholen und bereit machen</strong>
                                        <div class="rest-actions">
                                            <button type="button" onclick={() => pauseAendern(-30)}>-30s</button>
                                            <button type="button" class="skip" onclick={pauseSkippen}>Pause skippen</button>
                                            <button type="button" onclick={() => pauseAendern(30)}>+30s</button>
                                        </div>
                                    </div>
                                </div>
                            {/if}

                            {#if liveTrackingAktiv}
                                <button type="button" class="live-stop" onclick={trainingBeenden}>
                                    Training beenden
                                </button>
                            {:else}
                                <button type="button" class="live-start" onclick={trainingStarten}>
                                    Training starten
                                </button>
                            {/if}
                        </div>
                    {/if}

                    <div class="trainings-grid">
                        <div class="vorschlag-spalte">
                            {#if workoutVorschlag.length > 0}
                                <div class="workout-vorschlag">
                                    <div class="wv-kopf">
                                        <div>
                                            <span class="wv-label">Vorschlag für {finalerSubtyp}</span>
                                            <strong>Training vorbereiten</strong>
                                        </div>
                                        <span class="wv-count">{bearbeiteterVorschlag.length} Übungen</span>
                                    </div>
                                    {#if bearbeiteterVorschlag.length > 0}
                                        <div class="wv-uebungen">
                                            {#each bearbeiteterVorschlag as name}
                                                <span class="wv-chip" class:uebernommen={uebungen.some(u => u.name === name)}>
                                                    <span>{name}</span>
                                                    <button type="button"
                                                        onclick={() => vorschlagUebungEntfernen(name)}
                                                        aria-label="{name} aus Vorschlag entfernen">×</button>
                                                </span>
                                            {/each}
                                        </div>
                                    {:else}
                                        <p class="wv-empty">Noch keine Übungen im Vorschlag. Füge unten eine Übung hinzu.</p>
                                    {/if}

                                    <div class="wv-add">
                                        <div class="wv-add-row">
                                            <div class="wv-add-combobox">
                                                <input type="text"
                                                    placeholder="Übung zum Vorschlag hinzufügen..."
                                                    bind:value={vorschlagSuche}
                                                    onfocus={() => (vorschlagDropdownOffen = true)}
                                                    onkeydown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            vorschlagUebungHinzufuegen();
                                                        }
                                                    }}
                                                    autocomplete="off" />

                                                {#if vorschlagDropdownOffen}
                                                    <div class="wv-dropdown">
                                                        {#each Object.entries(vorschlagGefiltert) as [gruppe, namen]}
                                                            <div class="wv-gruppe-header">{gruppe}</div>
                                                            {#each namen as n}
                                                                <button type="button"
                                                                    class="wv-option"
                                                                    disabled={bearbeiteterVorschlag.some(v => v.toLowerCase() === n.toLowerCase())}
                                                                    onclick={() => vorschlagUebungHinzufuegen(n)}>
                                                                    {n}
                                                                </button>
                                                            {/each}
                                                        {/each}

                                                        {#if vorschlagSuche.trim() && !bearbeiteterVorschlag.some(v => v.toLowerCase() === vorschlagSuche.trim().toLowerCase())}
                                                            <button type="button"
                                                                class="wv-option wv-custom"
                                                                onclick={() => vorschlagUebungHinzufuegen()}>
                                                                + "{vorschlagSuche.trim()}" hinzufügen
                                                            </button>
                                                        {/if}
                                                    </div>
                                                {/if}
                                            </div>
                                            <button type="button"
                                                class="wv-add-btn"
                                                disabled={!vorschlagSuche.trim()}
                                                onclick={() => vorschlagUebungHinzufuegen()}>
                                                Hinzufügen
                                            </button>
                                        </div>
                                    </div>

                                    <button type="button"
                                        class="wv-uebernehmen"
                                        class:fertig={vorschlagVollstaendigUebernommen}
                                        disabled={!vorschlagUebernahmeMoeglich}
                                        onclick={workoutVorschlagUebernehmen}>
                                        {#if bearbeiteterVorschlag.length === 0}
                                            Vorschlag ist leer
                                        {:else if vorschlagVollstaendigUebernommen}
                                            Vorschlag übernommen
                                        {:else}
                                            Angepassten Vorschlag übernehmen
                                        {/if}
                                    </button>
                                    <p class="wv-hinweis">
                                        Entferne oder ergänze Übungen zuerst im Vorschlag. Standard: 2 Sätze × 8 Wiederholungen.
                                        Gewicht, Wiederholungen und Sätze kannst du unten anpassen.
                                    </p>
                                </div>
                            {/if}
                        </div>

                        <div class="uebungen-spalte">
                            {#if uebungen.length > 0}
                                <div class="ue-liste">
                                    {#each uebungen as u, idx (idx)}
                                        <div class="ue-zeile editierbar">
                                            <div class="ue-info">
                                                <span class="ue-name">{u.name}</span>
                                                {#if liveTrackingAktiv}
                                                    <div class="live-set-liste">
                                                        {#each uebungMitSets(u).sets as set, satzIdx}
                                                            <div class="live-set" class:erledigt={set.erledigt}>
                                                                <button type="button"
                                                                    class="live-check"
                                                                    onclick={() => satzErledigtUmschalten(idx, satzIdx)}
                                                                    aria-label="Satz abhaken">
                                                                    {set.erledigt ? '✓' : set.nr}
                                                                </button>
                                                                <div class="live-set-field">
                                                                    <span>kg</span>
                                                                    <button type="button"
                                                                        class="live-value-button"
                                                                        class:aktiv={istLiveEditorAktiv(idx, satzIdx, 'gewicht')}
                                                                        onclick={() => liveEditorOeffnen(idx, satzIdx, 'gewicht')}
                                                                        aria-label="Gewicht von Satz {set.nr} anpassen">
                                                                        <strong>{formatiereGewicht(set.gewicht)}</strong>
                                                                        <small>kg</small>
                                                                    </button>
                                                                </div>
                                                                <div class="live-set-field">
                                                                    <span>Wdh.</span>
                                                                    <button type="button"
                                                                        class="live-value-button"
                                                                        class:aktiv={istLiveEditorAktiv(idx, satzIdx, 'wiederholungen')}
                                                                        onclick={() => liveEditorOeffnen(idx, satzIdx, 'wiederholungen')}
                                                                        aria-label="Wiederholungen von Satz {set.nr} anpassen">
                                                                        <strong>{set.wiederholungen}</strong>
                                                                        <small>Wdh.</small>
                                                                    </button>
                                                                </div>
                                                                {#if istLiveEditorAktiv(idx, satzIdx, 'gewicht') || istLiveEditorAktiv(idx, satzIdx, 'wiederholungen')}
                                                                    <div class="live-stepper-editor">
                                                                        <div class="live-stepper-top">
                                                                            <span>{liveEditorLabel(aktiverLiveEditor.feld)}</span>
                                                                            <button type="button" onclick={liveEditorSchliessen}>Schliessen</button>
                                                                        </div>
                                                                        <div class="live-stepper-display">
                                                                            <button type="button"
                                                                                onclick={() => liveWertAnpassen(idx, satzIdx, aktiverLiveEditor.feld, -liveEditorBasisSchritt(aktiverLiveEditor.feld))}
                                                                                aria-label="{liveEditorLabel(aktiverLiveEditor.feld)} reduzieren">-</button>
                                                                            <strong>
                                                                                {formatiereLiveWert(aktiverLiveEditor.feld, set[aktiverLiveEditor.feld])}
                                                                                <span>{liveEditorEinheit(aktiverLiveEditor.feld)}</span>
                                                                            </strong>
                                                                            <button type="button"
                                                                                onclick={() => liveWertAnpassen(idx, satzIdx, aktiverLiveEditor.feld, liveEditorBasisSchritt(aktiverLiveEditor.feld))}
                                                                                aria-label="{liveEditorLabel(aktiverLiveEditor.feld)} erhoehen">+</button>
                                                                        </div>
                                                                        <div class="live-stepper-steps">
                                                                            {#each liveEditorSchritte(aktiverLiveEditor.feld) as schritt}
                                                                                <button type="button"
                                                                                    onclick={() => liveWertAnpassen(idx, satzIdx, aktiverLiveEditor.feld, schritt)}>
                                                                                    {formatiereSchritt(schritt)}
                                                                                </button>
                                                                            {/each}
                                                                        </div>
                                                                    </div>
                                                                {/if}
                                                                <button type="button"
                                                                    class="live-set-remove"
                                                                    onclick={() => satzEntfernen(idx, satzIdx)}
                                                                    aria-label="Satz entfernen">×</button>
                                                            </div>
                                                        {/each}
                                                        <button type="button" class="live-add-set"
                                                            onclick={() => satzHinzufuegen(idx)}>
                                                            + Satz
                                                        </button>
                                                    </div>
                                                {:else}
                                                <div class="ue-edit-grid">
                                                    <label>
                                                        <span>Sätze</span>
                                                        <input type="number" min="1" max="20"
                                                            value={u.saetze}
                                                            oninput={(e) => uebungAktualisieren(idx, 'saetze', e.currentTarget.value)} />
                                                    </label>
                                                    <label>
                                                        <span>Wdh.</span>
                                                        <input type="number" min="1" max="100"
                                                            value={u.wiederholungen}
                                                            oninput={(e) => uebungAktualisieren(idx, 'wiederholungen', e.currentTarget.value)} />
                                                    </label>
                                                    <label>
                                                        <span>kg</span>
                                                        <input type="number" min="0" max="1000" step="0.5"
                                                            value={u.gewicht}
                                                            oninput={(e) => uebungAktualisieren(idx, 'gewicht', e.currentTarget.value)} />
                                                    </label>
                                                </div>
                                                {/if}
                                            </div>
                                            <button type="button" class="ue-entfernen"
                                                onclick={() => uebungEntfernen(idx)}
                                                aria-label="Übung entfernen">×</button>
                                        </div>
                                    {/each}
                                </div>
                            {/if}

                            {#if !neueUebungAktiv}
                                <button type="button" class="ue-add-btn"
                                    onclick={() => (neueUebungAktiv = true)}>
                                    + Übung hinzufügen
                                </button>
                            {:else}
                                <div class="ue-form">
                                    <!-- Combobox: Suche + Dropdown mit Vorschlägen -->
                                    <div class="ue-combobox">
                                        <input type="text"
                                            class="ue-suche"
                                            placeholder="Übung suchen oder eingeben..."
                                            bind:value={uebungSuche}
                                            onfocus={() => (dropdownOffen = true)}
                                            autocomplete="off" />

                                        {#if dropdownOffen}
                                            <div class="ue-dropdown">
                                                <!-- Toggle: nur passende zum Subtyp ODER alle -->
                                                {#if finalerSubtyp && SUBTYP_GRUPPEN[finalerSubtyp]}
                                                    <div class="ue-toggle-zeile">
                                                        <span class="ue-toggle-info">
                                                            {alleUebungenZeigen ? 'Alle Übungen' : `Passend zu ${finalerSubtyp}`}
                                                        </span>
                                                        <button type="button"
                                                            class="ue-toggle-btn"
                                                            onclick={() => (alleUebungenZeigen = !alleUebungenZeigen)}>
                                                            {alleUebungenZeigen ? 'nur passende' : 'alle anzeigen'}
                                                        </button>
                                                    </div>
                                                {/if}

                                                {#each Object.entries(gefiltert) as [gruppe, namen]}
                                                    <div class="ue-gruppe-header">{gruppe}</div>
                                                    {#each namen as n}
                                                        <button type="button"
                                                            class="ue-vorschlag"
                                                            onclick={() => uebungWaehlen(n)}>
                                                            {n}
                                                        </button>
                                                    {/each}
                                                {/each}
                                                {#if Object.keys(gefiltert).length === 0}
                                                    <div class="ue-leer">
                                                        Keine Treffer — wird als eigene Übung gespeichert
                                                    </div>
                                                {/if}
                                            </div>
                                        {/if}
                                    </div>

                                <div class="ue-werte-grid">
                                    <div class="ue-feld">
                                        <input type="number" min="1" max="20"
                                            bind:value={saetzeInput} placeholder="4" />
                                        <span class="ue-feld-label">Sätze</span>
                                    </div>
                                    <div class="ue-feld">
                                        <input type="number" min="1" max="100"
                                            bind:value={wdhInput} placeholder="8" />
                                        <span class="ue-feld-label">Wdh.</span>
                                    </div>
                                    <div class="ue-feld">
                                        <input type="number" min="0" max="1000" step="0.5"
                                            bind:value={gewichtInput} placeholder="80" />
                                        <span class="ue-feld-label">kg</span>
                                    </div>
                                </div>

                                <div class="ue-form-aktionen">
                                    <button type="button" class="ue-speichern"
                                        onclick={uebungSpeichern}>Hinzufügen</button>
                                    <button type="button" class="ue-abbrechen"
                                        onclick={neueUebungAbbrechen}>Abbrechen</button>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>

                    <!-- Übungen werden als JSON in einem hidden field serialisiert -->
                    <input type="hidden" name="uebungen" value={JSON.stringify(speicherUebungen)} />
                {/if}

                <div class="abschluss-panel">
                    <label for="notiz" class="field-label">Notiz <span class="optional">(optional)</span></label>
                    <textarea id="notiz" name="notiz" placeholder="Wie war das Training?"></textarea>

                    <div class="abschluss-aktionen">
                        <button type="submit" class="btn-save">
                            {liveTrackingAktiv ? 'Training speichern' : 'Session speichern'}
                        </button>
                        <a href="/log" class="cancel">Abbrechen</a>
                    </div>
                </div>
            </section>
        </div>
    </form>
</div>

<style>
    .page {
        max-width: 480px;
        margin: 0 auto;
        padding: 1.75rem 1rem 1rem;
    }

    header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    h1 {
        font-size: 1.4rem;
        margin: 0;
        font-weight: 900;
        letter-spacing: 0.02em;
        color: var(--text-primary);
        text-transform: uppercase;
    }

    .back {
        font-size: 1.5rem;
        text-decoration: none;
        color: var(--text-primary);
        line-height: 1;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        transition: background 0.15s;
    }

    .back:hover { background: var(--bg-elevated); }

    .error {
        background: var(--error-bg);
        color: var(--error-text);
        border: 1px solid var(--error-border);
        padding: 0.85rem;
        border-radius: 10px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .form-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.4rem;
    }

    .basis-panel,
    .details-panel {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .panel-heading {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--border);
        cursor: default;
        user-select: none;
    }

    .panel-heading span {
        color: var(--text-tertiary);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .panel-heading strong {
        color: var(--text-primary);
        font-size: 1rem;
        font-weight: 850;
    }

    .basis-grid,
    .trainings-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.85rem;
    }

    .basis-block,
    .vorschlag-spalte,
    .uebungen-spalte,
    .abschluss-panel {
        min-width: 0;
    }

    .basis-block {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .vorschlag-spalte,
    .uebungen-spalte {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
    }

    .abschluss-panel {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .abschluss-aktionen {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
    }

    .coach-hinweis {
        background: var(--bg-card);
        border: 1px solid var(--accent);
        border-radius: var(--radius-lg);
        padding: 1rem;
        box-shadow: 0 0 20px var(--accent-glow);
    }

    .coach-hinweis strong {
        display: block;
        margin-top: 0.25rem;
        color: var(--text-primary);
        font-size: 1rem;
    }

    .coach-hinweis p {
        margin: 0.45rem 0 0;
        color: var(--text-secondary);
        font-size: 0.86rem;
        line-height: 1.45;
    }

    .coach-label {
        color: var(--accent);
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .field-label {
        font-weight: 600;
        font-size: 0.8rem;
        margin-top: 1rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }

    .section-label {
        cursor: default;
        user-select: none;
    }

    .rpe-wert {
        font-weight: 700;
        text-transform: none;
        letter-spacing: 0;
        color: var(--accent);
        font-size: 0.85rem;
    }

    .optional {
        font-weight: 400;
        text-transform: none;
        letter-spacing: 0;
        color: var(--text-tertiary);
        font-size: 0.75rem;
    }

    input[type="date"],
    input[type="number"],
    textarea {
        padding: 0.8rem 0.9rem;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: 10px;
        font-size: 1rem;
        width: 100%;
        color: var(--text-primary);
        font-family: inherit;
        transition: border-color 0.15s, background 0.15s;
    }

    input[type="date"]:focus,
    input[type="number"]:focus,
    textarea:focus {
        outline: none;
        border-color: var(--accent);
        background: var(--bg-card);
    }

    /* Date-Picker Indikator hell färben (Browser-Trick) */
    input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(1) opacity(0.6);
        cursor: pointer;
    }

    textarea {
        min-height: 90px;
        resize: vertical;
    }

    /* Range Slider */
    input[type="range"] {
        width: 100%;
        appearance: none;
        background: transparent;
        margin: 0.25rem 0;
    }

    input[type="range"]::-webkit-slider-runnable-track {
        height: 6px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 999px;
    }

    input[type="range"]::-moz-range-track {
        height: 6px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 999px;
    }

    input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 22px;
        height: 22px;
        background: var(--accent);
        border-radius: 50%;
        margin-top: -9px;
        box-shadow: 0 0 12px var(--accent-glow);
        cursor: pointer;
        transition: transform 0.15s;
    }

    input[type="range"]::-webkit-slider-thumb:active {
        transform: scale(1.15);
    }

    input[type="range"]::-moz-range-thumb {
        width: 22px;
        height: 22px;
        background: var(--accent);
        border-radius: 50%;
        border: none;
        box-shadow: 0 0 12px var(--accent-glow);
        cursor: pointer;
    }

    .rpe-skala {
        display: flex;
        justify-content: space-between;
        font-size: 0.7rem;
        color: var(--text-tertiary);
        margin-top: 0.1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* Subtyp-Pills */
    .vorschlag-hinweis {
        font-weight: 500;
        text-transform: none;
        letter-spacing: 0;
        color: var(--accent);
        font-size: 0.72rem;
        margin-left: auto;
    }

    .subtyp-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-bottom: 0.5rem;
    }

    .subtyp-pill {
        padding: 0.5rem 0.85rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--text-secondary);
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
    }

    .subtyp-pill:hover {
        background: var(--bg-elevated);
        color: var(--text-primary);
    }

    .subtyp-pill.gewaehlt {
        background: var(--accent);
        color: #0a0e14;
        border-color: var(--accent);
        box-shadow: 0 0 0 1px var(--accent), 0 0 16px var(--accent-glow);
    }

    .custom-subtyp {
        padding: 0.6rem 0.8rem;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: 10px;
        font-size: 0.9rem;
        width: 100%;
        color: var(--text-primary);
        font-family: inherit;
    }

    .custom-subtyp:focus {
        outline: none;
        border-color: var(--accent);
    }

    /* Quick-Date Pills */
    .quick-dates {
        display: flex;
        gap: 0.4rem;
        margin-bottom: 0.4rem;
    }

    .quick-date-btn {
        flex: 1;
        padding: 0.55rem 0.8rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--text-secondary);
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
    }

    .quick-date-btn:hover {
        background: var(--bg-elevated);
        color: var(--text-primary);
    }

    .quick-date-btn.gewaehlt {
        background: var(--accent);
        color: #0a0e14;
        border-color: var(--accent);
        box-shadow: 0 0 0 1px var(--accent), 0 0 16px var(--accent-glow);
    }

    /* Sport Grid */
    .sport-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
    }

    .sport-btn {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.85rem 1rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 10px;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--text-primary);
        transition: all 0.15s;
        margin-top: 0;
    }

    .sport-btn:hover {
        background: var(--bg-elevated);
        border-color: var(--border-strong);
    }

    .sport-btn input { display: none; }

    .sport-btn.gewaehlt {
        background: var(--bg-elevated);
        border-color: var(--accent);
        box-shadow: 0 0 0 1px var(--accent), 0 0 20px var(--accent-glow);
    }

    .sport-icon {
        font-size: 1.2rem;
    }

    .workout-vorschlag {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 1rem;
        margin-bottom: 0.6rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .wv-kopf {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: flex-start;
    }

    .wv-kopf strong {
        display: block;
        margin-top: 0.15rem;
        color: var(--text-primary);
        font-size: 1rem;
    }

    .wv-label {
        color: var(--accent);
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .wv-count {
        flex-shrink: 0;
        color: var(--text-tertiary);
        font-size: 0.75rem;
        font-weight: 700;
    }

    .wv-uebungen {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    .wv-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--text-secondary);
        font-size: 0.78rem;
        font-weight: 650;
        padding: 0.35rem 0.65rem;
    }

    .wv-chip button {
        width: 18px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        border-radius: 50%;
        color: var(--text-tertiary);
        cursor: pointer;
        font-family: inherit;
        font-size: 1rem;
        line-height: 1;
        padding: 0;
        transition: background 0.15s, color 0.15s;
    }

    .wv-chip button:hover {
        background: rgba(239, 68, 68, 0.16);
        color: var(--sport-kraft);
    }

    .wv-chip.uebernommen {
        background: rgba(132, 204, 22, 0.12);
        border-color: var(--accent);
        color: var(--accent);
    }

    .wv-empty {
        margin: 0;
        color: var(--text-tertiary);
        font-size: 0.85rem;
        line-height: 1.45;
    }

    .wv-add {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
    }

    .wv-add-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.45rem;
    }

    .wv-add-combobox {
        position: relative;
        min-width: 0;
    }

    .wv-add input {
        width: 100%;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.9rem;
        padding: 0.7rem 0.8rem;
    }

    .wv-add input:focus {
        outline: none;
        border-color: var(--accent);
    }

    .wv-add-btn {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        cursor: pointer;
        font-family: inherit;
        font-size: 0.84rem;
        font-weight: 750;
        padding: 0 0.8rem;
        transition: border-color 0.15s, color 0.15s, opacity 0.15s;
    }

    .wv-add-btn:hover:not(:disabled) {
        border-color: var(--accent);
        color: var(--accent);
    }

    .wv-add-btn:disabled {
        cursor: default;
        opacity: 0.45;
    }

    .wv-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        max-height: 220px;
        overflow-y: auto;
        background: var(--bg-elevated);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-md);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        z-index: 60;
    }

    .wv-gruppe-header {
        padding: 0.55rem 0.8rem 0.3rem;
        background: var(--bg-input);
        color: var(--text-tertiary);
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .wv-option {
        display: block;
        width: 100%;
        background: transparent;
        border: none;
        color: var(--text-primary);
        cursor: pointer;
        font-family: inherit;
        font-size: 0.86rem;
        padding: 0.58rem 0.8rem;
        text-align: left;
        transition: background 0.1s, color 0.1s, opacity 0.1s;
    }

    .wv-option:hover:not(:disabled) {
        background: var(--bg-card);
        color: var(--accent);
    }

    .wv-option:disabled {
        cursor: default;
        opacity: 0.45;
    }

    .wv-custom {
        border-top: 1px solid var(--border);
        color: var(--accent);
        font-weight: 700;
    }

    .wv-uebernehmen {
        width: 100%;
        background: var(--cta-bg);
        color: var(--cta-color);
        border: none;
        border-radius: var(--radius-md);
        padding: 0.8rem 1rem;
        font-family: inherit;
        font-size: 0.92rem;
        font-weight: 800;
        cursor: pointer;
        transition: background 0.15s, transform 0.15s, opacity 0.15s;
    }

    .wv-uebernehmen:hover:not(:disabled) {
        background: var(--cta-bg-hover);
        transform: translateY(-1px);
    }

    .wv-uebernehmen:disabled,
    .wv-uebernehmen.fertig {
        cursor: default;
        opacity: 0.7;
    }

    .wv-hinweis {
        margin: 0;
        color: var(--text-tertiary);
        font-size: 0.78rem;
        line-height: 1.45;
    }

    @media (max-width: 430px) {
        .wv-add-row {
            grid-template-columns: 1fr;
        }

        .wv-add-btn {
            min-height: 42px;
        }
    }

    /* ─── Übungen-Erfassung ─── */
    .live-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .live-card.aktiv {
        border-color: var(--accent);
        box-shadow: 0 0 18px var(--accent-glow);
    }

    .live-kopf {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
    }

    .live-label {
        color: var(--accent);
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .live-kopf strong {
        display: block;
        margin-top: 0.2rem;
        color: var(--text-primary);
        font-size: 1rem;
    }

    .live-kopf p {
        margin: 0.35rem 0 0;
        color: var(--text-secondary);
        font-size: 0.84rem;
        line-height: 1.4;
    }

    .live-metriken {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        align-items: flex-end;
        color: var(--text-secondary);
        font-size: 0.76rem;
        white-space: nowrap;
    }

    .live-metriken strong {
        display: inline;
        margin: 0;
        color: var(--accent);
        font-size: 1rem;
    }

    .live-progress {
        height: 6px;
        background: var(--bg-input);
        border-radius: 999px;
        overflow: hidden;
    }

    .live-progress span {
        display: block;
        height: 100%;
        background: var(--accent);
        box-shadow: 0 0 12px var(--accent-glow);
        transition: width 0.2s ease;
    }

    .rest-timer {
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr);
        gap: 0.85rem;
        align-items: center;
        padding: 0.8rem;
        background: linear-gradient(135deg, rgba(132, 204, 22, 0.13), rgba(28, 33, 40, 0.9));
        border: 1px solid rgba(132, 204, 22, 0.35);
        border-radius: var(--radius-md);
    }

    .rest-ring {
        position: relative;
        width: 66px;
        aspect-ratio: 1;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: conic-gradient(var(--accent) var(--pause-progress), var(--bg-input) 0);
        box-shadow: 0 0 16px rgba(132, 204, 22, 0.2);
    }

    .rest-ring::before {
        content: '';
        position: absolute;
        inset: 6px;
        border-radius: 50%;
        background: var(--bg-card);
    }

    .rest-ring span {
        position: relative;
        z-index: 1;
        color: var(--text-primary);
        font-size: 0.95rem;
        font-weight: 900;
        font-variant-numeric: tabular-nums;
    }

    .rest-info {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .rest-info > span {
        color: var(--accent);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .rest-info strong {
        color: var(--text-primary);
        font-size: 0.98rem;
    }

    .rest-actions {
        display: grid;
        grid-template-columns: 0.8fr 1.25fr 0.8fr;
        gap: 0.4rem;
        margin-top: 0.15rem;
    }

    .rest-actions button {
        min-height: 36px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--bg-input);
        color: var(--text-secondary);
        cursor: pointer;
        font-family: inherit;
        font-size: 0.78rem;
        font-weight: 800;
        transition: border-color 0.15s, color 0.15s, background 0.15s;
    }

    .rest-actions button:hover {
        border-color: var(--accent);
        color: var(--accent);
    }

    .rest-actions .skip {
        background: var(--accent);
        color: var(--cta-color);
        border-color: var(--accent);
    }

    .live-start,
    .live-stop {
        width: 100%;
        border: none;
        border-radius: var(--radius-md);
        padding: 0.85rem 1rem;
        font-family: inherit;
        font-size: 0.95rem;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.15s, background 0.15s;
    }

    .live-start {
        background: var(--accent);
        color: var(--cta-color);
    }

    .live-stop {
        background: var(--bg-elevated);
        color: var(--text-primary);
        border: 1px solid var(--border);
    }

    .live-start:hover,
    .live-stop:hover {
        transform: translateY(-1px);
    }

    .live-set-liste {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        margin-top: 0.6rem;
    }

    .live-set {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) minmax(0, 1fr) 34px;
        gap: 0.55rem;
        align-items: center;
        padding: 0.65rem;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
    }

    .live-set.erledigt {
        border-color: var(--accent);
        background: rgba(132, 204, 22, 0.1);
    }

    .live-check,
    .live-set-remove {
        height: 42px;
        border: none;
        border-radius: 9px;
        font-family: inherit;
        font-weight: 800;
        cursor: pointer;
    }

    .live-check {
        grid-column: 1;
        grid-row: 1;
        background: var(--bg-card);
        color: var(--text-secondary);
        border: 1px solid var(--border);
        font-size: 0.9rem;
    }

    .live-set.erledigt .live-check {
        background: var(--accent);
        color: var(--cta-color);
        border-color: var(--accent);
    }

    .live-set-field {
        display: flex;
        flex-direction: column;
        gap: 0.24rem;
        min-width: 0;
    }

    .live-set-field > span {
        color: var(--text-tertiary);
        font-size: 0.62rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }

    .live-value-button {
        width: 100%;
        min-height: 52px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        color: var(--text-primary);
        cursor: pointer;
        font-family: inherit;
        padding: 0.45rem 0.35rem;
        text-align: center;
        transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
    }

    .live-value-button:hover,
    .live-value-button.aktiv {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(132, 204, 22, 0.12);
        transform: translateY(-1px);
    }

    .live-value-button strong {
        display: block;
        color: var(--text-primary);
        font-size: 1.14rem;
        font-weight: 900;
        line-height: 1.05;
        font-variant-numeric: tabular-nums;
    }

    .live-value-button small {
        display: block;
        margin-top: 0.1rem;
        color: var(--text-tertiary);
        font-size: 0.62rem;
        font-weight: 800;
        text-transform: uppercase;
    }

    .live-stepper-editor {
        grid-column: 1 / -1;
        grid-row: 2;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        margin-top: 0.25rem;
        padding: 0.75rem;
        background: var(--bg-card);
        border: 1px solid rgba(132, 204, 22, 0.28);
        border-radius: var(--radius-md);
    }

    .live-stepper-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
    }

    .live-stepper-top span {
        color: var(--accent);
        font-size: 0.7rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .live-stepper-top button,
    .live-stepper-display button,
    .live-stepper-steps button {
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--bg-input);
        color: var(--text-secondary);
        cursor: pointer;
        font-family: inherit;
        font-weight: 850;
        transition: border-color 0.15s, color 0.15s, background 0.15s, transform 0.15s;
    }

    .live-stepper-top button:hover,
    .live-stepper-display button:hover,
    .live-stepper-steps button:hover {
        border-color: var(--accent);
        color: var(--accent);
        transform: translateY(-1px);
    }

    .live-stepper-top button {
        min-height: 32px;
        padding: 0 0.65rem;
        font-size: 0.72rem;
    }

    .live-stepper-display {
        display: grid;
        grid-template-columns: 48px minmax(0, 1fr) 48px;
        gap: 0.55rem;
        align-items: center;
    }

    .live-stepper-display button {
        min-height: 48px;
        color: var(--text-primary);
        font-size: 1.4rem;
    }

    .live-stepper-display strong {
        min-height: 56px;
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 0.35rem;
        padding: 0.45rem 0.7rem;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: 12px;
        color: var(--text-primary);
        font-size: 1.8rem;
        font-weight: 950;
        font-variant-numeric: tabular-nums;
        text-align: center;
    }

    .live-stepper-display strong span {
        color: var(--text-tertiary);
        font-size: 0.75rem;
        font-weight: 850;
        text-transform: uppercase;
    }

    .live-stepper-steps {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 0.4rem;
    }

    .live-stepper-steps button {
        min-height: 38px;
        font-size: 0.78rem;
    }

    .live-set-remove {
        grid-column: 4;
        grid-row: 1;
        background: transparent;
        color: var(--text-tertiary);
        font-size: 1.2rem;
    }

    .live-set-remove:hover {
        background: rgba(239, 68, 68, 0.15);
        color: var(--sport-kraft);
    }

    .live-add-set {
        background: transparent;
        border: 1px dashed var(--border);
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        cursor: pointer;
        font-family: inherit;
        font-size: 0.82rem;
        font-weight: 700;
        padding: 0.55rem;
        transition: border-color 0.15s, color 0.15s, background 0.15s;
    }

    .live-add-set:hover {
        background: var(--bg-input);
        border-color: var(--accent);
        color: var(--accent);
    }

    @media (max-width: 520px) {
        .live-kopf {
            flex-direction: column;
        }

        .live-metriken {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
        }

        .rest-timer {
            grid-template-columns: 1fr;
            justify-items: center;
            text-align: center;
        }

        .rest-actions {
            grid-template-columns: 1fr;
            width: 100%;
        }

        .live-set {
            grid-template-columns: 40px minmax(0, 1fr) minmax(0, 1fr) 32px;
            gap: 0.45rem;
            padding: 0.55rem;
        }

        .live-check,
        .live-set-remove {
            height: 40px;
        }

        .live-value-button {
            min-height: 50px;
        }

        .live-stepper-display {
            grid-template-columns: 44px minmax(0, 1fr) 44px;
        }

        .live-stepper-steps {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }

    .ue-liste {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        margin-bottom: 0.5rem;
    }

    .ue-zeile {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 0.7rem 0.85rem;
    }

    .ue-zeile.editierbar {
        align-items: flex-start;
    }

    .ue-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
    }

    .ue-name {
        font-weight: 700;
        font-size: 0.92rem;
        color: var(--text-primary);
    }

    .ue-edit-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.4rem;
        margin-top: 0.55rem;
    }

    .ue-edit-grid label {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        margin: 0;
    }

    .ue-edit-grid span {
        color: var(--text-tertiary);
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }

    .ue-edit-grid input {
        width: 100%;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.9rem;
        font-weight: 750;
        padding: 0.5rem 0.4rem;
        text-align: center;
    }

    .ue-edit-grid input:focus {
        outline: none;
        border-color: var(--accent);
    }

    .ue-entfernen {
        width: 28px;
        height: 28px;
        background: transparent;
        border: none;
        color: var(--text-tertiary);
        font-size: 1.3rem;
        line-height: 1;
        cursor: pointer;
        border-radius: 50%;
        font-family: inherit;
        transition: background 0.15s, color 0.15s;
    }

    .ue-entfernen:hover {
        background: rgba(239, 68, 68, 0.15);
        color: var(--sport-kraft);
    }

    /* "+ Übung" Button */
    .ue-add-btn {
        width: 100%;
        background: transparent;
        color: var(--text-secondary);
        padding: 0.75rem;
        border: 1px dashed var(--border);
        border-radius: var(--radius-md);
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
    }

    .ue-add-btn:hover {
        background: var(--bg-card);
        color: var(--accent);
        border-color: var(--accent);
        border-style: solid;
    }

    /* Inline-Form für neue Übung */
    .ue-form {
        background: var(--bg-card);
        border: 1px solid var(--accent);
        border-radius: var(--radius-md);
        padding: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        box-shadow: 0 0 16px var(--accent-glow);
    }

    /* Combobox */
    .ue-combobox {
        position: relative;
    }

    .ue-suche {
        padding: 0.7rem 0.85rem;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 0.95rem;
        width: 100%;
        color: var(--text-primary);
        font-family: inherit;
    }

    .ue-suche:focus {
        outline: none;
        border-color: var(--accent);
    }

    .ue-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: var(--bg-elevated);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-md);
        max-height: 240px;
        overflow-y: auto;
        z-index: 50;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    .ue-gruppe-header {
        padding: 0.55rem 0.85rem 0.3rem;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-tertiary);
        background: var(--bg-input);
    }

    /* Toggle-Zeile im Dropdown: zeigt aktuellen Filter-Status + Umschalt-Button */
    .ue-toggle-zeile {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.6rem 0.85rem;
        background: var(--bg-input);
        border-bottom: 1px solid var(--border);
    }

    .ue-toggle-info {
        font-size: 0.78rem;
        color: var(--accent);
        font-weight: 600;
    }

    .ue-toggle-btn {
        background: transparent;
        border: 1px solid var(--border-strong);
        color: var(--text-secondary);
        padding: 0.3rem 0.7rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
    }

    .ue-toggle-btn:hover {
        background: var(--bg-card);
        color: var(--text-primary);
        border-color: var(--accent);
    }

    .ue-vorschlag {
        display: block;
        width: 100%;
        text-align: left;
        background: transparent;
        border: none;
        padding: 0.6rem 0.85rem;
        color: var(--text-primary);
        font-size: 0.9rem;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.1s;
    }

    .ue-vorschlag:hover {
        background: var(--bg-card);
        color: var(--accent);
    }

    .ue-leer {
        padding: 0.85rem;
        color: var(--text-tertiary);
        font-size: 0.85rem;
        font-style: italic;
        text-align: center;
    }

    /* Werte-Grid (Sätze, Wdh, kg) */
    .ue-werte-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.45rem;
    }

    .ue-feld {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .ue-feld input {
        padding: 0.55rem 0.5rem;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 0.95rem;
        color: var(--text-primary);
        text-align: center;
        font-weight: 700;
        font-family: inherit;
    }

    .ue-feld input:focus {
        outline: none;
        border-color: var(--accent);
    }

    .ue-feld-label {
        font-size: 0.68rem;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-tertiary);
        font-weight: 600;
    }

    /* Form-Aktionen */
    .ue-form-aktionen {
        display: flex;
        gap: 0.4rem;
    }

    .ue-speichern {
        flex: 1;
        background: var(--cta-bg);
        color: var(--cta-color);
        padding: 0.7rem;
        border: none;
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.15s;
    }

    .ue-speichern:hover {
        background: var(--cta-bg-hover);
    }

    .ue-abbrechen {
        flex: 1;
        background: transparent;
        color: var(--text-secondary);
        padding: 0.7rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
    }

    .ue-abbrechen:hover {
        background: var(--bg-elevated);
    }

    /* ─── Lauf-/Rad-Sektion ─── */
    .lauf-sektion {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 1rem;
        margin-top: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .lauf-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }

    .lauf-titel {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .lauf-optional {
        font-size: 0.7rem;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 600;
    }

    .lauf-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.5rem;
    }

    /* Bei Rad: nur 2 Spalten (kein Höhenmeter) */
    .lauf-grid:has(.lauf-feld:nth-child(2):last-child) {
        grid-template-columns: 1fr 1fr;
    }

    .lauf-feld {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .lauf-feld input {
        padding: 0.6rem 0.5rem;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 0.95rem;
        color: var(--text-primary);
        text-align: center;
        font-weight: 700;
        font-family: inherit;
    }

    .lauf-feld input:focus {
        outline: none;
        border-color: var(--accent);
    }

    .lauf-feld-label {
        font-size: 0.65rem;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-tertiary);
        font-weight: 600;
    }

    /* Live-Vorschau: Pace + Speed */
    .lauf-vorschau {
        display: flex;
        gap: 1.25rem;
        padding-top: 0.6rem;
        border-top: 1px solid var(--border);
    }

    .lv-item {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .lv-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-tertiary);
        font-weight: 600;
    }

    .lv-wert {
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--accent);
        letter-spacing: -0.02em;
    }

    .lv-einheit {
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    /* Submit & Cancel — weisser CTA */
    .btn-save {
        margin-top: 1.5rem;
        background: var(--cta-bg);
        color: var(--cta-color);
        padding: 1rem;
        border: none;
        border-radius: var(--radius-md);
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.15s, transform 0.15s;
    }

    .btn-save:hover {
        background: var(--cta-bg-hover);
        transform: translateY(-1px);
    }

    .cancel {
        text-align: center;
        color: var(--text-tertiary);
        font-size: 0.9rem;
        text-decoration: none;
        margin-top: 0.6rem;
        padding: 0.5rem;
        transition: color 0.15s;
    }

    .cancel:hover { color: var(--text-secondary); }

    @media (min-width: 900px) {
        .page {
            max-width: 1180px;
            padding: 2.25rem 2rem 2rem;
        }

        header {
            margin-bottom: 1.75rem;
        }

        h1 {
            font-size: 1.8rem;
        }

        form {
            gap: 1.1rem;
        }

        .coach-hinweis {
            max-width: none;
        }

        .form-grid {
            grid-template-columns: 1fr;
            gap: 1.1rem;
            align-items: start;
        }

        .basis-panel,
        .details-panel {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 1.15rem;
            gap: 0.95rem;
        }

        .basis-block .field-label:first-child,
        .details-panel > .field-label {
            margin-top: 0;
        }

        .basis-grid {
            grid-template-columns: minmax(320px, 1.25fr) minmax(260px, 1fr) minmax(230px, 0.85fr);
            gap: 0.9rem 1rem;
            align-items: start;
        }

        .sport-block {
            grid-column: span 1;
        }

        .split-block {
            grid-column: span 1;
        }

        .zeit-block {
            grid-column: span 1;
        }

        .lauf-block,
        .intensitaet-block {
            grid-column: 1 / -1;
        }

        .intensitaet-block {
            max-width: none;
        }

        .sport-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.6rem;
        }

        .sport-btn {
            min-height: 58px;
        }

        .workout-vorschlag {
            margin-bottom: 0;
            padding: 1.15rem;
        }

        .trainings-grid {
            grid-template-columns: minmax(320px, 0.95fr) minmax(360px, 1.05fr);
            gap: 1rem;
            align-items: start;
        }

        .wv-uebungen {
            gap: 0.5rem;
        }

        .ue-liste {
            display: flex;
            flex-direction: column;
            gap: 0.65rem;
        }

        .ue-zeile {
            min-width: 0;
        }

        .ue-edit-grid {
            gap: 0.45rem;
        }

        textarea {
            min-height: 120px;
        }

        .abschluss-panel {
            margin-top: 0.35rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
        }

        .abschluss-aktionen {
            display: grid;
            grid-template-columns: minmax(260px, 360px) 180px;
            gap: 0.75rem;
            align-items: center;
        }

        .btn-save {
            margin-top: 0;
        }

        .cancel {
            align-self: center;
            min-width: 180px;
            margin-top: 0;
        }
    }
</style>
