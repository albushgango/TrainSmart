import mongoose from 'mongoose';
import { MONGODB_URI } from '$env/static/private';

let connection = null;

export async function connectDB() {
    if (connection) return connection;
    try {
        connection = await mongoose.connect(MONGODB_URI);
        return connection;
    } catch (err) {
        connection = null;
        throw new Error(`MongoDB-Verbindung fehlgeschlagen: ${err.message}`);
    }
}