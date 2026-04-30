<script>
    let { form } = $props();
    let rpe = $state(5);
</script>

<div class="page">
    <header>
        <a href="/log" class="back">✕</a>
        <h1>Session loggen</h1>
    </header>

    {#if form?.error}
        <p class="error">{form.error}</p>
    {/if}

    <form method="POST">
        <label>Sportart</label>
        <div class="sport-grid">
            {#each ['Kraft', 'Laufen', 'Rad', 'Schwimmen'] as sport}
                <label class="sport-btn">
                    <input type="radio" name="sport" value={sport} required />
                    {sport === 'Kraft' ? '🏋️' : sport === 'Laufen' ? '🏃' : sport === 'Rad' ? '🚴' : '🏊'}
                    {sport}
                </label>
            {/each}
        </div>

        <label for="datum">Datum</label>
        <input type="date" id="datum" name="datum" required
            value={new Date().toISOString().split('T')[0]} />

        <label for="dauer">Dauer (Minuten)</label>
        <input type="number" id="dauer" name="dauer" min="1" max="600" placeholder="60" required />

        <label for="rpe">Intensität (RPE {rpe}/10)</label>
        <input type="range" id="rpe" name="rpe" min="1" max="10"
            bind:value={rpe} />

        <label for="notiz">Notiz (optional)</label>
        <textarea id="notiz" name="notiz" placeholder="Wie war das Training?"></textarea>

        <button type="submit">Session speichern</button>
        <a href="/log" class="cancel">Abbrechen</a>
    </form>
</div>

<style>
    .page { max-width: 480px; margin: 0 auto; padding: 1rem; font-family: sans-serif; }
    header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    h1 { font-size: 1.4rem; margin: 0; }
    .back { font-size: 1.2rem; text-decoration: none; color: #111; }
    form { display: flex; flex-direction: column; gap: 0.5rem; }
    label { font-weight: 600; font-size: 0.9rem; margin-top: 0.75rem; }
    input[type="date"], input[type="number"], textarea {
        padding: 0.6rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; width: 100%;
    }
    input[type="range"] { width: 100%; }
    .sport-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem; }
    .sport-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem;
        border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 0.95rem; }
    .sport-btn input { display: none; }
    button[type="submit"] { margin-top: 1rem; background: #111; color: white; padding: 0.8rem;
        border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; }
    .cancel { text-align: center; color: #888; font-size: 0.9rem; text-decoration: none; margin-top: 0.5rem; }
    .error { background: #fee; color: #c00; padding: 0.75rem; border-radius: 8px; }
</style>