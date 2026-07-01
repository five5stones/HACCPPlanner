# HACCP Plan Manager

A browser-based tool for building, managing, printing, and sharing **HACCP** (Hazard Analysis and Critical Control Point) plans and production flow charts.

No database required — plans are stored in a local JSON file and synced through a small Python server.

![Python 3](https://img.shields.io/badge/python-3.10+-blue.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

## Features

- **Document library** — create, duplicate, rename, and delete multiple HACCP plans
- **8-step wizard** — process step → hazards → controls → limits → monitoring → frequency → corrective actions → records
- **Reference steps** — table-only rows (e.g. Listeria controls) excluded from the flow chart
- **Live preview** — HACCP table and flow chart update as you build
- **Version tracking** — plan version bumps when content changes
- **Print / Save PDF** — landscape HACCP table and portrait flow chart layouts
- **Admin settings** — business name shown in footers, browser title, and print headers
- **View-only links** — share read-only plan links (`view.html?doc=…`)
- **Import / export JSON** — backup and restore individual plans
- **Sample plan** — includes a full Sandwich Production HACCP example on first run

## Requirements

- **Python 3.10+** (stdlib only — no pip packages)
- A modern web browser (Chrome, Firefox, Edge, Safari)

## Quick start

```bash
git clone https://github.com/five5stones/HACCPPlanner.git
cd HACCPPlanner
python3 server.py
```

Open **http://127.0.0.1:8765/** in your browser.

> **Important:** Use `python3 server.py` rather than opening `index.html` directly. The server saves your plans to `data/library.json` and powers view-only share links.

### Optional environment variables

| Variable     | Default       | Description        |
|-------------|---------------|--------------------|
| `HACCP_HOST` | `127.0.0.1` | Server bind address |
| `HACCP_PORT` | `8765`      | Server port         |

Example:

```bash
HACCP_HOST=0.0.0.0 HACCP_PORT=9000 python3 server.py
```

## Project structure

```
HACCPPlanner/
├── index.html          # Main app (dashboard + plan builder)
├── view.html           # Read-only shared plan viewer
├── server.py           # Static file server + JSON API
├── css/style.css       # Styles and print layouts
├── js/
│   ├── app.js          # Wizard, dashboard, preview UI
│   ├── store.js        # Document library and persistence
│   ├── flowchart.js    # SVG flow chart renderer
│   ├── haccp-render.js # Shared table rendering
│   ├── view.js         # View-only page logic
│   └── sample-data.js  # Sandwich HACCP sample data
└── data/
    └── library.json    # Created at runtime (not in git)
```

## Usage

### Create a plan

1. Click **+ Create new HACCP plan** on the dashboard
2. Work through the wizard for each process step
3. Review and edit from the **Review** tab
4. Use **Print / Save PDF** when ready

### Edit a section from Review

1. Open **Review** for a plan
2. Expand a process step
3. Click **Edit** next to the section you want (e.g. Control measures)
4. Click **Save and return to review** when done

### Share a read-only link

1. Click **View link** on the dashboard or in the plan header
2. Copy the URL (e.g. `http://localhost:8765/view.html?doc=sandwich`)
3. Anyone with the link can view and print — not edit

### Admin — business name

1. Dashboard → **Admin**
2. Enter your business name and **Save settings**
3. Appears in document footers, the app title, and print headers

### Backup a plan

Use **Export JSON** in the plan header, or back up the whole library:

```bash
cp data/library.json data/library-backup.json
```

## API

The server exposes a small JSON API:

| Method | Path                    | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/library`          | Full document library    |
| PUT    | `/api/library`          | Save full library        |
| GET    | `/api/documents/{id}`   | Single plan + settings   |
| GET    | `/api/health`           | Health check             |

## Data storage

- **Primary:** `data/library.json` on the server
- **Cache:** browser `localStorage` for offline resilience

Your plan data stays on your machine unless you deploy the server elsewhere or share export files / view links.

## Development

The app is plain HTML, CSS, and JavaScript — no build step. Edit files and refresh the browser.

After changing `server.py`, restart the server:

```bash
# Ctrl+C to stop, then:
python3 server.py
```

## License

MIT — see [LICENSE](LICENSE).

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/five5stones/HACCPPlanner).
