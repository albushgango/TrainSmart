import { connectDB } from '$lib/server/db.js';
import Session from '$lib/server/models/session.js';
import Uebung from '$lib/server/models/uebung.js';
import { holeOderErstelleProfil } from '$lib/server/models/profil.js';
import { SPLITS, naechsterSplitTag } from '$lib/splits.js';
import { redirect, fail } from '@sveltejs/kit';

const AKTIVE_SPORTARTEN = ['Kraft', 'Laufen'];

/**
 * Lädt Vorschläge für die neue Session:
 * - vorgeschlagenerSport: zuletzt gewählter Sport
 * - vorgeschlagenerSubtyp: nächster Split-Tag (nur bei Kraft, wenn Split aktiv)
 * - aktiveSplitTage: Tage des aktiven Splits (für Pill-Auswahl)
 */
export async function load({ url }) {
    await connectDB();

    const profil = await holeOderErstelleProfil();
    const letzte = await Session.findOne().sort({ datum: -1 }).lean();
    const sportParam = url.searchParams.get('sport');
    const subtypParam = url.searchParams.get('subtyp');
    const quelleParam = url.searchParams.get('quelle');

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
    const sportAusParam = AKTIVE_SPORTARTEN.includes(sportParam) ? sportParam : null;
    const letzterAktiverSport = AKTIVE_SPORTARTEN.includes(letzte?.sport) ? letzte.sport : '';
    const subtypAusParam = subtypParam?.trim() || null;

    return {
        vorgeschlagenerSport: sportAusParam ?? (subtypAusParam ? 'Kraft' : letzterAktiverSport),
        vorgeschlagenerSubtyp: subtypAusParam ?? vorgeschlagenerSubtyp ?? '',
        aktiveSplitTage,
        aktiverSplit: profil.aktiverSplit,
        vorschlagQuelle: quelleParam === 'empfehlung' ? 'empfehlung' : ''
    };
}

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();

        const sport = String(data.get('sport') ?? '');
        const subtyp = data.get('subtyp') ?? '';
        const datum = data.get('datum');
        const dauer = Number(data.get('dauer'));
        const rpe = Number(data.get('rpe'));
        const notiz = data.get('notiz');
        const uebungenJson = String(data.get('uebungen') ?? '[]');

        // Lauf-/Rad-spezifische Felder (alle optional, auch nur bei diesen Sportarten erfasst)
        const distanzRaw = data.get('distanz');
        const avgHrRaw = data.get('avgHr');
        const hoehenmeterRaw = data.get('hoehenmeter');

        if (!sport || !datum || !dauer || !rpe) {
            return fail(400, { error: 'Bitte alle Pflichtfelder ausfüllen.' });
        }

        if (!AKTIVE_SPORTARTEN.includes(sport)) {
            return fail(400, { error: 'Rad und Schwimmen werden später ergänzt. Bitte wähle aktuell Kraft oder Laufen.' });
        }

        // Datum darf nicht in der Zukunft liegen
        const heute = new Date();
        heute.setHours(23, 59, 59, 999); // Heute 23:59 — alles bis Tagesende erlauben
        if (new Date(datum) > heute) {
            return fail(400, { error: 'Das Datum darf nicht in der Zukunft liegen.' });
        }

        // Lauf-Felder parsen — leerer String / NaN → undefined (Schema lässt's weg)
        const distanz = distanzRaw && Number.isFinite(Number(distanzRaw)) ? Number(distanzRaw) : undefined;
        const avgHr = avgHrRaw && Number.isFinite(Number(avgHrRaw)) ? Number(avgHrRaw) : undefined;
        const hoehenmeter = hoehenmeterRaw && Number.isFinite(Number(hoehenmeterRaw)) ? Number(hoehenmeterRaw) : undefined;

        await connectDB();
        const session = await Session.create({
            sport, subtyp, datum, dauer, rpe, notiz,
            distanz, avgHr, hoehenmeter
        });

        // Übungen mitspeichern (nur bei Kraft, nur falls vorhanden)
        // Fehler beim Übungs-Insert sind nicht kritisch — Session ist bereits gespeichert
        if (sport === 'Kraft') {
            try {
                const eingegebene = JSON.parse(uebungenJson);
                if (Array.isArray(eingegebene) && eingegebene.length > 0) {
                    const docs = eingegebene
                        .map(u => {
                            const sets = Array.isArray(u.sets) ? u.sets : [];
                            const erledigteSets = sets
                                .map(set => ({
                                    wiederholungen: Number(set.wiederholungen) || 1,
                                    gewicht: Number(set.gewicht) || 0,
                                    erledigt: Boolean(set.erledigt)
                                }))
                                .filter(set => set.erledigt);
                            const referenzSets = erledigteSets.length > 0 ? erledigteSets : [];
                            const schwerstesSet = referenzSets.reduce((bestes, set) =>
                                set.gewicht >= bestes.gewicht ? set : bestes, referenzSets[0]
                            );
                            const liveNotiz = erledigteSets.length > 0
                                ? `Live-Sets: ${erledigteSets.map(set => `${set.wiederholungen}x${set.gewicht}kg`).join(', ')}`
                                : '';

                            return {
                                sessionId: session._id,
                                name: String(u.name ?? '').trim(),
                                saetze: erledigteSets.length || Number(u.saetze) || 1,
                                wiederholungen: Number(schwerstesSet?.wiederholungen) || Number(u.wiederholungen) || 1,
                                gewicht: Number(schwerstesSet?.gewicht) || Number(u.gewicht) || 0,
                                notiz: liveNotiz
                            };
                        })
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
