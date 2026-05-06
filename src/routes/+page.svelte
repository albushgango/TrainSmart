<script>
    let { data } = $props();
    const { empfehlung, streak, letzteSessions, wochenziel, wochenTage, wochenSessions } = data;

    const sportEmoji = {
        Kraft: '🏋️',
        Laufen: '🏃',
        Rad: '🚴',
        Schwimmen: '🏊'
    };

    /** Mappt Sportart auf CSS-Variable für Akzentfarbe */
    const sportFarbe = {
        Kraft: 'var(--sport-kraft)',
        Laufen: 'var(--sport-laufen)',
        Rad: 'var(--sport-rad)',
        Schwimmen: 'var(--sport-schwimmen)'
    };

    function formatDatum(iso) {
        return new Date(iso).toLocaleDateString('de-CH', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
    }

    function formatLangesDatum(iso) {
        return new Date(iso).toLocaleDateString('de-CH', {
            weekday: 'long', day: 'numeric', month: 'long'
        });
    }

    // Begrüssung je nach Tageszeit
    const stunde = new Date().getHours();
    const begruessung = stunde < 12 ? 'Guten Morgen' : stunde < 18 ? 'Guten Tag' : 'Guten Abend';

    // Wochenkalender: Default = heute. Falls heute nicht in der Woche liegt (Edge), nimm den ersten Tag.
    let gewaehlterTag = $state(
        wochenTage.find(t => t.istHeute)?.datum ?? wochenTage[0].datum
    );

    // Sessions des gewählten Tages
    let gewaehlteSessions = $derived(
        wochenSessions.filter(s => s.datum.split('T')[0] === gewaehlterTag)
    );

    let gewaehltesIstHeute = $derived(
        wochenTage.find(t => t.datum === gewaehlterTag)?.istHeute ?? false
    );
</script>

<div class="page">
    <!-- Header -->
    <header>
        <div>
            <p class="gruss">{begruessung}</p>
            <h1>DASHBOARD</h1>
        </div>
        {#if streak > 0}
            <div class="streak-badge">
                <span class="streak-fire">🔥</span>
                <span class="streak-zahl">{streak}</span>
            </div>
        {/if}
    </header>

    <!-- Wochenkalender: 7 Pills, klickbar, Punkt unter Tagen mit Aktivität -->
    <section class="wochenkalender" role="tablist" aria-label="Wochentage">
        {#each wochenTage as tag}
            <button class="wk-tag"
                class:aktiv={gewaehlterTag === tag.datum}
                class:heute={tag.istHeute}
                onclick={() => (gewaehlterTag = tag.datum)}
                role="tab"
                aria-selected={gewaehlterTag === tag.datum}>
                <span class="wk-wt">{tag.wochentag}</span>
                <span class="wk-num">{tag.tagesnummer}</span>
                {#if tag.sessionsAnzahl > 0}
                    <span class="wk-punkt" aria-label="{tag.sessionsAnzahl} Sessions"></span>
                {/if}
            </button>
        {/each}
    </section>

    <!-- Tagesempfehlung -->
    <section class="empfehlung-card" style="--empf-farbe: {empfehlung.farbe}">
        <div class="empf-glow"></div>
        <div class="empf-content">
            <div class="empf-header">
                <span class="empf-label">Empfehlung heute</span>
                <span class="empf-typ">{empfehlung.typ}</span>
            </div>
            <p class="empf-grund">{empfehlung.grund}</p>
            {#if empfehlung.naechsterTag}
                <div class="split-vorschlag">
                    <span class="split-label">Laut deinem Split:</span>
                    <span class="split-tag">{empfehlung.naechsterTag}</span>
                </div>
            {/if}
        </div>
    </section>

    <!-- Wochenziel Fortschritt -->
    <section class="wochenziel-card">
        <div class="wz-header">
            <span class="wz-label">Wochenziel</span>
            <span class="wz-zaehler">
                <strong>{wochenziel.erreicht}</strong>
                <span class="wz-trenner">/</span>
                <span class="wz-ziel">{wochenziel.ziel}</span>
            </span>
        </div>
        <div class="wz-balken">
            <div class="wz-fortschritt"
                style="width: {wochenziel.prozent}%"
                class:erreicht={wochenziel.prozent >= 100}>
            </div>
        </div>
        <p class="wz-text">
            {#if wochenziel.prozent >= 100}
                Wochenziel erreicht! 🎉
            {:else if wochenziel.erreicht === 0}
                Noch keine Session diese Woche
            {:else}
                Noch {wochenziel.ziel - wochenziel.erreicht} {wochenziel.ziel - wochenziel.erreicht === 1 ? 'Session' : 'Sessions'} bis zum Ziel
            {/if}
        </p>
    </section>

    <!-- Quick-Log Button -->
    <a href="/log/new" class="quick-log-btn">
        <span class="plus">+</span>
        <span>Session loggen</span>
    </a>

    <!-- Sessions des gewählten Tages (oder Fallback "Zuletzt") -->
    <section class="letzte-section">
        <div class="section-header">
            <h2>
                {#if gewaehltesIstHeute}
                    Heute
                {:else}
                    {formatLangesDatum(gewaehlterTag + 'T00:00:00')}
                {/if}
            </h2>
            <a href="/log" class="alle-link">Alle →</a>
        </div>

        {#if gewaehlteSessions.length === 0}
            <div class="empty-state">
                <span class="empty-icon">💪</span>
                {#if gewaehltesIstHeute}
                    <p>Heute noch nichts trainiert</p>
                    <p class="sub">Tippe oben auf "+ Session loggen"</p>
                {:else}
                    <p>Kein Training an diesem Tag</p>
                    <p class="sub">Wähle einen anderen Tag oder logge eine Session</p>
                {/if}
            </div>
        {:else}
            <div class="session-list">
                {#each gewaehlteSessions as session (session._id)}
                    <a href="/log/{session._id}" class="session-card"
                        style="--card-farbe: {sportFarbe[session.sport]}">
                        <div class="card-accent"></div>
                        <div class="card-body">
                            <span class="sport">
                                {sportEmoji[session.sport] ?? ''} {session.sport}{#if session.subtyp}<span class="subtyp-badge">{session.subtyp}</span>{/if}
                            </span>
                            <span class="datum">{formatDatum(session.datum)}</span>
                        </div>
                        <div class="card-right">
                            <span class="dauer">{session.dauer} min</span>
                            <span class="rpe">RPE {session.rpe}</span>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </section>
</div>

<style>
    .page {
        max-width: 480px;
        margin: 0 auto;
        padding: 1.75rem 1rem 1rem;
    }

    /* Header */
    header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
    }

    .gruss {
        margin: 0 0 0.2rem;
        font-size: 0.85rem;
        color: var(--text-secondary);
        font-weight: 500;
    }

    h1 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 900;
        letter-spacing: 0.02em;
        color: var(--text-primary);
        text-transform: uppercase;
    }

    /* Streak Badge — kompakt im MCI-Style: Flame + Zahl horizontal */
    .streak-badge {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 0.4rem 0.85rem;
    }

    .streak-fire { font-size: 1rem; }
    .streak-zahl {
        font-size: 1.05rem;
        font-weight: 800;
        color: var(--text-primary);
        line-height: 1;
    }

    /* Wochenkalender — 7 Pills mit Wochentag, Datum, Aktivitätspunkt */
    .wochenkalender {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.35rem;
        margin-bottom: 1.25rem;
    }

    .wk-tag {
        background: transparent;
        border: 1px solid transparent;
        border-radius: 12px;
        padding: 0.55rem 0.2rem 0.7rem;
        cursor: pointer;
        font-family: inherit;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        position: relative;
        transition: all 0.15s;
        color: var(--text-secondary);
    }

    .wk-tag:hover {
        background: var(--bg-card);
    }

    .wk-tag.aktiv {
        background: var(--text-primary);
        color: #0a0e14;
    }

    .wk-tag.heute:not(.aktiv) {
        border-color: var(--accent);
        color: var(--accent);
    }

    .wk-wt {
        font-size: 0.62rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        opacity: 0.7;
    }

    .wk-tag.aktiv .wk-wt {
        opacity: 1;
    }

    .wk-num {
        font-size: 1rem;
        font-weight: 700;
        line-height: 1;
    }

    .wk-punkt {
        position: absolute;
        bottom: 0.3rem;
        left: 50%;
        transform: translateX(-50%);
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 6px var(--accent-glow);
    }

    .wk-tag.aktiv .wk-punkt {
        background: #0a0e14;
        box-shadow: none;
    }

    /* Tagesempfehlung */
    .empfehlung-card {
        position: relative;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: 1.5rem;
        margin-bottom: 1rem;
        overflow: hidden;
        transition: transform 0.2s;
    }

    .empfehlung-card:hover {
        transform: translateY(-1px);
    }

    /* Glow im Hintergrund der Card — Farbe je nach Empfehlung */
    .empf-glow {
        position: absolute;
        top: -50%;
        right: -30%;
        width: 280px;
        height: 280px;
        background: radial-gradient(circle, var(--empf-farbe) 0%, transparent 65%);
        opacity: 0.35;
        pointer-events: none;
    }

    .empf-content {
        position: relative;
        z-index: 1;
    }

    .empf-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.5rem;
    }

    .empf-label {
        font-size: 0.7rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 700;
    }

    .empf-typ {
        font-size: 1.6rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: var(--empf-farbe);
    }

    .empf-grund {
        margin: 0;
        font-size: 0.92rem;
        color: var(--text-secondary);
        line-height: 1.5;
    }

    .split-vorschlag {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        margin-top: 0.85rem;
        padding-top: 0.85rem;
        border-top: 1px solid var(--border);
    }

    .split-label {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 600;
    }

    .split-tag {
        background: var(--accent);
        color: #0a0e14;
        padding: 0.2rem 0.7rem;
        border-radius: 999px;
        font-size: 0.82rem;
        font-weight: 700;
        box-shadow: 0 0 14px var(--accent-glow);
    }

    /* Wochenziel */
    .wochenziel-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 1.1rem 1.2rem;
        margin-bottom: 1rem;
    }

    .wz-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.6rem;
    }

    .wz-label {
        font-size: 0.7rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 700;
    }

    .wz-zaehler {
        display: flex;
        align-items: baseline;
        gap: 0.2rem;
        font-size: 1.1rem;
        font-weight: 700;
    }

    .wz-zaehler strong {
        font-size: 1.45rem;
        font-weight: 800;
        color: var(--accent);
        letter-spacing: -0.02em;
    }

    .wz-trenner {
        color: var(--text-tertiary);
    }

    .wz-ziel {
        color: var(--text-secondary);
        font-weight: 600;
    }

    .wz-balken {
        background: var(--bg-input);
        border-radius: 999px;
        height: 8px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .wz-fortschritt {
        height: 100%;
        background: var(--accent);
        border-radius: 999px;
        transition: width 0.4s ease-out;
        box-shadow: 0 0 12px var(--accent-glow);
    }

    .wz-fortschritt.erreicht {
        background: linear-gradient(90deg, var(--accent), #22c55e);
    }

    .wz-text {
        margin: 0;
        font-size: 0.78rem;
        color: var(--text-tertiary);
    }

    /* Quick-Log — primärer CTA im weissen MCI-Style */
    .quick-log-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background: var(--cta-bg);
        color: var(--cta-color);
        border-radius: var(--radius-md);
        padding: 1rem;
        text-decoration: none;
        font-weight: 700;
        font-size: 1rem;
        margin-bottom: 1.75rem;
        transition: transform 0.15s, background 0.15s;
    }

    .quick-log-btn:hover {
        background: var(--cta-bg-hover);
        transform: translateY(-1px);
    }

    .quick-log-btn:active {
        transform: translateY(0);
    }

    .plus {
        font-size: 1.3rem;
        line-height: 1;
        font-weight: 400;
    }

    /* Letzte Sessions */
    .letzte-section {
        margin-top: 0.5rem;
    }

    .letzte-section h2 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        letter-spacing: -0.015em;
        color: var(--text-primary);
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.95rem;
    }

    .alle-link {
        font-size: 0.85rem;
        color: var(--text-secondary);
        text-decoration: none;
        font-weight: 500;
        transition: color 0.15s;
    }

    .alle-link:hover { color: var(--accent); }

    .session-list {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .session-card {
        display: flex;
        align-items: center;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        transition: background 0.15s, border-color 0.15s, transform 0.15s;
    }

    .session-card:hover {
        background: var(--bg-elevated);
        border-color: var(--border-strong);
        transform: translateX(2px);
    }

    .card-accent {
        width: 4px;
        align-self: stretch;
        background: var(--card-farbe, var(--accent));
        box-shadow: 0 0 10px var(--card-farbe, var(--accent));
    }

    .card-body {
        flex: 1;
        padding: 0.85rem 1rem;
    }

    .sport {
        display: block;
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--text-primary);
    }

    .subtyp-badge {
        display: inline-block;
        margin-left: 0.4rem;
        padding: 0.08rem 0.45rem;
        background: rgba(132, 204, 22, 0.12);
        color: var(--accent);
        border-radius: 999px;
        font-size: 0.66rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        vertical-align: middle;
    }

    .datum {
        display: block;
        font-size: 0.78rem;
        color: var(--text-tertiary);
        margin-top: 0.2rem;
    }

    .card-right {
        padding: 0.85rem 1rem;
        text-align: right;
    }

    .dauer {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .rpe {
        display: block;
        font-size: 0.72rem;
        color: var(--text-tertiary);
        margin-top: 0.15rem;
    }

    .empty-state {
        background: var(--bg-card);
        border: 1px dashed var(--border);
        border-radius: 14px;
        padding: 2.5rem 1rem;
        text-align: center;
    }

    .empty-icon {
        font-size: 2rem;
        display: block;
        margin-bottom: 0.6rem;
    }

    .empty-state p {
        margin: 0;
        color: var(--text-secondary);
        font-weight: 600;
    }

    .empty-state .sub {
        font-weight: 400;
        font-size: 0.85rem;
        color: var(--text-tertiary);
        margin-top: 0.2rem;
    }
</style>
