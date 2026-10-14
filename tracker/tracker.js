/**
 * CausalFunnel Analytics Tracker v1.0.0
 * 
 * Drop this script on any webpage to start tracking:
 *   - page_view  — fires once on page load
 *   - click      — fires on every user click, with x/y coordinates
 *
 * Configuration (optional, set before including the script):
 *   window.CF_ANALYTICS_ENDPOINT = 'http://localhost:4000/api/events';
 */
(function (window, document) {
  'use strict';

  // ─── Config ──────────────────────────────────────────────────────────────────
  const ENDPOINT =
    window.CF_ANALYTICS_ENDPOINT || 'http://localhost:4000/api/events';
  const SESSION_KEY = 'cf_session_id';
  const BATCH_INTERVAL_MS = 2000; // flush queued events every 2 s
  const MAX_QUEUE_SIZE = 50;      // safety cap

  // ─── Session ID ──────────────────────────────────────────────────────────────
  function generateId() {
    // Use crypto.randomUUID if available, fallback to Math.random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getOrCreateSession() {
    // Try localStorage first, then sessionStorage as fallback
    try {
      let sid = localStorage.getItem(SESSION_KEY);
      if (!sid) {
        sid = generateId();
        localStorage.setItem(SESSION_KEY, sid);
      }
      return sid;
    } catch (e) {
      // Private-mode browsers may block localStorage
      try {
        let sid = sessionStorage.getItem(SESSION_KEY);
        if (!sid) {
          sid = generateId();
          sessionStorage.setItem(SESSION_KEY, sid);
        }
        return sid;
      } catch (e2) {
        return generateId(); // worst-case: new id per page
      }
    }
  }

  const SESSION_ID = getOrCreateSession();

  // ─── Event Queue & Flush ─────────────────────────────────────────────────────
  const queue = [];
  let flushTimer = null;

  function buildBase(eventType) {
    return {
      session_id: SESSION_ID,
      event_type: eventType,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
    };
  }

  function enqueue(event) {
    queue.push(event);
    if (queue.length >= MAX_QUEUE_SIZE) {
      flush();
    }
  }

  function flush() {
    if (queue.length === 0) return;
    const batch = queue.splice(0); // drain queue

    // Use sendBeacon for last-resort (page unload), fetch otherwise
    const body = JSON.stringify(batch);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(ENDPOINT, blob);
      if (sent) return;
    }

    // Fallback to fetch (fire-and-forget)
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(function (err) {
      console.warn('[CF Analytics] Failed to send events:', err);
    });
  }

  // ─── Track page_view ─────────────────────────────────────────────────────────
  function trackPageView() {
    const event = buildBase('page_view');
    enqueue(event);
  }

  // ─── Track click ─────────────────────────────────────────────────────────────
  function trackClick(e) {
    const event = Object.assign(buildBase('click'), {
      x: e.clientX,
      y: e.clientY,
      // Normalized coordinates (0–1) for responsive heatmaps
      x_norm: e.clientX / (window.innerWidth || 1),
      y_norm: e.clientY / (window.innerHeight || 1),
      target_tag: (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : null,
      target_id: (e.target && e.target.id) ? e.target.id : null,
      target_text: (e.target && e.target.innerText)
        ? e.target.innerText.trim().substring(0, 100)
        : null,
    });
    enqueue(event);
  }

  // ─── Wire Up Events ──────────────────────────────────────────────────────────
  function init() {
    // Track the initial page view
    trackPageView();

    // Track clicks
    document.addEventListener('click', trackClick, { passive: true });

    // Periodic batch flush
    flushTimer = setInterval(flush, BATCH_INTERVAL_MS);

    // Flush on page unload
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);

    // Expose session ID for debugging
    window._cfSessionId = SESSION_ID;

    console.log('[CF Analytics] Initialized. Session:', SESSION_ID);
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window, document));
