import { connectDB } from '$lib/server/db.js';
import { holeOderErstelleProfil } from '$lib/server/models/profil.js';
import { SPLITS } from '$lib/splits.js';
import { fail, redirect } from '@sveltejs/kit';

export async function load() {
    await connectDB();
    const profil = await holeOderErstelleProfil();

    return {
        profil: {
            aktiverSplit: profil.aktiverSplit,
            customSplitTage: profil.customSplitTage,
            wochenziel: profil.wochenziel
        }
    };
}

export const actions = {
    /** Speichert den ausgewählten Split (oder Custom-Split-Tage) */
    splitSpeichern: async ({ request }) => {
        const data = await request.formData();
        const aktiverSplit = String(data.get('aktiverSplit') ?? 'kein');
        const customRaw = String(data.get('customSplitTage') ?? '');

        // Custom-Tage: kommasepariert, getrimmt, leere weg
        const customTage = customRaw
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        // Validierung: Bei vordefiniertem Split muss die ID existieren
        const istCustom = aktiverSplit === 'custom';
        if (!istCustom && !SPLITS[aktiverSplit]) {
            return fail(400, { error: 'Ungültiger Split' });
        }
        if (istCustom && customTage.length === 0) {
            return fail(400, { error: 'Custom-Split braucht mindestens einen Tag' });
        }

        await connectDB();
        const profil = await holeOderErstelleProfil();
        profil.aktiverSplit = aktiverSplit;
        profil.customSplitTage = istCustom ? customTage : [];
        await profil.save();

        redirect(303, '/profil?toast=aktualisiert');
    },

    /** Speichert das Wochenziel (Phase D) */
    wochenzielSpeichern: async ({ request }) => {
        const data = await request.formData();
        const wochenziel = Number(data.get('wochenziel'));

        if (!Number.isFinite(wochenziel) || wochenziel < 1 || wochenziel > 14) {
            return fail(400, { error: 'Wochenziel muss zwischen 1 und 14 sein' });
        }

        await connectDB();
        const profil = await holeOderErstelleProfil();
        profil.wochenziel = wochenziel;
        await profil.save();

        redirect(303, '/profil?toast=aktualisiert');
    }
};
