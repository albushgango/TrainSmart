export const STANDARD_MAX_HR = 190;

export const HR_ZONEN = [
    { zone: 1, name: 'Sehr locker', schwelle: 0, cssVar: '--zone-1' },
    { zone: 2, name: 'Locker', schwelle: 0.6, cssVar: '--zone-2' },
    { zone: 3, name: 'Moderat', schwelle: 0.7, cssVar: '--zone-3' },
    { zone: 4, name: 'Hart', schwelle: 0.8, cssVar: '--zone-4' },
    { zone: 5, name: 'Sehr hart', schwelle: 0.9, cssVar: '--zone-5' }
];

export function normalisiereMaxHr(maxHr) {
    const wert = Number(maxHr);
    if (!Number.isFinite(wert) || wert < 120 || wert > 230) return STANDARD_MAX_HR;
    return Math.round(wert);
}

export function zoneFuerHr(hr, maxHr = STANDARD_MAX_HR) {
    const max = normalisiereMaxHr(maxHr);
    const wert = Number(hr);
    if (!Number.isFinite(wert) || wert <= 0) return null;

    const anteil = wert / max;
    if (anteil >= 0.9) return 5;
    if (anteil >= 0.8) return 4;
    if (anteil >= 0.7) return 3;
    if (anteil >= 0.6) return 2;
    return 1;
}

function zeitwert(punkt) {
    if (Number.isFinite(punkt?.zeit)) return punkt.zeit / 1000;
    if (Number.isFinite(punkt?.sekunden)) return punkt.sekunden;
    return null;
}

function zonenBasis(maxHr) {
    const max = normalisiereMaxHr(maxHr);
    return HR_ZONEN.map((z, index) => {
        const naechste = HR_ZONEN[index + 1];
        const von = z.schwelle > 0 ? Math.round(max * z.schwelle) : 0;
        const bis = naechste ? Math.round(max * naechste.schwelle) - 1 : null;

        return {
            zone: z.zone,
            name: z.name,
            von,
            bis,
            cssVar: z.cssVar,
            sekunden: 0,
            minuten: 0,
            prozent: 0
        };
    });
}

export function berechneHrZonenAusPunkten(punkte = [], maxHr = STANDARD_MAX_HR) {
    const max = normalisiereMaxHr(maxHr);
    const zonen = zonenBasis(max);
    let totalSekunden = 0;

    for (let i = 1; i < punkte.length; i++) {
        const vorher = punkte[i - 1];
        const aktuell = punkte[i];
        const start = zeitwert(vorher);
        const ende = zeitwert(aktuell);
        const dauer = ende - start;

        if (!Number.isFinite(dauer) || dauer <= 0 || dauer > 180) continue;

        const hr = Number.isFinite(vorher?.hr) ? vorher.hr : aktuell?.hr;
        const zone = zoneFuerHr(hr, max);
        if (!zone) continue;

        zonen[zone - 1].sekunden += dauer;
        totalSekunden += dauer;
    }

    return {
        maxHr: max,
        totalSekunden: Math.round(totalSekunden),
        zonen: zonen.map(z => ({
            ...z,
            sekunden: Math.round(z.sekunden),
            minuten: Math.round((z.sekunden / 60) * 10) / 10,
            prozent: totalSekunden > 0 ? Math.round((z.sekunden / totalSekunden) * 100) : 0
        }))
    };
}

export function summiereHrZonen(analysen = [], maxHr = STANDARD_MAX_HR) {
    const max = normalisiereMaxHr(maxHr);
    const zonen = zonenBasis(max);
    let totalSekunden = 0;

    for (const analyse of analysen) {
        if (!analyse?.zonen?.length) continue;
        for (const zone of analyse.zonen) {
            const ziel = zonen.find(z => z.zone === zone.zone);
            if (!ziel) continue;
            const sekunden = Number(zone.sekunden) || 0;
            ziel.sekunden += sekunden;
            totalSekunden += sekunden;
        }
    }

    return {
        maxHr: max,
        totalSekunden: Math.round(totalSekunden),
        zonen: zonen.map(z => ({
            ...z,
            sekunden: Math.round(z.sekunden),
            minuten: Math.round((z.sekunden / 60) * 10) / 10,
            prozent: totalSekunden > 0 ? Math.round((z.sekunden / totalSekunden) * 100) : 0
        }))
    };
}

export function formatZonenZeit(sekunden) {
    const wert = Number(sekunden) || 0;
    if (wert < 60) return `${Math.round(wert)} s`;
    const minuten = Math.round(wert / 60);
    if (minuten < 60) return `${minuten} min`;
    const stunden = Math.floor(minuten / 60);
    const rest = minuten % 60;
    return rest > 0 ? `${stunden} h ${rest} min` : `${stunden} h`;
}
