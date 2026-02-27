# EventSphere Frontend

React + Vite + Tailwind CSS frontend for the EventSphere campus event platform.

## Stack
- **React 18** — UI library
- **Vite 5** — build tool & dev server
- **Tailwind CSS 3** — utility-first styling
- **React Router 6** — client-side routing
- **Axios** — HTTP client with interceptors
- **date-fns** — date formatting
- **lucide-react** — icons

## Project Structure

```
src/
├── context/
│   └── AuthContext.jsx      # Admin auth state (JWT in localStorage)
├── hooks/
│   └── useFetch.js          # Generic data-fetching hook
├── lib/
│   └── api.js               # Axios client + all API methods
├── components/
│   ├── ui/index.jsx         # Badge, Input, Toast, Skeleton, etc.
│   ├── layout/Navbar.jsx    # Top navigation bar
│   ├── EventCard.jsx        # Event card for listing
│   └── ProtectedRoute.jsx   # Auth guard for admin routes
└── pages/
    ├── HomePage.jsx          # Public: event listing with filters
    ├── EventDetailPage.jsx   # Public: event detail + registration form
    ├── AdminLoginPage.jsx    # Admin login
    ├── AdminDashboardPage.jsx# Admin: stats overview
    ├── AdminEventsPage.jsx   # Admin: events table + delete
    ├── EventFormPage.jsx     # Admin: create/edit event (shared form)
    └── RegistrationsPage.jsx # Admin: registrations table + CSV export
```

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Event listing with search & category filters |
| `/events/:id` | Public | Event detail + registration form |
| `/admin/login` | Public | Admin login |
| `/admin` | Protected | Dashboard with stats |
| `/admin/events` | Protected | Event management table |
| `/admin/events/new` | Protected | Create new event |
| `/admin/events/:id/edit` | Protected | Edit event |
| `/admin/events/:id/registrations` | Protected | View registrations for event |
| `/admin/registrations` | Protected | All registrations with search |

## Setup

### Development
```bash
npm install
npm run dev      # starts on http://localhost:3000
```
Vite proxies `/api/*` to `http://localhost:80` (your Nginx/backend).

### Production Build
```bash
npm run build    # outputs to ./dist/
```

### Deploy to Docker Setup
```bash
npm run build
cp -r dist/* ../nginx/html/
docker compose up -d --build nginx
```

The `dist/` contents replace the placeholder in `nginx/html/`.

## API Proxy (dev)
`vite.config.js` proxies `/api/*` → `http://localhost:80` so you can run
`npm run dev` against the Dockerized backend without CORS issues.