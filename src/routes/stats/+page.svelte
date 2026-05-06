<script>
    let { data } = $props();
    const { totals, wochenLoad, sportVerteilung, recordsProSport, uebungsFortschritt, heatmapTage } = data;

    function formatKurzes(iso) {
        return new Date(iso).toLocaleDateString('de-CH', {
            day: 'numeric', month: 'short', year: '2-digit'
        });
    }

    // Sport-Filter im Fortschritt-Tab — Default ist Kraft, weil dort Übungs-Daten existieren
    let sportFilter = $state('Kraft');
    const SPORTARTEN_FORTSCHRITT = [
        { id: 'Kraft', label: 'Kraft', verfuegbar: true },
        { id: 'Laufen', label: 'Laufen', verfuegbar: false },
        { id: 'Rad', label: 'Rad', verfuegbar: false },
        { id: 'Schwimmen', label: 'Schwimmen', verfuegbar: false }
    ];

    // Aktuell ausgewählte Übung für Chart-Expand (null = keine offen)
    let offeneUebung = $state(null);

    /** Berechnet SVG-Path-String für eine Linien-Visualisierung der Einträge */
    function chartPath(eintraege, breite, hoehe) {
        if (eintraege.length === 0) return '';
        const min = Math.min(...eintraege.map(e => e.gewicht));
        const max = Math.max(...eintraege.map(e => e.gewicht));
        const range = max - min || 1; // Vermeidet Division durch 0

        const xStep = eintraege.length === 1 ? breite / 2 : breite / (eintraege.length - 1);
        return eintraege.map((e, i) => {
            const x = eintraege.length === 1 ? breite / 2 : i * xStep;
            const y = hoehe - ((e.gewicht - min) / range) * hoehe;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');
    }

    /** Berechnet Punkt-Positionen für SVG-Punkte */
    function chartPunkte(eintraege, breite, hoehe) {
        if (eintraege.length === 0) return [];
        const min = Math.min(...eintraege.map(e => e.gewicht));
        const max = Math.max(...eintraege.map(e => e.gewicht));
        const range = max - min || 1;
        const xStep = eintraege.length === 1 ? breite / 2 : breite / (eintraege.length - 1);

        return eintraege.map((e, i) => ({
            x: eintraege.length === 1 ? breite / 2 : i * xStep,
            y: hoehe - ((e.gewicht - min) / range) * hoehe,
            ...e
        }));
    }

    /**
     * Sparkline-Daten: kompakte Linie für die Übersichts-Liste.
     * Liefert null bei keinen Einträgen, sonst { path, einzelpunkt? }.
     */
    function sparklineDaten(eintraege, breite, hoehe) {
        if (eintraege.length === 0) return null;
        if (eintraege.length === 1) {
            return { einzelpunkt: { x: breite / 2, y: hoehe / 2 } };
        }

        const min = Math.min(...eintraege.map(e => e.gewicht));
        const max = Math.max(...eintraege.map(e => e.gewicht));
        const range = max - min || 1;
        const xStep = breite / (eintraege.length - 1);

        const path = eintraege.map((e, i) => {
            const x = i * xStep;
            const y = hoehe - ((e.gewicht - min) / range) * (hoehe - 4) - 2; // 2px padding oben/unten
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');

        return { path };
    }

    /** Heatmap: gruppiere die 90 Tage in Spalten zu je 7 Tagen (Wochen) */
    function gruppiereInWochen(tage) {
        if (tage.length === 0) return [];

        // Erste Woche evtl. mit leeren Slots auffüllen, damit Montag oben startet
        // Mongo-Wochentag: 0=So, 1=Mo ... ich mappe so dass Montag oben ist
        const wochen = [];
        let aktuelleWoche = new Array(7).fill(null);
        let positionInWoche;

        tage.forEach((tag, idx) => {
            // Mappe Wochentag: Mo=0, Di=1 ... So=6
            const woTagIndex = (tag.wochentag + 6) % 7;

            if (idx === 0) {
                // Initiale Slots vor dem ersten Tag leer lassen
                positionInWoche = woTagIndex;
            }
            aktuelleWoche[woTagIndex] = tag;
            positionInWoche = woTagIndex;

            // Sonntag erreicht → Woche abschliessen
            if (woTagIndex === 6) {
                wochen.push(aktuelleWoche);
                aktuelleWoche = new Array(7).fill(null);
            }
        });

        // Letzte unvollständige Woche
        if (aktuelleWoche.some(t => t !== null)) {
            wochen.push(aktuelleWoche);
        }

        return wochen;
    }

    const heatmapWochen = gruppiereInWochen(heatmapTage);
    const maxLoadHeatmap = Math.max(...heatmapTage.map(t => t.load), 1);

    /** Berechnet die Intensität (0-4) für die Farbgebung */
    function intensitaet(load) {
        if (load === 0) return 0;
        const ratio = load / maxLoadHeatmap;
        if (ratio < 0.25) return 1;
        if (ratio < 0.5) return 2;
        if (ratio < 0.75) return 3;
        return 4;
    }

    function tagTitel(tag) {
        if (!tag) return '';
        const datum = new Date(tag.datum).toLocaleDateString('de-CH', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
        return tag.sessions === 0
            ? `${datum} — kein Training`
            : `${datum} — ${tag.sessions} Session${tag.sessions === 1 ? '' : 's'}, Load ${tag.load}`;
    }

    const wochentageLabels = ['Mo', '', 'Mi', '', 'Fr', '', ''];

    const sportEmoji = {
        Kraft: '🏋️',
        Laufen: '🏃',
        Rad: '🚴',
        Schwimmen: '🏊'
    };

    const sportFarbe = {
        Kraft: '#ef4444',
        Laufen: '#84cc16',
        Rad: '#06b6d4',
        Schwimmen: '#3b82f6'
    };

    // Maximaler Load über alle Wochen (für Bar-Chart Skalierung)
    const maxLoad = Math.max(...wochenLoad.map(w => w.load), 1);

    // Total-Minuten für Sport-Prozentanteile
    const totalSportMinuten = sportVerteilung.reduce((sum, s) => sum + s.minuten, 0);

    // SVG Chart-Dimensionen
    const chartWidth = 320;
    const chartHeight = 140;
    const barGap = 8;
    const barWidth = (chartWidth - barGap * (wochenLoad.length - 1)) / wochenLoad.length;

    function balkenHoehe(load) {
        return load === 0 ? 4 : Math.max(6, (load / maxLoad) * chartHeight);
    }

    // Tab-State: drei Tabs auf der Stats-Page (Übersicht, Aktivität, Records)
    let aktiverTab = $state('uebersicht');
</script>

<div class="page">
    <header>
        <h1>STATISTIKEN</h1>
        <p class="sub">Dein Trainingsfortschritt im Überblick</p>
    </header>

    {#if totals.sessions === 0}
        <div class="empty">
            <span class="empty-icon">📊</span>
            <p class="title">Noch keine Daten</p>
            <p class="desc">Logge deine erste Session, dann siehst du hier deine Statistiken.</p>
            <a href="/log/new" class="empty-btn">+ Session loggen</a>
        </div>
    {:else}
        <!-- Tab-Header mit Underline-Indikator (MCI-Style) -->
        <div class="tabs" role="tablist">
            <button class="tab" class:aktiv={aktiverTab === 'uebersicht'}
                role="tab" aria-selected={aktiverTab === 'uebersicht'}
                onclick={() => (aktiverTab = 'uebersicht')}>Übersicht</button>
            <button class="tab" class:aktiv={aktiverTab === 'aktivitaet'}
                role="tab" aria-selected={aktiverTab === 'aktivitaet'}
                onclick={() => (aktiverTab = 'aktivitaet')}>Aktivität</button>
            <button class="tab" class:aktiv={aktiverTab === 'fortschritt'}
                role="tab" aria-selected={aktiverTab === 'fortschritt'}
                onclick={() => (aktiverTab = 'fortschritt')}>Fortschritt</button>
        </div>

    {#if aktiverTab === 'uebersicht'}
        <!-- Total-Stats Hero -->
        <section class="total-stats">
            <div class="stat-card">
                <span class="stat-zahl">{totals.sessions}</span>
                <span class="stat-label">Sessions</span>
            </div>
            <div class="stat-card">
                <span class="stat-zahl">{totals.stunden}<span class="einheit">h</span></span>
                <span class="stat-label">Trainiert</span>
            </div>
            <div class="stat-card">
                <span class="stat-zahl">{totals.avgRpe}</span>
                <span class="stat-label">Ø RPE</span>
            </div>
        </section>

        <!-- Wochenload-Chart -->
        <section class="chart-section">
            <div class="section-header">
                <h2>Wochenload</h2>
                <span class="section-sub">letzte 8 Wochen</span>
            </div>

            <div class="chart-card">
                <svg viewBox="0 0 {chartWidth} {chartHeight + 24}"
                    width="100%" height="auto" preserveAspectRatio="xMidYMid meet">
                    <!-- Bars -->
                    {#each wochenLoad as woche, i}
                        {@const h = balkenHoehe(woche.load)}
                        {@const x = i * (barWidth + barGap)}
                        {@const y = chartHeight - h}
                        <!-- Glow-Effekt durch zweiten Balken mit blur -->
                        <rect x={x} y={y} width={barWidth} height={h}
                            rx="3" ry="3"
                            fill="var(--accent)"
                            opacity={woche.load === 0 ? 0.15 : 0.25}
                            filter="blur(6px)" />
                        <rect x={x} y={y} width={barWidth} height={h}
                            rx="3" ry="3"
                            fill="var(--accent)"
                            opacity={woche.load === 0 ? 0.3 : 1} />
                        <text x={x + barWidth / 2} y={chartHeight + 16}
                            text-anchor="middle"
                            font-size="9"
                            fill="var(--text-tertiary)"
                            font-weight="600">{woche.label}</text>
                    {/each}
                </svg>

                <div class="chart-legende">
                    <span>Load = Dauer × RPE pro Woche</span>
                </div>
            </div>
        </section>

        <!-- Sport-Verteilung (Teil von "Übersicht") -->
        <section class="chart-section">
            <div class="section-header">
                <h2>Sport-Verteilung</h2>
                <span class="section-sub">nach Trainingszeit</span>
            </div>

            <div class="chart-card">
                <!-- Stacked Bar -->
                <div class="stacked-bar">
                    {#each sportVerteilung as sport}
                        {@const prozent = (sport.minuten / totalSportMinuten) * 100}
                        <div class="bar-segment"
                            style="width: {prozent}%; background: {sportFarbe[sport.sport] ?? '#888'};"
                            title="{sport.sport}: {Math.round(prozent)}%">
                        </div>
                    {/each}
                </div>

                <!-- Legende -->
                <div class="sport-liste">
                    {#each sportVerteilung as sport}
                        {@const prozent = Math.round((sport.minuten / totalSportMinuten) * 100)}
                        {@const stunden = Math.round(sport.minuten / 60 * 10) / 10}
                        <div class="sport-item">
                            <span class="sport-dot" style="background: {sportFarbe[sport.sport] ?? '#888'};"></span>
                            <span class="sport-name">
                                {sportEmoji[sport.sport] ?? ''} {sport.sport}
                            </span>
                            <span class="sport-werte">
                                <span class="sport-prozent">{prozent}%</span>
                                <span class="sport-zeit">{stunden}h · {sport.sessions}x</span>
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
        </section>

    {:else if aktiverTab === 'aktivitaet'}

        <!-- Calendar-Heatmap -->
        <section class="chart-section">
            <div class="section-header">
                <h2>Aktivität</h2>
                <span class="section-sub">letzte 90 Tage</span>
            </div>

            <div class="chart-card">
                <div class="heatmap">
                    <div class="heatmap-tage-labels">
                        {#each wochentageLabels as wt}
                            <span class="hm-label">{wt}</span>
                        {/each}
                    </div>
                    <div class="heatmap-grid">
                        {#each heatmapWochen as woche}
                            <div class="hm-spalte">
                                {#each woche as tag}
                                    {#if tag}
                                        <div class="hm-zelle"
                                            data-intensitaet={intensitaet(tag.load)}
                                            title={tagTitel(tag)}>
                                        </div>
                                    {:else}
                                        <div class="hm-zelle leer"></div>
                                    {/if}
                                {/each}
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="heatmap-legende">
                    <span>Weniger</span>
                    <div class="hm-zelle hm-mini" data-intensitaet="0"></div>
                    <div class="hm-zelle hm-mini" data-intensitaet="1"></div>
                    <div class="hm-zelle hm-mini" data-intensitaet="2"></div>
                    <div class="hm-zelle hm-mini" data-intensitaet="3"></div>
                    <div class="hm-zelle hm-mini" data-intensitaet="4"></div>
                    <span>Mehr</span>
                </div>
            </div>
        </section>

    {:else if aktiverTab === 'fortschritt'}

        <!-- Sport-Filter Pills oben -->
        <div class="sport-filter" role="tablist" aria-label="Sportart">
            {#each SPORTARTEN_FORTSCHRITT as s}
                <button class="sf-pill"
                    class:aktiv={sportFilter === s.id}
                    class:disabled={!s.verfuegbar}
                    role="tab"
                    aria-selected={sportFilter === s.id}
                    onclick={() => s.verfuegbar && (sportFilter = s.id)}>
                    {s.label}
                    {#if !s.verfuegbar}<span class="bald">bald</span>{/if}
                </button>
            {/each}
        </div>

        <!-- Personal Records pro Sport -->
        {#if recordsProSport[sportFilter]}
            <section class="chart-section">
                <div class="section-header">
                    <h2>Personal Records</h2>
                    <span class="section-sub">{recordsProSport[sportFilter].sessionsAnzahl} {sportFilter}-Sessions</span>
                </div>

                <div class="records-grid">
                    <div class="record-card">
                        <span class="record-label">Längste Session</span>
                        <span class="record-wert">{recordsProSport[sportFilter].laengsteSession.dauer} min</span>
                        <span class="record-meta">{formatKurzes(recordsProSport[sportFilter].laengsteSession.datum)}</span>
                    </div>
                    <div class="record-card">
                        <span class="record-label">Höchstes RPE</span>
                        <span class="record-wert">{recordsProSport[sportFilter].hoechstesRpe.rpe}/10</span>
                        <span class="record-meta">{formatKurzes(recordsProSport[sportFilter].hoechstesRpe.datum)}</span>
                    </div>
                </div>
            </section>
        {/if}

        <!-- Übungs-Verlauf (nur bei Kraft) -->
        {#if sportFilter === 'Kraft'}
            <section class="chart-section">
                <div class="section-header">
                    <h2>Gewicht-Fortschritt</h2>
                    <span class="section-sub">tippe für Verlauf</span>
                </div>

                {#if uebungsFortschritt.length === 0}
                    <div class="chart-card empty-fortschritt">
                        <p>Noch keine Übungen erfasst.</p>
                        <p class="sub">Logge eine Kraft-Session und füge Übungen hinzu, um deinen Fortschritt zu sehen.</p>
                    </div>
                {:else}
                    <div class="fortschritt-liste">
                        {#each uebungsFortschritt as uebung (uebung.name)}
                            {@const istOffen = offeneUebung === uebung.name}
                            {@const spark = sparklineDaten(uebung.eintraege, 64, 22)}
                            <div class="fortschritt-item">
                                <button class="fi-zeile"
                                    onclick={() => offeneUebung = istOffen ? null : uebung.name}
                                    aria-expanded={istOffen}>
                                    <div class="fi-info">
                                        <span class="fi-name">{uebung.name}</span>
                                        <span class="fi-meta">
                                            {uebung.eintraege.length} Einträge · Max {uebung.max} kg
                                        </span>
                                    </div>

                                    <!-- Mini-Sparkline: zeigt Verlauf auf einen Blick -->
                                    {#if spark}
                                        <svg class="fi-spark" viewBox="0 0 64 22"
                                            width="64" height="22" aria-hidden="true">
                                            {#if spark.einzelpunkt}
                                                <circle cx={spark.einzelpunkt.x} cy={spark.einzelpunkt.y}
                                                    r="2.5" fill="var(--accent)" />
                                            {:else}
                                                <path d={spark.path}
                                                    stroke="var(--accent)" stroke-width="1.6"
                                                    fill="none" stroke-linecap="round"
                                                    stroke-linejoin="round" />
                                            {/if}
                                        </svg>
                                    {/if}

                                    <div class="fi-rechts">
                                        <span class="fi-aktuell">{uebung.aktuell.gewicht} kg</span>
                                        {#if uebung.trend !== null}
                                            <span class="fi-trend"
                                                class:plus={uebung.trend > 0}
                                                class:minus={uebung.trend < 0}>
                                                {#if uebung.trend > 0}+{/if}{uebung.trend}kg
                                            </span>
                                        {:else}
                                            <span class="fi-trend">erstmals</span>
                                        {/if}
                                    </div>
                                </button>

                                {#if istOffen}
                                    {@const punkte = chartPunkte(uebung.eintraege, 280, 100)}
                                    {@const path = chartPath(uebung.eintraege, 280, 100)}
                                    <div class="fi-chart">
                                        {#if uebung.eintraege.length === 1}
                                            <p class="single-hinweis">
                                                Ein Eintrag — Verlauf erscheint nach der zweiten Session.
                                            </p>
                                        {:else}
                                            <svg viewBox="-10 -10 300 130" preserveAspectRatio="xMidYMid meet"
                                                width="100%" height="auto" class="linien-chart">
                                                <!-- Gefüllter Bereich unter der Linie (subtil) -->
                                                <path d={`${path} L 280 100 L 0 100 Z`}
                                                    fill="var(--accent)" opacity="0.08" />
                                                <!-- Linie -->
                                                <path d={path}
                                                    fill="none" stroke="var(--accent)"
                                                    stroke-width="2" stroke-linecap="round"
                                                    stroke-linejoin="round" />
                                                <!-- Punkte -->
                                                {#each punkte as p}
                                                    <circle cx={p.x} cy={p.y} r="3.5"
                                                        fill="var(--accent)" />
                                                    <circle cx={p.x} cy={p.y} r="1.5"
                                                        fill="#0a0e14" />
                                                {/each}
                                            </svg>

                                            <!-- Mini-Tabelle mit allen Einträgen -->
                                            <div class="fi-eintraege">
                                                {#each uebung.eintraege.slice().reverse() as e}
                                                    <div class="fi-eintrag">
                                                        <span class="fie-datum">{formatKurzes(e.datum)}</span>
                                                        <span class="fie-werte">
                                                            {e.saetze} × {e.wiederholungen} @ <strong>{e.gewicht} kg</strong>
                                                        </span>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </section>
        {:else}
            <!-- Empty-State für Sportarten ohne Tracking -->
            <div class="chart-card empty-fortschritt">
                <span class="empty-icon">📈</span>
                <p>Bald verfügbar</p>
                <p class="sub">
                    Pace und Distanz für {sportFilter} kommen, wenn das Datenmodell erweitert ist.
                </p>
            </div>
        {/if}

    {/if}
{/if}
</div>

<style>
    .page {
        max-width: 480px;
        margin: 0 auto;
        padding: 1.75rem 1rem 1rem;
    }

    header {
        margin-bottom: 1.5rem;
    }

    h1 {
        font-size: 1.5rem;
        margin: 0;
        font-weight: 900;
        letter-spacing: 0.02em;
        color: var(--text-primary);
        text-transform: uppercase;
    }

    .sub {
        margin: 0.3rem 0 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    /* Empty State */
    .empty {
        background: var(--bg-card);
        border: 1px dashed var(--border);
        border-radius: 16px;
        padding: 3rem 1.5rem;
        text-align: center;
    }

    .empty-icon {
        font-size: 2.5rem;
        display: block;
        margin-bottom: 0.8rem;
        opacity: 0.6;
    }

    .empty .title {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .empty .desc {
        margin: 0 0 1.5rem;
        font-size: 0.88rem;
        color: var(--text-secondary);
        line-height: 1.55;
    }

    .empty-btn {
        display: inline-block;
        background: var(--cta-bg);
        color: var(--cta-color);
        padding: 0.85rem 1.5rem;
        border-radius: var(--radius-md);
        text-decoration: none;
        font-weight: 700;
        transition: background 0.15s, transform 0.15s;
    }

    .empty-btn:hover {
        background: var(--cta-bg-hover);
        transform: translateY(-1px);
    }

    /* Tab-System: Underline-Indikator (MCI-Style) */
    .tabs {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1.25rem;
        border-bottom: 1px solid var(--border);
    }

    .tab {
        background: transparent;
        border: none;
        padding: 0.75rem 0;
        color: var(--text-tertiary);
        font-size: 0.92rem;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        position: relative;
        transition: color 0.15s;
    }

    .tab:hover {
        color: var(--text-secondary);
    }

    .tab.aktiv {
        color: var(--accent);
    }

    .tab.aktiv::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--accent);
        border-radius: 2px 2px 0 0;
        box-shadow: 0 0 12px var(--accent-glow);
    }

    /* Total Stats */
    .total-stats {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.6rem;
        margin-bottom: 1.75rem;
    }

    .stat-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 1rem 0.75rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .stat-zahl {
        font-size: 1.6rem;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.03em;
        line-height: 1.1;
    }

    .einheit {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin-left: 0.1rem;
    }

    .stat-label {
        font-size: 0.7rem;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 600;
    }

    /* Chart Sections */
    .chart-section {
        margin-bottom: 1.85rem;
    }

    .chart-section:last-child {
        margin-bottom: 0.5rem;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.95rem;
    }

    h2 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        letter-spacing: -0.015em;
        color: var(--text-primary);
    }

    .section-sub {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        font-weight: 500;
    }

    .chart-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 1.1rem;
    }

    .chart-legende {
        margin-top: 0.6rem;
        font-size: 0.72rem;
        color: var(--text-tertiary);
        text-align: center;
        letter-spacing: 0.02em;
    }

    /* Calendar-Heatmap */
    .heatmap {
        display: flex;
        gap: 0.4rem;
        overflow-x: auto;
        padding-bottom: 0.3rem;
        scrollbar-width: thin;
    }

    .heatmap::-webkit-scrollbar {
        height: 4px;
    }

    .heatmap::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 2px;
    }

    .heatmap-tage-labels {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex-shrink: 0;
        padding-top: 1px;
    }

    .hm-label {
        font-size: 0.62rem;
        color: var(--text-tertiary);
        height: 12px;
        line-height: 12px;
        font-weight: 600;
    }

    .heatmap-grid {
        display: flex;
        gap: 3px;
    }

    .hm-spalte {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .hm-zelle {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        cursor: default;
        transition: transform 0.1s;
    }

    .hm-zelle:not(.leer):hover {
        transform: scale(1.4);
    }

    .hm-zelle.leer {
        background: transparent;
    }

    /* Intensitätsstufen 0-4 */
    .hm-zelle[data-intensitaet="0"] {
        background: var(--bg-input);
        border: 1px solid var(--border);
    }
    .hm-zelle[data-intensitaet="1"] {
        background: rgba(132, 204, 22, 0.25);
    }
    .hm-zelle[data-intensitaet="2"] {
        background: rgba(132, 204, 22, 0.5);
    }
    .hm-zelle[data-intensitaet="3"] {
        background: rgba(132, 204, 22, 0.75);
    }
    .hm-zelle[data-intensitaet="4"] {
        background: var(--accent);
        box-shadow: 0 0 8px var(--accent-glow);
    }

    .heatmap-legende {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        margin-top: 0.85rem;
        justify-content: flex-end;
        font-size: 0.7rem;
        color: var(--text-tertiary);
    }

    .hm-mini {
        cursor: default;
    }

    .hm-mini:hover {
        transform: none;
    }

    /* Sport-Filter Pills im Fortschritt-Tab */
    .sport-filter {
        display: flex;
        gap: 0.4rem;
        margin-bottom: 1.5rem;
        overflow-x: auto;
        scrollbar-width: none;
        padding-bottom: 0.25rem;
    }

    .sport-filter::-webkit-scrollbar { display: none; }

    .sf-pill {
        padding: 0.5rem 0.95rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--text-secondary);
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        white-space: nowrap;
        flex-shrink: 0;
        transition: all 0.15s;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
    }

    .sf-pill:hover:not(.disabled) {
        background: var(--bg-elevated);
        color: var(--text-primary);
    }

    .sf-pill.aktiv {
        background: var(--accent);
        color: #0a0e14;
        border-color: var(--accent);
    }

    .sf-pill.disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    .bald {
        font-size: 0.6rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        opacity: 0.7;
    }

    /* Empty-State im Fortschritt */
    .empty-fortschritt {
        text-align: center;
        padding: 2rem 1.5rem;
    }

    .empty-fortschritt .empty-icon {
        font-size: 2rem;
        display: block;
        margin-bottom: 0.7rem;
        opacity: 0.5;
    }

    .empty-fortschritt p {
        margin: 0;
        color: var(--text-primary);
        font-weight: 600;
    }

    .empty-fortschritt .sub {
        color: var(--text-tertiary);
        font-weight: 400;
        font-size: 0.85rem;
        margin-top: 0.3rem;
        line-height: 1.5;
    }

    /* Fortschritt-Liste — eine Card pro Übung, klickbar zum Expandieren */
    .fortschritt-liste {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
    }

    .fortschritt-item {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        overflow: hidden;
    }

    .fi-zeile {
        width: 100%;
        background: transparent;
        border: none;
        padding: 0.95rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        transition: background 0.15s;
    }

    .fi-zeile:hover {
        background: var(--bg-elevated);
    }

    .fi-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    /* Mini-Sparkline (kompakter Trend in der Zeile) */
    .fi-spark {
        flex-shrink: 0;
        margin: 0 0.5rem;
        opacity: 0.85;
    }

    .fi-name {
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--text-primary);
    }

    .fi-meta {
        font-size: 0.75rem;
        color: var(--text-tertiary);
    }

    .fi-rechts {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;
        flex-shrink: 0;
        margin-left: 0.6rem;
    }

    .fi-aktuell {
        font-size: 1rem;
        font-weight: 800;
        color: var(--accent);
    }

    .fi-trend {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: rgba(139, 148, 158, 0.15);
        color: var(--text-tertiary);
    }

    .fi-trend.plus {
        background: rgba(132, 204, 22, 0.15);
        color: var(--accent);
    }

    .fi-trend.minus {
        background: rgba(239, 68, 68, 0.15);
        color: var(--sport-kraft);
    }

    /* Chart-Bereich (Expanded) */
    .fi-chart {
        padding: 0.5rem 1rem 1rem;
        border-top: 1px solid var(--border);
    }

    .single-hinweis {
        margin: 1rem 0;
        text-align: center;
        font-size: 0.82rem;
        color: var(--text-tertiary);
    }

    .linien-chart {
        margin: 0.5rem 0 0.85rem;
    }

    .fi-eintraege {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-top: 0.5rem;
    }

    .fi-eintrag {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 0.5rem 0.7rem;
        background: var(--bg-input);
        border-radius: 8px;
        font-size: 0.85rem;
    }

    .fie-datum {
        color: var(--text-tertiary);
        font-size: 0.78rem;
    }

    .fie-werte {
        color: var(--text-secondary);
    }

    .fie-werte strong {
        color: var(--text-primary);
        font-weight: 700;
    }

    /* Personal Records */
    .records-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
        margin-bottom: 0.85rem;
    }

    .record-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 0.95rem 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .record-label {
        font-size: 0.7rem;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 600;
    }

    .record-wert {
        font-size: 1.4rem;
        font-weight: 800;
        color: var(--accent);
        letter-spacing: -0.02em;
        line-height: 1.1;
    }

    .record-meta {
        font-size: 0.72rem;
        color: var(--text-tertiary);
    }

    .top-uebungen h3 {
        margin: 0 0 0.7rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    .uebungen-records {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
    }

    .uebung-record {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.55rem 0.75rem;
        background: var(--bg-input);
        border-radius: 8px;
    }

    .ur-name {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.9rem;
    }

    .ur-werte {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
    }

    .ur-werte strong {
        color: var(--accent);
        font-weight: 800;
        font-size: 0.95rem;
    }

    .ur-detail {
        color: var(--text-tertiary);
        font-size: 0.78rem;
    }

    /* Stacked Bar */
    .stacked-bar {
        display: flex;
        height: 14px;
        border-radius: 999px;
        overflow: hidden;
        margin-bottom: 1rem;
        background: var(--bg-input);
    }

    .bar-segment {
        height: 100%;
        transition: opacity 0.15s;
    }

    .bar-segment:hover {
        opacity: 0.85;
    }

    /* Sport-Liste */
    .sport-liste {
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
    }

    .sport-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .sport-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        box-shadow: 0 0 8px currentColor;
    }

    .sport-name {
        flex: 1;
        font-size: 0.92rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .sport-werte {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.1rem;
    }

    .sport-prozent {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .sport-zeit {
        font-size: 0.72rem;
        color: var(--text-tertiary);
    }
</style>
