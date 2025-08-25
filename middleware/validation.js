/**
 * Validierungs-Middleware für Ressourcen-Daten (Titel, Typ).
 * Stellt sicher, dass 'title' und 'type' im Request-Body vorhanden sind und nicht leer sind.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 */
export const validateResource = (req, res, next) => {
    const { title, type } = req.body;
    if (!title || title.trim() === '' || !type || type.trim() === '') {
        return res.status(400).json({ error: 'Titel und Typ der Ressource sind erforderlich.' });
    }
    next();
};

/**
 * Validierungs-Middleware für Bewertungs-Daten (ratingValue).
 * Stellt sicher, dass 'ratingValue' eine Zahl zwischen 1 und 5 ist.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 */
export const validateRating = (req, res, next) => {
    const { ratingValue } = req.body;
    // Prüfen, ob ratingValue eine Zahl ist und im gültigen Bereich liegt
    if (typeof ratingValue !== 'number' || ratingValue < 1 || ratingValue > 5) {
        return res.status(400).json({ error: 'Bewertungswert muss eine Zahl zwischen 1 und 5 sein.' });
    }
    next();
};

/**
 * Validierungs-Middleware für Feedback-Daten (feedbackText).
 * Stellt sicher, dass 'feedbackText' vorhanden und nicht leer ist.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 */
export const validateFeedback = (req, res, next) => {
    const { feedbackText } = req.body;
    if (!feedbackText || feedbackText.trim() === '') {
        return res.status(400).json({ error: 'Feedback-Text ist erforderlich.' });
    }
    next();
};

