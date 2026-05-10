import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    sport: { type: String, required: true },
    subtyp: { type: String, default: '' },  // optional, z.B. 'Push', 'Pull', 'Easy', 'Long Run'
    datum: { type: Date, required: true },
    dauer: { type: Number, required: true },
    rpe: { type: Number, required: true, min: 1, max: 10 },
    notiz: { type: String, default: '' },

    // Lauf-spezifische Felder (alle optional, primär bei Sport='Laufen' oder 'Rad')
    distanz: { type: Number, min: 0, max: 1000 },        // km
    avgHr: { type: Number, min: 30, max: 250 },          // bpm (durchschnittliche Herzfrequenz)
    hoehenmeter: { type: Number, min: 0, max: 10000 }    // m (kumulative Höhenmeter)
}, { timestamps: true });

export default mongoose.models.Session || mongoose.model('Session', sessionSchema);
