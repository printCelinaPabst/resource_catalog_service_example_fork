/**
 * @file Manages API routes for the resource catalog, encompassing operations for
 * fetching resources, and comprehensive CRUD operations for feedback (including ratings)
 * associated with those resources. This file adheres to modern ES Module syntax.
 * @author Your Name
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // Utilized for generating unique identifiers for new feedback entries
import { fileURLToPath } from 'url';

const router = express.Router();

// In ES Module environments, `__dirname` is not intrinsically available.
// We explicitly reconstruct it to ensure correct file path resolution.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the absolute file paths for data storage.
// These paths assume a 'data' directory exists at the root level of your project,
// positioned as a sibling to your 'routes' directory.
const resourcesFilePath = path.join(__dirname, '../data/resources.json');
const feedbackFilePath = path.join(__dirname, '../data/feedback.json');

/**
 * @function readData
 * @description A synchronous helper utility designed to read and parse data from a specified JSON file.
 * It gracefully handles scenarios where the file might not exist or contains malformed JSON
 * by logging the error and returning an empty array, ensuring API robustness.
 * @param {string} filePath - The absolute path to the JSON file to be read.
 * @returns {Array<Object>} The parsed JSON data as an array of JavaScript objects.
 * Returns an empty array if the file is not found or parsing fails.
 */
const readData = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
};

/**
 * @function writeData
 * @description A synchronous helper utility for writing an array of data objects to a specified JSON file.
 * The output JSON is formatted with 2-space indentation for enhanced readability.
 * @param {string} filePath - The absolute path to the JSON file where data will be written.
 * @param {Array<Object>} data - The array of data objects to serialize and write to the file.
 */
const writeData = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing to ${filePath}:`, error);
    }
};

// --- RESOURCE ENDPOINTS ---

/**
 * @route GET /resources
 * @description **Retrieves a comprehensive list of all learning resources.**
 * Each resource object in the response is augmented to include an embedded array
 * of all its associated feedback entries (which inherently contain ratings).
 * This allows for a single API call to get resources along with their current feedback status.
 * @access Public
 * @returns {Array<Object>} 200 - An array of resource objects. Each object contains
 * its fundamental details and a `feedback` array.
 * The `feedback` array will be empty if no feedback exists for a resource.
 * @example
 * // Request: GET /resources
 * // Response (Status: 200 OK):
 * // [
 * //   {
 * //     "id": "resource-123",
 * //     "title": "Mastering React Hooks",
 * //     "description": "A deep dive into functional components and hooks.",
 * //     "topic": "Frontend Development",
 * //     "feedback": [
 * //       { "id": "feedback-a1", "resourceId": "resource-123", "comment": "Excellent!", "rating": 5, "author": "devUser", "timestamp": "2023-08-25T10:00:00.000Z" },
 * //       { "id": "feedback-b2", "resourceId": "resource-123", "comment": "Could use more examples.", "rating": 4, "author": "learnerX", "timestamp": "2023-08-25T11:30:00.000Z" }
 * //     ]
 * //   },
 * //   {
 * //     "id": "resource-456",
 * //     "title": "Introduction to Node.js",
 * //     "topic": "Backend Development",
 * //     "feedback": [] // No feedback yet for this resource
 * //   }
 * // ]
 */
router.get('/', (req, res) => {
    const resources = readData(resourcesFilePath);
    const feedback = readData(feedbackFilePath);

    // Iterates through each resource to attach its relevant feedback entries.
    const resourcesWithFeedback = resources.map(resource => ({
        ...resource,
        // Filters the global feedback array to find only entries pertaining to the current resource.
        feedback: feedback.filter(f => f.resourceId === resource.id)
    }));
    res.json(resourcesWithFeedback);
});

/**
 * @route GET /resources/:id
 * @description **Retrieves a single learning resource by its unique ID.**
 * The returned resource object is enhanced with an embedded array of all its
 * associated feedback entries, providing a complete view of the resource and its evaluations.
 * @access Public
 * @param {string} req.params.id - The unique identifier of the resource to be fetched.
 * @returns {Object} 200 - The resource object, including its details and a `feedback` array.
 * @returns {Object} 404 - If no resource with the provided ID is found in the catalog.
 * @example
 * // Request: GET /resources/resource-123
 * // Response (Status: 200 OK):
 * // {
 * //   "id": "resource-123",
 * //   "title": "Mastering React Hooks",
 * //   "description": "A deep dive into functional components and hooks.",
 * //   "topic": "Frontend Development",
 * //   "feedback": [
 * //     { "id": "feedback-a1", "resourceId": "resource-123", "comment": "Excellent!", "rating": 5, "author": "devUser", "timestamp": "2023-08-25T10:00:00.000Z" },
 * //     { "id": "feedback-b2", "resourceId": "resource-123", "comment": "Could use more examples.", "rating": 4, "author": "learnerX", "timestamp": "2023-08-25T11:30:00.000Z" }
 * //   ]
 * // }
 * @example
 * // Request: GET /resources/nonExistentId
 * // Response (Status: 404 Not Found):
 * // { "message": "Resource not found" }
 */
router.get('/:id', (req, res) => {
    const resources = readData(resourcesFilePath);
    const feedback = readData(feedbackFilePath);

    const resource = resources.find(r => r.id === req.params.id);

    if (resource) {
        // Attach feedback entries specific to this resource.
        resource.feedback = feedback.filter(f => f.resourceId === resource.id);
        res.json(resource);
    } else {
        res.status(404).json({ message: 'Resource not found' });
    }
});

// --- FEEDBACK AND RATING ENDPOINTS ---

/**
 * @route POST /resources/:resourceId/feedback
 * @description **Submits new feedback (including a rating) for a specified resource.**
 * This endpoint requires a `comment`, `rating` (a numerical value), and an `author`
 * in the request body to create a new feedback entry.
 * @access Private (typically requires user authentication and possibly authorization)
 * @param {string} req.params.resourceId - The unique ID of the resource to which this feedback applies.
 * @body {string} comment - The textual content of the feedback or review.
 * @body {number} rating - A numerical score or rating for the resource (e.g., 1 to 5).
 * @body {string} author - The name or identifier of the user submitting the feedback.
 * @returns {Object} 201 - The newly created feedback item, including its generated unique ID
 * and the timestamp of submission.
 * @returns {Object} 400 - If any of the mandatory fields (`comment`, `rating`, `author`) are
 * missing or invalid in the request body.
 * @returns {Object} 404 - If the `resourceId` provided in the URL does not match an existing resource.
 * @example
 * // Request: POST /resources/resource-123/feedback
 * // Request Body: { "comment": "This tutorial greatly improved my understanding!", "rating": 5, "author": "NewDev" }
 * // Response (Status: 201 Created):
 * // {
 * //   "id": "new-uuid-string-1234",
 * //   "resourceId": "resource-123",
 * //   "comment": "This tutorial greatly improved my understanding!",
 * //   "rating": 5,
 * //   "author": "NewDev",
 * //   "timestamp": "2023-08-25T15:45:00.000Z"
 * // }
 * @example
 * // Request: POST /resources/nonExistentId/feedback
 * // Request Body: { "comment": "test", "rating": 3, "author": "anon" }
 * // Response (Status: 404 Not Found):
 * // { "message": "Resource not found." }
 */
router.post('/:resourceId/feedback', (req, res) => {
    const { resourceId } = req.params;
    const { comment, rating, author } = req.body;

    // Validate the presence of all required feedback fields.
    if (!comment || rating === undefined || rating === null || !author) {
        return res.status(400).json({ message: 'Comment, rating (number), and author are required fields.' });
    }

    const resources = readData(resourcesFilePath);
    const resourceExists = resources.some(r => r.id === resourceId);

    if (!resourceExists) {
        return res.status(404).json({ message: 'Resource not found.' });
    }

    const feedback = readData(feedbackFilePath);
    const newFeedback = {
        id: uuidv4(), // Assign a unique ID using uuid library
        resourceId,
        comment,
        rating: parseInt(rating, 10), // Ensure rating is stored as an integer
        author,
        timestamp: new Date().toISOString() // Capture the current UTC timestamp
    };

    feedback.push(newFeedback);
    writeData(feedbackFilePath, feedback);

    res.status(201).json(newFeedback);
});

/**
 * @route PUT /resources/:resourceId/feedback/:feedbackId
 * @description **Updates an existing feedback entry for a specific resource.**
 * This endpoint allows for partial modifications to a feedback's `comment` or `rating`.
 * The `feedbackId` must correspond to an entry within the specified `resourceId`.
 * @access Private (typically requires authentication and authorization to edit one's own feedback)
 * @param {string} req.params.resourceId - The ID of the resource that owns the feedback to be updated.
 * @param {string} req.params.feedbackId - The unique ID of the specific feedback entry to modify.
 * @body {string} [comment] - The new textual content for the feedback (optional field for update).
 * @body {number} [rating] - The new numerical rating for the feedback (optional field for update).
 * @returns {Object} 200 - The fully updated feedback item.
 * @returns {Object} 404 - If the `resourceId` is not found, or if the `feedbackId` does not
 * exist under the specified `resourceId`.
 * @example
 * // Request: PUT /resources/resource-123/feedback/feedback-a1
 * // Request Body: { "comment": "It's even better than I first thought!", "rating": 5 }
 * // Response (Status: 200 OK):
 * // {
 * //   "id": "feedback-a1",
 * //   "resourceId": "resource-123",
 * //   "comment": "It's even better than I first thought!",
 * //   "rating": 5,
 * //   "author": "devUser",
 * //   "timestamp": "2023-08-25T10:00:00.000Z"
 * // }
 * @example
 * // Request: PUT /resources/resource-123/feedback/nonExistentFeedbackId
 * // Request Body: { "rating": 2 }
 * // Response (Status: 404 Not Found):
 * // { "message": "Feedback not found for this resource." }
 */
router.put('/:resourceId/feedback/:feedbackId', (req, res) => {
    const { resourceId, feedbackId } = req.params;
    const updates = req.body; // Contains fields to be updated, e.g., 'comment' or 'rating'

    const resources = readData(resourcesFilePath);
    const resourceExists = resources.some(r => r.id === resourceId);

    if (!resourceExists) {
        return res.status(404).json({ message: 'Resource not found.' });
    }

    let feedback = readData(feedbackFilePath);
    const feedbackIndex = feedback.findIndex(
        f => f.id === feedbackId && f.resourceId === resourceId
    );

    if (feedbackIndex !== -1) {
        // Apply updates to the found feedback entry.
        // Explicitly convert `rating` to an integer if it's present in the updates.
        const updatedFeedback = { ...feedback[feedbackIndex], ...updates };
        if (updatedFeedback.rating !== undefined && updatedFeedback.rating !== null) {
             updatedFeedback.rating = parseInt(updatedFeedback.rating, 10);
        }
        feedback[feedbackIndex] = updatedFeedback;
        writeData(feedbackFilePath, feedback);
        res.json(feedback[feedbackIndex]);
    } else {
        res.status(404).json({ message: 'Feedback not found for this resource.' });
    }
});

/**
 * @route DELETE /resources/:resourceId/feedback/:feedbackId
 * @description **Deletes a specific feedback entry associated with a given resource.**
 * Both the `resourceId` and `feedbackId` must correctly identify an existing feedback entry
 * for the deletion to succeed.
 * @access Private (typically requires authentication and authorization to delete one's own or moderated feedback)
 * @param {string} req.params.resourceId - The ID of the resource from which feedback will be deleted.
 * @param {string} req.params.feedbackId - The unique ID of the specific feedback entry to remove.
 * @returns {Object} 200 - A success message confirming the feedback was deleted.
 * @returns {Object} 404 - If the `resourceId` is not found, or if the `feedbackId` does not
 * exist under the specified `resourceId`.
 * @example
 * // Request: DELETE /resources/resource-123/feedback/feedback-b2
 * // Response (Status: 200 OK):
 * // { "message": "Feedback deleted successfully." }
 * @example
 * // Request: DELETE /resources/resource-123/feedback/nonExistentFeedbackId
 * // Response (Status: 404 Not Found):
 * // { "message": "Feedback not found for this resource." }
 */
router.delete('/:resourceId/feedback/:feedbackId', (req, res) => {
    const { resourceId, feedbackId } = req.params;

    const resources = readData(resourcesFilePath);
    const resourceExists = resources.some(r => r.id === resourceId);

    if (!resourceExists) {
        return res.status(404).json({ message: 'Resource not found.' });
    }

    let feedback = readData(feedbackFilePath);
    const initialLength = feedback.length;
    // Filters out the specific feedback item to be deleted based on both IDs.
    feedback = feedback.filter(f => !(f.id === feedbackId && f.resourceId === resourceId));

    if (feedback.length < initialLength) {
        // If the array length changed, it means an item was successfully removed.
        writeData(feedbackFilePath, feedback);
        res.status(200).json({ message: 'Feedback deleted successfully.' });
    } else {
        res.status(404).json({ message: 'Feedback not found for this resource.' });
    }
});

export default router;
