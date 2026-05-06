import { connectDB } from '$lib/server/db';
import Session from '$lib/server/models/session';
import { holeOderErstelleProfil } from '$lib/server/models/profil.js';
import { SPLITS, naechsterSplitTag } from '$lib/splits.js';

/** Berechnet die Tagesempfehlung basierend auf dem Load der letzten 7 Tage */
function berechneEmpfehlung(sessions, naechsterTag) {
    const jetzt = new Date();
    const vor7Tagen = new Date(jetzt - 7 * 24 * 60 * 60 * 1000);

    const letzte7Tage = sessions.filter(s => new Date(s.datum) >= vor7Tagen);

    if (letzte7Tage.length === 0) {
        return {
            typ: 'Heavy',
            farbe: '#ef4444',
            grund: 'Kein Training in den letzten 7 Tagen – leg los!',
            naechsterTag
        };
    }

    // Load = Dauer (min) * RPE pro Session
    const totalLoad = letzte7Tage.reduce((sum, s) => sum + s.dauer * s.rpe, 0);
    const avgLoad = totalLoad / 7;

    // Gestern trainiert?
    const gestern = new Date(jetzt);
    gestern.setDate(gestern.getDate() - 1);
    const heuteTrainiert = sessions.some(s => {
        const d = new Date(s.datum);
        return d.toDateString() === jetzt.toDateString();
    });
    const gesternTrainiert = sessions.some(s => {
        const d = new Date(s.datum);
        return d.toDateString() === gestern.toDateString();
    });

    if (heuteTrainiert) {
        return {
            typ: 'Erledigt ✓',
            farbe: '#22c55e',
            grund: 'Du hast heute schon trainiert. Gut gemacht!',
            naechsterTag: null
        };
    }

    if (avgLoad > 400) {
        return {
            typ: 'Rest',
            farbe: '#3b82f6',
            grund: 'Hoher Wochenload – dein Körper braucht Erholung.',
            naechsterTag: null
        };
    }

    if (gesternTrainiert && avgLoad > 250) {
        return {
            typ: 'Light',
            farbe: '#f59e0b',
            grund: 'Gestern trainiert + mittlerer Load – lockeres Training.',
            naechsterTag
        };
    }

    return {
        typ: 'Heavy',
        farbe: '#ef4444',
        grund: 'Niedriger Load – volle Intensität heute!',
        naechsterTag
    };
}

/** Berechnet die aktuelle Trainings-Streak in Wochen */
function berechneStreak(sessions) {
    if (sessions.length === 0) return 0;

    const wochen = new Set();
    sessions.forEach(s => {
        const d = new Date(s.datum);
        const jahr = d.getFullYear();
        const startOfYear = new Date(jahr, 0, 1);
        const woche = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        wochen.add(`${jahr}-W${woche}`);
    });

    const jetzt = new Date();
    const startOfYear = new Date(jetzt.getFullYear(), 0, 1);
    let aktuelleWoche = Math.ceil(((jetzt - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    let aktuellJahr = jetzt.getFullYear();

    const hatAktuelleWoche = wochen.has(`${aktuellJahr}-W${aktuelleWoche}`);
    const hatLetzteWoche = wochen.has(`${aktuellJahr}-W${aktuelleWoche - 1}`);

    if (!hatAktuelleWoche && !hatLetzteWoche) return 0;

    let streak = 0;
    let prüfWoche = hatAktuelleWoche ? aktuelleWoche : aktuelleWoche - 1;
    let prüfJahr = aktuellJahr;

    while (wochen.has(`${prüfJahr}-W${prüfWoche}`)) {
        streak++;
        prüfWoche--;
        if (prüfWoche < 1) {
            prüfJahr--;
            prüfWoche = 52;
        }
    }

    return streak;
}

/** Berechnet den Montag der aktuellen Woche um 00:00 Uhr */
function aktuellerWochenStart() {
    const jetzt = new Date();
    const tag = jetzt.getDay() || 7;
    const wochenStart = new Date(jetzt);
    wochenStart.setHours(0, 0, 0, 0);
    wochenStart.setDate(wochenStart.getDate() - (tag - 1));
    return wochenStart;
}

/** Berechnet Anzahl Sessions in der aktuellen Kalenderwoche (Montag-Sonntag) */
function sessionsAktuelleWoche(sessions, wochenStart) {
    return sessions.filter(s => new Date(s.datum) >= wochenStart).length;
}

/**
 * Baut die 7 Tage der aktuellen Woche mit Datum, Wochentag-Label und Session-Anzahl.
 * Wird vom Wochenkalender auf der Home-Page genutzt.
 */
function baueWochenTage(sessions, wochenStart) {
    const wochentagLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const heuteString = new Date().toDateString();

    return wochentagLabels.map((label, i) => {
        const d = new Date(wochenStart);
        d.setDate(wochenStart.getDate() + i);
        const dString = d.toDateString();

        const sessionsAmTag = sessions.filter(s =>
            new Date(s.datum).toDateString() === dString
        );

        return {
            datum: d.toISOString().split('T')[0],
            wochentag: label,
            tagesnummer: d.getDate(),
            istHeute: dString === heuteString,
            sessionsAnzahl: sessionsAmTag.length
        };
    });
}

export async function load() {
    await connectDB();

    const [alleSessions, profil] = await Promise.all([
        Session.find().sort({ datum: -1 }).lean(),
        holeOderErstelleProfil()
    ]);

    // Aktive Split-Tage bestimmen + nächsten Split-Tag berechnen
    let aktiveSplitTage = [];
    if (profil.aktiverSplit === 'custom') {
        aktiveSplitTage = profil.customSplitTage;
    } else if (SPLITS[profil.aktiverSplit]) {
        aktiveSplitTage = SPLITS[profil.aktiverSplit].tage;
    }

    const letzteKraft = alleSessions.find(s => s.sport === 'Kraft');
    const naechsterTag = naechsterSplitTag(aktiveSplitTage, letzteKraft?.subtyp ?? null);

    const empfehlung = berechneEmpfehlung(alleSessions, naechsterTag);
    const streak = berechneStreak(alleSessions);

    // Aktuelle Woche: Daten für Wochenkalender + Wochenziel
    const wochenStart = aktuellerWochenStart();
    const wochenTage = baueWochenTage(alleSessions, wochenStart);
    const sessionsDieseWoche = sessionsAktuelleWoche(alleSessions, wochenStart);

    // Sessions der aktuellen Woche serialisieren — Frontend filtert nach gewähltem Tag
    const wochenSessions = alleSessions
        .filter(s => new Date(s.datum) >= wochenStart)
        .map(s => ({
            ...s,
            _id: s._id.toString(),
            datum: s.datum.toISOString()
        }));

    // Letzte 3 Sessions als Fallback (z.B. wenn aktuelle Woche leer und User scrollt zurück)
    const letzteSessions = alleSessions.slice(0, 3).map(s => ({
        ...s,
        _id: s._id.toString(),
        datum: s.datum.toISOString()
    }));

    return {
        empfehlung,
        streak,
        wochenTage,
        wochenSessions,
        letzteSessions,
        wochenziel: {
            ziel: profil.wochenziel,
            erreicht: sessionsDieseWoche,
            prozent: Math.min(100, Math.round((sessionsDieseWoche / profil.wochenziel) * 100))
        }
    };
}
