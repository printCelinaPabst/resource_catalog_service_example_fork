import mongoose from "mongoose";

//Verbindung mit Datenbank und Steuerung (async)
export async function connectDB (
    uri, // uri der Datenbank
    { dbName = process.env.Mongo_DB || "resource_catalog" } = {} // Objekt mit Datenbank-Optionen 
) {

    mongoose.set("strictQuery", true); //steuert Abfragen an Datenbank,definiert Schema wenn Abfrage Schema nicht entspricht wird Abfrage abgelehnt

    const retries = 10; //Versuche um mit Datenbank zu verbinden
    const delayMs = 2000; //Verzögerung bis zum neuen Versuch

    for (let i = 1; i <= retries; i++) {
        try {
            await mongoose.connect(uri, { dbName });
            console.log(`[MongoDB] connected to ${dbName}`);
            return;
        } catch (err) {
            console.error(`[MongoDB] connect attempt ${i}/${retries} failed: ${err.message}`);
            await new Promise((r) => setTimeout(r, delayMs)); // warte so lange, wie es in der Variable delayMs definiert ist, bis du den nächsten Versuch machst

        }
    }
    process.exit(1); //Anwendung wird abgebrochen bei diesem Fehler
};