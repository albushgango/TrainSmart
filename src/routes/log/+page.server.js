import { connectDB } from '$lib/server/db.js';
import Session from '$lib/server/models/session.js';

export async function load() {
    await connectDB();
    const sessions = await Session.find().sort({ datum: -1 }).lean();
    return {
        sessions: sessions.map(s => ({
            ...s,
            _id: s._id.toString(),
            datum: s.datum.toISOString()
        }))
    };
}