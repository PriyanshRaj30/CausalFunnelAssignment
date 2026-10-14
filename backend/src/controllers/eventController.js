const Event = require('../models/Event');

/**
 * POST /api/events
 * Receive and store one or more events from the tracker script.
 */
const trackEvents = async (req, res) => {
  try {
    const payload = req.body;

    // Support both single event object and array of events
    const events = Array.isArray(payload) ? payload : [payload];

    if (events.length === 0) {
      return res.status(400).json({ error: 'No events provided' });
    }

    // Basic validation
    for (const event of events) {
      if (!event.session_id || !event.event_type || !event.page_url) {
        return res.status(400).json({
          error: 'Each event must have session_id, event_type, and page_url',
        });
      }
      if (!['page_view', 'click'].includes(event.event_type)) {
        return res.status(400).json({
          error: `Invalid event_type: ${event.event_type}. Must be 'page_view' or 'click'`,
        });
      }
    }

    const saved = await Event.insertMany(events, { ordered: false });

    return res.status(201).json({
      message: 'Events tracked successfully',
      count: saved.length,
    });
  } catch (error) {
    console.error('trackEvents error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/sessions
 * Fetch all sessions with event counts, last seen time, and page count.
 */
const getSessions = async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$session_id',
          total_events: { $sum: 1 },
          page_views: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          first_seen: { $min: '$timestamp' },
          last_seen: { $max: '$timestamp' },
          pages_visited: { $addToSet: '$page_url' },
        },
      },
      {
        $project: {
          session_id: '$_id',
          _id: 0,
          total_events: 1,
          page_views: 1,
          clicks: 1,
          first_seen: 1,
          last_seen: 1,
          pages_count: { $size: '$pages_visited' },
          duration_seconds: {
            $divide: [
              { $subtract: ['$last_seen', '$first_seen'] },
              1000,
            ],
          },
        },
      },
      { $sort: { last_seen: -1 } },
    ]);

    return res.status(200).json({ sessions, total: sessions.length });
  } catch (error) {
    console.error('getSessions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/sessions/:sessionId
 * Fetch all events for a specific session in chronological order.
 */
const getSessionEvents = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const events = await Event.find({ session_id: sessionId })
      .sort({ timestamp: 1 })
      .lean();

    if (events.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.status(200).json({ session_id: sessionId, events, total: events.length });
  } catch (error) {
    console.error('getSessionEvents error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/heatmap?page_url=<url>
 * Fetch all click events for a page (used to render heatmap).
 */
const getHeatmapData = async (req, res) => {
  try {
    const { page_url } = req.query;

    if (!page_url) {
      return res.status(400).json({ error: 'page_url query parameter is required' });
    }

    const clicks = await Event.find({
      page_url,
      event_type: 'click',
      x: { $ne: null },
      y: { $ne: null },
    })
      .select('x y viewport_width viewport_height timestamp session_id -_id')
      .lean();

    // Also get list of unique pages for the dropdown
    const pages = await Event.distinct('page_url');

    return res.status(200).json({
      page_url,
      clicks,
      total: clicks.length,
      pages,
    });
  } catch (error) {
    console.error('getHeatmapData error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/pages
 * Fetch all distinct page URLs that have been tracked.
 */
const getPages = async (req, res) => {
  try {
    const pages = await Event.distinct('page_url');
    return res.status(200).json({ pages });
  } catch (error) {
    console.error('getPages error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  trackEvents,
  getSessions,
  getSessionEvents,
  getHeatmapData,
  getPages,
};
