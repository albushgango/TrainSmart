// Vordefinierte Gym-Übungen, gruppiert nach Muskelgruppe.
// Wird im /log/new Form als Auswahl angeboten — User kann auch Custom-Übungen eintragen.

export const UEBUNGEN_NACH_GRUPPE = {
	Brust: [
		'Bench Press',
		'Incline Bench Press',
		'Decline Bench Press',
		'Dumbbell Press',
		'Cable Fly',
		'Push-Ups',
		'Dips',
		'Pec Deck'
	],
	Rücken: [
		'Deadlift',
		'Pull-Ups',
		'Lat Pulldown',
		'Barbell Row',
		'Cable Row',
		'T-Bar Row',
		'Face Pull',
		'Hyperextension'
	],
	Schultern: [
		'Overhead Press',
		'Lateral Raise',
		'Front Raise',
		'Rear Delt Fly',
		'Arnold Press',
		'Upright Row',
		'Shrugs'
	],
	Beine: [
		'Squat',
		'Front Squat',
		'Leg Press',
		'Romanian Deadlift',
		'Leg Curl',
		'Leg Extension',
		'Calf Raise',
		'Lunges',
		'Bulgarian Split Squat',
		'Hip Thrust'
	],
	Bizeps: [
		'Barbell Curl',
		'Dumbbell Curl',
		'Hammer Curl',
		'Preacher Curl',
		'Cable Curl',
		'Concentration Curl'
	],
	Trizeps: [
		'Tricep Pushdown',
		'Skull Crusher',
		'Close-Grip Bench Press',
		'Overhead Tricep Extension',
		'Tricep Kickback',
		'Diamond Push-Up'
	],
	Core: [
		'Plank',
		'Sit-Ups',
		'Crunches',
		'Leg Raise',
		'Russian Twist',
		'Hanging Knee Raise',
		'Cable Crunch',
		'Ab Wheel'
	]
};

/** Flache Liste aller Übungen mit ihrer Gruppe — praktisch für Filter und Auto-Complete */
export const ALLE_UEBUNGEN = Object.entries(UEBUNGEN_NACH_GRUPPE).flatMap(([gruppe, namen]) =>
	namen.map((name) => ({ name, gruppe }))
);

/**
 * Mapping: Trainings-Subtyp → relevante Muskelgruppen.
 * Wird beim Übungen-Suchen genutzt, um nur passende Übungen anzuzeigen.
 *
 * Wenn ein Subtyp hier nicht gelistet ist (z.B. Custom-Subtyp oder leer),
 * werden alle Gruppen zurückgegeben.
 */
export const SUBTYP_GRUPPEN = {
	// Standard 3er-Split (Push/Pull/Legs)
	Push: ['Brust', 'Schultern', 'Trizeps'],
	Pull: ['Rücken', 'Bizeps'],
	Legs: ['Beine', 'Core'],

	// 2er-Split (Upper/Lower)
	Upper: ['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps'],
	Lower: ['Beine', 'Core'],

	// Full Body — alle Gruppen
	'Full Body': ['Brust', 'Rücken', 'Schultern', 'Beine', 'Bizeps', 'Trizeps', 'Core'],

	// Arnold-Split-Tage
	'Brust+Rücken': ['Brust', 'Rücken'],
	'Schulter+Arme': ['Schultern', 'Bizeps', 'Trizeps'],
	Beine: ['Beine'],

	// Bro-Split-Tage
	Brust: ['Brust', 'Trizeps'], // Brust-Tag fokussiert oft auch auf Trizeps
	Rücken: ['Rücken', 'Bizeps'], // Rücken-Tag oft auch Bizeps
	Schulter: ['Schultern'],
	Arme: ['Bizeps', 'Trizeps']
};

export const WORKOUT_VORSCHLAEGE = {
	Push: [
		'Bench Press',
		'Incline Bench Press',
		'Overhead Press',
		'Lateral Raise',
		'Tricep Pushdown'
	],
	Pull: ['Pull-Ups', 'Lat Pulldown', 'Barbell Row', 'Face Pull', 'Dumbbell Curl'],
	Legs: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'],
	Upper: [
		'Bench Press',
		'Lat Pulldown',
		'Overhead Press',
		'Cable Row',
		'Tricep Pushdown',
		'Dumbbell Curl'
	],
	Lower: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'],
	'Full Body': ['Squat', 'Bench Press', 'Lat Pulldown', 'Romanian Deadlift', 'Overhead Press'],
	'Brust+Rücken': [
		'Bench Press',
		'Incline Bench Press',
		'Lat Pulldown',
		'Barbell Row',
		'Cable Fly'
	],
	'Schulter+Arme': [
		'Overhead Press',
		'Lateral Raise',
		'Rear Delt Fly',
		'Tricep Pushdown',
		'Dumbbell Curl'
	],
	Beine: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Extension', 'Calf Raise'],
	Brust: ['Bench Press', 'Incline Bench Press', 'Dumbbell Press', 'Cable Fly', 'Dips'],
	Rücken: ['Pull-Ups', 'Lat Pulldown', 'Barbell Row', 'Cable Row', 'Face Pull'],
	Schulter: ['Overhead Press', 'Lateral Raise', 'Rear Delt Fly', 'Arnold Press', 'Shrugs'],
	Arme: ['Close-Grip Bench Press', 'Tricep Pushdown', 'Barbell Curl', 'Hammer Curl', 'Cable Curl']
};

export function workoutVorschlagFuer(subtyp = '') {
	if (WORKOUT_VORSCHLAEGE[subtyp]) return WORKOUT_VORSCHLAEGE[subtyp];

	const gruppen = SUBTYP_GRUPPEN[subtyp];
	if (!gruppen) return [];

	return gruppen.flatMap((gruppe) => UEBUNGEN_NACH_GRUPPE[gruppe]?.slice(0, 2) ?? []).slice(0, 6);
}

/**
 * Filtert Übungen anhand eines Suchtexts (case-insensitive, sucht in Name)
 * und optional nach Subtyp (passende Muskelgruppen aus SUBTYP_GRUPPEN).
 *
 * @param {string} suchtext — Suchtext für Namens-Filter
 * @param {string} [subtyp] — Optionaler Subtyp-Filter (z.B. 'Push'). Wenn leer
 *                             oder nicht im Mapping, werden alle Gruppen genutzt.
 * @returns Map { Gruppe → Übungen[] } mit nur den passenden Treffern.
 */
export function filtereUebungen(suchtext, subtyp = '') {
	const text = suchtext.trim().toLowerCase();
	const erlaubteGruppen = SUBTYP_GRUPPEN[subtyp];

	const result = {};
	for (const [gruppe, namen] of Object.entries(UEBUNGEN_NACH_GRUPPE)) {
		// Subtyp-Filter: nur Gruppen, die im Mapping stehen (oder alle wenn kein Mapping)
		if (erlaubteGruppen && !erlaubteGruppen.includes(gruppe)) continue;

		// Namens-Filter
		const treffer = text ? namen.filter((n) => n.toLowerCase().includes(text)) : namen;

		if (treffer.length > 0) result[gruppe] = treffer;
	}
	return result;
}
