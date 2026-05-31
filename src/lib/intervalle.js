function paceToSpeedKmh(paceSek) {
	if (!Number.isFinite(paceSek) || paceSek <= 0) return null;
	return 3600 / paceSek;
}

export function formatPace(sekunden) {
	if (!Number.isFinite(sekunden) || sekunden <= 0) return '-';
	const min = Math.floor(sekunden / 60);
	const sec = Math.round(sekunden % 60)
		.toString()
		.padStart(2, '0');
	return `${min}:${sec}`;
}

export function formatDauer(sekunden) {
	const wert = Math.round(Number(sekunden) || 0);
	if (wert < 60) return `${wert} s`;
	const min = Math.floor(wert / 60);
	const sec = (wert % 60).toString().padStart(2, '0');
	return `${min}:${sec} min`;
}

function punktZeitSek(punkt, startZeit) {
	if (Number.isFinite(punkt?.zeit)) return (punkt.zeit - startZeit) / 1000;
	if (Number.isFinite(punkt?.sekunden)) return punkt.sekunden;
	return null;
}

function punktDistanzKm(punkt) {
	if (Number.isFinite(punkt?.distanzM)) return punkt.distanzM / 1000;
	if (Number.isFinite(punkt?.distanz)) return punkt.distanz;
	return null;
}

function punktHr(punkt) {
	return Number.isFinite(punkt?.hr) ? punkt.hr : null;
}

function segmentPace(vorher, aktuell, dauerSek, distanzKm) {
	const ausDistanz = distanzKm > 0 ? dauerSek / distanzKm : null;
	if (Number.isFinite(ausDistanz) && ausDistanz > 0) return ausDistanz;

	if (Number.isFinite(vorher?.speedMs) && vorher.speedMs > 0) {
		return 1000 / vorher.speedMs;
	}
	if (Number.isFinite(vorher?.pace) && vorher.pace > 0) {
		return vorher.pace;
	}
	if (Number.isFinite(aktuell?.pace) && aktuell.pace > 0) {
		return aktuell.pace;
	}
	return null;
}

function median(werte) {
	if (werte.length === 0) return null;
	const sortiert = werte.slice().sort((a, b) => a - b);
	const mitte = Math.floor(sortiert.length / 2);
	return sortiert.length % 2 === 0 ? (sortiert[mitte - 1] + sortiert[mitte]) / 2 : sortiert[mitte];
}

function normalisiereSegmente(punkte) {
	if (!Array.isArray(punkte) || punkte.length < 4) return [];

	const startZeit = Number.isFinite(punkte[0]?.zeit) ? punkte[0].zeit : 0;
	const segmente = [];

	for (let i = 1; i < punkte.length; i++) {
		const vorher = punkte[i - 1];
		const aktuell = punkte[i];
		const startSek = punktZeitSek(vorher, startZeit);
		const endeSek = punktZeitSek(aktuell, startZeit);
		const startDistanz = punktDistanzKm(vorher);
		const endeDistanz = punktDistanzKm(aktuell);

		if (!Number.isFinite(startSek) || !Number.isFinite(endeSek)) continue;
		if (!Number.isFinite(startDistanz) || !Number.isFinite(endeDistanz)) continue;

		const dauerSek = endeSek - startSek;
		const distanzKm = endeDistanz - startDistanz;
		if (dauerSek <= 0 || dauerSek > 120 || distanzKm <= 0) continue;

		const paceSek = segmentPace(vorher, aktuell, dauerSek, distanzKm);
		const speedKmh = paceToSpeedKmh(paceSek);

		if (!Number.isFinite(paceSek) || paceSek < 120 || paceSek > 900) continue;
		if (!Number.isFinite(speedKmh) || speedKmh > 30) continue;

		const hrWerte = [punktHr(vorher), punktHr(aktuell)].filter(Number.isFinite);
		segmente.push({
			startSek,
			endeSek,
			startDistanz,
			endeDistanz,
			dauerSek,
			distanzKm,
			paceSek,
			avgHr:
				hrWerte.length > 0
					? Math.round(hrWerte.reduce((sum, hr) => sum + hr, 0) / hrWerte.length)
					: null
		});
	}

	return segmente;
}

function baueIntervall(segmente, nummer) {
	const dauerSek = segmente.reduce((sum, s) => sum + s.dauerSek, 0);
	const distanzKm = segmente.reduce((sum, s) => sum + s.distanzKm, 0);
	const paceSek = distanzKm > 0 ? dauerSek / distanzKm : null;
	const hrGewichtet = segmente
		.filter((s) => Number.isFinite(s.avgHr))
		.reduce(
			(acc, s) => ({
				summe: acc.summe + s.avgHr * s.dauerSek,
				dauer: acc.dauer + s.dauerSek
			}),
			{ summe: 0, dauer: 0 }
		);

	return {
		nr: nummer,
		startSek: Math.round(segmente[0].startSek),
		endeSek: Math.round(segmente[segmente.length - 1].endeSek),
		dauerSek: Math.round(dauerSek),
		distanz: Math.round(distanzKm * 100) / 100,
		paceSek: Math.round(paceSek),
		paceFormatted: formatPace(paceSek),
		avgHr: hrGewichtet.dauer > 0 ? Math.round(hrGewichtet.summe / hrGewichtet.dauer) : null
	};
}

export function berechneIntervalleAusPunkten(punkte = [], optionen = {}) {
	const minDauerSek = optionen.minDauerSek ?? 25;
	const minDistanzKm = optionen.minDistanzKm ?? 0.05;
	const segmente = normalisiereSegmente(punkte);

	if (segmente.length < 4) {
		return { avgPaceSek: null, schwelleSek: null, intervalle: [] };
	}

	const totalDauer = segmente.reduce((sum, s) => sum + s.dauerSek, 0);
	const totalDistanz = segmente.reduce((sum, s) => sum + s.distanzKm, 0);
	const avgPaceSek = totalDistanz > 0 ? totalDauer / totalDistanz : null;
	const medianPaceSek = median(segmente.map((s) => s.paceSek));

	if (!Number.isFinite(avgPaceSek) || !Number.isFinite(medianPaceSek)) {
		return { avgPaceSek: null, schwelleSek: null, intervalle: [] };
	}

	const referenzPace = Math.min(avgPaceSek, medianPaceSek);
	const schwelleSek = Math.min(referenzPace * 0.9, referenzPace - 20);
	const intervalleRoh = [];
	let aktuell = [];
	let gap = [];

	function abschliessen() {
		if (aktuell.length === 0) return;
		const kandidat = baueIntervall(aktuell, intervalleRoh.length + 1);
		if (kandidat.dauerSek >= minDauerSek && kandidat.distanz >= minDistanzKm) {
			intervalleRoh.push(kandidat);
		}
		aktuell = [];
		gap = [];
	}

	for (const segment of segmente) {
		const istSchnell = segment.paceSek <= schwelleSek;

		if (istSchnell) {
			if (aktuell.length > 0 && gap.length > 0) {
				aktuell.push(...gap);
			}
			aktuell.push(segment);
			gap = [];
			continue;
		}

		if (aktuell.length > 0) {
			gap.push(segment);
			const gapDauer = gap.reduce((sum, s) => sum + s.dauerSek, 0);
			if (gapDauer > 12) {
				abschliessen();
			}
		}
	}

	abschliessen();

	return {
		avgPaceSek: Math.round(avgPaceSek),
		schwelleSek: Math.round(schwelleSek),
		intervalle: intervalleRoh
			.filter((i) => i.paceSek <= schwelleSek)
			.slice(0, 12)
			.map((intervall, index) => ({ ...intervall, nr: index + 1 }))
	};
}
