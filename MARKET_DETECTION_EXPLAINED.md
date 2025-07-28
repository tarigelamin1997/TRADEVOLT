# Market Detection System Explained

## How It Works

Our intelligent CSV import system now understands different trading markets and automatically detects what type of trades you're importing.

### 1. Market Types Supported

- **FUTURES**: ES, NQ, CL, GC, ZB, ZN, etc.
  - Detects contracts like ES, NQ, RTY, YM, ZB, ZN, CL, GC, NG, 6E
  - Applies proper contract multipliers for P&L calculation
  - Recognizes futures-specific columns like "contract", "expiry"

- **OPTIONS**: Stock and index options
  - Detects option symbols with strikes and expiration
  - Handles calls and puts
  - Applies 100-share multiplier for stock options

- **FOREX**: Currency pairs
  - Detects pairs like EUR/USD, GBP/JPY
  - Handles lot sizes and pip calculations
  - Recognizes forex-specific terminology

- **CRYPTO**: Cryptocurrency trading
  - Detects BTC, ETH, and other crypto symbols
  - Handles spot and perpetual futures
  - No multipliers for spot trading

- **STOCKS**: Regular equities
  - Standard stock symbols (AAPL, MSFT, etc.)
  - Direct quantity calculations

### 2. Column Detection Process

The system uses a three-step process:

1. **Header Analysis**: Looks at column names to identify market type
2. **Data Sampling**: Examines the first 10 rows to detect patterns
3. **Smart Mapping**: Uses market-specific knowledge to map columns

### 3. Your CSV Error Explained

When you got the error "CSV must include: Symbol, Type, Entry, Quantity columns", it was because:

1. Your CSV had columns named: `symbol`, `entry_time`, `exit_time`, `entry_price`, `exit_price`, `qty`, `direction`, etc.
2. The system detected these columns:
   - ✓ `symbol` → Symbol
   - ✓ `direction` → Type (long/short)
   - ✓ `entry_price` → Entry
   - ✓ `qty` → Quantity

But the validation was still too strict. Now it:
- Detects that you're trading FUTURES (ZB, RTY, ES, NG, etc.)
- Applies futures-specific logic
- Preserves all extra data (broker, trade_type, result) in notes

### 4. How to Use

Simply drag and drop your CSV file. The system will:

1. **Auto-detect market type** from your symbols and column names
2. **Map columns intelligently** based on the detected market
3. **Show you what was detected** before importing
4. **Calculate P&L correctly** using market-specific multipliers
5. **Preserve all extra data** in the notes field

### 5. Debug Information

If there's an error, click "Debug Information" to see:
- What headers were found
- What market was detected
- Sample data from your file

This helps understand why certain columns weren't detected.

### 6. Examples of Supported Formats

**TD Ameritrade Futures:**
```
symbol,entry_time,exit_time,entry_price,exit_price,qty,direction,pnl
ES,2024-01-15T09:30:00,2024-01-15T10:15:00,4500.25,4505.50,2,long,525.00
```

**Interactive Brokers Options:**
```
Symbol,Strike,Expiry,Type,Entry,Exit,Contracts,P&L
AAPL 240119C150,150,2024-01-19,CALL,5.25,7.50,10,2250
```

**Forex Broker:**
```
Pair,OpenTime,CloseTime,Type,OpenPrice,ClosePrice,Lots,Profit
EUR/USD,2024-01-15 14:30,2024-01-15 16:45,BUY,1.0950,1.0975,0.1,250
```

The system adapts to each format automatically!