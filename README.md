# Real Cost of Habits

Stage 1: backend core and design system. Stack: React+Vite, Express, MongoDB Atlas, Mongoose (JavaScript).

## Run
    cd server && cp .env.example .env   # set MONGODB_URI, JWT_SECRET
    npm i && npm test && npm run dev    # :4000
    cd client && npm i && npm run dev   # :5173 (proxies /api)

## Done
- Calculation service with tests (hourly rate, working hours, savings, goal progress, % change)
- Auth (bcrypt, JWT in httpOnly cookie), ownership-scoped expenses CRUD, filters/sort/pagination
- Analytics summary endpoint (period vs previous period, habit ranking, daily series)
- Design tokens, editorial shell, dashboard with trend chart and habit ledger

## Next stages
Habits/goals/subscriptions routes, simulator UI, AI coach (server-side, zod-validated, cached,
honest "not configured" state), reports, remaining pages, seed/reset demo data, API authorization tests.
