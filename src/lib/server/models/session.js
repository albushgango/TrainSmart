import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    sport: { type: String, required: true },
    datum: { type: Date, required: true },
    dauer: { type: Number, required: true },
    rpe: { type: Number, required: true, min: 1, max: 10 },
    notiz: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Session || mongoose.model('Session', sessionSchema);