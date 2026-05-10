<script>
    import { subtypenFuer } from '$lib/splits.js';
    import { filtereUebungen } from '$lib/uebungen.js';

    let { data, form } = $props();
    let rpe = $state(5);
    // Sport mit zuletzt geloggtem Sport vorbelegen — User wechselt selten zwischen Sportarten
    let sport = $state(data.vorgeschlagenerSport ?? '');
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

    // ────────── Übungen-Erfassung (nur bei Kraft) ──────────
    /** @type {Array<{name: string, saetze: number, wiederholungen: number, gewicht: number}>} */
    let uebungen = $state([]);

    // Form-State für neue Übung
    let neueUebungAktiv = $state(false);
    let uebungSuche = $state('');
    let dropdownOffen = $state(false);
    let saetzeInput = $state(4);
    let wdhInput = $state(8);
    let gewichtInput = $state(0);

    // Gefilterte Übungen-Vorschläge aus der Bibliothek
    let gefiltert = $derived(filtereUebungen(uebungSuche));

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
            gewicht: gewichtInput
        }];

        // Form leeren für nächste Übung
        uebungSuche = '';
        saetzeInput = 4;
        wdhInput = 8;
        gewichtInput = 0;
        dropdownOffen = false;
        neueUebungAktiv = false;
    }

    function uebungEntfernen(idx) {
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
        <label class="field-label">Sportart</label>
        <div class="sport-grid">
            {#each ['Kraft', 'Laufen', 'Rad', 'Schwimmen'] as s}
                <label class="sport-btn" class:gewaehlt={sport === s}>
                    <input type="radio" name="sport" value={s} bind:group={sport} required />
                    <span class="sport-icon">{sportEmoji[s]}</span>
                    <span>{s}</span>
                </label>
            {/each}
        </div>

        <!-- Subtyp-Auswahl (nur wenn Sport gewählt ist) -->
        {#if verfuegbareSubtypen.length > 0}
            <label class="field-label">
                Subtyp <span class="optional">(optional)</span>
                {#if data.vorgeschlagenerSubtyp && sport === 'Kraft'}
                    <span class="vorschlag-hinweis">→ {data.vorgeschlagenerSubtyp} laut Split</span>
                {/if}
            </label>
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
        {/if}

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
            placeholder="60" required />

        <label for="rpe" class="field-label">
            Intensität <span class="rpe-wert">RPE {rpe}/10</span>
        </label>
        <input type="range" id="rpe" name="rpe" min="1" max="10" bind:value={rpe} />
        <div class="rpe-skala">
            <span>locker</span>
            <span>maximal</span>
        </div>

        <!-- Übungen erfassen (nur bei Kraft) -->
        {#if sport === 'Kraft'}
            <label class="field-label">
                Übungen <span class="optional">(optional)</span>
            </label>

            {#if uebungen.length > 0}
                <div class="ue-liste">
                    {#each uebungen as u, idx (idx)}
                        <div class="ue-zeile">
                            <div class="ue-info">
                                <span class="ue-name">{u.name}</span>
                                <span class="ue-werte">
                                    {u.saetze} × {u.wiederholungen} @ <strong>{u.gewicht} kg</strong>
                                </span>
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

            <!-- Übungen werden als JSON in einem hidden field serialisiert -->
            <input type="hidden" name="uebungen" value={JSON.stringify(uebungen)} />
        {/if}

        <label for="notiz" class="field-label">Notiz <span class="optional">(optional)</span></label>
        <textarea id="notiz" name="notiz" placeholder="Wie war das Training?"></textarea>

        <button type="submit" class="btn-save">Session speichern</button>
        <a href="/log" class="cancel">Abbrechen</a>
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

    /* ─── Übungen-Erfassung ─── */
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

    .ue-werte {
        font-size: 0.8rem;
        color: var(--text-secondary);
    }

    .ue-werte strong {
        color: var(--accent);
        font-weight: 700;
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
</style>
