// lib/strategies/adaptive/decide.ts
export type StrategyCtx = { spins: { n:number; ts:number }[]; bankroll:number; tableMax:number; baseUnit:number };

export type StrategyDecision = {
  decision: 'BET' | 'SKIP';
  target: { kind: 'even'; side: 'A'|'B' } | { kind: 'numbers'; nums: number[] };
  stake: number | null;
  confidence: number;
  reasons: string[];
  meta?: Record<string, unknown>;
};

// TEMP stub — replace with your real logic when ready.
export function decide(_ctx: StrategyCtx): StrategyDecision {
  return {
    decision: 'SKIP',
    target: { kind: 'even', side: 'A' },
    stake: null,
    confidence: 0,
    reasons: ['temporary stub'],
  };
}