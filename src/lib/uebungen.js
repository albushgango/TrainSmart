// Vordefinierte Gym-Übungen, gruppiert nach Muskelgruppe.
// Wird im /log/new Form als Auswahl angeboten — User kann auch Custom-Übungen eintragen.

export const UEBUNGEN_NACH_GRUPPE = {
    'Brust': [
        'Bench Press',
        'Incline Bench Press',
        'Decline Bench Press',
        'Dumbbell Press',
        'Cable Fly',
        'Push-Ups',
        'Dips',
        'Pec Deck'
    ],
    'Rücken': [
        'Deadlift',
        'Pull-Ups',
        'Lat Pulldown',
        'Barbell Row',
        'Cable Row',
        'T-Bar Row',
        'Face Pull',
        'Hyperextension'
    ],
    'Schultern': [
        'Overhead Press',
        'Lateral Raise',
        'Front Raise',
        'Rear Delt Fly',
        'Arnold Press',
        'Upright Row',
        'Shrugs'
    ],
    'Beine': [
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
    'Bizeps': [
        'Barbell Curl',
        'Dumbbell Curl',
        'Hammer Curl',
        'Preacher Curl',
        'Cable Curl',
        'Concentration Curl'
    ],
    'Trizeps': [
        'Tricep Pushdown',
        'Skull Crusher',
        'Close-Grip Bench Press',
        'Overhead Tricep Extension',
        'Tricep Kickback',
        'Diamond Push-Up'
    ],
    'Core': [
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
export const ALLE_UEBUNGEN = Object.entries(UEBUNGEN_NACH_GRUPPE)
    .flatMap(([gruppe, namen]) => namen.map(name => ({ name, gruppe })));

/**
 * Filtert Übungen anhand eines Suchtexts (case-insensitive, sucht in Name).
 * Liefert eine Map { Gruppe → Übungen[] } mit nur den passenden Treffern.
 */
export function filtereUebungen(suchtext) {
    const text = suchtext.trim().toLowerCase();
    if (!text) return UEBUNGEN_NACH_GRUPPE;

    const result = {};
    for (const [gruppe, namen] of Object.entries(UEBUNGEN_NACH_GRUPPE)) {
        const treffer = namen.filter(n => n.toLowerCase().includes(text));
        if (treffer.length > 0) result[gruppe] = treffer;
    }
    return result;
}
