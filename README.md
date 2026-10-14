* [ ] 

# CausalFunnel User Analytics Application

A full-stack user analytics application that tracks user interactions on a webpage and displays them in a beautiful dashboard.

---

## 📐 Tech Stack

| Layer               | Technology                           |
| ------------------- | ------------------------------------ |
| **Frontend**  | Next.js 16 (App Router), Vanilla CSS |
| **Backend**   | Node.js + Express.js                 |
| **Database**  | MongoDB 7 + Mongoose ODM             |
| **Tracker**   | Vanilla JavaScript (no dependencies) |
| **Demo Page** | Plain HTML + CSS                     |

---

## 📁 Project Structure

```
CausalFunnel-assignment/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── config/db.js   # MongoDB connection
│   │   ├── models/Event.js  # Mongoose Event schema
│   │   ├── controllers/eventController.js  # Business logic
│   │   ├── routes/eventRoutes.js           # API routes
│   │   └── index.js       # Express server entry
│   ├── .env
│   └── package.json
│
├── frontend/              # Next.js Dashboard
│   ├── app/
│   │   ├── layout.jsx     # Root layout
│   │   ├── page.jsx       # Dashboard (Sessions + Heatmap)
│   │   └── globals.css    # Design system styles
│   ├── lib/
│   │   ├── api.js         # API client
│   │   └── utils.js       # Formatters
│   └── .env.local
│
├── tracker/
│   └── tracker.js         # Drop-in analytics tracking script
│
├── demo/
│   └── index.html         # Demo e-commerce page
│
└── README.md
```

---

## 🚀 Setup & Running

### Prerequisites

- **Node.js** v18+
- **MongoDB** v6+ running locally (`mongod`)

### 1. Start MongoDB

```bash
mongod --dbpath /usr/local/var/mongodb
# or on macOS with Homebrew:
brew services start mongodb-community
```

### 2. Start the Backend

```bash
cd backend
npm install
npm run dev     # starts on http://localhost:4000
```

Backend API Endpoints:

- `POST /api/events` — Receive events from tracker
- `GET  /api/sessions` — List all sessions with event counts
- `GET  /api/sessions/:id` — Events for a specific session
- `GET  /api/heatmap?page_url=<url>` — Click data for heatmap
- `GET  /api/pages` — All distinct tracked URLs
- `GET  /health` — Health check

### 3. Start the Frontend Dashboard

```bash
cd frontend
npm install     # if not done yet
npm run dev     # starts on http://localhost:3000
```

Open **http://localhost:3000** to view the dashboard.

### 4. Open the Demo Page

Open `demo/index.html` in your browser (via a local file server or directly).

```bash
# Quick option using Python:
cd demo && python3 -m http.server 8080
# Then open http://localhost:8080
```

The demo page automatically loads the tracker script and sends events to `http://localhost:4000/api/events`.

---

## 🎯 Features

### Event Tracking (Client Side)

- **`page_view`** event fires on page load
- **`click`** events fire on every user click with:
  - Absolute `x`, `y` coordinates
  - Normalized `x_norm`, `y_norm` (0–1, for responsive heatmaps)
  - `viewport_width` / `viewport_height`
  - `target_tag`, `target_id`, `target_text` for context
- **Session persistence** via `localStorage` (falls back to `sessionStorage`)
- **Event batching** — events are queued and flushed every 2 seconds
- **Beacon API** used for reliable last-send on page unload
- **Zero dependencies** — pure vanilla JS

### Dashboard

- **Sessions View** — Table of all sessions with total events, page views, clicks, duration, and relative timestamps
- **Session Journey** — Chronological timeline of all events in a session with type, URL, coordinates, and target info
- **Heatmap View** — Canvas-based click heatmap with:
  - Radial gradient blobs scaled by click density
  - Color intensity: blue → green → amber → red (hot)
  - Page URL selector dropdown
  - Click count stats

---

## ⚙️ Configuration

### Backend `.env`

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/causalfunnel
CORS_ORIGIN=http://localhost:3000
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Tracker Configuration

```html
<script>
  window.CF_ANALYTICS_ENDPOINT = 'https://your-api.com/api/events';
</script>
<script src="tracker.js"></script>
```

---

## 🤔 Assumptions & Trade-offs

| Decision                              | Reasoning                                                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Event batching (2s)**         | Reduces HTTP requests; events are still real-time enough for analytics. Beacon API ensures data isn't lost on navigation.                       |
| **localStorage for session ID** | Persists across tabs in the same browser. A cookie-based approach would be more robust for cross-tab isolation but adds complexity.             |
| **Canvas-based heatmap**        | Lightweight with no external charting library. A production version might use a library like`heatmap.js` or `leaflet` for better smoothing. |
| **No authentication**           | Omitted for simplicity. In production, the API would require API keys or JWT tokens.                                                            |
| **Normalized coordinates**      | `x_norm` and `y_norm` (0–1) allow the heatmap to be rendered at any canvas size regardless of the original viewport.                       |
| **MongoDB insertMany**          | Supports batch inserts from the tracker's queue, reducing round-trips.                                                                          |
| **No real-time updates**        | The dashboard uses polling on demand (manual refresh). WebSockets/SSE would be the next step.                                                   |
| **Vanilla CSS**                 | Full control over the design system; avoids Tailwind's class verbosity for complex animations and custom components.                            |

---

## 📸 Screenshots

|        Sessions View        |     Session Journey     |            Heatmap            |
| :-------------------------: | :----------------------: | :---------------------------: |
| List of sessions with stats | Timeline of user actions | Click intensity visualization |

---

## 🛣️ Future Improvements

- [ ] Real-time dashboard updates via WebSockets
- [ ] Funnel analysis (drop-off between pages)
- [ ] Device/browser breakdown
- [ ] Date range filtering
- [ ] Export to CSV
- [ ] Custom event support (e.g., `form_submit`, `scroll_depth`)
- [ ] Dockerize with `docker-compose`
