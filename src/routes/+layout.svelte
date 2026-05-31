<script>
	import { page } from '$app/stores';
	import Toast from '$lib/Toast.svelte';
	import { toast } from '$lib/toast.svelte.js';
	import { goto } from '$app/navigation';

	let { children } = $props();

	// Bottom-Nav: 4 Tabs mit eigenen SVG-Icons (keine Emojis mehr — cleaner Look)
	const navItems = [
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/log', label: 'Log', icon: 'log' },
		{ href: '/stats', label: 'Stats', icon: 'stats' },
		{ href: '/profil', label: 'Profil', icon: 'profil' }
	];

	// Toast-Auslöser via URL-Parameter (?toast=gespeichert | gelöscht | aktualisiert)
	$effect(() => {
		const t = $page.url.searchParams.get('toast');
		if (!t) return;

		const nachrichten = {
			gespeichert: 'Session gespeichert',
			geloescht: 'Session gelöscht',
			aktualisiert: 'Änderungen gespeichert'
		};
		if (nachrichten[t]) toast.zeigen(nachrichten[t], 'erfolg');

		// Param aus URL entfernen, damit beim Reload kein Toast mehr kommt
		const url = new URL($page.url);
		url.searchParams.delete('toast');
		goto(url.pathname + url.search, { replaceState: true, noScroll: true, keepFocus: true });
	});
</script>

<main class="app-content">
	{@render children()}
</main>

<Toast />

<nav class="bottom-nav">
	{#each navItems as item}
		{@const aktiv =
			$page.url.pathname === item.href ||
			($page.url.pathname.startsWith(item.href) && item.href !== '/')}
		<a href={item.href} class="nav-item" class:active={aktiv}>
			<span class="nav-icon" aria-hidden="true">
				{#if item.icon === 'home'}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M3 11.5L12 4l9 7.5" />
						<path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
					</svg>
				{:else if item.icon === 'log'}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="4" y="3" width="16" height="18" rx="2" />
						<path d="M8 8h8" />
						<path d="M8 12h8" />
						<path d="M8 16h5" />
					</svg>
				{:else if item.icon === 'stats'}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M3 21h18" />
						<rect x="5" y="13" width="3" height="6" />
						<rect x="10.5" y="9" width="3" height="10" />
						<rect x="16" y="5" width="3" height="14" />
					</svg>
				{:else if item.icon === 'profil'}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="8" r="4" />
						<path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
					</svg>
				{/if}
			</span>
			<span class="nav-label">{item.label}</span>
		</a>
	{/each}
</nav>

<style>
	/* Globale Theme-Variablen — werden in allen Pages verwendet */
	:global(:root) {
		/* Hintergrund-Layer */
		--bg-primary: #0a0e14;
		--bg-card: #161b22;
		--bg-elevated: #1c2128;
		--bg-input: #0d1117;

		/* Borders & Trennlinien — bewusst subtil für ein cleaneres Look */
		--border: rgba(240, 246, 252, 0.08);
		--border-strong: rgba(240, 246, 252, 0.18);

		/* Globale Radii für Konsistenz */
		--radius-sm: 10px;
		--radius-md: 14px;
		--radius-lg: 18px;
		--radius-xl: 22px;

		/* Text */
		--text-primary: #f0f6fc;
		--text-secondary: #8b949e;
		--text-tertiary: #6e7681;

		/* Akzent (Lime — Athletic) */
		--accent: #84cc16;
		--accent-hover: #a3e635;
		--accent-glow: rgba(132, 204, 22, 0.25);

		/* Sport-Farben */
		--sport-kraft: #ef4444;
		--sport-laufen: #84cc16;
		--sport-rad: #06b6d4;
		--sport-schwimmen: #3b82f6;

		/* Herzfrequenz-Zonen */
		--zone-1: #3b82f6;
		--zone-2: #84cc16;
		--zone-3: #facc15;
		--zone-4: #f97316;
		--zone-5: #ef4444;

		/* Empfehlungs-Farben */
		--empf-heavy: #ef4444;
		--empf-light: #f59e0b;
		--empf-rest: #3b82f6;
		--empf-erledigt: #22c55e;

		/* Status */
		--error-bg: rgba(239, 68, 68, 0.15);
		--error-text: #fca5a5;
		--error-border: rgba(239, 68, 68, 0.3);

		/* CTA-Buttons: weisser Background, dunkler Text */
		--cta-bg: #f0f6fc;
		--cta-bg-hover: #ffffff;
		--cta-color: #0a0e14;
	}

	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
		-webkit-font-smoothing: antialiased;
		user-select: none;
		-webkit-user-select: none;
	}

	/* Subtiler Hintergrund-Effekt — leichter Glow oben */
	:global(body::before) {
		content: '';
		position: fixed;
		top: -200px;
		left: 50%;
		transform: translateX(-50%);
		width: 600px;
		height: 400px;
		background: radial-gradient(ellipse, var(--accent-glow) 0%, transparent 60%);
		pointer-events: none;
		z-index: 0;
		opacity: 0.4;
	}

	:global(h1),
	:global(h2),
	:global(h3),
	:global(.panel-heading),
	:global(.section-label) {
		cursor: default;
		user-select: none;
		-webkit-user-select: none;
		pointer-events: none;
	}

	:global(input),
	:global(textarea),
	:global(select),
	:global([contenteditable='true']) {
		user-select: text;
		-webkit-user-select: text;
	}

	.app-content {
		padding-bottom: 84px; /* Platz für Bottom Nav */
		min-height: 100dvh;
		position: relative;
		z-index: 1;
	}

	/* Bottom-Nav — sauberer Look mit SVG-Icons */
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 72px;
		background: rgba(10, 14, 20, 0.92);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border-top: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-around;
		z-index: 100;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		text-decoration: none;
		color: var(--text-tertiary);
		flex: 1;
		padding: 0.5rem 0;
		transition: color 0.2s ease;
		position: relative;
	}

	.nav-item.active {
		color: var(--accent);
	}

	/* Aktiver Tab: dünner Lime-Strich oben */
	.nav-item.active::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 28px;
		height: 2px;
		background: var(--accent);
		border-radius: 0 0 4px 4px;
		box-shadow: 0 0 14px var(--accent-glow);
	}

	.nav-icon {
		width: 22px;
		height: 22px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.nav-icon svg {
		width: 100%;
		height: 100%;
		stroke: currentColor;
	}

	.nav-label {
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	@media (min-width: 900px) {
		.app-content {
			padding-bottom: 0;
			padding-left: 96px;
		}

		.bottom-nav {
			top: 0;
			right: auto;
			width: 88px;
			height: 100dvh;
			flex-direction: column;
			justify-content: flex-start;
			gap: 0.35rem;
			padding: 1.25rem 0;
			border-top: none;
			border-right: 1px solid var(--border);
		}

		.nav-item {
			flex: 0;
			width: 100%;
			min-height: 70px;
			justify-content: center;
		}

		.nav-item.active::before {
			top: 50%;
			left: 0;
			width: 3px;
			height: 32px;
			transform: translateY(-50%);
			border-radius: 0 4px 4px 0;
		}
	}
</style>
