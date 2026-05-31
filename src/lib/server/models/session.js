import mongoose from 'mongoose';

// Sub-Schema: Splits pro Kilometer (aus TCX-Import)
const splitSchema = new mongoose.Schema(
	{
		km: Number,
		dauerSek: Number,
		paceFormatted: String,
		avgHr: Number
	},
	{ _id: false }
);

// Sub-Schema: reduzierter Verlaufs-Datenpunkt (max ~80 pro Session)
const verlaufPunktSchema = new mongoose.Schema(
	{
		distanz: Number, // km
		sekunden: Number, // Sekunden seit Start
		hr: Number,
		pace: Number, // sec/km
		hoehe: Number // m
	},
	{ _id: false }
);

// Sub-Schema: Zeit in Herzfrequenz-Zonen 1-5 (aus TCX-HR-Verlauf)
const hrZoneSchema = new mongoose.Schema(
	{
		zone: Number,
		name: String,
		von: Number,
		bis: Number,
		cssVar: String,
		sekunden: Number,
		minuten: Number,
		prozent: Number
	},
	{ _id: false }
);

// Sub-Schema: automatisch erkannte schnelle Abschnitte aus dem Pace-Verlauf
const intervallSchema = new mongoose.Schema(
	{
		nr: Number,
		startSek: Number,
		endeSek: Number,
		dauerSek: Number,
		distanz: Number,
		paceSek: Number,
		paceFormatted: String,
		avgHr: Number
	},
	{ _id: false }
);

// Sub-Schema: erweiterte Lauf-Daten aus TCX-Import
const laufDatenSchema = new mongoose.Schema(
	{
		splits: [splitSchema],
		verlauf: [verlaufPunktSchema],
		hrZonen: {
			maxHr: Number,
			totalSekunden: Number,
			zonen: [hrZoneSchema]
		},
		intervalle: [intervallSchema]
	},
	{ _id: false }
);

const sessionSchema = new mongoose.Schema(
	{
		sport: { type: String, required: true },
		subtyp: { type: String, default: '' },
		datum: { type: Date, required: true },
		dauer: { type: Number, required: true },
		rpe: { type: Number, required: true, min: 1, max: 10 },
		notiz: { type: String, default: '' },

		// Lauf-/Rad-Felder (Phase 1 / manuelle Eingabe)
		distanz: { type: Number, min: 0, max: 1000 }, // km
		avgHr: { type: Number, min: 30, max: 250 }, // bpm
		hoehenmeter: { type: Number, min: 0, max: 10000 }, // m

		// Erweiterte Lauf-Felder aus TCX-Import (Phase 2)
		maxHr: { type: Number, min: 30, max: 250 }, // bpm
		calories: { type: Number, min: 0, max: 10000 }, // kcal
		avgCadence: { type: Number, min: 0, max: 250 }, // Schritte/Min
		avgWatts: { type: Number, min: 0, max: 2000 }, // Power

		// Detail-Daten aus TCX (Splits + Verlaufs-Arrays)
		laufDaten: laufDatenSchema
	},
	{ timestamps: true }
);

export default mongoose.models.Session || mongoose.model('Session', sessionSchema);
