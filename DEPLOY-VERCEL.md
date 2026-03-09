# Deploy SpicePlan to Vercel

## 1. Create a Postgres database
Recommended: Neon.

Copy the connection string. It should look like:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

## 2. Test locally with Postgres
```bash
npm install
npx prisma generate
npm run db:push
npm run db:seed
npm run dev
```

## 3. Push to GitHub
```bash
git init
git add .
git commit -m "SpicePlan Postgres"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## 4. Import into Vercel
- Add New Project
- Import the GitHub repo
- Framework: Next.js

## 5. Add environment variables in Vercel
Project Settings → Environment Variables:
- `DATABASE_URL`

## 6. Deploy
Vercel will run the build script:
```bash
prisma generate && next build
```

## 7. Seed production data
Run this once against the same production `DATABASE_URL`:
```bash
npm run db:seed
```
