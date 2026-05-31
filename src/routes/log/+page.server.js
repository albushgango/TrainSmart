import { connectDB } from '$lib/server/db.js';
import Session from '$lib/server/models/session.js';

const ERLAUBTE_SPORTARTEN = ['Kraft', 'Laufen', 'Rad', 'Schwimmen'];

export async function load({ url }) {
	await connectDB();

	// Filter aus URL-Param ?sport=Kraft (nur erlaubte Werte)
	const sportFilter = url.searchParams.get('sport');
	const filterAktiv = ERLAUBTE_SPORTARTEN.includes(sportFilter) ? sportFilter : null;
	const datumFilter = url.searchParams.get('datum');
	const datumAktiv = /^\d{4}-\d{2}-\d{2}$/.test(datumFilter ?? '') ? datumFilter : null;

	const query = {};
	if (filterAktiv) query.sport = filterAktiv;
	if (datumAktiv) {
		const start = new Date(`${datumAktiv}T00:00:00.000Z`);
		const ende = new Date(start);
		ende.setUTCDate(ende.getUTCDate() + 1);
		query.datum = { $gte: start, $lt: ende };
	}
	const sessions = await Session.find(query).sort({ datum: -1 }).lean();

	return {
		sessions: sessions.map((s) => ({
			...s,
			_id: s._id.toString(),
			datum: s.datum.toISOString()
		})),
		aktiverFilter: filterAktiv,
		aktivesDatum: datumAktiv
	};
}
