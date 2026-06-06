<script>
	import { SPLITS, SUBTYPEN_NACH_SPORT } from '$lib/splits.js';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Editierbare Werte (initialisiert aus Profil)
	let gewaehlterSplit = $state(data.profil.aktiverSplit);
	let customTageText = $state(data.profil.customSplitTage.join(', '));
	let wochenziel = $state(data.profil.wochenziel);
	let maxHr = $state(data.profil.maxHr ?? 190);

	// Splits als Array für #each
	const splitListe = Object.values(SPLITS);

	// ── Eigener Split: kontrollierte Auswahl aus hinterlegten Trainingstagen ──
	const VERFUEGBARE_SPLIT_TAGE = [
		...new Set([...Object.values(SPLITS).flatMap((s) => s.tage), ...SUBTYPEN_NACH_SPORT.Kraft])
	];

	// Aktuell gewählte Rotation als Array (Quelle bleibt customTageText für den Form-Submit)
	let customTage = $derived(
		customTageText
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean)
	);

	let customSuche = $state('');
	let customDropdownOffen = $state(false);
	let customComboEl = $state(null);

	// Vorschläge: alle hinterlegten Tage, die zur Suche passen und noch nicht gewählt sind
	let gefilterteTage = $derived(
		VERFUEGBARE_SPLIT_TAGE.filter(
			(t) => t.toLowerCase().includes(customSuche.toLowerCase()) && !customTage.includes(t)
		)
	);

	function tagHinzufuegen(tag) {
		if (customTage.includes(tag)) return;
		customTageText = [...customTage, tag].join(', ');
		customSuche = '';
		customDropdownOffen = false;
	}

	function tagEntfernen(tag) {
		customTageText = customTage.filter((t) => t !== tag).join(', ');
	}

	// Dropdown schliessen bei Klick ausserhalb
	$effect(() => {
		if (!customDropdownOffen) return;
		function handleAussenklick(e) {
			if (customComboEl && !customComboEl.contains(e.target)) {
				customDropdownOffen = false;
			}
		}
		window.addEventListener('mousedown', handleAussenklick);
		return () => window.removeEventListener('mousedown', handleAussenklick);
	});
</script>

<div class="page">
	<header>
		<h1>PROFIL</h1>
		<p class="sub">Trainings-Split und Ziel definieren</p>
	</header>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}

	<!-- Wochenziel -->
	<section class="card">
		<div class="card-header">
			<h2>Wochenziel</h2>
			<p class="card-sub">Wie viele Trainings möchtest du pro Woche absolvieren?</p>
		</div>

		<form method="POST" action="?/wochenzielSpeichern" use:enhance class="ziel-form">
			<div class="ziel-eingabe">
				<input
					type="number"
					name="wochenziel"
					bind:value={wochenziel}
					min="1"
					max="14"
					required
					class="ziel-input"
				/>
				<span class="ziel-einheit">Sessions / Woche</span>
			</div>
			<button type="submit" class="btn-primary">Speichern</button>
		</form>
	</section>

	<!-- Herzfrequenz-Zonen -->
	<section class="card">
		<div class="card-header">
			<h2>Herzfrequenz-Zonen</h2>
			<p class="card-sub">
				Basis für TCX-Laufanalyse: Zone 1-5 wird aus deiner maximalen Herzfrequenz berechnet.
			</p>
		</div>

		<form method="POST" action="?/herzfrequenzSpeichern" use:enhance class="ziel-form">
			<div class="ziel-eingabe">
				<input
					type="number"
					name="maxHr"
					bind:value={maxHr}
					min="120"
					max="230"
					required
					class="ziel-input"
				/>
				<span class="ziel-einheit">Max HR (bpm)</span>
			</div>
			<button type="submit" class="btn-primary">Speichern</button>
		</form>

		<div class="zonen-vorschau">
			<span>Z1 bis {Math.round(maxHr * 0.6) - 1}</span>
			<span>Z2 {Math.round(maxHr * 0.6)}-{Math.round(maxHr * 0.7) - 1}</span>
			<span>Z3 {Math.round(maxHr * 0.7)}-{Math.round(maxHr * 0.8) - 1}</span>
			<span>Z4 {Math.round(maxHr * 0.8)}-{Math.round(maxHr * 0.9) - 1}</span>
			<span>Z5 ab {Math.round(maxHr * 0.9)}</span>
		</div>
	</section>

	<!-- Split-Auswahl -->
	<section class="card">
		<div class="card-header">
			<h2>Trainings-Split</h2>
			<p class="card-sub">Wähle einen Split — die App schlägt dir den nächsten Tag vor</p>
		</div>

		<form method="POST" action="?/splitSpeichern" use:enhance>
			<div class="split-liste">
				{#each splitListe as split}
					<label class="split-option" class:gewaehlt={gewaehlterSplit === split.id}>
						<input type="radio" name="aktiverSplit" value={split.id} bind:group={gewaehlterSplit} />
						<div class="split-info">
							<div class="split-titel">{split.name}</div>
							<div class="split-beschr">{split.beschreibung}</div>
							{#if split.tage.length > 0}
								<div class="split-tage">
									{#each split.tage as tag}
										<span class="tag-pill">{tag}</span>
									{/each}
								</div>
							{/if}
						</div>
					</label>
				{/each}

				<!-- Custom-Split -->
				<div class="split-option custom-split" class:gewaehlt={gewaehlterSplit === 'custom'}>
					<label class="custom-head">
						<input type="radio" name="aktiverSplit" value="custom" bind:group={gewaehlterSplit} />
						<div class="split-info">
							<div class="split-titel">Eigener Split</div>
							<div class="split-beschr">Stelle deine Rotation aus den Trainingstagen zusammen</div>
						</div>
					</label>
					{#if gewaehlterSplit === 'custom'}
						{#if customTage.length > 0}
							<div class="custom-rotation">
								{#each customTage as tag, i (tag)}
									<span class="rotation-pill">
										<span class="rotation-nr">{i + 1}</span>
										{tag}
										<button
											type="button"
											class="rotation-remove"
											onclick={() => tagEntfernen(tag)}
											aria-label="{tag} entfernen">×</button
										>
									</span>
								{/each}
							</div>
						{/if}
						<div class="custom-combo" bind:this={customComboEl}>
							<input
								type="text"
								class="custom-input"
								bind:value={customSuche}
								onfocus={() => (customDropdownOffen = true)}
								placeholder="Trainingstag wählen …"
								autocomplete="off"
							/>
							{#if customDropdownOffen && gefilterteTage.length > 0}
								<div class="custom-dropdown">
									{#each gefilterteTage as tag (tag)}
										<button type="button" class="custom-option" onclick={() => tagHinzufuegen(tag)}
											>{tag}</button
										>
									{/each}
								</div>
							{/if}
						</div>
						<input type="hidden" name="customSplitTage" value={customTageText} />
					{/if}
				</div>
			</div>

			<button type="submit" class="btn-primary btn-full">Split speichern</button>
		</form>
	</section>
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

	.error {
		background: var(--error-bg);
		color: var(--error-text);
		border: 1px solid var(--error-border);
		padding: 0.85rem;
		border-radius: 10px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	/* Karten */
	.card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-xl);
		padding: 1.4rem;
		margin-bottom: 1rem;
	}

	.card-header {
		margin-bottom: 1.1rem;
	}

	h2 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: -0.015em;
		color: var(--text-primary);
	}

	.card-sub {
		margin: 0.35rem 0 0;
		font-size: 0.78rem;
		color: var(--text-tertiary);
		line-height: 1.5;
		font-weight: 500;
	}

	/* Wochenziel */
	.ziel-form {
		display: flex;
		gap: 0.6rem;
		align-items: stretch;
	}

	.ziel-eingabe {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: var(--bg-input);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.4rem 0.85rem;
		flex: 1;
	}

	.ziel-input {
		background: transparent;
		border: none;
		color: var(--accent);
		font-size: 1.4rem;
		font-weight: 800;
		width: 72px;
		text-align: center;
		padding: 0.3rem 0;
		font-family: inherit;
	}

	.ziel-input:focus {
		outline: none;
	}

	.ziel-einheit {
		font-size: 0.85rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.zonen-vorschau {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.85rem;
	}

	.zonen-vorschau span {
		padding: 0.25rem 0.55rem;
		background: var(--bg-input);
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--text-secondary);
		font-size: 0.72rem;
		font-weight: 600;
	}

	.btn-primary {
		background: var(--cta-bg);
		color: var(--cta-color);
		padding: 0.8rem 1.2rem;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
		transition:
			background 0.15s,
			transform 0.15s;
	}

	.btn-primary:hover {
		background: var(--cta-bg-hover);
		transform: translateY(-1px);
	}

	.btn-full {
		width: 100%;
		margin-top: 0.85rem;
		padding: 1rem;
		font-size: 1rem;
		border-radius: var(--radius-md);
	}

	/* Split-Liste */
	.split-liste {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.split-option {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.85rem 1rem;
		background: var(--bg-input);
		border: 1px solid var(--border);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.split-option:hover {
		background: var(--bg-elevated);
		border-color: var(--border-strong);
	}

	.split-option.gewaehlt {
		background: var(--bg-elevated);
		border-color: var(--accent);
		box-shadow:
			0 0 0 1px var(--accent),
			0 0 16px var(--accent-glow);
	}

	.split-option input[type='radio'] {
		display: none;
	}

	.split-info {
		flex: 1;
		min-width: 0;
	}

	.split-titel {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.15rem;
	}

	.split-beschr {
		font-size: 0.78rem;
		color: var(--text-tertiary);
		line-height: 1.45;
		margin-bottom: 0.6rem;
	}

	.split-tage {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin-top: 0.4rem;
	}

	.tag-pill {
		padding: 0.2rem 0.55rem;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.split-option.gewaehlt .tag-pill {
		background: rgba(132, 204, 22, 0.1);
		border-color: rgba(132, 204, 22, 0.4);
		color: var(--accent);
	}

	.custom-split {
		flex-direction: column;
	}

	.custom-head {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
	}

	.custom-rotation {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.6rem;
	}

	.rotation-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.5rem 0.25rem 0.3rem;
		background: rgba(132, 204, 22, 0.12);
		border: 1px solid rgba(132, 204, 22, 0.4);
		border-radius: 999px;
		font-size: 0.8rem;
		color: var(--accent);
		font-weight: 600;
	}

	.rotation-nr {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--accent);
		color: #0a0e14;
		font-size: 0.7rem;
		font-weight: 800;
	}

	.rotation-remove {
		background: none;
		border: none;
		color: var(--accent);
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		padding: 0;
		opacity: 0.7;
	}

	.rotation-remove:hover {
		opacity: 1;
	}

	.custom-combo {
		position: relative;
		margin-top: 0.6rem;
	}

	.custom-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: 20;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 8px;
		max-height: 220px;
		overflow-y: auto;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.custom-option {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.75rem;
		background: none;
		border: none;
		color: var(--text-primary);
		font-size: 0.85rem;
		cursor: pointer;
	}

	.custom-option:hover {
		background: var(--bg-elevated);
		color: var(--accent);
	}

	.custom-input {
		margin-top: 0.5rem;
		padding: 0.55rem 0.75rem;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-size: 0.85rem;
		width: 100%;
		color: var(--text-primary);
		font-family: inherit;
	}

	.custom-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.custom-input:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@media (min-width: 900px) {
		.page {
			max-width: 1180px;
			padding: 2.25rem 2rem 2rem;
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1rem;
			align-items: start;
		}

		header,
		.error,
		.card:nth-of-type(3) {
			grid-column: 1 / -1;
		}

		header {
			margin-bottom: 0.75rem;
		}

		h1 {
			font-size: 1.8rem;
		}

		.sub {
			font-size: 0.95rem;
		}

		.card {
			height: 100%;
			margin-bottom: 0;
			padding: 1.5rem;
		}

		.card:nth-of-type(3) {
			height: auto;
		}

		h2 {
			font-size: 1.15rem;
		}

		.card-sub {
			font-size: 0.82rem;
		}

		.ziel-form {
			min-height: 54px;
		}

		.split-liste {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
			gap: 0.8rem;
		}

		.split-option {
			min-height: 126px;
			padding: 1rem;
		}

		.split-titel {
			font-size: 1rem;
		}

		.btn-full {
			max-width: 360px;
		}
	}
</style>
