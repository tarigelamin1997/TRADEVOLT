# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TradeVolt is a trading journal application built with Next.js for tracking trades, analyzing performance, and managing trading psychology. It's a weekend MVP project designed to be deployed on Vercel.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build for production (includes Prisma generation and DB push)
- `npm run lint` - Run ESLint to check code quality
- `npm start` - Start production server

### Database Setup
- `npx prisma db push` - Push schema to database
- `npx prisma generate` - Generate Prisma client

Note: Currently using in-memory database for Vercel compatibility. Production requires PostgreSQL setup.

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14.2.0 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma with PostgreSQL (in-memory for dev)
- **Authentication**: Clerk (currently mocked)
- **UI Components**: Radix UI primitives + custom components

### Key Directories
- `app/` - Next.js app router pages and API routes
- `components/` - React components (trade-form, csv-import, ui primitives)
- `lib/` - Core business logic and database interfaces
- `prisma/` - Database schema and migrations

### Database Architecture
The app uses a simple two-table schema:
- **User**: Stores user info with Clerk integration
- **Trade**: Stores trading records with market type support

Currently using `lib/db-memory.ts` for Vercel deployment. For production, switch to `lib/db.ts` with proper PostgreSQL.

### Market Type Detection
The CSV import system intelligently detects trading markets:
- **FUTURES**: ES, NQ, CL, GC, ZB, ZN with proper multipliers
- **OPTIONS**: Stock/index options with strike detection
- **FOREX**: Currency pairs with lot size handling
- **CRYPTO**: Cryptocurrency spot and futures
- **STOCKS**: Regular equities

### Core Features
1. **Trade Management**: Manual entry and CSV import
2. **Analytics**: P&L tracking, win rate, profit factor
3. **Journal**: Trade reflections and psychology tracking
4. **Reports**: Period-based P&L breakdowns

## Important Considerations

### Current Limitations
- Data persistence is in-memory only (resets on cold starts)
- Authentication is mocked - uncomment Clerk imports for production
- CSV import needs proper database for persistence

### P&L Calculations
Different markets have specific multipliers:
- Futures: Contract-specific (ES=$50, NQ=$20, etc.)
- Options: 100 shares per contract
- Forex/Crypto/Stocks: Direct calculation

### Error Handling
- All API endpoints return JSON with error messages
- CSV import has detailed error reporting with debug info
- TypeScript strict mode enabled

### Deployment Notes
- Environment variables needed: Clerk keys, database URL
- Build process runs Prisma commands automatically
- Vercel serverless requires stateless design