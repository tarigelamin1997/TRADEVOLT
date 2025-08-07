# MetaTrader 4/5 Broker Integration Setup Guide

## Overview

TradeVolt now supports direct integration with MetaTrader 4 and MetaTrader 5 platforms through MetaAPI. This allows automatic synchronization of your trades without manual CSV imports.

## Prerequisites

1. **MetaTrader Account**
   - Active MT4 or MT5 account with any supported broker
   - Account login credentials (account number and password)
   - Server name from your MT4/5 terminal

2. **MetaAPI Account** (for production deployment)
   - Sign up at https://app.metaapi.cloud
   - Free tier: 1 MetaTrader account
   - Paid plans: Multiple accounts + advanced features

## Setup Instructions

### Step 1: Environment Configuration

1. Generate an encryption key for secure password storage:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Add the following to your `.env.local`:
   ```env
   # MetaAPI Configuration
   METAAPI_TOKEN=your-metaapi-token-here
   METAAPI_REGION=new-york  # Options: new-york, london, singapore
   
   # Encryption key for secure storage
   ENCRYPTION_KEY=your-generated-encryption-key-here
   ```

### Step 2: Database Setup

1. Run Prisma migration to add BrokerConnection table:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Step 3: Install Dependencies

```bash
npm install metaapi.cloud-sdk date-fns
```

### Step 4: Connect Your MT4/5 Account

1. Navigate to Settings → Broker Integration
2. Click "Add Account" button
3. Fill in your MT4/5 credentials:
   - **Platform**: Select MT4 or MT5
   - **Account Name**: Optional friendly name
   - **Account Login**: Your MT account number
   - **Password**: Your MT password (investor password recommended)
   - **Server Name**: Your broker's server (e.g., "ICMarketsSC-Demo")
   - **Auto-sync**: Enable for real-time trade updates

### Step 5: Find Your Server Name

**In MT4:**
1. Open MetaTrader 4
2. Go to File → Login to Trade Account
3. Server name is shown in the dropdown

**In MT5:**
1. Open MetaTrader 5
2. Go to File → Open an Account
3. Your current server is shown in the servers list

## Security Features

- **Encrypted Storage**: All passwords are encrypted using AES-256-GCM
- **Secure Connection**: MetaAPI handles all broker connections securely
- **Read-Only Option**: Use investor password for read-only access
- **No Server Storage**: Credentials never leave your deployment

## Features

### Automatic Trade Sync
- Real-time synchronization when auto-sync is enabled
- Manual sync button for on-demand updates
- Historical trade import (last 30 days by default)

### Multi-Account Support
- Connect multiple MT4/5 accounts
- Manage each account independently
- View connection status for each account

### Trade Data Mapping
- Automatic market type detection (Forex, Futures, Stocks, Crypto)
- Commission and swap tracking
- Entry/exit time synchronization
- Trade comments preserved

## Troubleshooting

### Connection Failed
- Verify account credentials are correct
- Check server name matches exactly (case-sensitive)
- Ensure your MT4/5 account is active
- Try using investor password if master password fails

### MetaAPI Token Issues
- Verify token is correctly set in `.env.local`
- Check token hasn't expired at https://app.metaapi.cloud
- Ensure you're within free tier limits (1 account)

### Sync Not Working
- Check connection status shows "connected"
- Verify auto-sync is enabled
- Manual sync to test connection
- Check browser console for errors

## API Rate Limits

**Free Tier:**
- 1 MetaTrader account
- Quote streaming: 1 tick per 2.5 seconds
- API calls subject to rate limiting

**Paid Plans:**
- Multiple accounts
- Higher rate limits
- Priority support

## Development vs Production

### Development
- Use demo accounts for testing
- MetaAPI free tier sufficient
- Local encryption key

### Production
- Use separate MetaAPI account
- Implement proper key rotation
- Monitor API usage
- Consider paid MetaAPI plan for multiple users

## Support

For issues specific to:
- **TradeVolt**: Create issue on GitHub
- **MetaAPI**: support@metaapi.cloud
- **MT4/5**: Contact your broker

## Next Steps

1. Test with demo account first
2. Verify trade sync accuracy
3. Set up auto-sync if desired
4. Monitor API usage in MetaAPI dashboard

---

**Note**: This integration is currently in beta. Please report any issues or suggestions for improvement.