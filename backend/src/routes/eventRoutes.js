const express = require('express');
const router = express.Router();
const {
  trackEvents,
  getSessions,
  getSessionEvents,
  getHeatmapData,
  getPages,
} = require('../controllers/eventController');

// POST /api/events — ingest events from tracker
router.post('/events', trackEvents);

// GET /api/sessions — list all sessions
router.get('/sessions', getSessions);

// GET /api/sessions/:sessionId — events for a specific session
router.get('/sessions/:sessionId', getSessionEvents);

// GET /api/heatmap?page_url=<url> — click data for heatmap
router.get('/heatmap', getHeatmapData);

// GET /api/pages — all distinct tracked page URLs
router.get('/pages', getPages);

module.exports = router;
