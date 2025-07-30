# Database Setup Instructions

## Steps to Complete Database Setup:

1. **Get your Neon Database URL**
   - Go to https://console.neon.tech
   - Click on your `tradevolt_dev_db` database
   - Copy the connection string (it starts with `postgresql://`)

2. **Update your local .env.local**
   Replace the placeholder DATABASE_URL with your actual Neon URL:
   ```
   DATABASE_URL=postgresql://your-actual-neon-connection-string
   ```

3. **Generate Prisma Client**
   ```bash
   cd trading-journal
   npx prisma generate
   ```

4. **Push schema to database**
   ```bash
   npx prisma db push
   ```

5. **Test locally**
   ```bash
   npm run dev
   ```
   - Visit http://localhost:3000
   - Try adding a trade
   - Check if it persists after refresh

6. **Deploy to Vercel**
   ```bash
   git add -A
   git commit -m "Switch from in-memory DB to Neon PostgreSQL"
   git push origin main
   vercel --prod
   ```

## What We Changed:

1. Created `/lib/prisma.ts` - Prisma client singleton
2. Updated `/app/api/route.ts` - Now uses Prisma instead of in-memory DB
3. Updated `prisma/schema.prisma` - Added missing `entryTime` and `exitTime` fields

## Verify It's Working:

After deployment, test the production API:
```bash
curl -X POST https://trading-journal-omega-six.vercel.app/api \
  -H "Content-Type: application/json" \
  -d '{"action":"getTrades"}'
```

You should see an empty trades array (or actual trades if you add some), not the demo trades anymore.