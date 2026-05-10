<script>
    let { data } = $props();
    let sessions = $derived(data.sessions);
    let aktiverFilter = $derived(data.aktiverFilter);

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

    const sportFilter = ['Kraft', 'Laufen', 'Rad', 'Schwimmen'];

    function formatDatum(iso) {
        return new Date(iso).toLocaleDateString('de-CH', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
    }
</script>

<div class="page">
    <header>
        <div>
            <h1>TRAININGS-LOG</h1>
            <p class="anzahl">
                {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
                {#if aktiverFilter}<span class="filter-info">· {aktiverFilter}</span>{/if}
            </p>
        </div>
        <div class="header-aktionen">
            {#if sessions.length > 0}
                <a href="/export" class="btn-export" aria-label="Als CSV exportieren"
                    title="Als CSV exportieren">⤓</a>
            {/if}
            <a href="/log/new" class="btn-primary" aria-label="Neue Session loggen">+</a>
        </div>
    </header>

    <!-- Filter-Pills -->
    <div class="filter-leiste" role="tablist">
        <a href="/log" class="filter-pill" class:aktiv={!aktiverFilter} role="tab"
            aria-selected={!aktiverFilter}>Alle</a>
        {#each sportFilter as s}
            <a href="/log?sport={s}"
                class="filter-pill"
                class:aktiv={aktiverFilter === s}
                style="--filter-farbe: {sportFarbe[s]}"
                role="tab"
                aria-selected={aktiverFilter === s}>
                {sportEmoji[s]} {s}
            </a>
        {/each}
    </div>

    <div class="session-list">
        {#if sessions.length === 0}
            <div class="empty">
                <span class="empty-icon">📋</span>
                {#if aktiverFilter}
                    <p>Keine {aktiverFilter}-Sessions</p>
                    <p class="sub">Wähle "Alle" oben, um andere Sessions zu sehen.</p>
                {:else}
                    <p>Noch keine Sessions</p>
                    <p class="sub">Tippe rechts oben auf +, um deine erste Session zu loggen.</p>
                {/if}
            </div>
        {:else}
            {#each sessions as session}
                <a href="/log/{session._id}" class="session-card"
                    style="--card-farbe: {sportFarbe[session.sport]}">
                    <div class="card-left"></div>
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
        {/if}
    </div>
</div>

<style>
    .page {
        max-width: 480px;
        margin: 0 auto;
        padding: 1.75rem 1rem 1rem;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
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

    .anzahl {
        margin: 0.2rem 0 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
    }

    .filter-info {
        color: var(--accent);
        font-weight: 600;
    }

    /* Filter-Pills */
    .filter-leiste {
        display: flex;
        gap: 0.4rem;
        margin-bottom: 1.25rem;
        overflow-x: auto;
        padding-bottom: 0.25rem;
        scrollbar-width: none;
    }

    .filter-leiste::-webkit-scrollbar {
        display: none;
    }

    .filter-pill {
        padding: 0.5rem 0.95rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--text-secondary);
        font-size: 0.82rem;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
        transition: all 0.15s;
        flex-shrink: 0;
    }

    .filter-pill:hover {
        background: var(--bg-elevated);
        color: var(--text-primary);
    }

    .filter-pill.aktiv {
        background: var(--filter-farbe, var(--accent));
        color: #0a0e14;
        border-color: var(--filter-farbe, var(--accent));
    }

    .header-aktionen {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .btn-export {
        background: var(--bg-card);
        color: var(--text-secondary);
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: 1px solid var(--border);
        text-decoration: none;
        font-size: 1.4rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        transition: all 0.15s;
    }

    .btn-export:hover {
        background: var(--bg-elevated);
        color: var(--accent);
        border-color: var(--accent);
    }

    .btn-primary {
        background: var(--accent);
        color: #0a0e14;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        text-decoration: none;
        font-size: 1.5rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        box-shadow: 0 4px 16px var(--accent-glow);
        transition: transform 0.15s, box-shadow 0.2s;
    }

    .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px var(--accent-glow);
    }

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

    .card-left {
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
        font-size: 1rem;
        color: var(--text-primary);
    }

    .subtyp-badge {
        display: inline-block;
        margin-left: 0.5rem;
        padding: 0.1rem 0.5rem;
        background: rgba(132, 204, 22, 0.12);
        color: var(--accent);
        border-radius: 999px;
        font-size: 0.7rem;
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

    .empty {
        background: var(--bg-card);
        border: 1px dashed var(--border);
        border-radius: 14px;
        padding: 3rem 1.5rem;
        text-align: center;
    }

    .empty-icon {
        font-size: 2.5rem;
        display: block;
        margin-bottom: 0.8rem;
        opacity: 0.6;
    }

    .empty p {
        margin: 0;
        color: var(--text-primary);
        font-weight: 600;
    }

    .empty .sub {
        font-weight: 400;
        font-size: 0.85rem;
        color: var(--text-tertiary);
        margin-top: 0.4rem;
    }
</style>
