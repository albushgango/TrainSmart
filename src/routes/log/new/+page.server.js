import { connectDB } from '$lib/server/db.js';
import Session from '$lib/server/models/session.js';
import { redirect, fail } from '@sveltejs/kit';

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();

        const sport = data.get('sport');
        const datum = data.get('datum');
        const dauer = Number(data.get('dauer'));
        const rpe = Number(data.get('rpe'));
        const notiz = data.get('notiz');

        if (!sport || !datum || !dauer || !rpe) {
            return fail(400, { error: 'Bitte alle Pflichtfelder ausfüllen.' });
        }

        await connectDB();
        await Session.create({ sport, datum, dauer, rpe, notiz });

        redirect(303, '/log');
    }
};