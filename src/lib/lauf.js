// Helpers für Lauf-spezifische Berechnungen.
// Wird sowohl im Frontend (Live-Vorschau) als auch im Stats-Server-Code genutzt.

/**
 * Berechnet Pace (Minuten pro Kilometer) aus Dauer und Distanz.
 *
 * @param {number} dauerMin — Dauer in Minuten
 * @param {number} distanzKm — Distanz in Kilometern
 * @returns {{min: number, sec: number, formatted: string, totalSekunden: number} | null}
 *          oder null wenn Berechnung nicht möglich (Distanz=0 etc.)
 */
export function paceProKm(dauerMin, distanzKm) {
    if (!Number.isFinite(dauerMin) || !Number.isFinite(distanzKm)) return null;
    if (distanzKm <= 0 || dauerMin <= 0) return null;

    const paceTotalSek = (dauerMin * 60) / distanzKm;
    const min = Math.floor(paceTotalSek / 60);
    const sec = Math.round(paceTotalSek - min * 60);

    // Sekunden-Overflow vermeiden (60 → 1:00)
    const minFinal = sec === 60 ? min + 1 : min;
    const secFinal = sec === 60 ? 0 : sec;

    return {
        min: minFinal,
        sec: secFinal,
        formatted: `${minFinal}:${secFinal.toString().padStart(2, '0')}`,
        totalSekunden: Math.round(paceTotalSek)
    };
}

/**
 * Berechnet Durchschnittsgeschwindigkeit in km/h.
 *
 * @param {number} dauerMin — Dauer in Minuten
 * @param {number} distanzKm — Distanz in Kilometern
 * @returns {number | null} Geschwindigkeit in km/h (auf 1 Nachkommastelle), oder null
 */
export function geschwindigkeitKmh(dauerMin, distanzKm) {
    if (!Number.isFinite(dauerMin) || !Number.isFinite(distanzKm)) return null;
    if (dauerMin <= 0 || distanzKm <= 0) return null;

    const speed = (distanzKm / dauerMin) * 60;
    return Math.round(speed * 10) / 10;
}

/**
 * Findet aus einer Liste von Lauf-Sessions die mit der schnellsten Pace.
 * Berücksichtigt nur Sessions mit gültiger Distanz.
 *
 * @param {Array<{dauer: number, distanz: number}>} sessions
 * @returns Die Session mit schnellster Pace (oder null wenn keine gültig)
 */
export function schnellstePace(sessions) {
    let beste = null;
    let besteSek = Infinity;

    for (const s of sessions) {
        const pace = paceProKm(s.dauer, s.distanz);
        if (!pace) continue;
        if (pace.totalSekunden < besteSek) {
            besteSek = pace.totalSekunden;
            beste = s;
        }
    }

    return beste;
}
