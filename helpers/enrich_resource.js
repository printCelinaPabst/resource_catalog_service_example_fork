/**
 * @file Helfer zum Anreichern eines Ressourcenobjekts mit Bewertungen & Feedback.
 */

import { average } from './metrics.js';

/**
 * Baut ein angereichertes Ressourcenobjekt mit `averageRating` und `feedback`
 * anhand der übergebenen Gesamtdaten.
 * @param {Object} resource - Die Basisressource.
 * @param {Array<Object>} ratings - Alle Ratings aus dem Datenspeicher.
 * @param {Array<Object>} feedback - Alles Feedback aus dem Datenspeicher.
 * @returns {Object} Enriched resource.
 */
export function buildEnrichedResource(resource, ratings, feedback) {
  const resourceId = String(resource.id);

  const resourceRatings = ratings.filter(r => String(r.resourceId) === resourceId);
  const avgRating = average(resourceRatings.map(r => r.ratingValue));

  const resourceFeedback = feedback.filter(f => String(f.resourceId) === resourceId);

  return {
    ...resource,
    averageRating: avgRating,
    feedback: resourceFeedback
  };
}
