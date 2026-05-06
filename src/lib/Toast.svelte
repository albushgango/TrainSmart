<script>
    import { toast } from './toast.svelte.js';
</script>

{#if toast.sichtbar}
    <div class="toast" class:erfolg={toast.typ === 'erfolg'}
        class:fehler={toast.typ === 'fehler'}
        class:info={toast.typ === 'info'}
        role="status"
        aria-live="polite">
        <span class="icon">
            {#if toast.typ === 'erfolg'}✓{:else if toast.typ === 'fehler'}!{:else}ℹ{/if}
        </span>
        <span class="nachricht">{toast.nachricht}</span>
    </div>
{/if}

<style>
    .toast {
        position: fixed;
        bottom: 88px; /* über der Bottom-Nav */
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        color: var(--text-primary);
        padding: 0.75rem 1.1rem;
        border-radius: 12px;
        font-size: 0.9rem;
        font-weight: 600;
        z-index: 300;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        animation: einblenden 0.25s ease-out;
        max-width: calc(100vw - 2rem);
    }

    .icon {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        font-weight: 700;
        flex-shrink: 0;
    }

    .erfolg {
        border-color: rgba(132, 204, 22, 0.4);
    }

    .erfolg .icon {
        background: var(--accent);
        color: #0a0e14;
        box-shadow: 0 0 12px var(--accent-glow);
    }

    .fehler {
        border-color: rgba(239, 68, 68, 0.4);
    }

    .fehler .icon {
        background: var(--sport-kraft);
        color: #fff;
    }

    .info .icon {
        background: var(--sport-rad);
        color: #fff;
    }

    @keyframes einblenden {
        from {
            transform: translate(-50%, 12px);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
</style>
