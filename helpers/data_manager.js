import * as fs from 'fs'; // Synchrones Dateisystem für existSync und mkdirSync
import fsp from 'fs/promises'; // Asynchrones Promise-basiertes Dateisystem für readFile/writeFile
import path from 'path'; // Für plattformunabhängige Pfadoperationen
import { fileURLToPath } from 'url'; // Um __filename und __dirname in ES Modules zu emulieren

// Helfervariablen für ES-Modul-Pfade (ersetzt __filename und __dirname aus CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Liest Daten asynchron aus einer JSON-Datei.
 * Behandelt fehlende Dateien und ungültiges JSON robust.
 * @param {string} fileName - Der Name der JSON-Datei (z.B. 'resources.json').
 * @returns {Promise<Array<object>>} Ein Promise, das ein Array von Objekten oder ein leeres Array zurückgibt.
 */
export const readData = async (fileName) => {
    // Konstruiert den vollständigen, plattformunabhängigen Pfad zur Zieldatei.
    // Geht von 'helpers/' eine Ebene hoch ('..') und dann in den 'data/' Ordner.
    const filePath = path.join(__dirname, '../data', fileName);

    // Prüft synchron, ob die Datei existiert.
    // Dies ist eine schnelle Operation, die den Event Loop nicht merklich blockiert.
    if (!fs.existsSync(filePath)) {
        console.log(`INFO: Datei nicht gefunden: ${filePath}. Gebe leere Liste zurück.`);
        return []; // Leere Liste zurückgeben, wenn die Datei nicht existiert
    }

    try {
        // Liest den gesamten Inhalt der Datei asynchron.
        // `await` pausiert die Funktion, ohne den Event Loop zu blockieren.
        const data = await fsp.readFile(filePath, 'utf-8');
        // Parst den JSON-String in ein JavaScript-Objekt.
        return JSON.parse(data);
    } catch (error) {
        if (error instanceof SyntaxError) {
            // Fängt spezifische JSON-Parsing-Fehler ab.
            console.error(`FEHLER: Ungültiges JSON in Datei: ${filePath}. Bitte Syntax überprüfen. Details: ${error.message}`);
        } else {
            // Fängt alle anderen unerwarteten Fehler beim Dateizugriff ab.
            console.error(`FEHLER: Ein unerwarteter Fehler ist aufgetreten beim Lesen von ${filePath}: ${error.message}`);
        }
        return []; // Gebe leere Liste bei jedem Fehler zurück
    }
};

/**
 * Schreibt Daten asynchron in eine JSON-Datei.
 * Stellt sicher, dass das Zielverzeichnis existiert.
 * @param {string} fileName - Der Name der JSON-Datei, in die geschrieben werden soll.
 * @param {Array<object>} data - Das JavaScript-Array oder -Objekt, das in die Datei geschrieben werden soll.
 * @returns {Promise<void>} Ein Promise, das aufgelöst wird, wenn der Schreibvorgang abgeschlossen ist.
 */
export const writeData = async (fileName, data) => {
    // Konstruiert den vollständigen Pfad zur Zieldatei.
    const filePath = path.join(__dirname, '../data', fileName);
    // Ermittelt den Verzeichnispfad der Zieldatei.
    const dir = path.dirname(filePath);

    // Prüft synchron, ob das Verzeichnis existiert.
    // Erstellt es, falls nicht, auch rekursiv für übergeordnete Verzeichnisse.
    // Diese synchrone Operation ist unproblematisch, da Verzeichnisse selten neu erstellt werden.
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    try {
        // Konvertiert das JavaScript-Objekt in einen lesbaren JSON-String (Pretty Print mit 2 Leerzeichen Einrückung).
        // `null, 2` für schöne Formatierung, `ensure_ascii=false` nicht relevant für JS/Node.js, aber hier als Erinnerung.
        const jsonData = JSON.stringify(data, null, 2);
        // Schreibt den JSON-String asynchron in die Datei.
        // `await` pausiert die Funktion, ohne den Event Loop zu blockieren.
        await fsp.writeFile(filePath, jsonData, 'utf-8');
    } catch (error) {
        console.error(`FEHLER: Ein unerwarteter Fehler ist aufgetreten beim Schreiben von ${filePath}: ${error.message}`);
        throw error; // Den Fehler weiterwerfen, damit er im aufrufenden Kontext behandelt werden kann.
    }
};

