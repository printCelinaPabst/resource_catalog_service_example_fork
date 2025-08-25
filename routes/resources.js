import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid'; // Paket 'uuid' für eindeutige IDs
import { formatISO } from 'date-fns'; // Paket 'date-fns' für ISO-formatierte Zeitstempel

// Importiere die asynchronen Datenmanager-Funktionen
import { readData, writeData } from '../helpers/data_manager.js';
// Importiere die Validierungs-Middleware
import { validateResource, validateRating, validateFeedback } from '../middleware/validation.js';

const router = Router();

// Dateinamen-Konstanten für den Datenmanager
const RESOURCES_FILE_NAME = 'resources.json';
const RATINGS_FILE_NAME = 'ratings.json';
const FEEDBACK_FILE_NAME = 'feedback.json';


// --- Routen-Definitionen ---

/**
 * GET /resources
 * @summary Ruft alle Ressourcen ab, optional gefiltert nach Typ oder Autor-ID.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {object} req.query - Query-Parameter für die Filterung.
 * @param {string} [req.query.type] - Optionaler Typ der Ressource zum Filtern.
 * @param {string} [req.query.authorId] - Optionale Autor-ID zum Filtern.
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 * @returns {Array<object>} 200 - Ein Array von Ressourcenobjekten, gefiltert oder ungefiltert.
 * @returns {object} 500 - Interner Serverfehler.
 */
router.get('/', async (req, res, next) => {
    try {
        const resources = await readData(RESOURCES_FILE_NAME);
        const { type, authorId } = req.query;

        let filteredResources = resources;

        // Filterung nach Typ (fallweise Konvertierung zu String für sicheren Vergleich)
        if (type) {
            filteredResources = filteredResources.filter(r => String(r.type) === String(type));
        }
        // Filterung nach Autor-ID
        if (authorId) {
            filteredResources = filteredResources.filter(r => String(r.authorId) === String(authorId));
        }

        res.status(200).json(filteredResources);
    } catch (error) {
        console.error('Fehler beim Abrufen der Ressourcen:', error);
        next(error); // Fehler an globale Fehlerbehandlung weiterleiten
    }
});

/**
 * GET /resources/:id
 * @summary Ruft eine einzelne Ressource anhand ihrer ID ab und berechnet die durchschnittliche Bewertung.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {string} req.params.id - Die ID der abzurufenden Ressource.
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 * @returns {object} 200 - Das Ressourcenobjekt mit hinzugefügter durchschnittlicher Bewertung.
 * @returns {object} 404 - Ressource nicht gefunden.
 * @returns {object} 500 - Interner Serverfehler.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const resourceId = String(req.params.id); // Sicherstellen, dass die ID ein String ist
        const resources = await readData(RESOURCES_FILE_NAME);

        // Bewertungen laden und filtern, um die durchschnittliche Bewertung zu berechnen
        const ratings = await readData(RATINGS_FILE_NAME);
        const resourceRatings = ratings.filter(rating => String(rating.resourceId) === resourceId);

        let averageRating = 0;
        if (resourceRatings.length > 0) {
            const sumOfRatings = resourceRatings.reduce((sum, rating) => sum + Number(rating.ratingValue), 0);
            averageRating = sumOfRatings / resourceRatings.length;
        }

        const resource = resources.find(r => String(r.id) === resourceId);

        if (resource) {
            resource.averageRating = averageRating; // Durchschnittliche Bewertung zur Ressource hinzufügen
            res.status(200).json(resource);
        } else {
            res.status(404).json({ error: `Ressource mit ID ${resourceId} nicht gefunden.` });
        }
    } catch (error) {
        console.error(`Fehler beim Abrufen der Ressource mit ID ${req.params.id}:`, error);
        next(error);
    }
});

/**
 * POST /resources
 * @summary Erstellt eine neue Ressource.
 * @description Nimmt Ressourcendaten im Request-Body entgegen, generiert eine UUID und speichert die Ressource.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {object} req.body - Die Daten der neuen Ressource (z.B. { title: string, type: string, ... }).
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 * @returns {object} 201 - Das neu erstellte Ressourcenobjekt.
 * @returns {object} 400 - Ungültige oder fehlende Ressourcendaten (validiert durch `validateResource` Middleware).
 * @returns {object} 500 - Interner Serverfehler.
 */
router.post('/', validateResource, async (req, res, next) => {
    const newResourceData = req.body;

    const newResource = {
        id: uuidv4(), // Eindeutige ID generieren
        ...newResourceData, // Alle Daten aus dem Body übernehmen
        createdAt: formatISO(new Date()) // Aktuellen Zeitstempel hinzufügen
    };

    try {
        const resources = await readData(RESOURCES_FILE_NAME);
        resources.push(newResource); // Neue Ressource hinzufügen
        await writeData(RESOURCES_FILE_NAME, resources); // Daten speichern

        res.status(201).json(newResource); // 201 Created und das Objekt zurückgeben
    } catch (error) {
        console.error('Fehler beim Erstellen der Ressource:', error);
        next(error);
    }
});

/**
 * PUT /resources/:id
 * @summary Aktualisiert eine bestehende Ressource vollständig oder teilweise.
 * @description Nimmt die Ressourcen-ID aus den Parametern und die zu aktualisierenden Daten im Request-Body entgegen.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {string} req.params.id - Die ID der zu aktualisierenden Ressource.
 * @param {object} req.body - Die neuen Daten für die Ressource.
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 * @returns {object} 200 - Das aktualisierte Ressourcenobjekt.
 * @returns {object} 400 - Ungültige oder fehlende Ressourcendaten (validiert durch `validateResource` Middleware).
 * @returns {object} 404 - Ressource nicht gefunden.
 * @returns {object} 500 - Interner Serverfehler.
 */
router.put('/:id', validateResource, async (req, res, next) => {
    const resourceId = String(req.params.id);
    const newData = req.body;

    try {
        const resources = await readData(RESOURCES_FILE_NAME);
        const resourceIndex = resources.findIndex(r => String(r.id) === resourceId);

        if (resourceIndex === -1) {
            return res.status(404).json({ error: `Ressource mit ID ${resourceId} nicht gefunden.` });
        }

        // Ressource aktualisieren (existierende Daten mit neuen überschreiben)
        resources[resourceIndex] = {
            ...resources[resourceIndex],
            ...newData,
            id: resourceId // Sicherstellen, dass die ID nicht überschrieben wird
        };

        await writeData(RESOURCES_FILE_NAME, resources);

        res.status(200).json(resources[resourceIndex]);
    } catch (error) {
        console.error(`Fehler beim Aktualisieren der Ressource mit ID ${req.params.id}:`, error);
        next(error);
    }
});

/**
 * DELETE /resources/:id
 * @summary Löscht eine Ressource anhand ihrer ID.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {string} req.params.id - Die ID der zu löschenden Ressource.
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 * @returns {object} 204 - Erfolgreich gelöscht (kein Inhalt zurückgegeben).
 * @returns {object} 404 - Ressource nicht gefunden.
 * @returns {object} 500 - Interner Serverfehler.
 */
router.delete('/:id', async (req, res, next) => {
    const resourceId = String(req.params.id);

    try {
        const resources = await readData(RESOURCES_FILE_NAME);
        const initialLength = resources.length;
        // Filtere alle Ressourcen heraus, die die zu löschende ID haben
        const updatedResources = resources.filter(r => String(r.id) !== resourceId);

        if (updatedResources.length === initialLength) {
            // Wenn die Länge sich nicht geändert hat, wurde die Ressource nicht gefunden
            return res.status(404).json({ error: `Ressource mit ID ${resourceId} nicht gefunden.` });
        }

        await writeData(RESOURCES_FILE_NAME, updatedResources); // Aktualisierte Liste speichern

        res.status(204).end(); // 204 No Content bei erfolgreicher Löschung
    } catch (error) {
        console.error(`Fehler beim Löschen der Ressource mit ID ${req.params.id}:`, error);
        next(error);
    }
});

/**
 * POST /resources/:resourceId/ratings
 * @summary Fügt einer Ressource eine neue Bewertung hinzu.
 * @description Nimmt Bewertungsdaten (ratingValue, userId) entgegen, generiert eine UUID und speichert die Bewertung.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {string} req.params.resourceId - Die ID der Ressource, die bewertet wird.
 * @param {object} req.body - Die Bewertungsdaten ({ ratingValue: number, userId: string }).
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 * @returns {object} 201 - Das neu erstellte Bewertungsobjekt.
 * @returns {object} 400 - Ungültige oder fehlende Bewertungsdaten (validiert durch `validateRating` Middleware).
 * @returns {object} 500 - Interner Serverfehler.
 */
router.post('/:resourceId/ratings', validateRating, async (req, res, next) => {
    const resourceId = String(req.params.resourceId);
    const { ratingValue, userId } = req.body;

    const newRating = {
        id: uuidv4(),
        resourceId: resourceId,
        ratingValue: Number(ratingValue), // Sicherstellen, dass es eine Zahl ist
        userId: userId ? String(userId) : 'anonymous',
        timestamp: formatISO(new Date())
    };

    try {
        const ratings = await readData(RATINGS_FILE_NAME);
        ratings.push(newRating);
        await writeData(RATINGS_FILE_NAME, ratings);

        res.status(201).json(newRating);
    } catch (error) {
        console.error(`Fehler beim Hinzufügen einer Bewertung für Ressource ${req.params.resourceId}:`, error);
        next(error);
    }
});

/**
 * POST /resources/:resourceId/feedback
 * @summary Fügt einer Ressource ein neues Feedback hinzu.
 * @description Nimmt Feedback-Text und optional eine Benutzer-ID entgegen, generiert eine UUID und speichert das Feedback.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {string} req.params.resourceId - Die ID der Ressource, für die Feedback gegeben wird.
 * @param {object} req.body - Die Feedback-Daten ({ feedbackText: string, [userId]: string }).
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 * @returns {object} 201 - Das neu erstellte Feedback-Objekt.
 * @returns {object} 400 - Ungültige oder fehlende Feedback-Daten (validiert durch `validateFeedback` Middleware).
 * @returns {object} 500 - Interner Serverfehler.
 */
router.post('/:resourceId/feedback', validateFeedback, async (req, res, next) => {
    const resourceId = String(req.params.resourceId);
    const { feedbackText, userId } = req.body;

    const newFeedback = {
        id: uuidv4(),
        resourceId: resourceId,
        feedbackText: feedbackText.trim(),
        userId: userId ? String(userId) : 'anonymous',
        timestamp: formatISO(new Date())
    };

    try {
        const feedback = await readData(FEEDBACK_FILE_NAME);
        feedback.push(newFeedback);
        await writeData(FEEDBACK_FILE_NAME, feedback);

        res.status(201).json(newFeedback);
    } catch (error) {
        console.error(`Fehler beim Hinzufügen von Feedback für Ressource ${req.params.resourceId}:`, error);
        next(error);
    }
});

/**
 * PUT /resources/:resourceId/feedback/:feedbackId
 * @summary Aktualisiert ein bestehendes Feedback für eine Ressource.
 * @description Nimmt die IDs der Ressource und des Feedbacks sowie den aktualisierten Feedback-Text entgegen.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {string} req.params.resourceId - Die ID der Ressource, zu der das Feedback gehört.
 * @param {string} req.params.feedbackId - Die ID des zu aktualisierenden Feedbacks.
 * @param {object} req.body - Die aktualisierten Feedback-Daten ({ feedbackText: string }).
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 * @returns {object} 200 - Das aktualisierte Feedback-Objekt.
 * @returns {object} 400 - Ungültige oder fehlende Feedback-Daten (validiert durch `validateFeedback` Middleware).
 * @returns {object} 404 - Feedback nicht gefunden.
 * @returns {object} 500 - Interner Serverfehler.
 */
router.put('/:resourceId/feedback/:feedbackId', validateFeedback, async (req, res, next) => {
    const resourceId = String(req.params.resourceId);
    const feedbackId = String(req.params.feedbackId);
    const { feedbackText } = req.body;

    try {
        let feedback = await readData(FEEDBACK_FILE_NAME);
        // Findet den Index des Feedbacks, das zu beiden IDs passt
        const feedbackIndex = feedback.findIndex(f => String(f.id) === feedbackId && String(f.resourceId) === resourceId);

        if (feedbackIndex === -1) {
            return res.status(404).json({ error: `Feedback mit ID ${feedbackId} für Ressource ${resourceId} nicht gefunden.` });
        }

        // Feedback-Text und Zeitstempel aktualisieren
        const currentFeedback = feedback[feedbackIndex];
        currentFeedback.feedbackText = feedbackText.trim();
        currentFeedback.timestamp = formatISO(new Date());

        feedback[feedbackIndex] = currentFeedback; // Das aktualisierte Objekt in die Liste zurücklegen
        await writeData(FEEDBACK_FILE_NAME, feedback);

        res.status(200).json(currentFeedback);
    } catch (error) {
        console.error(`Fehler beim Aktualisieren von Feedback ${req.params.feedbackId} für Ressource ${req.params.resourceId}:`, error);
        next(error);
    }
});

/**
 * DELETE /resources/:resourceId/feedback/:feedbackId
 * @summary Löscht ein Feedback für eine bestimmte Ressource.
 * @description Löscht ein Feedback-Element anhand seiner ID und der zugehörigen Ressourcen-ID.
 * @param {express.Request} req - Das Express-Request-Objekt.
 * @param {string} req.params.resourceId - Die ID der Ressource, zu der das Feedback gehört.
 * @param {string} req.params.feedbackId - Die ID des zu löschenden Feedbacks.
 * @param {express.Response} res - Das Express-Response-Objekt.
 * @param {express.NextFunction} next - Die Next-Middleware-Funktion.
 * @returns {object} 204 - Erfolgreich gelöscht (kein Inhalt zurückgegeben).
 * @returns {object} 404 - Feedback nicht gefunden.
 * @returns {object} 500 - Interner Serverfehler.
 */
router.delete('/:resourceId/feedback/:feedbackId', async (req, res, next) => {
    const resourceId = String(req.params.resourceId);
    const feedbackId = String(req.params.feedbackId);

    try {
        let feedback = await readData(FEEDBACK_FILE_NAME);
        const initialLength = feedback.length; // Ursprüngliche Länge speichern

        // Filtere alle Feedback-Einträge heraus, die zu beiden IDs passen
        feedback = feedback.filter(f => !(String(f.id) === feedbackId && String(f.resourceId) === resourceId));

        if (feedback.length === initialLength) {
            // Wenn die Länge sich nicht geändert hat, wurde kein passendes Feedback gefunden
            return res.status(404).json({ error: `Feedback mit ID ${feedbackId} für Ressource ${resourceId} nicht gefunden.` });
        }

        await writeData(FEEDBACK_FILE_NAME, feedback); // Aktualisierte Liste speichern

        res.status(204).end(); // 204 No Content bei erfolgreicher Löschung
    } catch (error) {
        console.error(`Fehler beim Löschen von Feedback ${req.params.feedbackId} für Ressource ${req.params.resourceId}:`, error);
        next(error);
    }
});


export default router;

