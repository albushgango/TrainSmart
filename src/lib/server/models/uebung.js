import mongoose from 'mongoose';

// Übung — verknüpft mit einer Session via sessionId.
// Eine Session kann beliebig viele Übungen haben (typisch 5-10 pro Workout).
const uebungSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
        index: true
    },
    name: { type: String, required: true, trim: true },
    saetze: { type: Number, required: true, min: 1, max: 20 },
    wiederholungen: { type: Number, required: true, min: 1, max: 100 },
    gewicht: { type: Number, required: true, min: 0, max: 1000 }, // kg
    notiz: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Uebung || mongoose.model('Uebung', uebungSchema);
