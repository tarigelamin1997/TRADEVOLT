# Trade Excursion Metrics - Implementation Plan

## Overview

Trade Excursion Metrics provide deep insights into the journey of each trade, revealing critical information about risk management, profit-taking behavior, and trade quality. These metrics go beyond simple entry/exit analysis to show what happened during the trade.

## Metrics Definitions

### 1. MAE (Maximum Adverse Excursion)
- **Definition**: The maximum drawdown (worst price) experienced during the trade
- **Formula**: 
  - For LONG: `MAE = (Entry Price - Lowest Price) / Entry Price * 100`
  - For SHORT: `MAE = (Highest Price - Entry Price) / Entry Price * 100`
- **Use Case**: Helps determine optimal stop-loss placement and risk tolerance

### 2. MFE (Maximum Favorable Excursion)
- **Definition**: The maximum unrealized profit achieved during the trade
- **Formula**:
  - For LONG: `MFE = (Highest Price - Entry Price) / Entry Price * 100`
  - For SHORT: `MFE = (Entry Price - Lowest Price) / Entry Price * 100`
- **Use Case**: Identifies if traders are leaving money on the table or holding too long

### 3. Running P&L
- **Definition**: Time-series data showing P&L throughout the trade duration
- **Data Points**: Calculated at regular intervals (5min, 15min, 1hr depending on trade duration)
- **Use Case**: Visualizes the trade journey and emotional decision points

### 4. Updraw %
- **Definition**: How close the price came to the take profit target
- **Formula**: `Updraw = (MFE / Target Profit) * 100`
- **Use Case**: Analyzes if profit targets are realistic and achievable

### 5. Edge Ratio
- **Definition**: The relationship between maximum profit potential and maximum risk taken
- **Formula**: `Edge Ratio = MFE / MAE`
- **Use Case**: Measures trade quality and entry timing efficiency

## Technical Architecture

### Phase 1: Data Infrastructure

#### 1.1 Database Schema Updates

```sql
-- Add columns to existing trades table
ALTER TABLE trades ADD COLUMN mae DECIMAL(10, 4);
ALTER TABLE trades ADD COLUMN mfe DECIMAL(10, 4);
ALTER TABLE trades ADD COLUMN edge_ratio DECIMAL(10, 4);
ALTER TABLE trades ADD COLUMN updraw_percent DECIMAL(10, 4);
ALTER TABLE trades ADD COLUMN take_profit_price DECIMAL(20, 8);
ALTER TABLE trades ADD COLUMN stop_loss_price DECIMAL(20, 8);

-- New table for intraday price data
CREATE TABLE trade_price_data (
  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  trade_id VARCHAR(36) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(20, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
  INDEX idx_trade_timestamp (trade_id, timestamp)
);

-- New table for excursion snapshots
CREATE TABLE trade_excursions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  trade_id VARCHAR(36) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  running_pnl DECIMAL(20, 8) NOT NULL,
  running_pnl_percent DECIMAL(10, 4) NOT NULL,
  mae_at_time DECIMAL(10, 4) NOT NULL,
  mfe_at_time DECIMAL(10, 4) NOT NULL,
  
  FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
  INDEX idx_trade_excursion (trade_id, timestamp)
);
```

#### 1.2 Price Data Service

```typescript
// lib/services/price-data-service.ts
export interface PriceDataProvider {
  fetchHistoricalData(
    symbol: string,
    startTime: Date,
    endTime: Date,
    interval: '1m' | '5m' | '15m' | '1h'
  ): Promise<PriceData[]>;
}

export class PriceDataService {
  private providers: Map<string, PriceDataProvider>;
  
  constructor() {
    this.providers = new Map([
      ['STOCKS', new AlphaVantageProvider()],
      ['CRYPTO', new BinanceProvider()],
      ['FOREX', new TwelveDataProvider()],
      ['FUTURES', new IBKRProvider()]
    ]);
  }
  
  async fetchTradeData(trade: Trade): Promise<PriceData[]> {
    const provider = this.providers.get(trade.marketType);
    if (!provider) throw new Error(`No provider for ${trade.marketType}`);
    
    const interval = this.determineInterval(trade);
    return await provider.fetchHistoricalData(
      trade.symbol,
      trade.entryTime,
      trade.exitTime || new Date(),
      interval
    );
  }
  
  private determineInterval(trade: Trade): '1m' | '5m' | '15m' | '1h' {
    const duration = this.getTradeDuration(trade);
    if (duration < 60) return '1m';        // < 1 hour
    if (duration < 240) return '5m';       // < 4 hours
    if (duration < 1440) return '15m';     // < 1 day
    return '1h';                           // > 1 day
  }
}
```

### Phase 2: Calculation Engine

#### 2.1 Excursion Calculator

```typescript
// lib/services/excursion-calculator.ts
export class ExcursionCalculator {
  static calculateMAE(
    trade: Trade,
    priceData: PriceData[]
  ): number {
    if (priceData.length === 0) return 0;
    
    const prices = priceData.map(d => d.price);
    const entryPrice = trade.entry;
    
    if (trade.type === 'BUY') {
      const lowestPrice = Math.min(...prices);
      return ((entryPrice - lowestPrice) / entryPrice) * 100;
    } else {
      const highestPrice = Math.max(...prices);
      return ((highestPrice - entryPrice) / entryPrice) * 100;
    }
  }
  
  static calculateMFE(
    trade: Trade,
    priceData: PriceData[]
  ): number {
    if (priceData.length === 0) return 0;
    
    const prices = priceData.map(d => d.price);
    const entryPrice = trade.entry;
    
    if (trade.type === 'BUY') {
      const highestPrice = Math.max(...prices);
      return ((highestPrice - entryPrice) / entryPrice) * 100;
    } else {
      const lowestPrice = Math.min(...prices);
      return ((entryPrice - lowestPrice) / entryPrice) * 100;
    }
  }
  
  static calculateRunningPnL(
    trade: Trade,
    priceData: PriceData[]
  ): RunningPnL[] {
    return priceData.map(data => {
      const pnl = this.calculatePnLAtPrice(trade, data.price);
      const mae = this.calculateMAEAtPoint(trade, priceData, data.timestamp);
      const mfe = this.calculateMFEAtPoint(trade, priceData, data.timestamp);
      
      return {
        timestamp: data.timestamp,
        price: data.price,
        pnl: pnl.amount,
        pnlPercent: pnl.percent,
        maeAtTime: mae,
        mfeAtTime: mfe
      };
    });
  }
  
  static calculateEdgeRatio(mae: number, mfe: number): number {
    if (mae === 0) return mfe > 0 ? Infinity : 0;
    return mfe / mae;
  }
  
  static calculateUpdraw(
    mfe: number,
    takeProfitPrice: number | null,
    entryPrice: number,
    tradeType: 'BUY' | 'SELL'
  ): number | null {
    if (!takeProfitPrice) return null;
    
    const targetProfit = tradeType === 'BUY' 
      ? ((takeProfitPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - takeProfitPrice) / entryPrice) * 100;
    
    if (targetProfit <= 0) return null;
    
    return (mfe / targetProfit) * 100;
  }
}
```

#### 2.2 Batch Processing Service

```typescript
// lib/services/excursion-batch-service.ts
export class ExcursionBatchService {
  static async processTradeExcursions(tradeId: string): Promise<void> {
    const trade = await TradeService.getTrade(tradeId);
    if (!trade) throw new Error('Trade not found');
    
    // Fetch price data
    const priceData = await PriceDataService.fetchTradeData(trade);
    
    // Calculate metrics
    const mae = ExcursionCalculator.calculateMAE(trade, priceData);
    const mfe = ExcursionCalculator.calculateMFE(trade, priceData);
    const edgeRatio = ExcursionCalculator.calculateEdgeRatio(mae, mfe);
    const updraw = ExcursionCalculator.calculateUpdraw(
      mfe,
      trade.takeProfitPrice,
      trade.entry,
      trade.type
    );
    
    // Calculate running P&L
    const runningPnL = ExcursionCalculator.calculateRunningPnL(trade, priceData);
    
    // Update database
    await prisma.$transaction([
      // Update trade with excursion metrics
      prisma.trade.update({
        where: { id: tradeId },
        data: {
          mae,
          mfe,
          edgeRatio,
          updrawPercent: updraw
        }
      }),
      
      // Store price data
      prisma.tradePriceData.createMany({
        data: priceData.map(d => ({
          tradeId,
          timestamp: d.timestamp,
          price: d.price,
          volume: d.volume
        }))
      }),
      
      // Store excursion snapshots
      prisma.tradeExcursion.createMany({
        data: runningPnL.map(snapshot => ({
          tradeId,
          timestamp: snapshot.timestamp,
          price: snapshot.price,
          runningPnl: snapshot.pnl,
          runningPnlPercent: snapshot.pnlPercent,
          maeAtTime: snapshot.maeAtTime,
          mfeAtTime: snapshot.mfeAtTime
        }))
      })
    ]);
  }
  
  static async processHistoricalTrades(userId: string): Promise<void> {
    const trades = await prisma.trade.findMany({
      where: { 
        userId,
        mae: null // Only process trades without excursion data
      }
    });
    
    // Process in batches to avoid overwhelming APIs
    const batchSize = 10;
    for (let i = 0; i < trades.length; i += batchSize) {
      const batch = trades.slice(i, i + batchSize);
      await Promise.all(
        batch.map(trade => this.processTradeExcursions(trade.id))
      );
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

### Phase 3: User Interface

#### 3.1 Excursion Metrics Component

```typescript
// components/features/excursion-metrics.tsx
interface ExcursionMetricsProps {
  trade: Trade;
  excursionData?: ExcursionData;
}

export function ExcursionMetrics({ trade, excursionData }: ExcursionMetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Excursion Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            title="MAE"
            value={`-${excursionData?.mae.toFixed(2)}%`}
            description="Max Adverse Excursion"
            color="red"
            icon={<TrendingDown />}
          />
          <MetricCard
            title="MFE"
            value={`+${excursionData?.mfe.toFixed(2)}%`}
            description="Max Favorable Excursion"
            color="green"
            icon={<TrendingUp />}
          />
          <MetricCard
            title="Edge Ratio"
            value={excursionData?.edgeRatio.toFixed(2)}
            description="MFE/MAE Ratio"
            color={excursionData?.edgeRatio > 2 ? 'green' : 'amber'}
            icon={<Target />}
          />
          <MetricCard
            title="Updraw"
            value={excursionData?.updraw ? `${excursionData.updraw.toFixed(0)}%` : 'N/A'}
            description="% to Take Profit"
            color="blue"
            icon={<Flag />}
          />
          <MetricCard
            title="Efficiency"
            value={calculateEfficiency(trade, excursionData)}
            description="Exit Efficiency"
            color={getEfficiencyColor(trade, excursionData)}
            icon={<Zap />}
          />
        </div>
        
        {/* Running P&L Chart */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Trade Journey</h3>
          <RunningPnLChart data={excursionData?.runningPnL || []} />
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3.2 Running P&L Chart

```typescript
// components/charts/running-pnl-chart.tsx
import { Line, ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function RunningPnLChart({ data }: { data: RunningPnL[] }) {
  const chartData = data.map(point => ({
    time: format(point.timestamp, 'HH:mm'),
    pnl: point.pnlPercent,
    mae: -Math.abs(point.maeAtTime),
    mfe: point.mfeAtTime
  }));
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <XAxis dataKey="time" />
        <YAxis tickFormatter={(value) => `${value}%`} />
        <Tooltip
          formatter={(value: number) => `${value.toFixed(2)}%`}
          labelFormatter={(label) => `Time: ${label}`}
        />
        
        {/* MAE/MFE Range */}
        <Area
          type="monotone"
          dataKey="mfe"
          stackId="1"
          stroke="none"
          fill="#10b981"
          fillOpacity={0.2}
        />
        <Area
          type="monotone"
          dataKey="mae"
          stackId="1"
          stroke="none"
          fill="#ef4444"
          fillOpacity={0.2}
        />
        
        {/* P&L Line */}
        <Line
          type="monotone"
          dataKey="pnl"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
        
        {/* Entry/Exit Markers */}
        <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

#### 3.3 Excursion Statistics Dashboard

```typescript
// components/features/excursion-stats.tsx
export function ExcursionStats({ userId }: { userId: string }) {
  const { data: stats } = useExcursionStats(userId);
  
  return (
    <div className="space-y-6">
      {/* Average Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Average Excursion Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Avg MAE" value={`${stats?.avgMAE.toFixed(2)}%`} />
            <Stat label="Avg MFE" value={`${stats?.avgMFE.toFixed(2)}%`} />
            <Stat label="Avg Edge Ratio" value={stats?.avgEdgeRatio.toFixed(2)} />
            <Stat label="Avg Efficiency" value={`${stats?.avgEfficiency.toFixed(0)}%`} />
          </div>
        </CardContent>
      </Card>
      
      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>MAE Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <MAEDistributionChart data={stats?.maeDistribution || []} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>MFE Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <MFEDistributionChart data={stats?.mfeDistribution || []} />
          </CardContent>
        </Card>
      </div>
      
      {/* Edge Ratio Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Edge Ratio Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <EdgeRatioScatterPlot trades={stats?.trades || []} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Phase 4: Implementation Steps

#### Step 1: Database Setup (Day 1)
1. Create database migration files
2. Add new columns to trades table
3. Create price data and excursion tables
4. Test migrations on development database

#### Step 2: Price Data Integration (Days 2-4)
1. Set up API accounts for data providers:
   - Alpha Vantage (Stocks)
   - Binance (Crypto)
   - Twelve Data (Forex)
   - IBKR (Futures)
2. Implement provider interfaces
3. Create price fetching service
4. Add rate limiting and caching

#### Step 3: Calculation Engine (Days 5-6)
1. Implement excursion calculator
2. Create batch processing service
3. Add unit tests for calculations
4. Test with sample trades

#### Step 4: API Endpoints (Day 7)
1. Create endpoints for:
   - Fetching excursion data
   - Triggering recalculation
   - Bulk processing historical trades
2. Add authentication and rate limiting
3. Document API endpoints

#### Step 5: Frontend Components (Days 8-10)
1. Build excursion metrics card
2. Create running P&L chart
3. Add distribution charts
4. Implement scatter plot for edge ratio
5. Mobile-responsive design

#### Step 6: Integration & Testing (Days 11-12)
1. Integrate with existing trade pages
2. Add to analytics dashboard
3. Performance testing
4. User acceptance testing

#### Step 7: Deployment (Day 13)
1. Deploy database migrations
2. Configure API keys in production
3. Deploy application updates
4. Monitor for issues

#### Step 8: Historical Data Processing (Day 14)
1. Process existing trades in batches
2. Monitor API usage and costs
3. Handle failures gracefully
4. Send completion notifications

## Performance Considerations

### Caching Strategy
```typescript
// Cache excursion data aggressively
const CACHE_DURATIONS = {
  FREE: {
    excursionData: 7 * 24 * 60 * 60, // 1 week
    priceData: 30 * 24 * 60 * 60,    // 1 month
  },
  PAID: {
    excursionData: 24 * 60 * 60,     // 1 day
    priceData: 7 * 24 * 60 * 60,     // 1 week
  }
};
```

### Database Optimization
- Index on (trade_id, timestamp) for quick lookups
- Partition price data table by month for older data
- Use materialized views for aggregate statistics
- Archive old price data to cold storage

### API Rate Limiting
- Implement exponential backoff
- Queue system for bulk processing
- Prioritize recent trades
- Cache API responses

## Cost Analysis

### API Costs (Monthly)
- Alpha Vantage: $50 (Premium plan)
- Twelve Data: $29 (Starter plan)
- Binance: Free (with limits)
- IBKR: Included with account

### Storage Costs
- Price data: ~1KB per trade per day
- 10,000 trades × 30 days = 300MB/month
- Cloudflare R2: ~$0.015/GB = $0.01/month

### Processing Costs
- Vercel Function execution: ~100ms per trade
- 10,000 trades = 1,000 seconds = $0.10

## Success Metrics

### Technical Metrics
- 95% of trades have excursion data within 24 hours
- API success rate > 99%
- Average calculation time < 100ms
- Cache hit rate > 80%

### User Metrics
- 50% of users view excursion metrics weekly
- 30% improvement in trade timing (measured by edge ratio)
- 20% reduction in average MAE
- 15% increase in profit factor

## Risk Mitigation

### API Failures
- Fallback to manual entry
- Queue for retry
- Alternative data providers
- Cached data usage

### Performance Issues
- Progressive loading
- Background processing
- Data pagination
- Query optimization

### Data Accuracy
- Validation checks
- Outlier detection
- Manual review options
- Data source attribution

## Future Enhancements

### Phase 2 Features
1. **Real-time Excursion Tracking**
   - WebSocket connections for live trades
   - Push notifications for excursion alerts
   - Live P&L curve updates

2. **Advanced Analytics**
   - Machine learning for optimal exit prediction
   - Correlation with market conditions
   - Peer comparison benchmarks

3. **Risk Management Integration**
   - Automatic stop-loss suggestions based on MAE
   - Take-profit optimization using MFE data
   - Position sizing based on edge ratio

4. **Educational Content**
   - Interactive tutorials on excursion metrics
   - Case studies of improved trades
   - Webinars on using metrics effectively

## Conclusion

Trade Excursion Metrics will provide TRADEVOLT users with professional-grade analysis tools that go beyond basic P&L tracking. By understanding the journey of each trade, traders can optimize their entry/exit strategies, improve risk management, and ultimately increase profitability.

The phased implementation approach ensures we can deliver value quickly while building a robust, scalable system that can handle millions of price points efficiently.