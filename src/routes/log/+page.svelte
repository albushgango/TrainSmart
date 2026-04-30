<script>
    let { data } = $props();
    const { sessions } = data;

    const sportEmoji = {
        Kraft: '🏋️',
        Laufen: '🏃',
        Rad: '🚴',
        Schwimmen: '🏊'
    };

    function formatDatum(iso) {
        return new Date(iso).toLocaleDateString('de-CH', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
    }
</script>

<div class="page">
    <header>
        <h1>Trainings-Log</h1>
        <a href="/log/new" class="btn-primary">+ Session loggen</a>
    </header>

    <div class="session-list">
        {#if sessions.length === 0}
            <p class="empty">Noch keine Sessions. Leg los!</p>
        {:else}
            {#each sessions as session}
                <div class="session-card">
                    <div class="card-left"></div>
                    <div class="card-body">
                        <span class="sport">{sportEmoji[session.sport] ?? ''} {session.sport}</span>
                        <span class="datum">{formatDatum(session.datum)}</span>
                    </div>
                    <div class="card-right">
                        <span class="dauer">{session.dauer} min</span>
                        <span class="rpe">RPE {session.rpe}</span>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .page { max-width: 480px; margin: 0 auto; padding: 1rem; font-family: sans-serif; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    h1 { font-size: 1.4rem; margin: 0; }
    .btn-primary { background: #111; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem; }
    .session-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .session-card { display: flex; align-items: center; background: #f9f9f9; border-radius: 10px; overflow: hidden; }
    .card-left { width: 4px; min-height: 68px; background: #111; }
    .card-body { flex: 1; padding: 0.75rem 1rem; }
    .sport { display: block; font-weight: 600; font-size: 1rem; }
    .datum { display: block; font-size: 0.8rem; color: #666; margin-top: 0.2rem; }
    .card-right { padding: 0.75rem 1rem; text-align: right; }
    .dauer { display: block; font-size: 0.9rem; font-weight: 500; }
    .rpe { display: block; font-size: 0.75rem; color: #888; }
    .empty { color: #999; text-align: center; margin-top: 2rem; }
</style>