# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Roulette Tracker Pro is a Next.js 15 application for tracking and analyzing roulette gameplay. It provides analytics across 47 betting groups (26 table + 21 wheel), a practice simulator, session management with a "betting card" system, and real-time statistical insights. This is a client-side application with optional Supabase integration for persistence.

## Development Commands

```bash
npm run dev       # Start development server with Turbopack at localhost:3000
npm run build     # Production build with Turbopack (run before deploying)
npm run start     # Serve production build locally
npm run lint      # Run ESLint (resolve warnings before PRs)
```

## Architecture Overview

### State Management (Multi-Layer Design)

The app uses a hybrid state management approach with clear separation of concerns:

1. **Global Game State** (`stores/gameState.ts` - Zustand)
   - Single source of truth for: spin history, bankroll, active card, card archive
   - Handles card lifecycle: `startCardsMode()` → `updateActiveCard()` → `closeActiveCard()`
   - **Key Pattern**: Steps are immutable once created; only the last step can be updated
   - **Performance Note**: Keep spins array filtered (non-zero) when passing to decision engine to avoid recalculation

2. **Betting Data Context** (`components/BettingDataContext.tsx` - React Context)
   - Session-wide aggregations: total spins, wagered, returned, ROI
   - Used by performance analytics and dashboard summaries
   - **When to use**: Cross-session statistics, not individual card tracking

3. **Card Manager Context** (`app/contexts/CardManagerContext.tsx` - React Context)
   - UI-only state for floating/draggable card components
   - Manages z-index stacking, minimize/maximize, positioning
   - **Separate from game state** - purely presentational layer

### Core Domain Logic

**Roulette Constants & Helpers** (`lib/roulette-logic.ts`)
- Defines all betting groups: standard (red/black, even/odd, dozens, columns), wheel-based (voisins, orphelins, tiers), and alternative groupings (A/B, AA/BB, etc.)
- `checkIfGroupWon(num, group)`: determines if a number wins for a specific betting group
- `getGroupPayout(group)`: returns payout multiplier (1x, 2x, or 5x)
- `detectAnomalies(spins, threshold)`: identifies statistical anomalies (missing dozens, extreme color bias, missing columns)

**Decision Engine** (`lib/decideBet.ts`) - Multi-Window Voting System

The decision engine uses a sophisticated weighted voting system across three time windows:

1. **Analysis Windows**:
   - 5 spins (weight: 0.25) - Immediate momentum and current runs
   - 10 spins (weight: 0.5) - Medium-term patterns and consistency
   - 15 spins (weight: 0.25) - Long-term trend confirmation

2. **Calculated Metrics** per window:
   - `redCount/blackCount`: Raw color distribution
   - `flipsPercent`: Alternation rate (high = choppy, low = trending)
   - `zScore`: Statistical bias (expected vs actual red/black ratio)
   - `entropy`: Pattern structure (0=perfectly structured, 1=random)
   - `runLength`: Current consecutive same-color streak

3. **Voting Logic** (`determineDirection()`):
   - Each window casts votes for FOLLOW (trend) or STAY (counter-trend)
   - High flipsPercent (≥60%) → vote STAY (bet against alternation)
   - High zScore or low entropy → vote FOLLOW (ride the bias)
   - Run length ≥3 → vote FOLLOW (momentum)
   - Aggregate weighted votes determine final direction

4. **Skip Strategy** (`makeDecisionWithSkips()`):
   - **Defensive skips**: consecutive losses ≥ threshold, volatility too high
   - **Confidence skips**: confidence < minConfidence, survival probability < minSurvival
   - **Pattern skips**: trend invalidation detected, after big wins (consolidate)
   - **Recovery skips**: require higher confidence after skip streaks
   - Returns BET/SKIP (single condition) or SIT_OUT (multiple red flags)

5. **Adaptive Rules** (CardSettings.adaptiveRule):
   - `"follow"`: Always bet with the trend
   - `"stay"`: Always bet against the trend (contrarian)
   - `"adaptive9"`: Dynamic - switch based on 9-spin window analysis
   - Used in card settings to override decision engine for testing strategies

**Critical Understanding**: The engine doesn't predict outcomes - it identifies pattern strength and suggests bet timing. High confidence = strong pattern detected, not guaranteed win.

**Prediction & Analysis**
- `lib/predictionEngine.ts`: Statistical predictions for betting groups
- `lib/convergenceEngine.ts`: Analyzes convergence toward expected probabilities
- `lib/numberStatsCalculations.ts`: Per-number statistics (frequency, absence, streaks)

### Complete Data Flow (Spin → Decision → Bet → Outcome)

Understanding how a single spin flows through the entire system:

```
1. User Input (CompactBettingCard)
   ↓
2. Decision Engine (lib/decideBet.ts)
   - Filter non-zero spins from history
   - Calculate window metrics (5, 10, 15 spins)
   - Run voting system → determine direction
   - Apply skip strategy
   - Return Decision object
   ↓
3. UI Suggestion Display
   - Show recommended action (BET/SKIP/SIT_OUT)
   - Display confidence level (0-100%)
   - List reasoning bullets
   - Highlight suggested side (A/B)
   ↓
4. Matrix Betting Pattern
   - User can bet on MULTIPLE groups simultaneously
   - Each group has independent stake (allows hedging)
   - Betting matrix stored: { red: 5, dozen1: 10, ... }
   - Total stake = sum of all group bets
   ↓
5. Betting System Progression (calculateNextBet)
   - Uses previous outcome + system rules
   - Martingale: double on loss → baseBet on win
   - Fibonacci: next sequence index on loss → step back 2 on win
   - Custom: evaluate rules per consecutive loss count
   - Updates currentBet in session state
   ↓
6. Outcome Calculation
   - Spin number determines color (RED_NUMBERS array)
   - For each bet group: checkIfGroupWon(num, group)
   - Calculate payout: stake × getGroupPayout(group)
   - Group results: { red: -5, dozen1: 20, ... }
   - Net P/L = sum of all group results
   ↓
7. State Updates (Multiple Layers)
   - CardStep created with outcome, P/L, running total
   - Zustand store: activeCard.steps.push(newStep)
   - BettingDataContext: update session aggregates
   - Betting system: update consecutiveWins/Losses
   ↓
8. Card Status Check
   - If runningTotal ≥ target → status = 'completed' → show celebration
   - If betsUsed ≥ maxBets → status = 'failed' → show failure modal
   - Else → continue to next spin
```

**Matrix Betting Philosophy**: Unlike traditional single-bet-per-spin roulette, this system allows complex strategies like betting red + dozen1 + col2 simultaneously. This enables:
- Hedging strategies (bet both red and black on different progressions)
- Coverage strategies (bet multiple dozens with different stakes)
- Correlation testing (track which group combinations win together)

### Component Architecture

**Page Routes** (`app/`)
- `/` - Landing page with feature overview and "10 Commandments"
- `/simulator` - Practice mode with simulated spins
- `/analysis` - Live tracking with full analytics
- `/tracker` - Simplified tracker view
- `/assistant` - Betting card system (main feature)

**Key Components** (`components/`)

1. **Betting Assistant System**
   - `BettingAssistant.tsx`: Orchestrates session flow (setup → dashboard → active card → performance)
   - `SessionSetup.tsx`: Configure bankroll, card targets, max bets, betting system (Flat, Paroli, D'Alembert, Martingale, Fibonacci, Custom)
   - `BetCardDashboard.tsx`: Shows all cards in session with status (locked/active/completed/failed)
   - `CompactBettingCard.tsx`: Main betting interface with matrix-based betting across multiple groups, real-time suggestions, and betting system progression
   - `BettingAssistantPerformance.tsx`: Detailed analytics and performance metrics

2. **Analysis Components**
   - `RouletteSystem.tsx`: Main analysis view with tabs (Statistics, Predictions, Numbers, Anomalies)
   - `EnhancedProbabilityAnalysis.tsx`: Group-level probability analysis
   - `WheelView.tsx`: Visual wheel representation with sector tracking
   - `GroupPredictions.tsx`: AI-driven predictions for betting groups
   - `BetAdvisor.tsx`: Real-time betting advice based on current trends

3. **Floating Card System**
   - `FloatingCardWrapper.tsx`: Draggable, resizable card container
   - `FloatingAdvisorCard.tsx`: Compact advisor overlay
   - `FloatingProbabilityCard.tsx`: Quick probability reference

### Betting Card System Flow

1. **Session Setup**: User configures bankroll, number of cards, target per card, max bets per card, and betting system
2. **Card States**: locked → active → completed/failed
3. **Card Lifecycle**:
   - Each card is a mini-session with independent P/L tracking
   - Target-based completion (reach +$X profit)
   - Bet-limited (max N bets to reach target)
   - **Discipline metrics**: % of suggestions followed, skip discipline %
4. **Card Completion**: Success triggers celebration modal; failure shows retry options
5. **Session Analytics**: Track overall ROI, win rate, discipline percentage across all cards

**Why Cards?** The card metaphor enforces discipline by:
- Setting clear profit targets (prevents "just one more bet")
- Limiting maximum bets (prevents chasing losses)
- Creating psychological breaks between cards (prevents tilt)
- Tracking strategy adherence (follow vs ignore suggestions)

### Data Models

**Card System** (`stores/gameState.ts`)
```typescript
Card {
  id, cardNumber, openedAt, status: 'active' | 'closed' | 'abandoned'
  settings: CardSettings (group, target, maxBets, progression, adaptiveRule)
  steps: CardStep[] (each bet/skip decision)
  actualBets, totalSteps, skipsCount, maxSkipStreak
  finalPL, disciplinePct, skipDisciplinePct
}

CardStep {
  stepNumber, betNumber, spinNumber
  suggested: { action, side, stake, confidence, reasons }
  userAction: { action, side, stake, timestamp }
  outcome: 'win' | 'loss' | 'push' | 'skipped'
  pl, runningTotal, bankrollAfter
  followedSuggestion, progressionIndex, skipStreak
}

Decision {
  decision: 'BET' | 'SKIP' | 'SIT_OUT'
  side: 'FOLLOW' | 'STAY' | null
  betOn: 'A' | 'B' | null
  stake, confidence, reasons, skipReasons
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  survivalProb, expectedValue
  patternQuality: 'strong' | 'moderate' | 'weak' | 'none'
  marketCondition: 'stable' | 'transitioning' | 'volatile' | 'chaotic'
}
```

### Betting Systems

Implemented in `CompactBettingCard.tsx` via `calculateNextBet()`:
- **Flat**: Fixed bet amount (no progression)
- **Paroli**: Double on win up to 3 consecutive wins, reset to base
- **D'Alembert**: Increase by base unit on loss, decrease on win
- **Reverse D'Alembert**: Increase on win, decrease on loss
- **Martingale**: Double on loss, reset to base on win (high risk)
- **Fibonacci**: Follow Fibonacci sequence on loss, step back 2 positions on win
- **Custom**: Configurable rules for first/second/third loss and win behavior with max multiplier cap

**System Update Flow**: `placeBet()` → `updateBettingSystem()` → `calculateNextBet()` → updates `session.config.bettingSystem`

### Environment Setup

Required environment variables (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Supabase is optional - app functions fully client-side without it.

## Key Conventions

- **TypeScript**: Use explicit types; avoid `any` except for legacy compatibility
- **Component Naming**: PascalCase for components, camelCase for functions/variables
- **Store Naming**: Zustand stores use descriptive keys; memoize heavy selectors
- **Styling**: Tailwind CSS throughout; group classes: layout → color → effects
- **Commits**: Follow Conventional Commits (`feat:`, `fix:`, `chore:`) with scope when relevant

## Common Patterns

**Adding a New Betting Group**:
1. Add to `GroupKey` type in `lib/roulette-logic.ts`
2. Define number membership in constant or function
3. Update `checkIfGroupWon()` and `getGroupPayout()`
4. Add UI representation in relevant components (CompactBettingCard, RouletteSystem)

**Modifying Decision Logic**:
1. Update `lib/decideBet.ts` metrics calculation in `calculateWindowMetrics()`
2. Adjust `determineDirection()` voting weights (5-spin: 0.25, 10-spin: 0.5, 15-spin: 0.25)
3. Test with various spin sequences (alternating, trending, random)
4. Update confidence calculation in `calculateConfidence()` if needed

**Adding a Betting System**:
1. Define system config in `types/bettingAssistant.ts` (BettingSystemConfig interface)
2. Add to `SessionSetup.tsx` system picker with description
3. Implement progression logic in `CompactBettingCard.tsx` `calculateNextBet()`
4. Update `updateBettingSystem()` in `BettingAssistant.tsx` to track wins/losses
5. Test edge cases: max multiplier, sequence exhaustion, bankroll limits

**Debugging Decision Engine**:
- Log `metrics5`, `metrics10`, `metrics15` to see window calculations
- Check `votes` array in `determineDirection()` to see which windows voted which way
- Verify `confidence` calculation - should be 0-1 range
- Test skip conditions individually to isolate triggering logic

## Performance Considerations

- **47 Betting Groups (26 table + 21 wheel)**: Each spin recalculates win/loss for all groups. Use memoization for expensive calculations.
- **Spin History**: Filter zeros before passing to decision engine. Consider limiting history to last 100 spins for real-time performance.
- **Matrix Betting**: Calculating outcomes for 10+ simultaneous bets per spin - keep `checkIfGroupWon()` optimized.
- **Re-renders**: BettingDataContext updates trigger dashboard re-renders. Use React.memo for heavy components.

## Testing

No automated tests currently. Manual QA required:
1. Run `npm run lint` to catch errors
2. Test in `npm run dev` with realistic session flow
3. Verify betting system progressions with known sequences
4. Check responsive behavior at different screen sizes
5. Test edge cases: zero spins, max bets reached, bankroll depletion

**Test Scenarios**:
- Alternating pattern (RBRBRBRB): Should suggest STAY with high confidence
- Trending pattern (RRRRRBBB): Should suggest FOLLOW with medium confidence
- After 5 consecutive losses: Should trigger defensive skip
- High volatility (RBBRRBBR): Should lower confidence or trigger skip
- Card completion: Verify celebration modal and next card unlock

## Additional Context from AGENTS.md

- Routed pages in `app/(sections)`, shared providers in `app/layout.tsx`
- Long-form docs/notes in `docs/`
- Type definitions in `types/`, re-export to avoid deep imports
- Production build required before deployment (affects routing/build-time data)
- 2-space indentation; JSX props on separate lines when > ~80 chars
- Document manual QA steps in PR descriptions until test suite added
