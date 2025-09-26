Version: 1.0
Status: WORKING
Last Verified: 2024-12-26
/**
 * ROULETTE TRACKER - LAYOUT STRUCTURE v1.0
 * Last Updated: 2024-12-26
 * 
 * NAVIGATION MAP:
 * - Assistant OFF: [Table View] [Table Bets] [Table Stats]
 * - Assistant ON: [Setup] [Game Action] [Performance] [Analysis]
 *   - Game Action → [Table] [Wheel]
 *     - Table → [Table View] [Table Bets] [Table Stats]
 *     - Wheel → [Wheel View] [Wheel Bets] [Wheel Stats]
 * 
 * DO NOT MODIFY WITHOUT UPDATING THIS MAP
 */
 ## Component Files Reference
* Main: RouletteSystem.tsx (app/page.tsx)
* Betting Cards: BettingCards18.tsx, BettingCards12.tsx, BettingCards6.tsx
* Tables: HistoryTable.tsx, StatsMatrix.tsx
* Entry: EntryPanel.tsx
* Summary: CurrentBetsSummary.tsx
* Heatmap: HeatmapGrid.tsx
* Header: HeaderBar.tsx
* Wheel: WheelView.tsx