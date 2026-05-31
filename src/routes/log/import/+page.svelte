<script>
	import { enhance } from '$app/forms';

	let { form } = $props();

	let rpe = $state(5);
	let subtyp = $state('');
	let notiz = $state('');
	let dateiInput = $state(null);
	let dateiName = $state('');
	let dragAktiv = $state(false);

	// Wenn form.geparsed da ist → Step 2 (Vorschau + Bestätigung)
	let geparsed = $derived(form?.geparsed ?? null);
	let fehler = $derived(form?.error ?? null);

	const sportEmoji = { Kraft: '🏋️', Laufen: '🏃', Rad: '🚴', Schwimmen: '🏊' };

	function formatDauer(min) {
		const h = Math.floor(min / 60);
		const m = min % 60;
		return h > 0 ? `${h}h ${m}min` : `${m} min`;
	}

	function formatDatum(iso) {
		return new Date(iso).toLocaleString('de-CH', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function dateiSetzen(file) {
		if (!file) return;
		dateiName = file.name;
	}

	function dateiAuswaehlen(event) {
		dateiSetzen(event.currentTarget.files?.[0]);
	}

	function dateiAblegen(event) {
		event.preventDefault();
		dragAktiv = false;

		const file = event.dataTransfer?.files?.[0];
		if (!file || !dateiInput) return;

		const transfer = new DataTransfer();
		transfer.items.add(file);
		dateiInput.files = transfer.files;
		dateiSetzen(file);
	}
</script>

<div class="page">
	<header>
		<a href="/log" class="back" aria-label="Abbrechen">←</a>
		<h1>{geparsed ? 'IMPORT VORSCHAU' : 'GARMIN IMPORT'}</h1>
	</header>

	{#if fehler}
		<p class="error">{fehler}</p>
	{/if}

	{#if !geparsed}
		<!-- Step 1: Upload -->
		<section class="info-card">
			<h2>So gehts</h2>
			<ol>
				<li>
					Öffne deine Activity in <a
						href="https://connect.garmin.com"
						target="_blank"
						rel="noopener">Garmin Connect</a
					>
				</li>
				<li>Klicke auf das ⚙ Settings-Symbol → <strong>"Original-Datei exportieren"</strong></li>
				<li>Die heruntergeladene <code>.tcx</code>-Datei hier hochladen</li>
			</ol>
			<p class="hinweis">
				Wird automatisch ausgelesen: Sport, Datum, Dauer, Distanz, Ø HR, Max HR, Kalorien,
				Schrittfrequenz, Watts, Höhenmeter, km-Splits und Verlaufs-Daten.
			</p>
		</section>

		<form method="POST" action="?/parsen" enctype="multipart/form-data" use:enhance>
			<label
				class="upload-label"
				class:drag-aktiv={dragAktiv}
				ondragenter={(event) => {
					event.preventDefault();
					dragAktiv = true;
				}}
				ondragover={(event) => event.preventDefault()}
				ondragleave={() => (dragAktiv = false)}
				ondrop={dateiAblegen}
			>
				<input
					bind:this={dateiInput}
					type="file"
					name="datei"
					accept=".tcx"
					required
					onchange={dateiAuswaehlen}
				/>
				<span class="upload-icon">⬆</span>
				<span class="upload-text">TCX-Datei wählen</span>
				<span class="upload-hint">oder Datei hier ablegen</span>
				{#if dateiName}
					<span class="upload-datei">{dateiName}</span>
				{/if}
			</label>

			<button type="submit" class="btn-save">TCX parsen</button>
			<a href="/log" class="cancel">Abbrechen</a>
		</form>
	{:else}
		<!-- Step 2: Vorschau + RPE eintragen -->
		<section class="vorschau-card">
			<div class="vorschau-haupt">
				<span class="vorschau-icon">{sportEmoji[geparsed.sport] ?? ''}</span>
				<div>
					<div class="vorschau-titel">{geparsed.sport}</div>
					<div class="vorschau-datum">{formatDatum(geparsed.datum)}</div>
				</div>
			</div>

			<div class="vorschau-grid">
				<div class="vorschau-item">
					<span class="vi-label">Distanz</span>
					<span class="vi-wert">{geparsed.distanz}<span class="vi-einh"> km</span></span>
				</div>
				<div class="vorschau-item">
					<span class="vi-label">Dauer</span>
					<span class="vi-wert">{formatDauer(geparsed.dauer)}</span>
				</div>
				{#if geparsed.avgHr}
					<div class="vorschau-item">
						<span class="vi-label">Ø HR</span>
						<span class="vi-wert">{geparsed.avgHr}<span class="vi-einh"> bpm</span></span>
					</div>
				{/if}
				{#if geparsed.maxHr}
					<div class="vorschau-item">
						<span class="vi-label">Max HR</span>
						<span class="vi-wert">{geparsed.maxHr}<span class="vi-einh"> bpm</span></span>
					</div>
				{/if}
				{#if geparsed.calories}
					<div class="vorschau-item">
						<span class="vi-label">Kalorien</span>
						<span class="vi-wert">{geparsed.calories}<span class="vi-einh"> kcal</span></span>
					</div>
				{/if}
				{#if geparsed.hoehenmeter}
					<div class="vorschau-item">
						<span class="vi-label">Höhenmeter</span>
						<span class="vi-wert">{geparsed.hoehenmeter}<span class="vi-einh"> m</span></span>
					</div>
				{/if}
				{#if geparsed.avgCadence}
					<div class="vorschau-item">
						<span class="vi-label">Ø Cadence</span>
						<span class="vi-wert">{geparsed.avgCadence}<span class="vi-einh"> spm</span></span>
					</div>
				{/if}
				{#if geparsed.avgWatts}
					<div class="vorschau-item">
						<span class="vi-label">Ø Watts</span>
						<span class="vi-wert">{geparsed.avgWatts}<span class="vi-einh"> W</span></span>
					</div>
				{/if}
			</div>

			<div class="vorschau-meta">
				{geparsed.trackpointAnzahl} Trackpoints · {geparsed.laufDaten?.splits.length ?? 0} km-Splits
			</div>
		</section>

		<form method="POST" action="?/speichern" use:enhance>
			<input type="hidden" name="geparseDatenJson" value={JSON.stringify(geparsed)} />

			<label for="rpe" class="field-label">
				Intensität <span class="rpe-wert">RPE {rpe}/10</span>
			</label>
			<input type="range" id="rpe" name="rpe" min="1" max="10" bind:value={rpe} />
			<div class="rpe-skala">
				<span>locker</span>
				<span>maximal</span>
			</div>

			<label for="subtyp" class="field-label">Subtyp <span class="optional">(optional)</span></label
			>
			<input
				type="text"
				id="subtyp"
				name="subtyp"
				bind:value={subtyp}
				placeholder="z.B. Easy, Tempo, Long Run"
			/>

			<label for="notiz" class="field-label">Notiz <span class="optional">(optional)</span></label>
			<textarea id="notiz" name="notiz" bind:value={notiz} placeholder="Wie war der Lauf?"
			></textarea>

			<button type="submit" class="btn-save">Session importieren</button>
			<a href="/log/import" class="cancel">Andere Datei wählen</a>
		</form>
	{/if}
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
		border-radius: var(--radius-sm);
		background: var(--bg-card);
		border: 1px solid var(--border);
	}

	.error {
		background: var(--error-bg);
		color: var(--error-text);
		border: 1px solid var(--error-border);
		padding: 0.85rem;
		border-radius: var(--radius-sm);
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	/* Info-Card mit Anleitung */
	.info-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		margin-bottom: 1.25rem;
	}

	.info-card h2 {
		margin: 0 0 0.7rem;
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.info-card ol {
		margin: 0 0 0.75rem;
		padding-left: 1.25rem;
		color: var(--text-secondary);
		font-size: 0.88rem;
		line-height: 1.6;
	}

	.info-card ol li {
		margin-bottom: 0.3rem;
	}

	.info-card code {
		background: var(--bg-input);
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		font-size: 0.82rem;
		color: var(--accent);
	}

	.info-card a {
		color: var(--accent);
		text-decoration: none;
	}

	.info-card .hinweis {
		margin: 0;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border);
		font-size: 0.78rem;
		color: var(--text-tertiary);
		line-height: 1.5;
	}

	/* Upload-Bereich */
	form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.upload-label {
		background: var(--bg-card);
		border: 2px dashed var(--border);
		border-radius: var(--radius-lg);
		padding: 2.5rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.upload-label:hover,
	.upload-label.drag-aktiv {
		background: var(--bg-elevated);
		border-color: var(--accent);
		box-shadow: 0 0 28px var(--accent-glow);
		transform: translateY(-1px);
	}

	.upload-label input[type='file'] {
		display: none;
	}

	.upload-icon {
		font-size: 2rem;
		color: var(--accent);
	}
	.upload-text {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.upload-hint {
		font-size: 0.8rem;
		color: var(--text-tertiary);
	}

	.upload-datei {
		margin-top: 0.25rem;
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		background: rgba(132, 204, 22, 0.12);
		color: var(--accent);
		font-size: 0.78rem;
		font-weight: 700;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Vorschau-Card */
	.vorschau-card {
		background: var(--bg-card);
		border: 1px solid var(--accent);
		border-radius: var(--radius-xl);
		padding: 1.4rem;
		margin-bottom: 1.25rem;
		box-shadow: 0 0 24px var(--accent-glow);
	}

	.vorschau-haupt {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1rem;
	}

	.vorschau-icon {
		font-size: 2.2rem;
	}

	.vorschau-titel {
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		line-height: 1.1;
	}

	.vorschau-datum {
		font-size: 0.82rem;
		color: var(--text-tertiary);
		margin-top: 0.2rem;
	}

	.vorschau-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.7rem;
	}

	.vorschau-item {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.7rem;
		background: var(--bg-input);
		border-radius: var(--radius-sm);
	}

	.vi-label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-tertiary);
		font-weight: 600;
	}

	.vi-wert {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--accent);
	}

	.vi-einh {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.vorschau-meta {
		margin-top: 0.85rem;
		padding-top: 0.85rem;
		border-top: 1px solid var(--border);
		font-size: 0.72rem;
		color: var(--text-tertiary);
		text-align: center;
	}

	/* Form-Felder (gleich wie /log/new) */
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

	input[type='text'],
	textarea {
		padding: 0.8rem 0.9rem;
		background: var(--bg-input);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 1rem;
		width: 100%;
		color: var(--text-primary);
		font-family: inherit;
	}

	input[type='text']:focus,
	textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	textarea {
		min-height: 80px;
		resize: vertical;
	}

	input[type='range'] {
		width: 100%;
		appearance: none;
		background: transparent;
		margin: 0.25rem 0;
	}

	input[type='range']::-webkit-slider-runnable-track {
		height: 6px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 999px;
	}
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 22px;
		height: 22px;
		background: var(--accent);
		border-radius: 50%;
		margin-top: -9px;
		box-shadow: 0 0 12px var(--accent-glow);
		cursor: pointer;
	}
	input[type='range']::-moz-range-track {
		height: 6px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 999px;
	}
	input[type='range']::-moz-range-thumb {
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
		transition:
			background 0.15s,
			transform 0.15s;
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
	}

	.cancel:hover {
		color: var(--text-secondary);
	}
</style>
