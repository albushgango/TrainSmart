import { XMLParser } from 'fast-xml-parser';
import { berechneHrZonenAusPunkten } from '$lib/hrZonen.js';

/**
 * Parser für Garmin-TCX-Dateien (Training Center XML).
 * Liest Activity-Summary und Trackpoints, berechnet Splits und reduzierte Verlaufs-Arrays.
 */

const SPORT_MAPPING = {
    'Running': 'Laufen',
    'Biking': 'Rad',
    'Cycling': 'Rad',
    'Swimming': 'Schwimmen',
    'Other': null  // User muss manuell wählen
};

/**
 * Wandelt eine Trackpoint-Geschwindigkeit (m/s) in Pace (Sekunden pro Kilometer) um.
 * @param {number} speedMs m/s
 * @returns {number | null}
 */
function speedToPaceSek(speedMs) {
    if (!Number.isFinite(speedMs) || speedMs <= 0) return null;
    return Math.round(1000 / speedMs);
}

/**
 * Formatiert Sekunden als min:ss
 * @param {number} sekunden
 * @returns {string}
 */
function formatPace(sekunden) {
    if (!Number.isFinite(sekunden)) return '—';
    const min = Math.floor(sekunden / 60);
    const sec = Math.round(sekunden - min * 60);
    const finalMin = sec === 60 ? min + 1 : min;
    const finalSec = sec === 60 ? 0 : sec;
    return `${finalMin}:${finalSec.toString().padStart(2, '0')}`;
}

/**
 * Berechnet kumulative Höhenmeter aus einer Sequenz von Altitude-Werten.
 * Nur positive Differenzen werden summiert (Anstiege).
 */
function berechneHoehenmeter(altitudes) {
    let gesamt = 0;
    for (let i = 1; i < altitudes.length; i++) {
        const diff = altitudes[i] - altitudes[i - 1];
        if (diff > 0) gesamt += diff;
    }
    return Math.round(gesamt);
}

/**
 * Berechnet Splits pro Kilometer aus Trackpoints.
 * Jeder Split: km-Nummer, Dauer für diesen km, durchschnittliche HR im km.
 */
function berechneSplits(trackpoints) {
    const splits = [];
    let aktuellerKm = 1;
    let kmStartZeit = trackpoints[0]?.zeit ?? null;
    let hrSumme = 0;
    let hrCount = 0;

    for (const tp of trackpoints) {
        if (!kmStartZeit) {
            kmStartZeit = tp.zeit;
            continue;
        }

        if (Number.isFinite(tp.hr)) {
            hrSumme += tp.hr;
            hrCount++;
        }

        // Wenn aktueller km erreicht ist (Distanz >= aktuellerKm * 1000)
        if (tp.distanzM >= aktuellerKm * 1000) {
            const dauerSek = Math.round((tp.zeit - kmStartZeit) / 1000);
            splits.push({
                km: aktuellerKm,
                dauerSek,
                paceFormatted: formatPace(dauerSek),
                avgHr: hrCount > 0 ? Math.round(hrSumme / hrCount) : null
            });
            aktuellerKm++;
            kmStartZeit = tp.zeit;
            hrSumme = 0;
            hrCount = 0;
        }
    }

    return splits;
}

/**
 * Sampelt eine Trackpoint-Liste auf max. N gleichmässig verteilte Punkte.
 * Behält Distanz, HR, Pace und Höhe als reduzierte Verlaufs-Daten.
 */
function reduziereVerlauf(trackpoints, maxPunkte = 80) {
    if (trackpoints.length === 0) return [];
    if (trackpoints.length <= maxPunkte) {
        return trackpoints.map(tp => ({
            distanz: Math.round(tp.distanzM / 10) / 100, // km, 2 Dezimalstellen
            sekunden: Math.round((tp.zeit - trackpoints[0].zeit) / 1000),
            hr: tp.hr ?? null,
            pace: speedToPaceSek(tp.speedMs),
            hoehe: tp.altitudeM ?? null
        }));
    }

    const step = trackpoints.length / maxPunkte;
    const startZeit = trackpoints[0].zeit;
    const ergebnis = [];

    for (let i = 0; i < maxPunkte; i++) {
        const idx = Math.floor(i * step);
        const tp = trackpoints[idx];
        ergebnis.push({
            distanz: Math.round(tp.distanzM / 10) / 100,
            sekunden: Math.round((tp.zeit - startZeit) / 1000),
            hr: tp.hr ?? null,
            pace: speedToPaceSek(tp.speedMs),
            hoehe: tp.altitudeM ?? null
        });
    }

    return ergebnis;
}

/**
 * Berechnet Mittelwert eines numerischen Feldes über Trackpoints,
 * ignoriert null/undefined/0.
 */
function avgFeld(trackpoints, feld) {
    let summe = 0;
    let count = 0;
    for (const tp of trackpoints) {
        const wert = tp[feld];
        if (Number.isFinite(wert) && wert > 0) {
            summe += wert;
            count++;
        }
    }
    return count > 0 ? Math.round(summe / count) : null;
}

/**
 * Haupt-Funktion: parsed TCX-XML-String und liefert strukturiertes Daten-Objekt.
 *
 * @param {string} xmlString — TCX-XML als String
 * @returns {Object} Geparseten Daten mit allen Feldern
 * @throws {Error} bei ungültigem TCX
 */
export function parseTCX(xmlString, optionen = {}) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        parseAttributeValue: true,
        // Trackpoint-Listen immer als Array, auch wenn nur ein Element
        isArray: (name) => ['Trackpoint', 'Lap', 'Activity'].includes(name)
    });

    let parsed;
    try {
        parsed = parser.parse(xmlString);
    } catch (err) {
        throw new Error(`TCX-Datei konnte nicht geparst werden: ${err.message}`);
    }

    const db = parsed.TrainingCenterDatabase;
    if (!db) throw new Error('Keine TrainingCenterDatabase im TCX gefunden.');

    const activities = db.Activities?.Activity;
    if (!activities || activities.length === 0) {
        throw new Error('Keine Activity im TCX gefunden.');
    }

    const activity = activities[0];
    const sportRaw = activity['@_Sport'] ?? 'Other';
    const sport = SPORT_MAPPING[sportRaw] ?? null;

    const datum = activity.Id ? new Date(activity.Id) : new Date();
    const laps = activity.Lap ?? [];
    if (laps.length === 0) throw new Error('Keine Laps im TCX gefunden.');

    // Lap-Summary aggregieren
    let totalSek = 0;
    let totalDistanzM = 0;
    let totalCalories = 0;
    let avgHrSummen = []; // gewichtet mit Lap-Dauer für korrekten Mittelwert
    let maxHr = null;

    // Alle Trackpoints aus allen Laps zusammenführen
    const alleTrackpoints = [];

    for (const lap of laps) {
        totalSek += Number(lap.TotalTimeSeconds) || 0;
        totalDistanzM += Number(lap.DistanceMeters) || 0;
        totalCalories += Number(lap.Calories) || 0;

        const lapAvgHr = Number(lap.AverageHeartRateBpm?.Value);
        const lapMaxHr = Number(lap.MaximumHeartRateBpm?.Value);
        if (Number.isFinite(lapAvgHr) && lapAvgHr > 0) {
            avgHrSummen.push({ hr: lapAvgHr, dauer: Number(lap.TotalTimeSeconds) || 0 });
        }
        if (Number.isFinite(lapMaxHr) && (maxHr === null || lapMaxHr > maxHr)) {
            maxHr = lapMaxHr;
        }

        const tps = lap.Track?.Trackpoint ?? [];
        for (const tp of tps) {
            const ext = tp.Extensions?.['ns3:TPX'] ?? tp.Extensions?.TPX ?? {};
            alleTrackpoints.push({
                zeit: new Date(tp.Time).getTime(),
                distanzM: Number(tp.DistanceMeters) || 0,
                hr: Number(tp.HeartRateBpm?.Value) || null,
                altitudeM: Number(tp.AltitudeMeters) || null,
                speedMs: Number(ext['ns3:Speed'] ?? ext.Speed) || null,
                cadence: Number(ext['ns3:RunCadence'] ?? ext.RunCadence) || null,
                watts: Number(ext['ns3:Watts'] ?? ext.Watts) || null
            });
        }
    }

    // Gewichteter Avg-HR über alle Laps
    const avgHrTotal = avgHrSummen.length > 0
        ? Math.round(
            avgHrSummen.reduce((sum, x) => sum + x.hr * x.dauer, 0) /
            avgHrSummen.reduce((sum, x) => sum + x.dauer, 0)
        )
        : null;

    // Zusatz-Aggregationen aus Trackpoints
    const avgCadence = avgFeld(alleTrackpoints, 'cadence');
    const avgWatts = avgFeld(alleTrackpoints, 'watts');

    // Höhenmeter berechnen
    const altitudes = alleTrackpoints
        .map(tp => tp.altitudeM)
        .filter(Number.isFinite);
    const hoehenmeter = altitudes.length > 0 ? berechneHoehenmeter(altitudes) : null;

    // Splits + reduzierter Verlauf
    const splits = berechneSplits(alleTrackpoints);
    const verlauf = reduziereVerlauf(alleTrackpoints);
    const hrZonen = berechneHrZonenAusPunkten(alleTrackpoints, optionen.maxHr);

    return {
        // Direkt für Session
        sport,
        sportRaw, // für Fehlermeldung wenn Mapping fehlschlägt
        datum: datum.toISOString(),
        dauer: Math.round(totalSek / 60),
        distanz: Math.round(totalDistanzM / 10) / 100,  // km, 2 Dezimal
        avgHr: avgHrTotal,
        maxHr,
        calories: totalCalories > 0 ? totalCalories : null,
        avgCadence,
        avgWatts,
        hoehenmeter,

        // Erweiterte Lauf-Daten
        laufDaten: {
            splits,
            verlauf,
            hrZonen
        },

        // Meta
        trackpointAnzahl: alleTrackpoints.length
    };
}
