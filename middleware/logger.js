/**
 * Globale Logging-Middleware für Express.js-Anwendungen.
 * Protokolliert jede eingehende HTTP-Anfrage mit Zeitstempel, Methode, URL und nach Abschluss der Antwort
 * zusätzlich den Statuscode und die Dauer der Bearbeitung.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 */
export const logger = (req, res, next) => {
    // Startzeit der Anfrage mit hoher Auflösung messen.
    const start = process.hrtime();

    // Erste Log-Nachricht beim Empfang der Anfrage.
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    // Event-Listener für das 'finish'-Ereignis des Response-Objekts.
    // Dies wird ausgelöst, wenn die Antwort vollständig an den Client gesendet wurde.
    res.on('finish', () => {
        // Endzeit messen und Differenz zur Startzeit berechnen.
        const end = process.hrtime(start);
        // Dauer in Millisekunden umrechnen (end[0] sind Sekunden, end[1] sind Nanosekunden).
        const durationInMilliseconds = (end[0] * 1000) + (end[1] / 1_000_000);

        // Zweite Log-Nachricht nach Abschluss der Antwort, inkl. Statuscode und Dauer.
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Status: ${res.statusCode} - Dauer: ${durationInMilliseconds.toFixed(2)}ms`);
    });

    // WICHTIG: Die Kontrolle an die nächste Middleware im Stack weitergeben.
    next();
};

