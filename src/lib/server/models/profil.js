import mongoose from 'mongoose';

// Profil ist ein Singleton-Dokument — die App ist Single-User, daher gibt's
// genau einen Eintrag pro Datenbank. Über findOneOrCreate() abgerufen.
const profilSchema = new mongoose.Schema({
    aktiverSplit: { type: String, default: 'kein' },     // ID aus SPLITS in $lib/splits.js
    customSplitTage: { type: [String], default: [] },     // bei 'custom' Split: eigene Tage
    wochenziel: { type: Number, default: 3 },             // Anzahl Sessions/Woche (Phase D)
    maxHr: { type: Number, default: 190, min: 120, max: 230 } // Basis für HR-Zonen
}, { timestamps: true });

const Profil = mongoose.models.Profil || mongoose.model('Profil', profilSchema);

/** Liefert das Profil-Dokument oder erstellt es, falls noch nicht vorhanden. */
export async function holeOderErstelleProfil() {
    let profil = await Profil.findOne();
    if (!profil) {
        profil = await Profil.create({});
    }
    return profil;
}

export default Profil;
