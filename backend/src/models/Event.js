const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: true,
      index: true,
    },
    event_type: {
      type: String,
      required: true,
      enum: ['page_view', 'click'],
      index: true,
    },
    page_url: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    // Click-specific coordinates
    x: {
      type: Number,
      default: null,
    },
    y: {
      type: Number,
      default: null,
    },
    // Viewport dimensions for normalizing heatmap
    viewport_width: {
      type: Number,
      default: null,
    },
    viewport_height: {
      type: Number,
      default: null,
    },
    // Optional metadata
    user_agent: {
      type: String,
      default: null,
    },
    referrer: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  }
);

// Compound index for heatmap queries
eventSchema.index({ page_url: 1, event_type: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
