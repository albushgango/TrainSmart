import { connectDB } from '$lib/server/db.js';
import Session from '$lib/server/models/session.js';
import Uebung from '$lib/server/models/uebung.js';
import { holeOderErstelleProfil } from '$lib/server/models/profil.js';
import { SPLITS } from '$lib/splits.js';
import { ALLE_UEBUNGEN } from '$lib/uebungen.js';
import { error, fail, redirect } from '@sveltejs/kit';
import mongoose from 'mongoose';

/** Lädt Session, Übungen und Vergleichswerte (letzte gleichnamige Übung) */
export async function load({ params }) {
    if (!mongoose.isValidObjectId(params.id)) {
        throw error(404, 'Session nicht gefunden');
    }

    await connectDB();
    const [session, profil] = await Promise.all([
        Session.findById(params.id).lean(),
        holeOderErstelleProfil()
    ]);

    if (!session) {
        throw error(404, 'Session nicht gefunden');
    }

    // Übungen für diese Session
    const uebungen = await Uebung.find({ sessionId: params.id }).sort({ createdAt: 1 }).lean();

    // Für jede Übung: vorherige Vorkommen (gleicher Name, ältere Sessions) suchen — für Vergleich
    const uebungenMitVergleich = await Promise.all(uebungen.map(async (u) => {
        const vorherige = await Uebung.findOne({
            name: u.name,
            sessionId: { $ne: session._id }
        })
            .populate({ path: 'sessionId', select: 'datum' })
            .sort({ createdAt: -1 })
            .lean();

        // Nur Übungen aus älteren Sessions zählen
        let vergleich = null;
        if (vorherige && vorherige.sessionId?.datum && new Date(vorherige.sessionId.datum) < new Date(session.datum)) {
            vergleich = {
                gewicht: vorherige.gewicht,
                saetze: vorherige.saetze,
                wiederholungen: vorherige.wiederholungen,
                differenz: u.gewicht - vorherige.gewicht
            };
        }

        return {
            ...u,
            _id: u._id.toString(),
            sessionId: u.sessionId.toString(),
            vergleich
        };
    }));

    // Aktive Split-Tage für Subtyp-Auswahl im Edit-Modus
    let aktiveSplitTage = [];
    if (profil.aktiverSplit === 'custom') {
        aktiveSplitTage = profil.customSplitTage;
    } else if (SPLITS[profil.aktiverSplit]) {
        aktiveSplitTage = SPLITS[profil.aktiverSplit].tage;
    }

    // Auto-Complete-Vorschläge: vordefinierte Übungen + bisher genutzte
    // (Set entfernt Duplikate, History-Übungen die schon in der vordefinierten Liste sind)
    const distinctNamen = await Uebung.distinct('name');
    const alleNamen = [...new Set([
        ...ALLE_UEBUNGEN.map(u => u.name),
        ...distinctNamen
    ])].sort();

    return {
        session: {
            ...session,
            _id: session._id.toString(),
            datum: session.datum.toISOString()
        },
        uebungen: uebungenMitVergleich,
        aktiveSplitTage,
        uebungsVorschlaege: alleNamen
    };
}

export const actions = {
    /** Aktualisiert die Session mit den Form-Werten */
    update: async ({ request, params }) => {
        if (!mongoose.isValidObjectId(params.id)) {
            return fail(404, { error: 'Session nicht gefunden' });
        }

        const data = await request.formData();
        const sport = data.get('sport');
        const subtyp = data.get('subtyp') ?? '';
        const datum = data.get('datum');
        const dauer = Number(data.get('dauer'));
        const rpe = Number(data.get('rpe'));
        const notiz = data.get('notiz') ?? '';

        // Lauf-/Rad-Felder (optional)
        const distanzRaw = data.get('distanz');
        const avgHrRaw = data.get('avgHr');
        const hoehenmeterRaw = data.get('hoehenmeter');

        if (!sport || !datum || !dauer || !rpe) {
            return fail(400, { error: 'Bitte alle Pflichtfelder ausfüllen.' });
        }

        // Datum darf nicht in der Zukunft liegen
        const heute = new Date();
        heute.setHours(23, 59, 59, 999);
        if (new Date(datum) > heute) {
            return fail(400, { error: 'Das Datum darf nicht in der Zukunft liegen.' });
        }

        // Lauf-Felder parsen — leerer String → null (Schema entfernt das Feld)
        const distanz = distanzRaw && Number.isFinite(Number(distanzRaw)) ? Number(distanzRaw) : null;
        const avgHr = avgHrRaw && Number.isFinite(Number(avgHrRaw)) ? Number(avgHrRaw) : null;
        const hoehenmeter = hoehenmeterRaw && Number.isFinite(Number(hoehenmeterRaw)) ? Number(hoehenmeterRaw) : null;

        try {
            await connectDB();
            const updated = await Session.findByIdAndUpdate(
                params.id,
                { sport, subtyp, datum, dauer, rpe, notiz, distanz, avgHr, hoehenmeter },
                { new: true, runValidators: true }
            );

            if (!updated) {
                return fail(404, { error: 'Session nicht gefunden' });
            }

            return { success: true };
        } catch (err) {
            return fail(500, { error: `Fehler beim Speichern: ${err.message}` });
        }
    },

    /** Löscht die Session und alle zugehörigen Übungen */
    delete: async ({ params }) => {
        if (!mongoose.isValidObjectId(params.id)) {
            return fail(404, { error: 'Session nicht gefunden' });
        }

        try {
            await connectDB();
            await Promise.all([
                Session.findByIdAndDelete(params.id),
                Uebung.deleteMany({ sessionId: params.id })
            ]);
        } catch (err) {
            return fail(500, { error: `Fehler beim Löschen: ${err.message}` });
        }

        redirect(303, '/log?toast=geloescht');
    },

    /** Fügt eine neue Übung zur Session hinzu */
    uebungHinzufuegen: async ({ request, params }) => {
        if (!mongoose.isValidObjectId(params.id)) {
            return fail(404, { error: 'Session nicht gefunden' });
        }

        const data = await request.formData();
        const name = String(data.get('name') ?? '').trim();
        const saetze = Number(data.get('saetze'));
        const wiederholungen = Number(data.get('wiederholungen'));
        const gewicht = Number(data.get('gewicht'));
        const notiz = String(data.get('notiz') ?? '');

        if (!name || !Number.isFinite(saetze) || !Number.isFinite(wiederholungen) || !Number.isFinite(gewicht)) {
            return fail(400, { uebungError: 'Bitte alle Übungs-Felder ausfüllen.' });
        }

        try {
            await connectDB();
            await Uebung.create({
                sessionId: params.id,
                name,
                saetze,
                wiederholungen,
                gewicht,
                notiz
            });
            return { uebungSuccess: true };
        } catch (err) {
            return fail(500, { uebungError: `Fehler: ${err.message}` });
        }
    },

    /** Aktualisiert eine bestehende Übung */
    uebungAktualisieren: async ({ request }) => {
        const data = await request.formData();
        const uebungId = String(data.get('uebungId') ?? '');

        if (!mongoose.isValidObjectId(uebungId)) {
            return fail(400, { uebungError: 'Ungültige Übungs-ID' });
        }

        const name = String(data.get('name') ?? '').trim();
        const saetze = Number(data.get('saetze'));
        const wiederholungen = Number(data.get('wiederholungen'));
        const gewicht = Number(data.get('gewicht'));
        const notiz = String(data.get('notiz') ?? '');

        if (!name || !Number.isFinite(saetze) || !Number.isFinite(wiederholungen) || !Number.isFinite(gewicht)) {
            return fail(400, { uebungError: 'Bitte alle Übungs-Felder ausfüllen.' });
        }

        try {
            await connectDB();
            await Uebung.findByIdAndUpdate(
                uebungId,
                { name, saetze, wiederholungen, gewicht, notiz },
                { runValidators: true }
            );
            return { uebungSuccess: true };
        } catch (err) {
            return fail(500, { uebungError: `Fehler: ${err.message}` });
        }
    },

    /** Löscht eine Übung */
    uebungLoeschen: async ({ request }) => {
        const data = await request.formData();
        const uebungId = String(data.get('uebungId') ?? '');

        if (!mongoose.isValidObjectId(uebungId)) {
            return fail(400, { uebungError: 'Ungültige Übungs-ID' });
        }

        try {
            await connectDB();
            await Uebung.findByIdAndDelete(uebungId);
            return { uebungSuccess: true };
        } catch (err) {
            return fail(500, { uebungError: `Fehler: ${err.message}` });
        }
    }
};
