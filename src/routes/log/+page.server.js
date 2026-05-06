import { connectDB } from '$lib/server/db.js';
import Session from '$lib/server/models/session.js';

const ERLAUBTE_SPORTARTEN = ['Kraft', 'Laufen', 'Rad', 'Schwimmen'];

export async function load({ url }) {
    await connectDB();

    // Filter aus URL-Param ?sport=Kraft (nur erlaubte Werte)
    const sportFilter = url.searchParams.get('sport');
    const filterAktiv = ERLAUBTE_SPORTARTEN.includes(sportFilter) ? sportFilter : null;

    const query = filterAktiv ? { sport: filterAktiv } : {};
    const sessions = await Session.find(query).sort({ datum: -1 }).lean();

    return {
        sessions: sessions.map(s => ({
            ...s,
            _id: s._id.toString(),
            datum: s.datum.toISOString()
        })),
        aktiverFilter: filterAktiv
    };
}
