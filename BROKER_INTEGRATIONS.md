# Forex Broker Integration Guide

## Overview

This document outlines the major forex brokers and their data export capabilities for integration with our Trading Journal. We're focusing on the forex market first as it's the largest financial market globally.

## Major Forex Trading Platforms

### 1. MetaTrader (MT4/MT5)
**Market Share**: ~70% of retail forex traders
**Export Formats**: 
- CSV (Historical data)
- HTML Reports
- Excel compatible files

**Integration Method**:
```
File → Save As → Report (Detailed)
Format: HTML/CSV
Contains: All trades, balance, equity curve
```

### 2. cTrader
**Market Share**: ~15% of retail forex traders
**Export Formats**:
- CSV (Detailed trading history)
- FIX API for real-time data
- cAlgo API for automated exports

**Integration Method**:
```
History → Export → CSV
Contains: Symbol, Direction, Volume, Entry/Exit, P&L, Commission
```

### 3. TradingView
**Export Formats**:
- CSV export for trade list
- Pine Script for custom exports
- Webhook integration

### 4. Proprietary Platforms
Various brokers have their own platforms with CSV export capabilities.

## Top Forex Brokers by Platform (2024)

### Brokers Supporting Multiple Platforms:

#### Tier 1 Brokers (Highly Regulated)
1. **IC Markets**
   - Platforms: MT4, MT5, cTrader
   - Export: CSV, API (FIX 4.4)
   - Special: Raw spreads from 0.0 pips

2. **Pepperstone**
   - Platforms: MT4, MT5, cTrader, TradingView
   - Export: CSV, API access
   - Regulation: ASIC, FCA, CySEC

3. **FP Markets**
   - Platforms: MT4, MT5, cTrader, IRESS
   - Export: CSV, FIX API
   - Features: 10,000+ instruments

4. **FxPro**
   - Platforms: MT4, MT5, cTrader, FxPro Platform
   - Export: CSV, API
   - Regulation: FCA, CySEC

#### Tier 2 Brokers
5. **RoboForex**
   - Platforms: MT4, MT5, cTrader, R Trader
   - Export: CSV, API
   - Features: Copy trading integration

6. **Fusion Markets**
   - Platforms: MT4, MT5, cTrader
   - Export: CSV
   - Special: $0 minimum deposit

7. **FXPRIMUS**
   - Platforms: MT4, MT5, cTrader
   - Export: CSV
   - Regulation: CySEC, VFSC

8. **Skilling**
   - Platforms: MT4, cTrader, Skilling Trader
   - Export: CSV
   - Mobile-first approach

## CSV Export Formats by Platform

### MetaTrader 4/5 Format
```csv
Ticket,Open Time,Type,Size,Symbol,Price,S/L,T/P,Close Time,Price,Commission,Swap,Profit
12345678,2024.01.15 10:30,buy,1.00,EURUSD,1.08500,0.00000,0.00000,2024.01.15 14:45,1.08750,0.00,0.00,250.00
```

### cTrader Format
```csv
Position ID,Symbol,Direction,Volume,Entry Time,Entry Price,Exit Time,Exit Price,Commission,Swap,P&L,Comment
98765432,EURUSD,BUY,100000,2024-01-15 10:30:00,1.08500,2024-01-15 14:45:00,1.08750,-5.00,0.00,245.00,
```

### Common Fields Mapping
| Our System | MT4/MT5 | cTrader | TradingView |
|------------|---------|---------|-------------|
| symbol | Symbol | Symbol | Symbol |
| type | Type | Direction | Side |
| entry | Price | Entry Price | Entry Price |
| exit | Close Price | Exit Price | Exit Price |
| quantity | Size/Lots | Volume | Quantity |
| date | Open Time | Entry Time | Time |

## Integration Priority List

### Phase 1: CSV Import (Completed)
- ✅ Generic CSV parser with intelligent column detection
- ✅ Market type detection (Forex, Futures, etc.)
- ✅ Support for major broker formats

### Phase 2: Platform-Specific Templates (Next)
1. **MetaTrader Template**
   - Detect MT4/MT5 specific formats
   - Handle lot size conversions
   - Parse magic numbers and comments

2. **cTrader Template**
   - Handle position IDs
   - Parse commission and swap
   - Support for cTrader-specific fields

### Phase 3: API Integration (Future)
1. **FIX API Integration**
   - Real-time trade updates
   - Direct broker connectivity
   - Automated trade import

2. **REST API Integration**
   - OANDA API
   - Interactive Brokers API
   - TradingView Webhooks

## Forex Market Specifics

### Lot Size Conversions
- Standard Lot = 100,000 units
- Mini Lot = 10,000 units
- Micro Lot = 1,000 units
- Nano Lot = 100 units

### P&L Calculation
For forex pairs:
```
P&L = (Exit Price - Entry Price) × Contract Size × Number of Lots
```

For pairs where USD is not the quote currency, additional conversion is needed.

### Common Forex Pairs by Volume
1. EUR/USD (~24% of volume)
2. USD/JPY (~13%)
3. GBP/USD (~9%)
4. AUD/USD (~5%)
5. USD/CAD (~4%)

## Implementation Notes

### Current Status
- ✅ Market type selector in trade form
- ✅ Remembers last selected market type
- ✅ Intelligent CSV parsing with market detection
- ✅ Support for various date and number formats

### Next Steps
1. Add broker-specific templates for easier import
2. Create sample CSV files for each major platform
3. Add commission and swap field support
4. Implement pip calculation for forex pairs
5. Add currency conversion for non-USD accounts

## Testing Brokers

For development and testing, these brokers offer demo accounts with full export capabilities:
1. IC Markets (cTrader demo)
2. Pepperstone (MT4/MT5 demo)
3. FxPro (All platforms demo)
4. OANDA (REST API sandbox)