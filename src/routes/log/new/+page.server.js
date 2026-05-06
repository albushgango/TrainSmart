import { connectDB } from '$lib/server/db.js';
import Session from '$lib/server/models/session.js';
import Uebung from '$lib/server/models/uebung.js';
import { holeOderErstelleProfil } from '$lib/server/models/profil.js';
import { SPLITS, naechsterSplitTag } from '$lib/splits.js';
import { redirect, fail } from '@sveltejs/kit';

/**
 * Lädt Vorschläge für die neue Session:
 * - vorgeschlagenerSport: zuletzt gewählter Sport
 * - vorgeschlagenerSubtyp: nächster Split-Tag (nur bei Kraft, wenn Split aktiv)
 * - aktiveSplitTage: Tage des aktiven Splits (für Pill-Auswahl)
 */
export async function load() {
    await connectDB();

    const profil = await holeOderErstelleProfil();
    const letzte = await Session.findOne().sort({ datum: -1 }).lean();

    // Aktive Split-Tage bestimmen
    let aktiveSplitTage = [];
    if (profil.aktiverSplit === 'custom') {
        aktiveSplitTage = profil.customSplitTage;
    } else if (SPLITS[profil.aktiverSplit]) {
        aktiveSplitTage = SPLITS[profil.aktiverSplit].tage;
    }

    // Letzte Kraft-Session für Subtyp-Vorschlag (nur Kraft hat Splits)
    const letzteKraft = await Session.findOne({ sport: 'Kraft' }).sort({ datum: -1 }).lean();
    const vorgeschlagenerSubtyp = naechsterSplitTag(aktiveSplitTage, letzteKraft?.subtyp ?? null);

    return {
        vorgeschlagenerSport: letzte?.sport ?? '',
        vorgeschlagenerSubtyp: vorgeschlagenerSubtyp ?? '',
        aktiveSplitTage,
        aktiverSplit: profil.aktiverSplit
    };
}

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();

        const sport = data.get('sport');
        const subtyp = data.get('subtyp') ?? '';
        const datum = data.get('datum');
        const dauer = Number(data.get('dauer'));
        const rpe = Number(data.get('rpe'));
        const notiz = data.get('notiz');
        const uebungenJson = String(data.get('uebungen') ?? '[]');

        if (!sport || !datum || !dauer || !rpe) {
            return fail(400, { error: 'Bitte alle Pflichtfelder ausfüllen.' });
        }

        await connectDB();
        const session = await Session.create({ sport, subtyp, datum, dauer, rpe, notiz });

        // Übungen mitspeichern (nur bei Kraft, nur falls vorhanden)
        // Fehler beim Übungs-Insert sind nicht kritisch — Session ist bereits gespeichert
        if (sport === 'Kraft') {
            try {
                const eingegebene = JSON.parse(uebungenJson);
                if (Array.isArray(eingegebene) && eingegebene.length > 0) {
                    const docs = eingegebene
                        .map(u => ({
                            sessionId: session._id,
                            name: String(u.name ?? '').trim(),
                            saetze: Number(u.saetze) || 1,
                            wiederholungen: Number(u.wiederholungen) || 1,
                            gewicht: Number(u.gewicht) || 0,
                            notiz: ''
                        }))
                        .filter(u => u.name.length > 0);

                    if (docs.length > 0) {
                        await Uebung.insertMany(docs);
                    }
                }
            } catch (err) {
                console.error('Übungen konnten nicht gespeichert werden:', err.message);
            }
        }

        redirect(303, '/log?toast=gespeichert');
    }
};
