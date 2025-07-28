# Trading Journal - Weekend MVP

A dead simple trading journal built in a weekend. Track trades, see patterns, make money.

## Quick Start

1. **Set up your environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Add your actual API keys

2. **Set up the database**
   ```bash
   npx prisma db push
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

## Deployment

### 1. Database Setup (Neon)
- Go to [neon.tech](https://neon.tech)
- Create a free PostgreSQL database
- Copy the connection string to `DATABASE_URL` in `.env.local`

### 2. Authentication (Clerk)
- Go to [clerk.com](https://clerk.com)
- Create a new application
- Copy your keys to `.env.local`

### 3. Payments (Stripe)
- Go to [stripe.com](https://stripe.com)
- Get your test API keys
- Create a payment link for $25/mo subscription
- Update the Stripe link in `app/page.tsx` and `app/dashboard/page.tsx`

### 4. AI Insights (Anthropic)
- Get an API key from [anthropic.com](https://anthropic.com)
- Add to `.env.local`

### 5. Deploy to Vercel
```bash
npm run build
vercel --prod
```

## Features

- **Free Tier**: 2 rotating features per week
- **Paid Tier ($25/mo)**: All 20 features unlocked

### Feature List
- Add trades
- Basic P&L calculation
- AI trading insights
- CSV export
- Advanced charts
- Risk analysis
- Trade replay
- Position sizing
- And 12 more...

## Architecture

This is a weekend MVP. The architecture is intentionally simple:
- 12 files total
- One API endpoint for everything
- No complex state management
- No service layers
- Direct database calls

## Next Steps

Once you have paying customers:
1. Add proper error handling
2. Implement better state management
3. Add unit tests
4. Refactor the architecture
5. Add more features based on user feedback

Remember: Ship first, refactor later!