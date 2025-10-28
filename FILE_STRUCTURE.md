# Roulette Tracker Pro - File Structure & Data Flow

## 📁 Project Architecture Overview

```
roulette-next/
├── app/                          # Next.js 15 App Router
│   ├── (sections)/              # Routed pages
│   │   ├── analysis/           # Advanced Tracker (Tier 2)
│   │   ├── assistant/          # Betting Assistant (Tier 1)
│   │   ├── learn/              # Learning Tab
│   │   └── tracker/            # Basic Tracker
│   ├── api/                    # API routes
│   └── layout.tsx              # Root layout with providers
│
├── components/                  # React Components
│   ├── [TIER 1] Betting Assistant
│   │   ├── BettingAssistant.tsx           # Main orchestrator (91KB)
│   │   ├── SessionSetup.tsx               # Session configuration
│   │   ├── BetCardDashboard.tsx           # Card management UI
│   │   ├── CompactBettingCard.tsx         # Active betting interface
│   │   └── BettingAssistantPerformance.tsx # Analytics view
│   │
│   ├── [TIER 2] Advanced Tracker
│   │   ├── PatternDetectionEngine.tsx     # 47 groups analysis (37KB)
│   │   ├── StreakAnalysisTable.tsx        # Streak detection (15KB)
│   │   ├── TimeCorrelationTable.tsx       # Time patterns (27KB)
│   │   └── RouletteSystem.tsx             # Integration point
│   │
│   ├── [SHARED] Common Components
│   │   ├── Navigation.tsx                 # App navigation
│   │   ├── BettingDataContext.tsx         # Global spin state
│   │   ├── HistoryTable.tsx              # Spin history with betting
│   │   ├── WheelHistory.tsx              # Wheel-based history
│   │   └── MyGroupsLayout.tsx            # Custom groups betting
│   │
│   └── [UI] Roulette Components
│       ├── WheelLayout.tsx               # Visual wheel
│       ├── WheelBetGroups.tsx            # Wheel betting interface
│       └── TableLayoutModal.tsx          # Table betting modal
│
├── lib/                         # Utility Libraries
│   ├── [CORE LOGIC]
│   │   ├── roulette-logic.ts            # 47 betting groups, payouts
│   │   ├── decideBet.ts                 # Decision engine (multi-window)
│   │   └── types.ts                     # Core type definitions
│   │
│   ├── [SUPABASE]
│   │   ├── supabase.ts                  # Client initialization
│   │   ├── bettingAssistantStorage.ts   # Tier 1 persistence (17KB)
│   │   └── customGroupsStorage.ts       # Custom groups persistence
│   │
│   └── [ANALYTICS]
│       ├── predictionEngine.ts          # Statistical predictions
│       ├── convergenceEngine.ts         # Probability convergence
│       └── numberStatsCalculations.ts   # Per-number stats
│
├── types/                       # TypeScript Definitions
│   └── bettingAssistant.ts     # Betting system types
│
└── stores/                      # State Management
    └── gameState.ts            # Zustand store (cards, spins)
```

---

## 🔄 Data Flow Architecture

### **1. TIER 1: Betting Assistant Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    BETTING ASSISTANT (Tier 1)                   │
└─────────────────────────────────────────────────────────────────┘

USER ACTION
    ↓
┌──────────────────┐
│ SessionSetup.tsx │ → Configure: bankroll, cards, targets, system
└────────┬─────────┘
         ↓
    [startSession()]
         ↓
┌───────────────────────────────────────────────────────┐
│ BettingAssistant.tsx (Main Orchestrator)             │
│  - Manages session state                             │
│  - Controls card lifecycle                           │
│  - Integrates with Supabase                          │
└───────┬───────────────────────────────────────────────┘
        ↓
   ┌────┴────┐
   │         │
   ↓         ↓
[Dashboard] [Active Card]
   ↓              ↓
┌──────────────┐  ┌─────────────────────┐
│ BetCard      │  │ CompactBettingCard  │
│ Dashboard    │  │  - Matrix betting   │
│              │  │  - Decision engine  │
└──────────────┘  │  - Real-time calc   │
                  └──────────┬──────────┘
                             ↓
                    [handleHistoryTableBet] ← useCallback wrapper
                             ↓
                  ┌──────────┴──────────┐
                  │                     │
                  ↓                     ↓
           [Local State]        [Supabase (if logged in)]
                  ↓                     ↓
         ┌─────────────┐      ┌──────────────────┐
         │ Card Steps  │      │ betting_sessions │
         │ Session $   │      │ betting_cards    │
         │ Bankroll    │      │ betting_card_steps│
         └─────────────┘      └──────────────────┘
                  ↓
         [endSession()] → Mark as 'completed' in Supabase
                  ↓
         ┌──────────────────────┐
         │ Performance Analytics│
         └──────────────────────┘
```

### **2. TIER 2: Advanced Tracker Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                   ADVANCED TRACKER (Tier 2)                     │
└─────────────────────────────────────────────────────────────────┘

USER NAVIGATION
    ↓
┌──────────────────┐
│ /analysis route  │
└────────┬─────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ RouletteSystem.tsx (Integration Point)              │
│  - Tabs: Statistics | Predictions | Numbers | ...   │
└─────┬───────────────────────────────────────────────┘
      ↓
   ┌──┴──────────────────────────────────┐
   │                                     │
   ↓                                     ↓
┌──────────────────────┐    ┌────────────────────────┐
│ PatternDetection     │    │ StreakAnalysisTable    │
│ Engine.tsx           │    │                        │
│  - 47 betting groups │    │  - Detect streaks      │
│  - Pattern detection │    │  - Configurable limit  │
│  - Tabbed navigation │    │  - Visual indicators   │
└──────────────────────┘    └────────────────────────┘
                                     │
                                     ↓
                         ┌────────────────────────┐
                         │ TimeCorrelationTable   │
                         │  - Time-based patterns │
                         │  - Hour analysis       │
                         └────────────────────────┘

ALL THREE COMPONENTS USE:
    ↓
┌──────────────────────────────────┐
│ BettingDataContext               │
│  - spinHistory                   │
│  - sessionStats                  │
│  - Global spin state (Zustand)   │
└──────────────────────────────────┘
```

### **3. Shared Data Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHARED STATE MANAGEMENT                      │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ BettingDataContext.tsx (React Context) │
│  - spinHistory: SpinData[]             │
│  - sessionStats: SessionStats          │
│  - addSpin() / undoLastSpin()          │
└──────────────┬─────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────┐
│ Components Consuming Spin Data:                      │
│  ✓ BettingAssistant (for card tracking)             │
│  ✓ RouletteSystem (for pattern analysis)            │
│  ✓ HistoryTable (for bet placement)                 │
│  ✓ WheelHistory (for visual tracking)               │
│  ✓ PatternDetectionEngine (for group analysis)      │
│  ✓ StreakAnalysisTable (for streak detection)       │
│  ✓ TimeCorrelationTable (for time patterns)         │
└──────────────────────────────────────────────────────┘
               │
               ↓
      Each spin gets unique ID
         (timestamp-based)
               ↓
┌──────────────────────────────────────────┐
│ historicalBets: Record<spinId, BetData>  │
│  - Prevents bet data collision          │
│  - Each spin isolated                   │
└──────────────────────────────────────────┘
```

---

## 🔗 Integration Points & Boundaries

### **Tier Separation Matrix**

| Component | Used In | Imports From | Tier |
|-----------|---------|--------------|------|
| `BettingAssistant.tsx` | `/assistant` | lib/, types/, stores/ | 1 |
| `PatternDetectionEngine.tsx` | `RouletteSystem.tsx` | lib/roulette-logic | 2 |
| `StreakAnalysisTable.tsx` | `RouletteSystem.tsx` | lib/roulette-logic | 2 |
| `TimeCorrelationTable.tsx` | `RouletteSystem.tsx` | lib/roulette-logic | 2 |
| `BettingDataContext.tsx` | App-wide | N/A (provider) | Shared |
| `HistoryTable.tsx` | Both tiers | lib/types, lib/roulette-logic | Shared |

### **Key Boundaries**

```
✅ CLEAN SEPARATION:
   - Betting Assistant does NOT import Advanced Tier components
   - Advanced Tier does NOT import Betting Assistant components
   - Both use shared components (HistoryTable, BettingDataContext)

✅ DATA ISOLATION:
   - Betting Assistant: uses local session state + Supabase
   - Advanced Tracker: uses BettingDataContext spinHistory
   - No state conflicts
```

---

## 🗄️ Supabase Integration Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE TABLES                            │
└─────────────────────────────────────────────────────────────────┘

USER LOGIN
    ↓
[supabase.auth.getUser()] → userId
    ↓
┌──────────────────────────┐
│ betting_sessions         │ ← createBettingSession()
│  - session_name          │ ← updateBettingSession()
│  - config                │
│  - current_bankroll      │
│  - total_wagered         │
│  - status                │
│  - created_at            │
└────────┬─────────────────┘
         │
         ↓ (one-to-many)
┌──────────────────────────┐
│ betting_cards            │ ← createBettingCards()
│  - card_number           │ ← updateBettingCard()
│  - target                │
│  - max_bets              │
│  - current_total         │
│  - bets_used             │
│  - status                │
└────────┬─────────────────┘
         │
         ↓ (one-to-many)
┌──────────────────────────┐
│ betting_card_steps       │ ← saveBettingCardStep()
│  - step_number           │
│  - bet_number            │
│  - spin_number           │
│  - bet_groups            │
│  - outcome               │
│  - net_pl                │
│  - running_card_total    │
└──────────────────────────┘

┌──────────────────────────┐
│ custom_groups            │ ← saveCustomGroups()
│  - user_id               │ ← loadCustomGroups()
│  - groups: Array         │
└──────────────────────────┘
```

---

## 📊 Decision Engine Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      DECISION ENGINE                            │
└─────────────────────────────────────────────────────────────────┘

Spin History (filtered, non-zero)
    ↓
lib/decideBet.ts
    ↓
┌──────────────────────────────────────┐
│ Calculate Window Metrics:            │
│  - 5 spins  (weight: 0.25)          │
│  - 10 spins (weight: 0.5)           │
│  - 15 spins (weight: 0.25)          │
│                                      │
│ For each window:                     │
│  - redCount/blackCount              │
│  - flipsPercent (alternation)       │
│  - zScore (bias)                    │
│  - entropy (pattern structure)      │
│  - runLength (streak)               │
└──────────┬───────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ Voting System:                       │
│  - Each window votes FOLLOW/STAY    │
│  - Aggregate weighted votes         │
└──────────┬───────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ Skip Strategy:                       │
│  - Defensive skips (losses)         │
│  - Confidence skips (low quality)   │
│  - Pattern skips (invalidation)     │
│  - Recovery skips (after skips)     │
└──────────┬───────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ Return Decision:                     │
│  {                                   │
│    decision: 'BET' | 'SKIP' | 'SIT' │
│    side: 'FOLLOW' | 'STAY'          │
│    betOn: 'A' | 'B'                 │
│    stake: number                     │
│    confidence: 0-100%                │
│    reasons: string[]                 │
│  }                                   │
└──────────────────────────────────────┘
```

---

## 🎯 Betting System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BETTING SYSTEM FLOW                          │
└─────────────────────────────────────────────────────────────────┘

User places bet
    ↓
handleHistoryTableBet() [useCallback wrapped]
    ↓
Calculate outcome (matrix betting)
    ↓
    ┌─────────────────────────────────┐
    │ For each group in betMatrix:    │
    │  - checkIfGroupWon(num, group)  │
    │  - getGroupPayout(group)        │
    │  - Calculate P/L                │
    └─────────┬───────────────────────┘
              ↓
    ┌─────────────────────────────────┐
    │ Update Betting System:          │
    │  - Flat: no change              │
    │  - Martingale: double on loss   │
    │  - Fibonacci: sequence advance  │
    │  - D'Alembert: +/- base unit    │
    └─────────┬───────────────────────┘
              ↓
    ┌─────────────────────────────────┐
    │ Create BetRecord                │
    │  - id: timestamp                │
    │  - betMatrix                    │
    │  - outcome: win/loss            │
    │  - P/L                          │
    │  - runningCardTotal             │
    │  - runningBankroll              │
    └─────────┬───────────────────────┘
              ↓
         ┌────┴────┐
         │         │
         ↓         ↓
   [Local]    [Supabase]
    Update     (if logged in)
    Card       
    Steps      saveBettingCardStep()
               updateBettingCard()
               updateBettingSession()
               
    ↓
Check card status:
    - currentTotal >= target → 'completed'
    - betsUsed >= maxBets → 'failed'
```

---

## 🔍 Problem-Solving Reference

### **When debugging Betting Assistant:**
1. Check `components/BettingAssistant.tsx` (main logic)
2. Verify `lib/bettingAssistantStorage.ts` (Supabase calls)
3. Check `handleHistoryTableBet` (useCallback wrapped at line 591)
4. Verify spin ID uniqueness (timestamp-based)

### **When debugging Advanced Tracker:**
1. Check `components/RouletteSystem.tsx` (integration)
2. Verify `PatternDetectionEngine.tsx` (47 groups)
3. Check `lib/roulette-logic.ts` (betting groups definition)
4. Verify `BettingDataContext` (spin data source)

### **When debugging Supabase:**
1. Check `.env.local` (credentials)
2. Verify `lib/supabase.ts` (client init)
3. Check error logs in browser console
4. Verify table structure in Supabase dashboard

### **When debugging bet tracking:**
1. Verify spin has unique `id: timestamp`
2. Check `historicalBets` object structure
3. Verify `spinKey` generation in HistoryTable
4. Check `onHistoricalBetsUpdate` callback

---

## 📝 Quick Reference: Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `handleHistoryTableBet` | BettingAssistant.tsx:591 | Process bet, update card |
| `startSession` | BettingAssistant.tsx:285 | Create session + Supabase |
| `endSession` | BettingAssistant.tsx:743 | Mark session complete |
| `decideBet` | lib/decideBet.ts | Decision engine (multi-window) |
| `checkIfGroupWon` | lib/roulette-logic.ts | Check if bet won |
| `saveBettingCardStep` | lib/bettingAssistantStorage.ts:502 | Save bet to DB |

---

**Last Updated:** October 28, 2024
**Build Status:** ✅ Passing
**Deployment:** Auto-deploy from GitHub main → Vercel
