# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TradeVolt is a comprehensive trading journal application that provides professional-grade analytics for traders. Built as a Next.js 14 application with TypeScript, it offers advanced trade tracking, performance analysis, and AI-powered insights. The application features a sophisticated playbooks system for trading setups, behavioral analytics, and discipline tracking.

## Development Commands

### Essential Commands
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build for production (includes Prisma generation and DB push)
npm run lint         # Run ESLint
npm start            # Start production server
```

### Database Commands
```bash
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma migrate deploy  # Deploy migrations (production)
```

### Deployment
```bash
vercel              # Deploy to Vercel (preview)
vercel --prod       # Deploy to production
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14.2.0 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Radix UI components
- **Database**: PostgreSQL (Neon) with Prisma ORM + JSON fallback
- **Authentication**: Clerk (with demo mode fallback)
- **Payments**: Stripe (optional, beta features currently free)
- **AI**: Anthropic Claude API for insights
- **Charts**: Recharts, Chart.js, React Sparklines

### Database Architecture

The application uses a dual database strategy:
1. **Production**: PostgreSQL via Prisma (`lib/prisma.ts`)
2. **Fallback**: JSON-based file system (`lib/db.ts`) for development/demo

Key models:
- **User**: Clerk integration, subscription status
- **Trade**: Comprehensive trade data with market type support, rule compliance tracking
- **TradingSetup**: Trading strategy configurations with entry/exit/risk rules
- **SetupRule**: Individual rules for trading setups with importance levels
- **RuleChecklist**: Compliance tracking for trades against setup rules
- **Advanced**: TradePriceData, TradeExcursion, PartialExit for detailed analysis

### API Design

Single endpoint architecture (`/api/route.ts`) with action-based routing:
- `getTrades`: Fetch user trades with filtering
- `addTrade`: Add new trade with market-specific calculations
- `importTrades`: Bulk CSV import with validation
- `getAI`: Claude-powered trade analysis
- `testConnection`: Database health checks
- `getSubscription`: Check user subscription status

### Market Type Handling

Different markets have specific P&L calculations:
- **FUTURES**: Contract multipliers (ES=$50, NQ=$20, CL=$1000, etc.)
- **OPTIONS**: 100 shares per contract
- **FOREX**: Pip calculations with lot sizes
- **CRYPTO**: Direct price calculations
- **STOCKS**: Standard price × quantity

### Key Features & Services

#### Analytics Engine (`lib/services/`)
- **AnalyticsService**: Core performance metrics (win rate, profit factor, Sharpe ratio)
- **ExcursionService**: MAE/MFE tracking for trade quality analysis
- **BehavioralService**: Trading psychology analysis (revenge trading, discipline)
- **MarketAnalysisService**: Symbol and market type performance
- **TimeAnalysisService**: Day/hour patterns, hold time analysis
- **TradingSetupService**: Setup management, performance tracking, discipline scoring

#### Visualization Components
- **Calendar Heatmap**: Daily P&L visualization
- **Equity Curve**: Account balance progression
- **Distribution Charts**: Win/loss patterns
- **Performance Gauges**: Visual metric displays
- **Time Heatmaps**: Trading performance by time
- **Setup Evolution**: Timeline view of trading setup performance
- **Discipline Tracker**: Real-time monitoring of trading discipline and tilt warnings

### Authentication Flow

Clerk integration with fallback:
```typescript
// Automatic detection of Clerk configuration
const isClerkConfigured = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY
)

// Falls back to 'demo-user' when Clerk not configured
```

### Environment Variables

Required for production:
```env
DATABASE_URL                          # PostgreSQL connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY    # Clerk public key
CLERK_SECRET_KEY                     # Clerk secret key
ANTHROPIC_API_KEY                    # Claude API key
```

Optional:
```env
STRIPE_SECRET_KEY                    # Payment processing
STRIPE_PUBLISHABLE_KEY              # Stripe public key
STRIPE_WEBHOOK_SECRET               # Webhook validation
```

### Current Production Status

- **URL**: https://tradevolt.vercel.app (https://trading-journal-omega-six.vercel.app)
- **Database**: PostgreSQL on Neon (Europe West region)
- **Features**: All 16 professional metrics available during beta
- **Import**: CSV import working (tested with 112+ trades)
- **Export**: CSV/JSON export functionality
- **Trading Setups**: Complete playbooks system with setup wizard and analytics
- **Build Status**: Pending deployment (fixing TypeScript build errors as of 2025-08-04)

### Important Architectural Decisions

1. **Single API Endpoint**: Simplifies routing and maintains consistency
2. **Dual Database Support**: Ensures app works in any environment
3. **Market-Aware Calculations**: Accurate P&L for different asset types
4. **Progressive Enhancement**: Core features work without external services
5. **Type Safety**: Full TypeScript with strict mode
6. **Subscription Context**: React context for feature gating

### Beta Features Currently Available

All Pro features are currently free during beta:
- 16 professional trading metrics
- AI-powered insights via Claude API
- Advanced excursion analysis (MAE/MFE)
- Behavioral analytics and tilt detection
- Full export capabilities (CSV/JSON)
- All visualization tools
- Trading Playbooks system with:
  - Setup creation wizard
  - Rule compliance tracking
  - Setup performance analytics
  - Discipline monitoring
  - Evolution timeline view

### Recent Development (August 2025)

- **Playbooks Feature**: Complete trading setup management system
- **Enhanced Trade Form**: Integration with trading setups and rule compliance
- **Discipline Tracking**: Real-time monitoring with tilt warnings
- **Build Fixes**: Resolved multiple TypeScript errors in playbooks components
- **Type Safety**: Improved type checking for optional properties and array handling
- **UI Consistency**: Refactored all pages to use SidebarLayout component for consistent navigation
- **Navigation Fix**: Added dashboard link to Trading Playbooks header
- **Sidebar Toggle**: Fixed visibility of sidebar toggle button across all pages
- **Sidebar Implementation**: 
  - Added SidebarLayout wrapper to all pages for consistent navigation
  - Implemented collapsible sidebar with arrow button (-right-3 positioning)
  - Added SidebarTrigger (hamburger menu) to page headers
  - Restored dynamic content shifting with SidebarInset
  - Fixed sidebar state management and responsive behavior
- **Metric Functions**: Added 8 missing trading metric calculations
- **Build Error Fixes**: Resolved all TypeScript compilation errors for Vercel deployment