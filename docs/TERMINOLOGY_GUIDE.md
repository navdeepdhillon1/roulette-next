# Terminology Guide

This document defines consistent terminology used throughout the EuroRoulette Tracker application, documentation, and user-facing content.

## Core Concepts

### Betting Cards
**Definition:** A mini-session within a larger betting session with its own profit target, maximum bet limit, and status tracking.

**Usage:**
- Each **betting card** represents a structured attempt to reach a profit goal
- Cards have states: locked, active, completed, or failed
- Example: "Card #1: Target $50, Max 15 bets"

**Found in:**
- Card Dashboard
- Betting Assistant
- Session Setup

**Example Sentences:**
- "Start your first **betting card** with a $50 target"
- "Each **betting card** helps you maintain discipline"
- "Complete all **betting cards** to finish your session"

---

### Betting Groups
**Definition:** Categories of betting types in roulette (e.g., Red/Black, Even/Odd, Dozens, Columns, Wheel Sectors).

**Usage:**
- **Betting groups** are the categories or types of bets available
- They represent the 47 different bet types tracked by the system
- Example groups: Red, Black, Dozen 1, Column 3, Voisins du Zéro

**Categories:**
- **Table Common:** Red, Black, Even, Odd, Low, High
- **Table Special:** Dozens (1-3), Columns (1-3)
- **Wheel Common:** Voisins, Tiers, Orphelins
- **Wheel Special:** Jeu Zéro, custom groups

**Example Sentences:**
- "Track performance across 47 **betting groups**"
- "Select your preferred **betting groups** for this card"
- "The **betting groups** section shows all available bet types"

---

### Betting Chips
**Definition:** Individual clickable buttons representing specific betting groups that you interact with to place bets.

**Usage:**
- **Betting chips** are the interactive UI elements you click to place or increase bets
- Each **betting chip** corresponds to one betting group
- Visual metaphor: Like placing physical chips on a roulette table

**Behavior:**
- Click a **betting chip** to add stake
- **Betting chips** show current stake amount
- Active **betting chips** are highlighted (typically yellow)
- Hold or right-click to decrease stake

**Example Sentences:**
- "Click the Red **betting chip** to place $5 on Red"
- "**Betting chips** turn yellow when you have an active bet"
- "Tap a **betting chip** to increase your stake"
- "Each **betting chip** displays your current bet amount"

---

### Card Dashboard
**Definition:** The overview screen showing all betting cards in a session with their status and progress.

**Usage:**
- The **Card Dashboard** displays all cards: locked, active, completed, and failed
- Provides quick visibility into session progress
- Shows which card is currently active

**Example Sentences:**
- "View all your cards in the **Card Dashboard**"
- "The **Card Dashboard** shows your session progress"
- "Return to the **Card Dashboard** to see completed cards"

---

### Performance Matrix
**Definition:** A detailed table showing bet outcomes, P/L tracking, and results for each betting group across all spins.

**Usage:**
- The **Performance Matrix** tracks which bets won/lost on each spin
- Organized into 4 views: Table Common, Table Special, Wheel Common, Wheel Special
- Shows running totals and per-spin results

**Example Sentences:**
- "Check the **Performance Matrix** to see detailed results"
- "The **Performance Matrix** shows which groups are profitable"
- "View your betting history in the **Performance Matrix**"

---

## Hierarchy & Relationships

```
Session
  └─ Betting Cards (mini-sessions with targets)
       └─ Betting Interface (active card window)
            └─ Betting Groups Section
                 └─ Betting Chips (clickable buttons)
                      └─ Individual Bets (Red $5, Dozen 1 $10, etc.)
```

---

## Terminology Quick Reference

| Term | Definition | Example |
|------|------------|---------|
| **Betting Card** | Mini-session with target/limits | "Card #3: Target $100" |
| **Card Dashboard** | Overview of all cards | "View progress in Card Dashboard" |
| **Betting Groups** | Categories of bet types | "Red, Black, Dozens, Columns" |
| **Betting Chips** | Clickable bet buttons | "Click the Red betting chip" |
| **Performance Matrix** | Detailed results table | "Track outcomes in Performance Matrix" |
| **Betting Interface** | Active betting window | (Internal term - not user-facing) |

---

## Usage Guidelines

### ✅ DO:
- Use "**betting chip**" when referring to the clickable button
- Use "**betting group**" when referring to the bet type/category
- Use "**betting card**" when referring to the mini-session
- Be consistent across documentation, UI labels, and tooltips

### ❌ DON'T:
- Call betting chips "buttons" (too generic)
- Call betting cards just "cards" without context
- Mix terms (e.g., calling chips "groups" or vice versa)
- Use "bet button" or "bet selector" (inconsistent with chip metaphor)

---

## Context-Specific Usage

### In Documentation:
- "Click the **Red betting chip** to place a $5 bet on Red"
- "Each **betting card** represents a disciplined attempt to reach your profit target"
- "The system tracks 47 **betting groups** across table and wheel bets"

### In UI Labels:
- Button: "Place Betting Chips" (section header)
- Tooltip: "Click betting chip to increase stake"
- Dashboard: "Betting Card #1"

### In Code Comments:
- `// User clicked a betting chip to place bet`
- `// Calculate P/L for this betting group`
- `// Update active betting card state`

---

## Glossary for Users

Consider adding this to your app's help section or onboarding:

**Betting Card:** A mini-goal within your session (e.g., "Win $50 in 15 bets or less")

**Betting Groups:** The types of bets you can place (Red, Black, Dozens, Columns, etc.)

**Betting Chips:** The buttons you click to place bets - just like placing chips on a real roulette table

**Card Dashboard:** Your command center showing all betting cards and their status

**Performance Matrix:** Detailed view of every bet's outcome and your running profit/loss

---

## Notes for Content Writers

When writing guides, tutorials, or help content:
1. Introduce terms on first use: "**Betting chips** (the clickable buttons representing each bet type)..."
2. Use bold on first mention in each article
3. Stay consistent with the casino metaphor (chips, table, groups)
4. Avoid mixing metaphors (don't call chips "tiles" or "selectors")

---

## Version History

- **v1.0** (2025-10-29): Initial terminology guide established
  - Defined betting chip, betting group, betting card
  - Established consistent hierarchy
  - Created usage guidelines
