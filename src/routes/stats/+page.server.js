import { connectDB } from '$lib/server/db.js';
import Session from '$lib/server/models/session.js';
import Uebung from '$lib/server/models/uebung.js';
import { paceProKm, schnellstePace } from '$lib/lauf.js';
import { berechneHrZonenAusPunkten, summiereHrZonen } from '$lib/hrZonen.js';
import { holeOderErstelleProfil } from '$lib/server/models/profil.js';

/** Berechnet ISO-Wochennummer für ein Datum */
function isoWoche(datum) {
    const d = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
    const tagesnummer = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - tagesnummer);
    const jahresStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const wochenNr = Math.ceil(((d - jahresStart) / 86400000 + 1) / 7);
    return { jahr: d.getUTCFullYear(), woche: wochenNr };
}

/** Generiert ein Array der letzten N Wochen, ältest zuerst */
function letzteNWochen(n) {
    const result = [];
    const heute = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(heute);
        d.setDate(d.getDate() - i * 7);
        const { jahr, woche } = isoWoche(d);
        result.push({ jahr, woche, key: `${jahr}-W${woche}`, label: `KW${woche}`, load: 0, sessions: 0 });
    }
    return result;
}

export async function load() {
    await connectDB();
    const [alleSessions, profil] = await Promise.all([
        Session.find().sort({ datum: -1 }).lean(),
        holeOderErstelleProfil()
    ]);

    // Total-Stats
    const totalSessions = alleSessions.length;
    const totalMinuten = alleSessions.reduce((sum, s) => sum + (s.dauer || 0), 0);
    const avgRpe = totalSessions > 0
        ? alleSessions.reduce((sum, s) => sum + (s.rpe || 0), 0) / totalSessions
        : 0;

    // Wochenload-Chart: letzte 8 Wochen
    const wochen = letzteNWochen(8);
    const wochenMap = new Map(wochen.map(w => [w.key, w]));

    alleSessions.forEach(s => {
        const { jahr, woche } = isoWoche(new Date(s.datum));
        const key = `${jahr}-W${woche}`;
        const eintrag = wochenMap.get(key);
        if (eintrag) {
            eintrag.load += (s.dauer || 0) * (s.rpe || 0);
            eintrag.sessions += 1;
        }
    });

    // Calendar-Heatmap: letzte 90 Tage als Tagesraster
    // Pro Tag den Trainings-Load (Dauer × RPE) summieren
    const heatmapTage = [];
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);

    for (let i = 89; i >= 0; i--) {
        const tag = new Date(heute);
        tag.setDate(heute.getDate() - i);
        heatmapTage.push({
            datum: tag.toISOString().split('T')[0],
            wochentag: tag.getDay(),  // 0=So, 1=Mo ... 6=Sa
            load: 0,
            sessions: 0
        });
    }

    const heatmapMap = new Map(heatmapTage.map(t => [t.datum, t]));
    alleSessions.forEach(s => {
        const datumKey = new Date(s.datum).toISOString().split('T')[0];
        const eintrag = heatmapMap.get(datumKey);
        if (eintrag) {
            eintrag.load += (s.dauer || 0) * (s.rpe || 0);
            eintrag.sessions += 1;
        }
    });

    // Sport-Verteilung (Anteil der Total-Minuten pro Sportart)
    const sportMap = new Map();
    alleSessions.forEach(s => {
        const aktuell = sportMap.get(s.sport) || { sport: s.sport, minuten: 0, sessions: 0 };
        aktuell.minuten += s.dauer || 0;
        aktuell.sessions += 1;
        sportMap.set(s.sport, aktuell);
    });
    const sportVerteilung = [...sportMap.values()].sort((a, b) => b.minuten - a.minuten);

    // Personal Records pro Sportart (für Filter im Fortschritt-Tab)
    const SPORTARTEN = ['Kraft', 'Laufen', 'Rad', 'Schwimmen'];
    const recordsProSport = {};
    SPORTARTEN.forEach(sport => {
        const sessionsDesSports = alleSessions.filter(s => s.sport === sport);
        if (sessionsDesSports.length === 0) {
            recordsProSport[sport] = null;
            return;
        }
        const laengste = sessionsDesSports.reduce((max, s) =>
            (!max || s.dauer > max.dauer) ? s : max, null);
        const hoechstesRpe = sessionsDesSports.reduce((max, s) =>
            (!max || s.rpe > max.rpe) ? s : max, null);
        recordsProSport[sport] = {
            laengsteSession: {
                dauer: laengste.dauer,
                datum: laengste.datum.toISOString()
            },
            hoechstesRpe: {
                rpe: hoechstesRpe.rpe,
                datum: hoechstesRpe.datum.toISOString()
            },
            sessionsAnzahl: sessionsDesSports.length
        };
    });

    // Übungs-Fortschritt: Pro Übungsnamen alle Einträge sortiert nach Datum.
    // Wird im Frontend zu Linien-Charts (kg über Zeit).
    const alleUebungen = await Uebung.find()
        .populate({ path: 'sessionId', select: 'datum' })
        .lean();

    const fortschrittMap = new Map();
    alleUebungen.forEach(u => {
        if (!u.sessionId?.datum) return;

        if (!fortschrittMap.has(u.name)) {
            fortschrittMap.set(u.name, { name: u.name, eintraege: [] });
        }
        fortschrittMap.get(u.name).eintraege.push({
            datum: u.sessionId.datum.toISOString(),
            gewicht: u.gewicht,
            saetze: u.saetze,
            wiederholungen: u.wiederholungen
        });
    });

    // Pro Übung: Einträge nach Datum sortieren, Trend zwischen letztem und vorletztem berechnen
    const uebungsFortschritt = [...fortschrittMap.values()].map(u => {
        u.eintraege.sort((a, b) => new Date(a.datum) - new Date(b.datum));
        const aktuell = u.eintraege[u.eintraege.length - 1];
        const vorher = u.eintraege.length >= 2 ? u.eintraege[u.eintraege.length - 2] : null;
        const max = Math.max(...u.eintraege.map(e => e.gewicht));
        return {
            name: u.name,
            eintraege: u.eintraege,
            aktuell,
            vorher,
            trend: vorher ? Math.round((aktuell.gewicht - vorher.gewicht) * 10) / 10 : null,
            max
        };
    }).sort((a, b) => b.max - a.max); // Schwerste Übungen zuerst

    // ─── Lauf-spezifische Records + Verlauf ───
    const laufSessions = alleSessions
        .filter(s => s.sport === 'Laufen' && Number.isFinite(s.distanz) && s.distanz > 0);

    let laufFortschritt = null;
    if (laufSessions.length > 0) {
        // Records
        const laengsteDistanz = laufSessions.reduce((max, s) =>
            (!max || s.distanz > max.distanz) ? s : max, null);
        const schnellsteSession = schnellstePace(laufSessions);
        const hoechsteHr = laufSessions
            .filter(s => Number.isFinite(s.avgHr))
            .reduce((max, s) => (!max || s.avgHr > max.avgHr) ? s : max, null);
        const meisteHm = laufSessions
            .filter(s => Number.isFinite(s.hoehenmeter))
            .reduce((max, s) => (!max || s.hoehenmeter > max.hoehenmeter) ? s : max, null);

        // Verlauf für Charts (chronologisch ältest → jüngst)
        const verlauf = laufSessions
            .slice()
            .sort((a, b) => new Date(a.datum) - new Date(b.datum))
            .map(s => {
                const pace = paceProKm(s.dauer, s.distanz);
                return {
                    _id: s._id.toString(),
                    datum: s.datum.toISOString(),
                    dauer: s.dauer,
                    distanz: s.distanz,
                    rpe: s.rpe,
                    avgHr: s.avgHr ?? null,
                    hoehenmeter: s.hoehenmeter ?? null,
                    paceFormatted: pace?.formatted ?? null,
                    paceSekunden: pace?.totalSekunden ?? null
                };
            });

        const schnellstePaceFormat = schnellsteSession
            ? paceProKm(schnellsteSession.dauer, schnellsteSession.distanz)
            : null;
        const hrAnalysen = laufSessions
            .map(s => s.laufDaten?.hrZonen?.zonen?.length
                ? s.laufDaten.hrZonen
                : berechneHrZonenAusPunkten(s.laufDaten?.verlauf ?? [], profil.maxHr))
            .filter(a => a.totalSekunden > 0);
        const hrZonen = summiereHrZonen(hrAnalysen, profil.maxHr);

        laufFortschritt = {
            anzahl: laufSessions.length,
            records: {
                laengsteDistanz: laengsteDistanz ? {
                    distanz: laengsteDistanz.distanz,
                    datum: laengsteDistanz.datum.toISOString()
                } : null,
                schnellstePace: schnellstePaceFormat ? {
                    formatted: schnellstePaceFormat.formatted,
                    distanz: schnellsteSession.distanz,
                    datum: schnellsteSession.datum.toISOString()
                } : null,
                hoechsteHr: hoechsteHr ? {
                    bpm: hoechsteHr.avgHr,
                    datum: hoechsteHr.datum.toISOString()
                } : null,
                meisteHm: meisteHm ? {
                    meter: meisteHm.hoehenmeter,
                    datum: meisteHm.datum.toISOString()
                } : null
            },
            hrZonen,
            verlauf
        };
    }

    return {
        totals: {
            sessions: totalSessions,
            stunden: Math.round(totalMinuten / 60 * 10) / 10,
            avgRpe: Math.round(avgRpe * 10) / 10
        },
        wochenLoad: wochen,
        sportVerteilung,
        heatmapTage,
        recordsProSport,
        uebungsFortschritt,
        laufFortschritt
    };
}
