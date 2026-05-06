// Globaler Toast-Store mit Svelte 5 Runes
// Verwendung: import { toast } from '$lib/toast.svelte.js';
//             toast.zeigen('Session gespeichert', 'erfolg');

class ToastStore {
    nachricht = $state('');
    typ = $state('erfolg'); // 'erfolg' | 'fehler' | 'info'
    sichtbar = $state(false);

    /** @type {ReturnType<typeof setTimeout> | null} */
    timer = null;

    /**
     * Zeigt einen Toast an. Verschwindet automatisch nach 3 Sekunden.
     * @param {string} nachricht
     * @param {'erfolg' | 'fehler' | 'info'} typ
     */
    zeigen(nachricht, typ = 'erfolg') {
        if (this.timer) clearTimeout(this.timer);
        this.nachricht = nachricht;
        this.typ = typ;
        this.sichtbar = true;
        this.timer = setTimeout(() => this.verstecken(), 3000);
    }

    verstecken() {
        this.sichtbar = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}

export const toast = new ToastStore();
