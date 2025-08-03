# Behavioral & Consistency Metrics Implementation Plan

## Overview
Adding comprehensive behavioral analysis and consistency metrics to help traders identify patterns, improve discipline, and detect problematic trading behaviors.

## 1. Core Metrics to Implement

### A. Zella Score (0-100)
A proprietary composite score combining 6 key trading metrics:
1. **Win Rate** (20%) - Percentage of winning trades
2. **Profit Factor** (20%) - Gross profit / Gross loss ratio
3. **Risk/Reward Ratio** (15%) - Average win / Average loss
4. **Consistency Score** (20%) - Daily result consistency
5. **Recovery Factor** (15%) - Net profit / Max drawdown
6. **Discipline Score** (10%) - Based on revenge trading and overtrading

Formula:
```
ZellaScore = (WinRate * 0.20) + (ProfitFactor * 0.20) + (RRRatio * 0.15) + 
             (ConsistencyScore * 0.20) + (RecoveryFactor * 0.15) + (DisciplineScore * 0.10)
```

### B. Daily Consistency Score
Measures how consistent daily trading results are:
- Standard deviation of daily P&L
- Coefficient of variation (CV)
- Percentage of profitable days
- Daily Sharpe ratio

### C. Outlier Identification
- **Largest Win**: Biggest single trade profit
- **Largest Loss**: Biggest single trade loss
- **Outlier Ratio**: How much outliers affect overall performance
- **Performance without outliers**: P&L excluding top/bottom 10%

### D. Win/Loss Streaks
- **Current Streak**: Active winning/losing streak
- **Longest Win Streak**: Historical best
- **Longest Loss Streak**: Historical worst
- **Average Streak Length**: Typical streak duration
- **Streak Recovery Time**: Time to recover from losing streaks

### E. Revenge Trading Detection
Identifies emotional/impulsive trading after losses:
- **Increased Position Size**: After loss events
- **Reduced Time Between Trades**: Quick entries after losses
- **Win Rate Degradation**: Performance after losses
- **Volume Spike Detection**: Abnormal trading frequency
- **Loss Recovery Attempts**: Aggressive trading to "make it back"

## 2. Technical Implementation

### A. Service Layer (`lib/services/behavioral-analysis-service.ts`)
```typescript
interface BehavioralMetrics {
  zellaScore: number
  components: {
    winRate: number
    profitFactor: number
    riskReward: number
    consistency: number
    recovery: number
    discipline: number
  }
  dailyConsistency: {
    score: number
    stdDev: number
    cv: number
    profitableDays: number
    dailySharpe: number
  }
  outliers: {
    largestWin: Trade | null
    largestLoss: Trade | null
    outlierRatio: number
    performanceWithoutOutliers: number
  }
  streaks: {
    current: {
      type: 'win' | 'loss' | 'none'
      count: number
      startDate: Date | null
    }
    longestWin: number
    longestLoss: number
    averageStreak: number
    recoveryTime: number
  }
  revengeTrading: {
    detected: boolean
    score: number
    indicators: {
      positionSizeIncrease: boolean
      reducedTimeBetweenTrades: boolean
      winRateDegradation: boolean
      volumeSpike: boolean
      aggressiveRecovery: boolean
    }
    incidents: RevengeIncident[]
  }
}
```

### B. Dashboard Components

1. **Zella Score Gauge** (`components/charts/zella-score-gauge.tsx`)
   - Circular gauge showing 0-100 score
   - Color-coded zones (Excellent, Good, Average, Poor)
   - Breakdown of component scores

2. **Consistency Heatmap** (`components/charts/consistency-heatmap.tsx`)
   - Daily P&L heatmap showing consistency patterns
   - Standard deviation visualization
   - Profitable vs losing days ratio

3. **Streak Tracker** (`components/charts/streak-tracker.tsx`)
   - Visual timeline of win/loss streaks
   - Current streak indicator
   - Historical streak comparison

4. **Outlier Analysis** (`components/charts/outlier-analysis.tsx`)
   - Scatter plot highlighting outliers
   - Impact analysis visualization
   - Performance comparison with/without outliers

5. **Revenge Trading Alert** (`components/charts/revenge-alert.tsx`)
   - Warning indicators when revenge trading detected
   - Historical incident tracking
   - Behavioral pattern visualization

### C. Dashboard Page (`app/behavioral/page.tsx`)
- Main behavioral metrics dashboard
- Real-time metric updates
- Actionable insights and recommendations
- Historical trend analysis

### D. Integration Points
1. **Main Dashboard**: Add Zella Score summary card
2. **Trade History**: Show streak indicators
3. **Trade Entry**: Revenge trading warnings
4. **Daily Review**: Consistency score tracking

## 3. Calculation Methods

### A. Consistency Score Algorithm
```typescript
calculateConsistencyScore(trades: Trade[]): number {
  const dailyPnL = groupTradesByDay(trades)
  const stdDev = calculateStandardDeviation(dailyPnL)
  const mean = calculateMean(dailyPnL)
  const cv = stdDev / Math.abs(mean)
  const profitableDaysRatio = countProfitableDays(dailyPnL) / dailyPnL.length
  
  // Normalize to 0-100 scale
  const cvScore = Math.max(0, 100 - (cv * 100))
  const profitScore = profitableDaysRatio * 100
  
  return (cvScore * 0.6 + profitScore * 0.4)
}
```

### B. Revenge Trading Detection
```typescript
detectRevengeTrading(trades: Trade[]): RevengeIndicators {
  const incidents = []
  
  for (let i = 1; i < trades.length; i++) {
    const prevTrade = trades[i-1]
    const currTrade = trades[i]
    
    if (prevTrade.pnl < 0) {
      const timeDiff = currTrade.entryTime - prevTrade.exitTime
      const sizeIncrease = currTrade.quantity / prevTrade.quantity
      
      if (timeDiff < 300000 && sizeIncrease > 1.5) { // 5 minutes & 50% size increase
        incidents.push({
          triggerTrade: prevTrade,
          revengeTrade: currTrade,
          indicators: analyzeRevengeIndicators(prevTrade, currTrade)
        })
      }
    }
  }
  
  return analyzeIncidents(incidents)
}
```

## 4. UI/UX Design

### A. Color Schemes
- **Zella Score**: Gradient from red (0-40) → yellow (40-70) → green (70-100)
- **Consistency**: Blue gradient for stability
- **Streaks**: Green for wins, red for losses
- **Revenge Trading**: Red/orange warning colors

### B. Interactive Features
- Hover tooltips with detailed explanations
- Click-through to detailed analysis
- Time period selection (7D, 30D, 90D, All)
- Export behavioral report functionality

### C. Insights & Recommendations
- AI-powered insights based on patterns
- Personalized improvement suggestions
- Behavioral pattern alerts
- Performance correlation analysis

## 5. Implementation Timeline

1. **Phase 1**: Core service and calculations (Day 1)
2. **Phase 2**: Zella Score and Consistency (Day 1)
3. **Phase 3**: Streaks and Outliers (Day 1)
4. **Phase 4**: Revenge Trading Detection (Day 2)
5. **Phase 5**: Dashboard and Components (Day 2)
6. **Phase 6**: Integration and Testing (Day 2)

## 6. Future Enhancements
- Machine learning for pattern prediction
- Peer comparison benchmarks
- Behavioral coaching recommendations
- Custom metric configuration
- API for third-party integrations