/**
 * Globale Fehlerbehandlungs-Middleware für Express.js-Anwendungen.
 * Fängt alle Fehler ab, die in Routen oder anderen Middleware-Funktionen auftreten,
 * und sendet eine konsistente `500 Internal Server Error`-Antwort.
 * @param {Error} err - Das Fehlerobjekt, das von einer vorherigen Middleware oder Route weitergegeben wurde.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion (oft nicht direkt verwendet, aber notwendig für die Signatur).
 */
export const errorHandler = (err, req, res, next) => {
    // Protokolliert den Fehler auf der Konsole für das Server-Debugging.
    console.error(`[${new Date().toISOString()}] Ein Fehler ist aufgetreten:`, err.stack);

    // Sendet eine Standard-Fehlerantwort an den Client.
    // Status 500 (Internal Server Error) ist der allgemeine Fehlercode für serverseitige Probleme.
    res.status(500).json({
        error: 'Interner Serverfehler',
        message: err.message // Optional: Die Fehlermeldung kann an den Client gesendet werden,
                             // aber in Produktion sollte dies ggf. weniger detailliert sein.
    });
};

