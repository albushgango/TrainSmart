import { connectDB } from '$lib/server/db.js';
import Session from '$lib/server/models/session.js';
import { holeOderErstelleProfil } from '$lib/server/models/profil.js';
import { parseTCX } from '$lib/server/tcxParser.js';
import { redirect, fail } from '@sveltejs/kit';

export const actions = {
	/**
	 * Step 1: TCX-Datei parsen und Vorschau-Daten zurückgeben.
	 * Speichert noch nichts — User vervollständigt RPE/Subtyp in Step 2.
	 */
	parsen: async ({ request }) => {
		const data = await request.formData();
		const datei = data.get('datei');

		if (!datei || typeof datei === 'string' || datei.size === 0) {
			return fail(400, { error: 'Bitte eine TCX-Datei auswählen.' });
		}

		// Datei-Endung prüfen (Garmin liefert .tcx)
		const dateiName = datei.name ?? '';
		if (!dateiName.toLowerCase().endsWith('.tcx')) {
			return fail(400, {
				error:
					'Nur .tcx-Dateien werden unterstützt. GPX und FIT folgen evtl. in einer späteren Version.'
			});
		}

		// Max 5 MB (eine typische TCX einer Stunde ist ~2-3 MB)
		if (datei.size > 5 * 1024 * 1024) {
			return fail(400, { error: 'Datei ist zu gross (max. 5 MB).' });
		}

		try {
			await connectDB();
			const profil = await holeOderErstelleProfil();
			const xmlString = await datei.text();
			const geparsed = parseTCX(xmlString, { maxHr: profil.maxHr });

			if (!geparsed.sport) {
				return fail(400, {
					error: `Sport "${geparsed.sportRaw}" ist nicht unterstützt. Aktuell: Running → Laufen, Biking → Rad, Swimming → Schwimmen.`
				});
			}

			return {
				geparsed,
				dateiName
			};
		} catch (err) {
			return fail(400, { error: `TCX-Parsing-Fehler: ${err.message}` });
		}
	},

	/**
	 * Step 2: Vom User vervollständigte Daten speichern.
	 * Die geparsten Werte kommen als JSON im hidden field, RPE/Subtyp/Notiz sind editierbar.
	 */
	speichern: async ({ request }) => {
		const data = await request.formData();
		const geparseDatenJson = String(data.get('geparseDatenJson') ?? '');
		const rpe = Number(data.get('rpe'));
		const subtyp = String(data.get('subtyp') ?? '');
		const notiz = String(data.get('notiz') ?? '');

		if (!geparseDatenJson) {
			return fail(400, { error: 'Geparste Daten fehlen.' });
		}

		if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10) {
			return fail(400, { error: 'RPE muss zwischen 1 und 10 liegen.' });
		}

		let g;
		try {
			g = JSON.parse(geparseDatenJson);
		} catch {
			return fail(400, { error: 'Ungültige geparste Daten.' });
		}

		try {
			await connectDB();
			const session = await Session.create({
				sport: g.sport,
				subtyp,
				datum: new Date(g.datum),
				dauer: g.dauer,
				rpe,
				notiz,
				distanz: g.distanz,
				avgHr: g.avgHr,
				maxHr: g.maxHr,
				calories: g.calories,
				avgCadence: g.avgCadence,
				avgWatts: g.avgWatts,
				hoehenmeter: g.hoehenmeter,
				laufDaten: g.laufDaten
			});

			redirect(303, `/log/${session._id}?toast=gespeichert`);
		} catch (err) {
			// SvelteKit's redirect() wirft eine Exception — die müssen wir durchlassen
			if (err?.status === 303) throw err;
			return fail(500, { error: `Speicher-Fehler: ${err.message}` });
		}
	}
};
