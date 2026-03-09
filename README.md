# SpicePlan v2 PostgreSQL + Vercel

A PostgreSQL-ready build of the Indian vegetarian weekly meal planner.

## Included
- database-backed weekly planner
- favorites
- ingredients to avoid
- shopping list generation
- ingredient-based dish suggestions
- Hindi ingredient aliases in English letters (pyaz, tamatar, aloo, dahi, etc.)
- manual dish entry
- larger Indian vegetarian dish dataset
- cleaner premium UI

## Tech stack
- Next.js 15
- Prisma ORM
- PostgreSQL (recommended: Neon or Supabase)
- Vercel for deployment

## Local setup with PostgreSQL
1. Create a PostgreSQL database in Neon, Supabase, or another hosted provider.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to your PostgreSQL connection string.
4. Run:
   ```bash
   npm install
   npx prisma generate
   npm run db:push
   npm run db:seed
   npm run dev
   ```
5. Open `http://localhost:3000`

## Deploy to Vercel
1. Push this project to GitHub.
2. Import the repo into Vercel.
3. In Vercel → Project Settings → Environment Variables, add:
   - `DATABASE_URL`
4. Deploy.
5. After the first deploy, seed the production database once by running locally against the same production `DATABASE_URL`:
   ```bash
   npm run db:seed
   ```

## Scripts
- `npm run dev` → start local dev server
- `npm run build` → Prisma generate + Next build
- `npm run db:push` → push Prisma schema to database
- `npm run db:seed` → seed dishes and demo user
- `npm run db:migrate` → deploy migrations if you add them later

## Routes
- `/` planner
- `/library` dish library
- `/shopping` shopping list
- `/settings` avoided ingredients

## Notes
- This build is configured for PostgreSQL, not SQLite.
- The demo user is still created automatically by the seed script.
- `ingredients` and `tags` are stored as JSON strings for compatibility with the current app layer.
