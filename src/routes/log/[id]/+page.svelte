<script>
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { toast } from '$lib/toast.svelte.js';
    import { subtypenFuer } from '$lib/splits.js';
    import { filtereUebungen, SUBTYP_GRUPPEN } from '$lib/uebungen.js';
    import { paceProKm, geschwindigkeitKmh } from '$lib/lauf.js';
    import { berechneHrZonenAusPunkten, formatZonenZeit } from '$lib/hrZonen.js';

    let { data, form } = $props();

    let session = $derived(data.session);
    let uebungen = $derived(data.uebungen);
    let bearbeitenAktiv = $state(false);
    let loeschenBestaetigung = $state(false);

    // Übungs-Edit-State
    let neueUebungAktiv = $state(false);
    let editUebungId = $state(null);  // ID der gerade editierten Übung
    let uebungLoeschId = $state(null); // ID der zu löschenden Übung

    // Combobox-State für die "Neue Übung"-Form (Custom-Dropdown)
    let neuName = $state('');
    let neuDropdownOffen = $state(false);
    // Toggle: ignoriert Subtyp-Filter, zeigt alle Übungen
    let neuAlleZeigen = $state(false);

    // Subtyp der aktuellen Session — bestimmt welche Übungen vorgeschlagen werden
    let sessionSubtyp = $derived(session.subtyp ?? '');

    let gefiltert = $derived(
        filtereUebungen(neuName, neuAlleZeigen ? '' : sessionSubtyp)
    );

    // Edit-State (initialisiert mit aktuellen Werten der Session)
    let sport = $state(session.sport);
    let subtyp = $state(session.subtyp ?? '');
    let customSubtyp = $state('');
    let datum = $state(session.datum.split('T')[0]);
    let dauer = $state(session.dauer);
    let rpe = $state(session.rpe);
    let notiz = $state(session.notiz ?? '');

    // Lauf-/Rad-spezifische Felder
    let distanz = $state(session.distanz ?? '');
    let avgHr = $state(session.avgHr ?? '');
    let hoehenmeter = $state(session.hoehenmeter ?? '');

    // UI-Klassifizierung
    let istLaufen = $derived(sport === 'Laufen');
    let istRad = $derived(sport === 'Rad');
    let zeigtLaufFelder = $derived(istLaufen || istRad);

    // Live-Pace im Edit-Modus (basierend auf editierbaren Werten)
    let editPace = $derived.by(() => paceProKm(Number(dauer), Number(distanz)));
    let editSpeed = $derived.by(() => geschwindigkeitKmh(Number(dauer), Number(distanz)));

    // Read-Modus: Pace aus gespeicherten Werten
    let sessionPace = $derived.by(() => paceProKm(session.dauer, session.distanz));
    let sessionSpeed = $derived.by(() => geschwindigkeitKmh(session.dauer, session.distanz));
    let hrZonenAnalyse = $derived.by(() => {
        const gespeichert = session.laufDaten?.hrZonen;
        if (gespeichert?.zonen?.length) return gespeichert;
        return berechneHrZonenAusPunkten(session.laufDaten?.verlauf ?? [], data.profil?.maxHr);
    });

    // Subtypen ableiten (Kraft hat aktive Split-Tage, andere Sportarten nur Standard)
    let verfuegbareSubtypen = $derived(
        sport ? subtypenFuer(sport, sport === 'Kraft' ? data.aktiveSplitTage : []) : []
    );

    let finalerSubtyp = $derived(customSubtyp.trim() || subtyp);

    const sportEmoji = {
        Kraft: '🏋️',
        Laufen: '🏃',
        Rad: '🚴',
        Schwimmen: '🏊'
    };

    const sportFarbe = {
        Kraft: 'var(--sport-kraft)',
        Laufen: 'var(--sport-laufen)',
        Rad: 'var(--sport-rad)',
        Schwimmen: 'var(--sport-schwimmen)'
    };

    function formatDatum(iso) {
        return new Date(iso).toLocaleDateString('de-CH', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    function formatPaceSekunden(sekunden) {
        if (!Number.isFinite(sekunden) || sekunden <= 0) return '-';
        const minuten = Math.floor(sekunden / 60);
        const rest = Math.round(sekunden % 60).toString().padStart(2, '0');
        return `${minuten}:${rest}`;
    }

    function splitFazit(splits) {
        if (!splits || splits.length < 2) {
            return { titel: 'Laufprofil', text: 'Mehr Splits machen die Analyse aussagekräftiger.' };
        }

        const erster = splits[0].dauerSek;
        const letzter = splits[splits.length - 1].dauerSek;
        const unterschied = erster - letzter;

        if (unterschied > 8) {
            return { titel: 'Negativer Split', text: `Du wurdest zum Ende ca. ${Math.round(unterschied)}s/km schneller.` };
        }
        if (unterschied < -8) {
            return { titel: 'Schneller Start', text: `Du bist ca. ${Math.abs(Math.round(unterschied))}s/km langsamer geworden.` };
        }
        return { titel: 'Konstanter Lauf', text: 'Deine Pace blieb über den Lauf hinweg stabil.' };
    }

    function bearbeitenAbbrechen() {
        sport = session.sport;
        datum = session.datum.split('T')[0];
        dauer = session.dauer;
        rpe = session.rpe;
        notiz = session.notiz ?? '';
        distanz = session.distanz ?? '';
        avgHr = session.avgHr ?? '';
        hoehenmeter = session.hoehenmeter ?? '';
        bearbeitenAktiv = false;
    }

    // Nach erfolgreichem Update: Edit-Modus verlassen, Daten neu laden, Toast zeigen
    $effect(() => {
        if (form?.success) {
            bearbeitenAktiv = false;
            invalidateAll();
            toast.zeigen('Änderungen gespeichert', 'erfolg');
        } else if (form?.error) {
            toast.zeigen(form.error, 'fehler');
        } else if (form?.uebungSuccess) {
            neueUebungAktiv = false;
            editUebungId = null;
            invalidateAll();
            toast.zeigen('Übung gespeichert', 'erfolg');
        } else if (form?.uebungError) {
            toast.zeigen(form.uebungError, 'fehler');
        }
    });
</script>

<div class="page" style="--card-farbe: {sportFarbe[session.sport]}">
    <header>
        <a href="/log" class="back" aria-label="Zurück">←</a>
        <h1>SESSION</h1>
    </header>

    {#if form?.error}
        <p class="error">{form.error}</p>
    {/if}

    {#if !bearbeitenAktiv}
        <!-- Read-Modus -->
        <section class="detail-card">
            <div class="card-glow"></div>
            <div class="sport-zeile">
                <span class="sport-icon">{sportEmoji[session.sport] ?? ''}</span>
                <div class="sport-text">
                    <span class="sport-name">{session.sport}</span>
                    {#if session.subtyp}
                        <span class="sport-subtyp">{session.subtyp}</span>
                    {/if}
                </div>
            </div>

            <div class="info-grid">
                <div class="info-zeile">
                    <span class="label">Datum</span>
                    <span class="wert">{formatDatum(session.datum)}</span>
                </div>
                <div class="info-zeile">
                    <span class="label">Dauer</span>
                    <span class="wert">{session.dauer} min</span>
                </div>
                <div class="info-zeile">
                    <span class="label">Intensität</span>
                    <span class="wert rpe-wert">RPE {session.rpe}/10</span>
                </div>

                {#if session.distanz}
                    <div class="info-zeile">
                        <span class="label">Distanz</span>
                        <span class="wert">{session.distanz} km</span>
                    </div>
                {/if}
                {#if sessionPace && istLaufen}
                    <div class="info-zeile">
                        <span class="label">Pace</span>
                        <span class="wert rpe-wert">{sessionPace.formatted} min/km</span>
                    </div>
                {/if}
                {#if sessionSpeed}
                    <div class="info-zeile">
                        <span class="label">{istLaufen ? 'Tempo' : 'Schnitt'}</span>
                        <span class="wert">{sessionSpeed} km/h</span>
                    </div>
                {/if}
                {#if session.avgHr}
                    <div class="info-zeile">
                        <span class="label">Ø Herzfrequenz</span>
                        <span class="wert">{session.avgHr} bpm</span>
                    </div>
                {/if}
                {#if session.maxHr}
                    <div class="info-zeile">
                        <span class="label">Max Herzfrequenz</span>
                        <span class="wert">{session.maxHr} bpm</span>
                    </div>
                {/if}
                {#if session.calories}
                    <div class="info-zeile">
                        <span class="label">Kalorien</span>
                        <span class="wert">{session.calories} kcal</span>
                    </div>
                {/if}
                {#if session.avgCadence}
                    <div class="info-zeile">
                        <span class="label">Ø Schrittfrequenz</span>
                        <span class="wert">{session.avgCadence} spm</span>
                    </div>
                {/if}
                {#if session.avgWatts}
                    <div class="info-zeile">
                        <span class="label">Ø Watts</span>
                        <span class="wert">{session.avgWatts} W</span>
                    </div>
                {/if}
                {#if session.hoehenmeter}
                    <div class="info-zeile">
                        <span class="label">Höhenmeter</span>
                        <span class="wert">{session.hoehenmeter} m ↗</span>
                    </div>
                {/if}

                {#if session.notiz}
                    <div class="info-zeile notiz-zeile">
                        <span class="label">Notiz</span>
                        <span class="wert notiz-text">{session.notiz}</span>
                    </div>
                {/if}
            </div>
        </section>

        <div class="aktionen">
            <button class="btn-edit" onclick={() => (bearbeitenAktiv = true)}>
                ✎ Bearbeiten
            </button>
            <button class="btn-delete" onclick={() => (loeschenBestaetigung = true)}>
                🗑 Löschen
            </button>
        </div>

        <!-- Lauf-Analyse-Sektion: Splits + Charts (nur bei vorhandenen laufDaten aus TCX-Import) -->
        {#if session.laufDaten && session.laufDaten.verlauf && session.laufDaten.verlauf.length > 0}
            {@const v = session.laufDaten.verlauf}
            {@const splits = session.laufDaten.splits}
            {@const chartB = 280}
            {@const chartH = 90}

            {#if splits && splits.length > 0}
                {@const besterSplit = splits.reduce((best, split) => split.dauerSek < best.dauerSek ? split : best, splits[0])}
                {@const fazit = splitFazit(splits)}
                <section class="lauf-analyse lauf-fazit">
                    <div class="la-header">
                        <h2>Lauf-Fazit</h2>
                        <span class="la-sub">aus Garmin-Daten</span>
                    </div>

                    <div class="fazit-grid">
                        <div class="fazit-item fazit-haupt">
                            <span class="fazit-label">{fazit.titel}</span>
                            <span class="fazit-text">{fazit.text}</span>
                        </div>
                        <div class="fazit-item">
                            <span class="fazit-label">Bester km</span>
                            <span class="fazit-wert">km {besterSplit.km} · {besterSplit.paceFormatted}</span>
                        </div>
                        {#if session.avgWatts}
                            <div class="fazit-item">
                                <span class="fazit-label">Ø Power</span>
                                <span class="fazit-wert">{session.avgWatts} W</span>
                            </div>
                        {/if}
                    </div>
                </section>
            {/if}

            <!-- Splits-Tabelle -->
            {#if splits && splits.length > 0}
                {@const langsamstePace = Math.max(...splits.map(s => s.dauerSek))}
                {@const schnellstePace = Math.min(...splits.map(s => s.dauerSek))}

                <section class="lauf-analyse">
                    <div class="la-header">
                        <h2>Splits</h2>
                        <span class="la-sub">{splits.length} km</span>
                    </div>

                    <div class="splits-tabelle">
                        {#each splits as split}
                            {@const pct = ((langsamstePace - split.dauerSek) / (langsamstePace - schnellstePace || 1)) * 100}
                            <div class="split-zeile">
                                <span class="split-km">km {split.km}</span>
                                <div class="split-balken-container">
                                    <div class="split-balken" style="width: {Math.max(15, pct)}%"></div>
                                </div>
                                <span class="split-pace">{split.paceFormatted}</span>
                                {#if split.avgHr}
                                    <span class="split-hr">{split.avgHr}♥</span>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </section>
            {/if}

            <!-- HR-Zonen -->
            {#if hrZonenAnalyse && hrZonenAnalyse.totalSekunden > 0}
                <section class="lauf-analyse hr-zonen-card">
                    <div class="la-header">
                        <h2>HR-Zonen</h2>
                        <span class="la-sub">Basis max. {hrZonenAnalyse.maxHr} bpm</span>
                    </div>

                    <div class="hr-zonen-liste">
                        {#each hrZonenAnalyse.zonen as zone}
                            <div class="hr-zone-zeile">
                                <div class="hr-zone-kopf">
                                    <div class="hr-zone-titel">
                                        <span class="hr-zone-badge" style="background: var({zone.cssVar});">Z{zone.zone}</span>
                                        <span class="hr-zone-name">{zone.name}</span>
                                    </div>
                                    <span class="hr-zone-zeit">{formatZonenZeit(zone.sekunden)}</span>
                                </div>
                                <div class="hr-zone-balken-bg">
                                    <div class="hr-zone-balken"
                                        style="width: {Math.max(zone.sekunden > 0 ? 4 : 0, zone.prozent)}%; background: var({zone.cssVar});">
                                    </div>
                                </div>
                                <div class="hr-zone-meta">
                                    <span>{zone.von > 0 ? `${zone.von}${zone.bis ? '-' + zone.bis : '+'}` : `bis ${zone.bis}`} bpm</span>
                                    <span>{zone.prozent}%</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </section>
            {/if}

            <!-- HR-Verlauf-Chart -->
            {@const hrDaten = v.filter(p => Number.isFinite(p.hr))}
            {#if hrDaten.length >= 2}
                {@const hrMin = Math.min(...hrDaten.map(p => p.hr))}
                {@const hrMax = Math.max(...hrDaten.map(p => p.hr))}
                {@const hrRange = hrMax - hrMin || 1}
                {@const hrPath = hrDaten.map((p, i) => {
                    const x = (i / (hrDaten.length - 1)) * chartB;
                    const y = chartH - ((p.hr - hrMin) / hrRange) * chartH;
                    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ')}

                <section class="lauf-analyse">
                    <div class="la-header">
                        <h2>Herzfrequenz</h2>
                        <span class="la-sub">Ø {session.avgHr ?? '-'} bpm · {hrMin}–{hrMax} bpm</span>
                    </div>

                    <svg viewBox="-10 -10 300 120" preserveAspectRatio="xMidYMid meet"
                        width="100%" class="lauf-chart">
                        <path d={`${hrPath} L ${chartB} ${chartH} L 0 ${chartH} Z`}
                            fill="var(--sport-kraft)" opacity="0.1" />
                        <path d={hrPath}
                            fill="none" stroke="var(--sport-kraft)"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </section>
            {/if}

            <!-- Pace-Verlauf-Chart (invertiert: schneller = höher) -->
            {@const paceDaten = v.filter(p => Number.isFinite(p.pace) && p.pace > 0)}
            {#if paceDaten.length >= 2}
                {@const paceMin = Math.min(...paceDaten.map(p => p.pace))}
                {@const paceMax = Math.max(...paceDaten.map(p => p.pace))}
                {@const paceRange = paceMax - paceMin || 1}
                {@const pacePath = paceDaten.map((p, i) => {
                    const x = (i / (paceDaten.length - 1)) * chartB;
                    // Invertiert: höhere Pace (langsam) = oben, niedrige Pace (schnell) = unten
                    const y = ((p.pace - paceMin) / paceRange) * chartH;
                    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ')}

                <section class="lauf-analyse">
                    <div class="la-header">
                        <h2>Pace-Verlauf</h2>
                        <span class="la-sub">{formatPaceSekunden(paceMin)}–{formatPaceSekunden(paceMax)} min/km · oben = schneller</span>
                    </div>

                    <svg viewBox="-10 -10 300 120" preserveAspectRatio="xMidYMid meet"
                        width="100%" class="lauf-chart">
                        <path d={`${pacePath} L ${chartB} ${chartH} L 0 ${chartH} Z`}
                            fill="var(--accent)" opacity="0.1" />
                        <path d={pacePath}
                            fill="none" stroke="var(--accent)"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </section>
            {/if}

            <!-- Höhenprofil -->
            {@const hoeheDaten = v.filter(p => Number.isFinite(p.hoehe))}
            {#if hoeheDaten.length >= 2}
                {@const hMin = Math.min(...hoeheDaten.map(p => p.hoehe))}
                {@const hMax = Math.max(...hoeheDaten.map(p => p.hoehe))}
                {@const hRange = hMax - hMin || 1}
                {@const hPath = hoeheDaten.map((p, i) => {
                    const x = (i / (hoeheDaten.length - 1)) * chartB;
                    const y = chartH - ((p.hoehe - hMin) / hRange) * chartH;
                    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ')}

                <section class="lauf-analyse">
                    <div class="la-header">
                        <h2>Höhenprofil</h2>
                        <span class="la-sub">{Math.round(hMin)}–{Math.round(hMax)} m</span>
                    </div>

                    <svg viewBox="-10 -10 300 120" preserveAspectRatio="xMidYMid meet"
                        width="100%" class="lauf-chart">
                        <path d={`${hPath} L ${chartB} ${chartH} L 0 ${chartH} Z`}
                            fill="var(--sport-rad)" opacity="0.18" />
                        <path d={hPath}
                            fill="none" stroke="var(--sport-rad)"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </section>
            {/if}
        {/if}

        <!-- Übungen-Sektion: nur bei Kraft -->
        {#if session.sport === 'Kraft'}
            <section class="uebungen-section">
                <div class="uebungen-header">
                    <div class="uebungen-titel">
                        <h2>Übungen</h2>
                        {#if uebungen.length > 0}
                            <span class="uebungen-anzahl">{uebungen.length}</span>
                        {/if}
                    </div>
                    {#if uebungen.length > 0}
                        <span class="uebungen-sub">tippe für Details</span>
                    {/if}
                </div>

                {#if uebungen.length === 0 && !neueUebungAktiv}
                    <div class="uebungen-empty">
                        <p>Noch keine Übungen erfasst</p>
                        <button class="btn-add-uebung" onclick={() => (neueUebungAktiv = true)}>
                            + Erste Übung hinzufügen
                        </button>
                    </div>
                {:else}
                    <div class="uebungen-liste">
                        {#each uebungen as uebung (uebung._id)}
                            {#if editUebungId === uebung._id}
                                <!-- Edit-Form für diese Übung -->
                                <form method="POST" action="?/uebungAktualisieren"
                                    use:enhance class="uebung-form">
                                    <input type="hidden" name="uebungId" value={uebung._id} />
                                    <input type="text" name="name" value={uebung.name}
                                        placeholder="Übungsname" required class="uebung-name-input"
                                        list="uebungs-vorschlaege" />
                                    <div class="uebung-werte">
                                        <div class="wert-feld">
                                            <input type="number" name="saetze" value={uebung.saetze}
                                                min="1" max="20" required />
                                            <span class="wert-label">Sätze</span>
                                        </div>
                                        <div class="wert-feld">
                                            <input type="number" name="wiederholungen"
                                                value={uebung.wiederholungen}
                                                min="1" max="100" required />
                                            <span class="wert-label">Wdh.</span>
                                        </div>
                                        <div class="wert-feld">
                                            <input type="number" name="gewicht" value={uebung.gewicht}
                                                min="0" max="1000" step="0.5" required />
                                            <span class="wert-label">kg</span>
                                        </div>
                                    </div>
                                    <input type="text" name="notiz" value={uebung.notiz}
                                        placeholder="Notiz (optional)" class="uebung-notiz-input" />
                                    <div class="uebung-form-aktionen">
                                        <button type="submit" class="btn-uebung-save">Speichern</button>
                                        <button type="button" class="btn-uebung-cancel"
                                            onclick={() => (editUebungId = null)}>Abbrechen</button>
                                        <button type="button" class="btn-uebung-delete"
                                            onclick={() => (uebungLoeschId = uebung._id)}>🗑</button>
                                    </div>
                                </form>
                            {:else}
                                <!-- Read-Anzeige der Übung -->
                                <button type="button" class="uebung-card"
                                    onclick={() => (editUebungId = uebung._id)}>
                                    <div class="uebung-zeile">
                                        <span class="uebung-name">{uebung.name}</span>
                                        {#if uebung.vergleich}
                                            {@const diff = uebung.vergleich.differenz}
                                            <span class="vergleich"
                                                class:plus={diff > 0}
                                                class:minus={diff < 0}>
                                                {#if diff > 0}+{diff}kg{:else if diff < 0}{diff}kg{:else}=={/if}
                                            </span>
                                        {/if}
                                    </div>
                                    <div class="uebung-werte-readonly">
                                        <span class="werte-text">
                                            {uebung.saetze} × {uebung.wiederholungen} @ <strong>{uebung.gewicht} kg</strong>
                                        </span>
                                        {#if uebung.vergleich}
                                            <span class="letzte">letztes Mal: {uebung.vergleich.saetze}×{uebung.vergleich.wiederholungen} @ {uebung.vergleich.gewicht}kg</span>
                                        {/if}
                                    </div>
                                    {#if uebung.notiz}
                                        <p class="uebung-notiz">{uebung.notiz}</p>
                                    {/if}
                                </button>
                            {/if}
                        {/each}
                    </div>

                    {#if !neueUebungAktiv}
                        <button class="btn-add-uebung" onclick={() => (neueUebungAktiv = true)}>
                            + Übung hinzufügen
                        </button>
                    {/if}
                {/if}

                <!-- Form für neue Übung mit Custom-Combobox -->
                {#if neueUebungAktiv}
                    <form method="POST" action="?/uebungHinzufuegen"
                        use:enhance={() => {
                            return async ({ update }) => {
                                await update();
                                neuName = '';
                                neuDropdownOffen = false;
                            };
                        }}
                        class="uebung-form neue">

                        <!-- Combobox: Suche + gruppiertes Dropdown -->
                        <div class="ue-combobox-detail">
                            <input type="text" name="name" required
                                class="uebung-name-input"
                                placeholder="Übung suchen oder eingeben..."
                                bind:value={neuName}
                                onfocus={() => (neuDropdownOffen = true)}
                                autocomplete="off" />

                            {#if neuDropdownOffen}
                                <div class="ue-dropdown-detail">
                                    <!-- Toggle: passend zum Session-Subtyp ODER alle -->
                                    {#if sessionSubtyp && SUBTYP_GRUPPEN[sessionSubtyp]}
                                        <div class="ue-toggle-zeile">
                                            <span class="ue-toggle-info">
                                                {neuAlleZeigen ? 'Alle Übungen' : `Passend zu ${sessionSubtyp}`}
                                            </span>
                                            <button type="button"
                                                class="ue-toggle-btn"
                                                onclick={() => (neuAlleZeigen = !neuAlleZeigen)}>
                                                {neuAlleZeigen ? 'nur passende' : 'alle anzeigen'}
                                            </button>
                                        </div>
                                    {/if}

                                    {#each Object.entries(gefiltert) as [gruppe, namen]}
                                        <div class="ue-gruppe-header">{gruppe}</div>
                                        {#each namen as n}
                                            <button type="button"
                                                class="ue-vorschlag"
                                                onclick={() => {
                                                    neuName = n;
                                                    neuDropdownOffen = false;
                                                }}>
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

                        <div class="uebung-werte">
                            <div class="wert-feld">
                                <input type="number" name="saetze" min="1" max="20"
                                    placeholder="4" required />
                                <span class="wert-label">Sätze</span>
                            </div>
                            <div class="wert-feld">
                                <input type="number" name="wiederholungen" min="1" max="100"
                                    placeholder="8" required />
                                <span class="wert-label">Wdh.</span>
                            </div>
                            <div class="wert-feld">
                                <input type="number" name="gewicht" min="0" max="1000" step="0.5"
                                    placeholder="80" required />
                                <span class="wert-label">kg</span>
                            </div>
                        </div>
                        <input type="text" name="notiz" placeholder="Notiz (optional)"
                            class="uebung-notiz-input" />
                        <div class="uebung-form-aktionen">
                            <button type="submit" class="btn-uebung-save">Hinzufügen</button>
                            <button type="button" class="btn-uebung-cancel"
                                onclick={() => {
                                    neueUebungAktiv = false;
                                    neuName = '';
                                    neuDropdownOffen = false;
                                }}>Abbrechen</button>
                        </div>
                    </form>
                {/if}

                <!-- Datalist für Auto-Complete -->
                <datalist id="uebungs-vorschlaege">
                    {#each data.uebungsVorschlaege as v}
                        <option value={v}></option>
                    {/each}
                </datalist>
            </section>
        {/if}
    {:else}
        <!-- Edit-Modus -->
        <form method="POST" action="?/update" use:enhance>
            <label class="field-label">Sportart</label>
            <div class="sport-grid">
                {#each ['Kraft', 'Laufen', 'Rad', 'Schwimmen'] as s}
                    <label class="sport-btn" class:gewaehlt={sport === s}>
                        <input type="radio" name="sport" value={s} bind:group={sport} required />
                        <span class="sport-icon-sm">{sportEmoji[s]}</span>
                        <span>{s}</span>
                    </label>
                {/each}
            </div>

            <!-- Subtyp-Auswahl im Edit-Modus -->
            {#if verfuegbareSubtypen.length > 0}
                <label class="field-label">Subtyp <span class="optional">(optional)</span></label>
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
                <input type="hidden" name="subtyp" value={finalerSubtyp} />
            {/if}

            <label for="datum" class="field-label">Datum</label>
            <input type="date" id="datum" name="datum" bind:value={datum}
                max={new Date().toISOString().split('T')[0]} required />

            <label for="dauer" class="field-label">Dauer (Minuten)</label>
            <input type="number" id="dauer" name="dauer" min="1" max="600"
                bind:value={dauer} required />

            <!-- Lauf-/Rad-spezifische Felder im Edit-Modus -->
            {#if zeigtLaufFelder}
                <div class="lauf-edit-grid">
                    <div class="lauf-edit-feld">
                        <input type="number" name="distanz" min="0" max="500" step="0.01"
                            placeholder="0.00" bind:value={distanz} />
                        <span class="lauf-edit-label">Distanz (km)</span>
                    </div>
                    <div class="lauf-edit-feld">
                        <input type="number" name="avgHr" min="30" max="250"
                            placeholder="—" bind:value={avgHr} />
                        <span class="lauf-edit-label">Ø HR (bpm)</span>
                    </div>
                    {#if istLaufen}
                        <div class="lauf-edit-feld">
                            <input type="number" name="hoehenmeter" min="0" max="10000"
                                placeholder="—" bind:value={hoehenmeter} />
                            <span class="lauf-edit-label">Höhenmeter</span>
                        </div>
                    {/if}
                </div>
                {#if editPace || editSpeed}
                    <div class="lauf-edit-vorschau">
                        {#if istLaufen && editPace}
                            <span><strong>{editPace.formatted}</strong> min/km</span>
                        {/if}
                        {#if editSpeed}
                            <span><strong>{editSpeed}</strong> km/h</span>
                        {/if}
                    </div>
                {/if}
            {/if}

            <label for="rpe" class="field-label">
                Intensität <span class="rpe-anzeige">RPE {rpe}/10</span>
            </label>
            <input type="range" id="rpe" name="rpe" min="1" max="10" bind:value={rpe} />

            <label for="notiz" class="field-label">Notiz <span class="optional">(optional)</span></label>
            <textarea id="notiz" name="notiz" bind:value={notiz}
                placeholder="Wie war das Training?"></textarea>

            <div class="form-aktionen">
                <button type="submit" class="btn-save">Speichern</button>
                <button type="button" class="btn-cancel" onclick={bearbeitenAbbrechen}>
                    Abbrechen
                </button>
            </div>
        </form>
    {/if}
</div>

<!-- Lösch-Bestätigung -->
{#if loeschenBestaetigung}
    <div class="dialog-backdrop" onclick={() => (loeschenBestaetigung = false)}
        role="presentation">
        <div class="dialog" onclick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <h2 id="dialog-title">Session löschen?</h2>
            <p>Diese Aktion kann nicht rückgängig gemacht werden. Alle Übungen werden ebenfalls gelöscht.</p>
            <div class="dialog-aktionen">
                <button class="btn-cancel-dialog" onclick={() => (loeschenBestaetigung = false)}>
                    Abbrechen
                </button>
                <form method="POST" action="?/delete" use:enhance>
                    <button type="submit" class="btn-delete-confirm">Löschen</button>
                </form>
            </div>
        </div>
    </div>
{/if}

<!-- Übung-Lösch-Bestätigung -->
{#if uebungLoeschId}
    <div class="dialog-backdrop" onclick={() => (uebungLoeschId = null)}
        role="presentation">
        <div class="dialog" onclick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-labelledby="dialog-uebung-title">
            <h2 id="dialog-uebung-title">Übung löschen?</h2>
            <p>Diese Übung wird aus der Session entfernt.</p>
            <div class="dialog-aktionen">
                <button class="btn-cancel-dialog" onclick={() => (uebungLoeschId = null)}>
                    Abbrechen
                </button>
                <form method="POST" action="?/uebungLoeschen" use:enhance={() => {
                    return async ({ update }) => {
                        await update();
                        uebungLoeschId = null;
                        editUebungId = null;
                    };
                }}>
                    <input type="hidden" name="uebungId" value={uebungLoeschId} />
                    <button type="submit" class="btn-delete-confirm">Löschen</button>
                </form>
            </div>
        </div>
    </div>
{/if}

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

    /* Detail Card */
    .detail-card {
        position: relative;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: 1.5rem;
        margin-bottom: 1.25rem;
        overflow: hidden;
    }

    .card-glow {
        position: absolute;
        top: -40%;
        right: -30%;
        width: 280px;
        height: 280px;
        background: radial-gradient(circle, var(--card-farbe) 0%, transparent 65%);
        opacity: 0.2;
        pointer-events: none;
    }

    .sport-zeile {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.85rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1.1rem;
        border-bottom: 1px solid var(--border);
    }

    .sport-icon {
        font-size: 2.2rem;
    }

    .sport-text {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .sport-name {
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--text-primary);
        line-height: 1.1;
    }

    .sport-subtyp {
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    .info-grid {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .info-zeile {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }

    .notiz-zeile {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .label {
        color: var(--text-tertiary);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
    }

    .wert {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .rpe-wert {
        color: var(--accent);
    }

    .notiz-text {
        font-weight: 400;
        line-height: 1.55;
        color: var(--text-secondary);
        white-space: pre-wrap;
    }

    /* Aktionen */
    .aktionen {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .btn-edit, .btn-delete {
        padding: 0.95rem;
        border-radius: 12px;
        border: 1px solid var(--border);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        font-family: inherit;
    }

    .btn-edit {
        background: var(--bg-card);
        color: var(--text-primary);
    }

    .btn-edit:hover {
        background: var(--bg-elevated);
        border-color: var(--accent);
        box-shadow: 0 0 0 1px var(--accent);
    }

    .btn-delete {
        background: transparent;
        color: var(--sport-kraft);
        border-color: rgba(239, 68, 68, 0.3);
    }

    .btn-delete:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: var(--sport-kraft);
    }

    /* Form Edit */
    form {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
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

    .rpe-anzeige {
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
        margin: 0.5rem 0;
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

    /* Übungen-Sektion */
    .uebungen-section {
        margin-top: 2.25rem;
    }

    .uebungen-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.6rem;
        margin-bottom: 0.95rem;
    }

    .uebungen-titel {
        display: flex;
        align-items: baseline;
        gap: 0.6rem;
    }

    .uebungen-header h2 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        letter-spacing: -0.015em;
        color: var(--text-primary);
    }

    .uebungen-sub {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        font-weight: 500;
    }

    .uebungen-anzahl {
        background: rgba(132, 204, 22, 0.12);
        color: var(--accent);
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 700;
    }

    .uebungen-empty {
        background: var(--bg-card);
        border: 1px dashed var(--border);
        border-radius: 14px;
        padding: 1.5rem 1rem;
        text-align: center;
    }

    .uebungen-empty p {
        margin: 0 0 0.85rem;
        color: var(--text-tertiary);
        font-size: 0.9rem;
    }

    .uebungen-liste {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        margin-bottom: 0.7rem;
    }

    /* Übungs-Card (Read-Modus) */
    .uebung-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 0.85rem 1rem;
        text-align: left;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
    }

    .uebung-card:hover {
        background: var(--bg-elevated);
        border-color: var(--border-strong);
    }

    .uebung-zeile {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.3rem;
    }

    .uebung-name {
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--text-primary);
    }

    .vergleich {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
    }

    .vergleich.plus {
        background: rgba(132, 204, 22, 0.15);
        color: var(--accent);
    }

    .vergleich.minus {
        background: rgba(239, 68, 68, 0.15);
        color: var(--sport-kraft);
    }

    .vergleich:not(.plus):not(.minus) {
        background: rgba(139, 148, 158, 0.15);
        color: var(--text-tertiary);
    }

    .uebung-werte-readonly {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .werte-text {
        font-size: 0.88rem;
        color: var(--text-secondary);
    }

    .werte-text strong {
        color: var(--text-primary);
        font-weight: 700;
    }

    .letzte {
        font-size: 0.72rem;
        color: var(--text-tertiary);
    }

    .uebung-notiz {
        margin: 0.4rem 0 0;
        font-size: 0.78rem;
        color: var(--text-tertiary);
        font-style: italic;
    }

    /* Übungs-Form (Add/Edit) */
    .uebung-form {
        background: var(--bg-card);
        border: 1px solid var(--accent);
        border-radius: 12px;
        padding: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        box-shadow: 0 0 16px var(--accent-glow);
    }

    .uebung-form.neue {
        margin-top: 0.5rem;
    }

    .uebung-name-input {
        padding: 0.6rem 0.75rem;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.95rem;
        color: var(--text-primary);
        font-family: inherit;
        font-weight: 600;
    }

    .uebung-name-input:focus {
        outline: none;
        border-color: var(--accent);
    }

    .uebung-werte {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.5rem;
    }

    .wert-feld {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .wert-feld input {
        padding: 0.55rem 0.5rem;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.95rem;
        color: var(--text-primary);
        text-align: center;
        font-family: inherit;
        font-weight: 600;
    }

    .wert-feld input:focus {
        outline: none;
        border-color: var(--accent);
    }

    .wert-label {
        font-size: 0.7rem;
        color: var(--text-tertiary);
        text-align: center;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.06em;
    }

    .uebung-notiz-input {
        padding: 0.5rem 0.7rem;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.85rem;
        color: var(--text-primary);
        font-family: inherit;
    }

    .uebung-notiz-input:focus {
        outline: none;
        border-color: var(--accent);
    }

    .uebung-form-aktionen {
        display: flex;
        gap: 0.4rem;
        margin-top: 0.2rem;
    }

    .btn-uebung-save {
        flex: 1;
        background: var(--cta-bg);
        color: var(--cta-color);
        padding: 0.65rem;
        border: none;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.15s;
    }

    .btn-uebung-save:hover {
        background: var(--cta-bg-hover);
    }

    .btn-uebung-cancel {
        flex: 1;
        background: var(--bg-elevated);
        color: var(--text-secondary);
        padding: 0.6rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
    }

    .btn-uebung-delete {
        background: transparent;
        color: var(--sport-kraft);
        padding: 0.6rem 0.8rem;
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        font-size: 0.9rem;
        cursor: pointer;
        font-family: inherit;
    }

    .btn-uebung-delete:hover {
        background: rgba(239, 68, 68, 0.1);
    }

    /* Combobox in Detail-Page für neue Übung */
    .ue-combobox-detail {
        position: relative;
    }

    .ue-dropdown-detail {
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

    .btn-add-uebung {
        width: 100%;
        background: transparent;
        color: var(--text-secondary);
        padding: 0.75rem;
        border: 1px dashed var(--border);
        border-radius: 10px;
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
    }

    .btn-add-uebung:hover {
        background: var(--bg-card);
        color: var(--accent);
        border-color: var(--accent);
    }

    /* ─── Lauf-Analyse: Splits + Charts ─── */
    .lauf-analyse {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 1.1rem;
        margin-top: 1rem;
    }

    .la-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.85rem;
    }

    .la-header h2 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        letter-spacing: -0.015em;
        color: var(--text-primary);
    }

    .la-sub {
        font-size: 0.72rem;
        color: var(--text-tertiary);
        font-weight: 500;
        text-align: right;
    }

    .lauf-fazit {
        border-color: rgba(132, 204, 22, 0.28);
        box-shadow: 0 0 22px rgba(132, 204, 22, 0.08);
    }

    .fazit-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.65rem;
    }

    .fazit-item {
        background: var(--bg-input);
        border: 1px solid rgba(240, 246, 252, 0.06);
        border-radius: var(--radius-sm);
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .fazit-haupt {
        grid-column: 1 / -1;
    }

    .fazit-label {
        color: var(--accent);
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }

    .fazit-text {
        color: var(--text-secondary);
        font-size: 0.86rem;
        line-height: 1.45;
    }

    .fazit-wert {
        color: var(--text-primary);
        font-size: 0.95rem;
        font-weight: 800;
    }

    /* Splits-Tabelle: jede km eine Zeile mit Balken */
    .splits-tabelle {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .split-zeile {
        display: grid;
        grid-template-columns: 50px 1fr 70px 50px;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
    }

    .split-km {
        font-weight: 700;
        color: var(--text-tertiary);
        font-size: 0.78rem;
    }

    .split-balken-container {
        background: var(--bg-input);
        border-radius: 999px;
        height: 8px;
        overflow: hidden;
    }

    .split-balken {
        background: linear-gradient(90deg, var(--accent), var(--accent-hover));
        height: 100%;
        border-radius: 999px;
        box-shadow: 0 0 8px var(--accent-glow);
        transition: width 0.3s ease-out;
    }

    .split-pace {
        font-weight: 700;
        color: var(--text-primary);
        text-align: right;
    }

    .split-hr {
        font-size: 0.78rem;
        color: var(--sport-kraft);
        font-weight: 600;
        text-align: right;
    }

    .hr-zonen-card {
        border-color: rgba(239, 68, 68, 0.22);
    }

    .hr-zonen-liste {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .hr-zone-zeile {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .hr-zone-kopf,
    .hr-zone-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
    }

    .hr-zone-titel {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
    }

    .hr-zone-badge {
        color: var(--bg-primary);
        border-radius: 999px;
        padding: 0.15rem 0.45rem;
        font-size: 0.7rem;
        font-weight: 900;
    }

    .hr-zone-name {
        color: var(--text-primary);
        font-size: 0.86rem;
        font-weight: 700;
    }

    .hr-zone-zeit {
        color: var(--text-primary);
        font-size: 0.86rem;
        font-weight: 800;
        white-space: nowrap;
    }

    .hr-zone-balken-bg {
        height: 9px;
        background: var(--bg-input);
        border-radius: 999px;
        overflow: hidden;
    }

    .hr-zone-balken {
        height: 100%;
        border-radius: 999px;
        box-shadow: 0 0 10px currentColor;
        transition: width 0.25s ease-out;
    }

    .hr-zone-meta {
        color: var(--text-tertiary);
        font-size: 0.72rem;
        font-weight: 600;
    }

    .lauf-chart {
        display: block;
    }

    /* ─── Lauf-/Rad-Edit-Felder ─── */
    .lauf-edit-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.45rem;
        margin-top: 0.45rem;
    }

    .lauf-edit-grid:has(.lauf-edit-feld:nth-child(2):last-child) {
        grid-template-columns: 1fr 1fr;
    }

    .lauf-edit-feld {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .lauf-edit-feld input {
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

    .lauf-edit-feld input:focus {
        outline: none;
        border-color: var(--accent);
    }

    .lauf-edit-label {
        font-size: 0.65rem;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-tertiary);
        font-weight: 600;
    }

    .lauf-edit-vorschau {
        display: flex;
        gap: 1.25rem;
        padding: 0.6rem 0.85rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-top: 0.5rem;
    }

    .lauf-edit-vorschau strong {
        color: var(--accent);
        font-weight: 800;
    }

    /* Subtyp-Pills im Edit */
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

    .sport-icon-sm {
        font-size: 1.2rem;
    }

    /* Form Aktionen */
    .form-aktionen {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 1.5rem;
    }

    .btn-save, .btn-cancel {
        padding: 0.95rem;
        border-radius: 12px;
        border: 1px solid var(--border);
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
    }

    .btn-save {
        background: var(--cta-bg);
        color: var(--cta-color);
        border-color: var(--cta-bg);
    }

    .btn-save:hover {
        background: var(--cta-bg-hover);
        transform: translateY(-1px);
    }

    .btn-cancel {
        background: var(--bg-card);
        color: var(--text-secondary);
        font-weight: 600;
    }

    .btn-cancel:hover {
        background: var(--bg-elevated);
        color: var(--text-primary);
    }

    /* Dialog */
    .dialog-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        padding: 1rem;
    }

    .dialog {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 1.5rem;
        max-width: 360px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    .dialog h2 {
        margin: 0 0 0.5rem;
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .dialog p {
        margin: 0 0 1.4rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.5;
    }

    .dialog-aktionen {
        display: flex;
        gap: 0.6rem;
        justify-content: flex-end;
    }

    .btn-cancel-dialog {
        padding: 0.7rem 1.1rem;
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border);
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
    }

    .btn-cancel-dialog:hover {
        background: var(--bg-elevated);
        color: var(--text-primary);
    }

    .dialog-aktionen form { display: contents; }

    .btn-delete-confirm {
        padding: 0.7rem 1.1rem;
        background: var(--sport-kraft);
        color: #fff;
        border: none;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: transform 0.15s;
        box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
    }

    .btn-delete-confirm:hover {
        transform: translateY(-1px);
    }
</style>
