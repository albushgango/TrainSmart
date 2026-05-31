import { connectDB } from '$lib/server/db.js';
import Session from '$lib/server/models/session.js';
import Uebung from '$lib/server/models/uebung.js';

/** Escaped einen Wert für CSV (RFC 4180): Anführungszeichen verdoppeln, ggf. quoten */
function csvFeld(wert) {
	if (wert == null) return '';
	const s = String(wert);
	if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes(';')) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

/** GET /log/export → CSV-Download mit allen Sessions und Übungen */
export async function GET() {
	await connectDB();

	const sessions = await Session.find().sort({ datum: -1 }).lean();
	const uebungen = await Uebung.find().lean();

	// Übungen pro Session gruppieren
	const uebungenProSession = new Map();
	uebungen.forEach((u) => {
		const sid = u.sessionId.toString();
		if (!uebungenProSession.has(sid)) uebungenProSession.set(sid, []);
		uebungenProSession.get(sid).push(u);
	});

	// CSV-Header (Excel-CH versteht Semikolon besser als Komma; wir bleiben aber bei Komma als Standard)
	const zeilen = [['Datum', 'Sport', 'Subtyp', 'Dauer (min)', 'RPE', 'Notiz', 'Übungen'].join(',')];

	sessions.forEach((s) => {
		const datum = new Date(s.datum).toISOString().split('T')[0];
		const uebungenList = uebungenProSession.get(s._id.toString()) ?? [];
		// Übungen kompakt darstellen: "Bench: 4×8 @ 80kg | Squat: 3×10 @ 100kg"
		const uebungenStr = uebungenList
			.map((u) => `${u.name}: ${u.saetze}×${u.wiederholungen} @ ${u.gewicht}kg`)
			.join(' | ');

		zeilen.push(
			[
				datum,
				csvFeld(s.sport),
				csvFeld(s.subtyp ?? ''),
				s.dauer,
				s.rpe,
				csvFeld(s.notiz ?? ''),
				csvFeld(uebungenStr)
			].join(',')
		);
	});

	const csv = zeilen.join('\n');
	const dateiname = `trainsmart-export-${new Date().toISOString().split('T')[0]}.csv`;

	// BOM für Excel UTF-8 Erkennung
	const bom = '﻿';

	return new Response(bom + csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${dateiname}"`
		}
	});
}
