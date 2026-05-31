// Konstanten für Sport-Subtypen und Trainings-Splits.
// Frei verwendbar im Frontend und auf dem Server.

/** Standard-Subtypen pro Sportart, wenn kein Split gewählt ist */
export const SUBTYPEN_NACH_SPORT = {
	Kraft: ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'],
	Laufen: ['Easy', 'Tempo', 'Intervalle', 'Long Run', 'Sprint'],
	Rad: ['Indoor', 'Outdoor', 'Pendel'],
	Schwimmen: ['Kraul', 'Brust', 'Rücken', 'Mixed']
};

/**
 * Vordefinierte Trainings-Splits.
 * `tage` ist die Rotation — nach dem letzten Tag geht's wieder von vorne los.
 */
export const SPLITS = {
	kein: {
		id: 'kein',
		name: 'Kein Split',
		beschreibung: 'Keine fixe Reihenfolge — frei wählbar',
		tage: []
	},
	'push-pull-legs': {
		id: 'push-pull-legs',
		name: 'Push / Pull / Legs',
		beschreibung: '3er-Split, klassisch für 3-6 Trainings/Woche',
		tage: ['Push', 'Pull', 'Legs']
	},
	arnold: {
		id: 'arnold',
		name: 'Arnold Split',
		beschreibung: '3er-Rotation, hohes Volumen für Fortgeschrittene (oft 6x/Woche)',
		tage: ['Brust+Rücken', 'Schulter+Arme', 'Beine']
	},
	'upper-lower': {
		id: 'upper-lower',
		name: 'Upper / Lower',
		beschreibung: '2er-Split, ideal für 4 Trainings/Woche',
		tage: ['Upper', 'Lower']
	},
	'bro-split': {
		id: 'bro-split',
		name: 'Bro Split',
		beschreibung: '5er-Split, jede Muskelgruppe einmal pro Woche',
		tage: ['Brust', 'Rücken', 'Schulter', 'Arme', 'Beine']
	},
	'full-body': {
		id: 'full-body',
		name: 'Full Body',
		beschreibung: 'Ganzkörper-Training, 2-3x pro Woche',
		tage: ['Full Body']
	}
};

/**
 * Liefert die verfügbaren Subtypen für einen Sport — kombiniert Standard-Optionen
 * mit den Tagen des aktiven Splits (ohne Duplikate).
 *
 * @param {string} sport — z.B. 'Kraft'
 * @param {Array<string>} aktiveSplitTage — Tage des aktiven Splits (oder leer)
 * @returns {Array<string>}
 */
export function subtypenFuer(sport, aktiveSplitTage = []) {
	const standard = SUBTYPEN_NACH_SPORT[sport] ?? [];
	const kombiniert = [...aktiveSplitTage, ...standard];
	return [...new Set(kombiniert)];
}

/**
 * Berechnet den nächsten Split-Tag, basierend auf dem letzten geloggten Subtyp.
 * Findet den letzten Subtyp im Tage-Array und gibt den nächsten zurück (mit Wrap).
 *
 * @param {Array<string>} tage — Rotation des Splits
 * @param {string | null} letzterSubtyp — zuletzt geloggter Subtyp
 * @returns {string | null}
 */
export function naechsterSplitTag(tage, letzterSubtyp) {
	if (!tage || tage.length === 0) return null;
	if (!letzterSubtyp) return tage[0];

	const idx = tage.indexOf(letzterSubtyp);
	if (idx === -1) return tage[0]; // letzter Subtyp gehört nicht zum Split
	return tage[(idx + 1) % tage.length];
}
