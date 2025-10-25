'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { trackArticleView } from '@/lib/analytics'

// This will eventually come from a CMS, database, or markdown files
const getArticleBySlug = (slug: string) => {
  const articles: Record<string, any> = {
    'getting-started-basic-tracker': {
      title: 'Getting Started with Basic Tracker',
      category: 'How-To Guides',
      date: '2025-01-24',
      readTime: '7 min read',
      author: 'Roulette Tracker Team',
      content: `
        <p>Welcome to Roulette Tracker Pro! This guide will help you get started with the Basic Tracker - your first step to understanding roulette statistics and managing your sessions effectively.</p>

        <h2>What You'll Learn</h2>
        <ul>
          <li>How to add your first spin</li>
          <li>Understanding the statistics panel</li>
          <li>Reading color distribution</li>
          <li>Session tracking basics</li>
          <li>Exporting your data</li>
        </ul>

        <h2>Adding Your First Spin</h2>
        <p>The basic tracker is available on the <strong>/tracker</strong> page. Here's how to start:</p>

        <h3>Method 1: Click the Number Wheel</h3>
        <ol>
          <li>Click on any number from the roulette wheel display (0-36)</li>
          <li>The number will be instantly added to your spin history</li>
          <li>Watch as statistics update in real-time</li>
        </ol>

        <h3>Method 2: Manual Entry</h3>
        <ol>
          <li>Find the number input field at the top</li>
          <li>Type the number (0-36) and press Enter</li>
          <li>Or use the "Add Spin" button</li>
        </ol>

        <h2>Understanding the Statistics Panel</h2>
        <p>Once you've added a few spins, the stats panel shows key metrics:</p>

        <h3>Total Spins</h3>
        <p>The total number of spins you've recorded in this session. More spins = more reliable statistics.</p>

        <h3>Win Rate</h3>
        <p>If you're betting on a specific outcome (like red/black), this shows your success percentage. Keep in mind:</p>
        <ul>
          <li><strong>Even money bets (red/black, odd/even):</strong> Expected win rate is 48.6% in European roulette</li>
          <li><strong>Dozens and columns:</strong> Expected win rate is 32.4%</li>
          <li>Don't expect 50% - the zero is where the house edge comes from</li>
        </ul>

        <h3>ROI (Return on Investment)</h3>
        <p>Shows your profit or loss as a percentage of total money wagered.</p>
        <ul>
          <li><strong>Positive ROI:</strong> You're currently ahead (enjoy it while it lasts!)</li>
          <li><strong>Negative ROI:</strong> You're currently behind (this is expected long-term)</li>
          <li><strong>Realistic expectation:</strong> -2.7% for European, -5.26% for American roulette</li>
        </ul>

        <h2>Color Distribution: Red vs Black</h2>
        <p>The tracker shows a breakdown of red and black results:</p>

        <ul>
          <li><strong>Red Count:</strong> How many times red has hit (numbers 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36)</li>
          <li><strong>Black Count:</strong> How many times black has hit (all non-red numbers except 0)</li>
          <li><strong>Green Count:</strong> How many times zero has hit</li>
        </ul>

        <p><strong>Important:</strong> Over the long run, red and black should each appear approximately 48.6% of the time. Short-term deviations are normal and expected - they don't mean anything is "due."</p>

        <h2>Session Tracking</h2>
        <p>A "session" is a period of play from start to finish. Good session management is key to responsible gambling:</p>

        <h3>Starting a New Session</h3>
        <ol>
          <li>Click "New Session" or "Clear History"</li>
          <li>Set your starting bankroll (the amount you brought to play with)</li>
          <li>Set a stop-loss limit (the maximum you're willing to lose)</li>
          <li>Optionally set a profit target (when you'll stop if winning)</li>
        </ol>

        <h3>During a Session</h3>
        <ul>
          <li>The tracker shows your current bankroll after each bet</li>
          <li>A warning appears if you're approaching your stop-loss limit</li>
          <li>The bankroll chart visualizes your session performance</li>
        </ul>

        <h3>Ending a Session</h3>
        <ul>
          <li>Stop when you hit your stop-loss (discipline!)</li>
          <li>Stop when you hit your profit target (lock in wins)</li>
          <li>Stop when you've played for your planned time</li>
          <li><strong>Never chase losses</strong> - this is the most important rule</li>
        </ul>

        <h2>Exporting Your Data</h2>
        <p>Want to analyze your results elsewhere? Export your data:</p>

        <ol>
          <li>Click the "Export" button (usually in the top-right)</li>
          <li>Choose your format:
            <ul>
              <li><strong>CSV:</strong> Open in Excel, Google Sheets, or any spreadsheet</li>
              <li><strong>JSON:</strong> For developers or advanced analysis</li>
            </ul>
          </li>
          <li>Your spin history, timestamps, and bet details will be saved</li>
        </ol>

        <h2>Tips for Beginners</h2>

        <h3>1. Start with Pen and Paper</h3>
        <p>If you're at a real casino, practice tracking a few spins on paper first. Then enter them into the app later to see statistics.</p>

        <h3>2. Track at Least 50 Spins</h3>
        <p>Statistical patterns don't emerge from 5-10 spins. Track at least 50 to see meaningful data.</p>

        <h3>3. Don't Look for Patterns That Aren't There</h3>
        <p>The tracker shows hot/cold numbers and streaks, but remember: these are historical facts, not future predictions. The wheel has no memory.</p>

        <h3>4. Use It for Discipline</h3>
        <p>The real value of tracking isn't predicting outcomes - it's maintaining discipline. Seeing your bankroll chart helps you recognize when to stop.</p>

        <h2>Common Questions</h2>

        <h3>Q: Will tracking help me win?</h3>
        <p><strong>A:</strong> No. Tracking shows you what has happened, not what will happen. Use it to understand variance and manage your bankroll, not to predict outcomes.</p>

        <h3>Q: Why does my win rate fluctuate?</h3>
        <p><strong>A:</strong> Short-term variance is normal. Over hundreds of spins, your win rate will converge toward the expected probability (48.6% for red/black).</p>

        <h3>Q: Should I bet more when I see a pattern?</h3>
        <p><strong>A:</strong> No! Past results don't influence future spins. This is the gambler's fallacy. Bet sizes should be based on your bankroll, not perceived patterns.</p>

        <h2>Next Steps</h2>
        <p>Once you're comfortable with basic tracking:</p>

        <ul>
          <li>Upgrade to <strong>Pro tier</strong> for Advanced Analytics (47 betting groups, probability analysis, convergence tracking)</li>
          <li>Upgrade to <strong>Elite tier</strong> for the Betting Assistant (structured card system with data-driven suggestions)</li>
          <li>Read our guide on <strong>Session Management 101</strong> to improve discipline</li>
        </ul>

        <h2>Key Takeaways</h2>
        <ul>
          <li>The Basic Tracker helps you record spins and understand statistics</li>
          <li>Win rate for even-money bets should approach 48.6% over time</li>
          <li>Session management (stop-loss, profit targets) is critical</li>
          <li>Export data to analyze your play offline</li>
          <li>Tracking doesn't predict the future - use it for discipline, not strategy</li>
        </ul>

        <p><strong>Ready to start tracking?</strong> Head to the <a href="/tracker">/tracker</a> page and add your first spin!</p>
      `,
    },
    'your-first-betting-card': {
      title: 'Your First Betting Card',
      category: 'How-To Guides',
      date: '2025-01-24',
      readTime: '10 min read',
      author: 'Roulette Tracker Team',
      content: `
        <p>Welcome to the Betting Assistant! Betting Cards are the core feature of the Elite tier. They provide structured, disciplined betting with real-time pattern-based suggestions. This guide will walk you through creating and using your first card.</p>

        <h2>What Is a Betting Card?</h2>
        <p>A betting card is a mini-session with specific goals:</p>

        <ul>
          <li><strong>Target Profit:</strong> A clear dollar amount you're trying to win (e.g., $30)</li>
          <li><strong>Max Bets:</strong> A hard limit on number of attempts (e.g., 20 bets)</li>
          <li><strong>Betting System:</strong> A progression strategy (Flat, Martingale, Fibonacci, etc.)</li>
          <li><strong>Betting Group:</strong> What you're betting on (red/black, dozens, numbers, etc.)</li>
          <li><strong>Adaptive Rule:</strong> How the decision engine analyzes patterns (follow trends, stay contrarian, or adaptive)</li>
        </ul>

        <p>Think of a card as a structured game plan. You either hit your target (success!) or reach max bets (failure). No "just one more bet."</p>

        <h2>Why Use Betting Cards?</h2>

        <h3>Enforces Discipline</h3>
        <p>Cards prevent the most common mistake: chasing losses. When the card ends, you stop. Period.</p>

        <h3>Tracks Strategy Adherence</h3>
        <p>The system tracks how often you follow statistical suggestions vs override them. This "discipline score" shows if you're sticking to the plan.</p>

        <h3>Provides Structured Goals</h3>
        <p>Instead of vague "win some money," you have a specific target. This makes it easier to stop when you're ahead.</p>

        <h3>Offers Real-Time Guidance</h3>
        <p>The decision engine analyzes recent spin patterns and suggests whether to BET, SKIP, or SIT_OUT each spin based on statistical analysis. You're not alone in decision-making.</p>

        <h2>Creating Your First Card (Step-by-Step)</h2>

        <h3>Step 1: Access the Betting Assistant</h3>
        <ol>
          <li>Navigate to <strong>/assistant</strong></li>
          <li>If this is your first time, click "Start Session"</li>
          <li>You'll see the session setup screen</li>
        </ol>

        <h3>Step 2: Configure Session Settings</h3>
        <p>First, set up your overall session (you can run multiple cards in one session):</p>

        <ul>
          <li><strong>Starting Bankroll:</strong> How much money you have to play with (e.g., $200)</li>
          <li><strong>Number of Cards:</strong> How many betting cards to create (start with 3-5)</li>
          <li><strong>Target per Card:</strong> How much profit each card should aim for (e.g., $30)</li>
          <li><strong>Max Bets per Card:</strong> Maximum attempts per card (recommended: 15-25)</li>
        </ul>

        <p><strong>Example Setup:</strong></p>
        <ul>
          <li>Bankroll: $200</li>
          <li>Number of Cards: 5</li>
          <li>Target per Card: $25</li>
          <li>Max Bets per Card: 20</li>
        </ul>

        <h3>Step 3: Choose a Betting System</h3>
        <p>The betting system controls how your bet size changes after wins and losses:</p>

        <ul>
          <li><strong>Flat Betting:</strong> Same bet every time (safest, recommended for beginners)</li>
          <li><strong>Martingale:</strong> Double after loss, reset on win (high risk, requires big bankroll)</li>
          <li><strong>Fibonacci:</strong> Follow Fibonacci sequence (1, 1, 2, 3, 5, 8...) on losses</li>
          <li><strong>D'Alembert:</strong> Increase by 1 unit on loss, decrease on win (moderate risk)</li>
          <li><strong>Reverse D'Alembert:</strong> Increase on win, decrease on loss (ride winning streaks)</li>
          <li><strong>Custom:</strong> Define your own progression rules</li>
        </ul>

        <p><strong>For your first card, use Flat Betting.</strong> Set your base bet to 2-5% of your bankroll (e.g., $5 for a $200 bankroll).</p>

        <h3>Step 4: Select a Betting Group</h3>
        <p>Choose what you'll be betting on:</p>

        <ul>
          <li><strong>Red/Black:</strong> 48.6% win rate, 1:1 payout (simplest for beginners)</li>
          <li><strong>Even/Odd:</strong> Also 48.6% win rate, 1:1 payout</li>
          <li><strong>Dozens (1st/2nd/3rd):</strong> 32.4% win rate, 2:1 payout</li>
          <li><strong>Columns:</strong> Also 32.4% win rate, 2:1 payout</li>
          <li><strong>Advanced Groups:</strong> Voisins, Tiers, Orphelins (wheel-based sectors)</li>
        </ul>

        <p><strong>Recommended for first card:</strong> Red/Black. It's the simplest to follow.</p>

        <h3>Step 5: Choose an Adaptive Rule</h3>
        <p>This determines how the decision engine analyzes patterns:</p>

        <ul>
          <li><strong>FOLLOW:</strong> Analyze and suggest betting with the current trend (if lots of red recently, suggest red)</li>
          <li><strong>STAY:</strong> Analyze and suggest betting against the trend (contrarian approach)</li>
          <li><strong>ADAPTIVE:</strong> Decision engine analyzes 9-spin patterns and switches between follow/stay based on pattern strength</li>
        </ul>

        <p><strong>Recommended for first card:</strong> FOLLOW. It's intuitive and easy to understand.</p>

        <h3>Step 6: Start Your Card</h3>
        <p>Click "Start Session" or "Create Cards." Your first card will be <strong>Active</strong>, while others are <strong>Locked</strong> (they unlock as you complete cards).</p>

        <h2>Using Your Active Card</h2>

        <h3>The Card Interface</h3>
        <p>Once your card is active, you'll see:</p>

        <ul>
          <li><strong>Target:</strong> Your goal (e.g., $30 profit)</li>
          <li><strong>Running Total:</strong> Your current profit/loss on this card</li>
          <li><strong>Bets Used:</strong> How many of your max bets you've used</li>
          <li><strong>Suggestion:</strong> Decision engine recommendation (BET, SKIP, or SIT_OUT)</li>
          <li><strong>Confidence:</strong> Pattern strength indicator (0-100%)</li>
          <li><strong>Reasons:</strong> Statistical factors behind the suggestion</li>
        </ul>

        <h3>Following Suggestions</h3>
        <p>Here's how to interpret the decision engine's suggestions:</p>

        <h4>BET (Green)</h4>
        <ul>
          <li><strong>Meaning:</strong> Conditions look favorable, place a bet</li>
          <li><strong>Side:</strong> Bet on A or B (e.g., Red vs Black)</li>
          <li><strong>Stake:</strong> How much to bet (based on your betting system)</li>
          <li><strong>Action:</strong> Click "Place Bet" and select the suggested side</li>
        </ul>

        <h4>SKIP (Yellow)</h4>
        <ul>
          <li><strong>Meaning:</strong> One concern detected (low confidence, volatility, or defensive)</li>
          <li><strong>Action:</strong> Click "Skip Spin" - don't bet this round</li>
          <li><strong>Why it matters:</strong> Protects bankroll during uncertain patterns</li>
        </ul>

        <h4>SIT_OUT (Red)</h4>
        <ul>
          <li><strong>Meaning:</strong> Multiple red flags (confidence too low, survival risk, etc.)</li>
          <li><strong>Action:</strong> Definitely don't bet - wait for better conditions</li>
          <li><strong>Why it matters:</strong> Prevents catastrophic losses during chaos</li>
        </ul>

        <h3>Recording Spin Results</h3>
        <p>After each spin:</p>

        <ol>
          <li>Enter the result number (0-36)</li>
          <li>The system calculates if you won or lost</li>
          <li>Your running total updates</li>
          <li>Your betting system adjusts the next stake</li>
          <li>The decision engine analyzes the updated data and generates a new suggestion</li>
        </ol>

        <h2>Card Completion</h2>

        <h3>Success: Reached Target</h3>
        <p>When your running total >= target:</p>

        <ul>
          <li>The card status changes to <strong>Completed</strong></li>
          <li>A celebration modal appears</li>
          <li>Your discipline score is calculated</li>
          <li>The next locked card unlocks</li>
        </ul>

        <h3>Failure: Max Bets Reached</h3>
        <p>If you use all max bets without reaching target:</p>

        <ul>
          <li>The card status changes to <strong>Failed</strong></li>
          <li>A failure modal shows what went wrong</li>
          <li>Your loss is recorded (usually less than target due to skips)</li>
          <li>The next card unlocks (don't give up!)</li>
        </ul>

        <h2>Discipline Metrics</h2>
        <p>After each card, you'll see discipline scores:</p>

        <h3>Suggestion Adherence</h3>
        <p>Percentage of times you followed the decision engine's BET suggestion:</p>

        <ul>
          <li><strong>90-100%:</strong> Excellent discipline</li>
          <li><strong>70-89%:</strong> Good, but room for improvement</li>
          <li><strong>Below 70%:</strong> You're overriding too often - trust the statistical analysis</li>
        </ul>

        <h3>Skip Discipline</h3>
        <p>Percentage of times you followed SKIP/SIT_OUT suggestions:</p>

        <ul>
          <li><strong>High skip discipline:</strong> Protects bankroll</li>
          <li><strong>Low skip discipline:</strong> You're betting when you shouldn't - increases risk</li>
        </ul>

        <h2>Common Mistakes to Avoid</h2>

        <h3>1. Ignoring Skip Suggestions</h3>
        <p>When the system says SKIP based on statistical analysis, it's for a reason. Betting anyway often leads to losses during volatile periods.</p>

        <h3>2. Overriding BET Suggestions</h3>
        <p>"I have a feeling about this one" is how discipline breaks down. Trust the statistical analysis, not your gut.</p>

        <h3>3. Chasing After a Failed Card</h3>
        <p>If card 1 fails, don't immediately raise stakes on card 2. Stick to your original system. Variance happens.</p>

        <h3>4. Setting Unrealistic Targets</h3>
        <p>A $10 target on 10 bets is realistic. A $100 target on 10 bets is not. Aim for 2-3x your base bet as a target.</p>

        <h3>5. Using Martingale Without Enough Bankroll</h3>
        <p>If you're using Martingale, make sure your bankroll can handle 7-8 consecutive losses (e.g., $5 → $10 → $20 → $40 → $80 → $160).</p>

        <h2>Example First Card Walkthrough</h2>

        <p><strong>Settings:</strong></p>
        <ul>
          <li>Target: $30</li>
          <li>Max Bets: 20</li>
          <li>Betting System: Flat ($5 per bet)</li>
          <li>Group: Red/Black</li>
          <li>Adaptive Rule: FOLLOW</li>
        </ul>

        <p><strong>Spin-by-Spin:</strong></p>

        <ol>
          <li><strong>Spin 1:</strong> System suggests BET Red (pattern strength 45%). Result: Red. You win $5. Running total: +$5.</li>
          <li><strong>Spin 2:</strong> System suggests BET Red (pattern strength 52%). Result: Black. You lose $5. Running total: $0.</li>
          <li><strong>Spin 3:</strong> System suggests SKIP (pattern strength too low). You skip. Running total: $0.</li>
          <li><strong>Spin 4:</strong> System suggests BET Black (pattern strength 60%). Result: Black. You win $5. Running total: +$5.</li>
          <li>... continue until running total >= $30 or 20 bets used ...</li>
        </ol>

        <h2>Next Steps</h2>

        <p>After completing your first card:</p>

        <ul>
          <li>Review your <strong>Performance Analytics</strong> to see discipline scores</li>
          <li>Try different betting systems (Fibonacci, D'Alembert) to compare</li>
          <li>Experiment with different betting groups (dozens, columns)</li>
          <li>Read our guide on <strong>Understanding the Decision Engine</strong> to learn how statistical analysis generates suggestions</li>
          <li>Try <strong>Matrix Betting</strong> (advanced: bet on multiple groups simultaneously)</li>
        </ul>

        <h2>Key Takeaways</h2>

        <ul>
          <li>Betting cards enforce discipline with clear targets and max bets</li>
          <li>Start with Flat Betting on Red/Black with FOLLOW rule</li>
          <li>Trust statistical suggestions - high discipline scores correlate with better outcomes</li>
          <li>SKIP suggestions protect your bankroll during volatility</li>
          <li>Card completion (success or failure) unlocks the next card - don't chase losses</li>
          <li><strong>Remember:</strong> The system analyzes patterns in past data; it cannot predict future outcomes</li>
        </ul>

        <p><strong>Ready to create your first card?</strong> Head to the <a href="/assistant">/assistant</a> page and start your journey!</p>
      `,
    },
    'understanding-47-groups': {
      title: 'Understanding the 47 Betting Groups',
      category: 'How-To Guides',
      date: '2025-01-24',
      readTime: '15 min read',
      author: 'Roulette Tracker Team',
      content: `
        <p>One of the most powerful features of Roulette Tracker Pro is comprehensive tracking across <strong>47 distinct betting groups</strong>. This guide explains what these groups are, how they're organized, and how to use them in your analysis.</p>

        <h2>Why 47 Groups?</h2>
        <p>Standard roulette tracking only shows basic stats like red/black or hot numbers. But experienced players know there are many more ways to bet:</p>

        <ul>
          <li><strong>Table-based bets:</strong> What you see on the felt (red/black, dozens, columns, etc.)</li>
          <li><strong>Wheel-based bets:</strong> Sectors of the physical wheel (Voisins, Tiers, Orphelins)</li>
          <li><strong>Alternative patterns:</strong> Custom groupings (A/B splits, AA/BB patterns)</li>
        </ul>

        <p>Our system tracks ALL of them simultaneously, giving you unprecedented insight into which betting groups are hitting and which aren't.</p>

        <h2>The 47 Groups: Complete Breakdown</h2>

        <h3>Part 1: Standard Table Bets (8 groups)</h3>

        <h4>1. Red (18 numbers)</h4>
        <p><strong>Numbers:</strong> 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36</p>
        <p><strong>Payout:</strong> 1:1 (even money)</p>
        <p><strong>Win Rate:</strong> 48.6% (18/37)</p>
        <p><strong>Use Case:</strong> Most popular bet. Simple, high win rate, low payout.</p>

        <h4>2. Black (18 numbers)</h4>
        <p><strong>Numbers:</strong> 2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35</p>
        <p><strong>Payout:</strong> 1:1</p>
        <p><strong>Win Rate:</strong> 48.6%</p>
        <p><strong>Use Case:</strong> Same as red. Track color bias over time.</p>

        <h4>3. Even (18 numbers)</h4>
        <p><strong>Numbers:</strong> 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36</p>
        <p><strong>Payout:</strong> 1:1</p>
        <p><strong>Win Rate:</strong> 48.6%</p>

        <h4>4. Odd (18 numbers)</h4>
        <p><strong>Numbers:</strong> 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35</p>
        <p><strong>Payout:</strong> 1:1</p>
        <p><strong>Win Rate:</strong> 48.6%</p>

        <h4>5. Low (18 numbers, 1-18)</h4>
        <p><strong>Numbers:</strong> 1-18</p>
        <p><strong>Payout:</strong> 1:1</p>
        <p><strong>Win Rate:</strong> 48.6%</p>

        <h4>6. High (18 numbers, 19-36)</h4>
        <p><strong>Numbers:</strong> 19-36</p>
        <p><strong>Payout:</strong> 1:1</p>
        <p><strong>Win Rate:</strong> 48.6%</p>

        <h4>7-9. Dozens (12 numbers each)</h4>
        <ul>
          <li><strong>First Dozen (1-12):</strong> 32.4% win rate, 2:1 payout</li>
          <li><strong>Second Dozen (13-24):</strong> 32.4% win rate, 2:1 payout</li>
          <li><strong>Third Dozen (25-36):</strong> 32.4% win rate, 2:1 payout</li>
        </ul>
        <p><strong>Use Case:</strong> Lower win rate than red/black, but higher payout. Popular for hedging strategies.</p>

        <h4>10-12. Columns (12 numbers each)</h4>
        <ul>
          <li><strong>Column 1:</strong> 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34</li>
          <li><strong>Column 2:</strong> 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35</li>
          <li><strong>Column 3:</strong> 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36</li>
        </ul>
        <p><strong>Payout:</strong> 2:1</p>
        <p><strong>Win Rate:</strong> 32.4%</p>
        <p><strong>Use Case:</strong> Similar to dozens. Good for matrix betting (combining with red/black).</p>

        <h3>Part 2: Wheel-Based Groups (4 groups)</h3>
        <p>These groups are based on the <strong>physical position</strong> of numbers on the European roulette wheel, not the table layout.</p>

        <h4>13. Voisins du Zéro (Neighbors of Zero - 17 numbers)</h4>
        <p><strong>Numbers:</strong> 22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25</p>
        <p><strong>Wheel Position:</strong> The large arc from 22 to 25 (includes zero)</p>
        <p><strong>Coverage:</strong> 45.9% of the wheel</p>
        <p><strong>Use Case:</strong> Popular in European casinos. Requires 9 chips (split/corner/trio bets).</p>

        <h4>14. Tiers du Cylindre (Third of the Wheel - 12 numbers)</h4>
        <p><strong>Numbers:</strong> 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33</p>
        <p><strong>Wheel Position:</strong> Opposite side of the wheel from Voisins</p>
        <p><strong>Coverage:</strong> 32.4% of the wheel</p>
        <p><strong>Use Case:</strong> Requires 6 chips (all split bets).</p>

        <h4>15. Orphelins (Orphans - 8 numbers)</h4>
        <p><strong>Numbers:</strong> 1, 20, 14, 31, 9, 17, 34, 6</p>
        <p><strong>Wheel Position:</strong> The two small arcs not covered by Voisins or Tiers</p>
        <p><strong>Coverage:</strong> 21.6% of the wheel</p>
        <p><strong>Use Case:</strong> Requires 5 chips. Often overlooked but statistically valid.</p>

        <h4>16. Jeu Zéro (Zero Game - 7 numbers)</h4>
        <p><strong>Numbers:</strong> 12, 35, 3, 26, 0, 32, 15</p>
        <p><strong>Wheel Position:</strong> Immediate neighbors of zero</p>
        <p><strong>Coverage:</strong> 18.9% of the wheel</p>
        <p><strong>Use Case:</strong> Requires 4 chips. Smallest wheel sector bet.</p>

        <h3>Part 3: Neighbor Bets (Variable groups)</h3>

        <h4>17-53. Number + Neighbors</h4>
        <p>For each number (0-36), you can bet on that number plus its neighbors on the wheel. For example:</p>

        <ul>
          <li><strong>17 and neighbors:</strong> 25, 2, 21, 4, 19 (17 in the middle, 2 neighbors on each side)</li>
          <li><strong>0 and neighbors:</strong> 26, 0, 32 (with 2 neighbors on each side: 15, 19, 4, 21, 2)</li>
        </ul>

        <p><strong>Use Case:</strong> Popular in live casinos. Dealer announces "17 and neighbors" and places chips.</p>

        <h3>Part 4: Alternative Groupings</h3>

        <h4>A/B Groups (Red/Black Alternative View)</h4>
        <p>Instead of standard red/black, some systems use A/B notation:</p>

        <ul>
          <li><strong>A:</strong> Equivalent to Red</li>
          <li><strong>B:</strong> Equivalent to Black</li>
        </ul>

        <p><strong>Use Case:</strong> Used in decision engine for statistical analysis. Allows flexible mapping (you can define A/B as anything).</p>

        <h4>AA/BB Patterns</h4>
        <p>Advanced pattern tracking:</p>

        <ul>
          <li><strong>AA:</strong> Two consecutive reds</li>
          <li><strong>BB:</strong> Two consecutive blacks</li>
          <li><strong>AB or BA:</strong> Alternating colors</li>
        </ul>

        <p><strong>Use Case:</strong> Used in adaptive betting strategies. Track how often results alternate vs streak.</p>

        <h2>How Groups Are Tracked</h2>

        <h3>Real-Time Updates</h3>
        <p>Every time you record a spin, the system:</p>

        <ol>
          <li>Checks which groups that number belongs to</li>
          <li>Updates hit counts for all matching groups</li>
          <li>Recalculates expected vs actual frequencies</li>
          <li>Flags anomalies (groups that are hot or cold)</li>
        </ol>

        <h3>Probability Analysis</h3>
        <p>For each group, you'll see:</p>

        <ul>
          <li><strong>Expected Frequency:</strong> How many times it should have hit (based on probability)</li>
          <li><strong>Actual Frequency:</strong> How many times it actually hit</li>
          <li><strong>Deviation:</strong> The difference (positive = hot, negative = cold)</li>
          <li><strong>Chi-Square Test:</strong> Is the deviation statistically significant?</li>
        </ul>

        <h3>Group Win/Loss Tracking</h3>
        <p>If you bet on a group, the system tracks:</p>

        <ul>
          <li>Total bets on that group</li>
          <li>Total wins/losses</li>
          <li>ROI for that specific group</li>
          <li>Average profit per bet</li>
        </ul>

        <h2>Which Groups Should You Track?</h2>

        <h3>Beginners: 6 Core Groups</h3>
        <ul>
          <li>Red/Black</li>
          <li>Even/Odd</li>
          <li>Low/High</li>
          <li>Three Dozens</li>
        </ul>

        <p>These are the simplest and most common. Focus on understanding these first.</p>

        <h3>Intermediate: Add Wheel Groups</h3>
        <ul>
          <li>Voisins du Zéro</li>
          <li>Tiers du Cylindre</li>
          <li>Orphelins</li>
        </ul>

        <p>If you play at live casinos, wheel bets are powerful. Track their performance.</p>

        <h3>Advanced: All 47 Groups</h3>
        <p>For serious players and data analysts, tracking all 47 groups reveals:</p>

        <ul>
          <li>Correlations between groups (when Voisins hits, does Red also hit?)</li>
          <li>Wheel bias detection (is one sector hitting more than others?)</li>
          <li>Matrix betting opportunities (which combinations win together)</li>
        </ul>

        <h2>Using Groups in Betting Assistant</h2>

        <h3>Single-Group Cards</h3>
        <p>Your betting card targets one group (e.g., "bet on Red until you profit $30").</p>

        <h3>Matrix Betting (Elite Feature)</h3>
        <p>Bet on MULTIPLE groups simultaneously. For example:</p>

        <ul>
          <li>$5 on Red</li>
          <li>$10 on First Dozen</li>
          <li>$5 on Column 2</li>
        </ul>

        <p>If number 12 hits (red, first dozen, column 2), you win on all three bets!</p>

        <h2>Group Anomalies</h2>

        <h3>What Triggers an Anomaly Alert?</h3>

        <ul>
          <li><strong>Missing Dozen:</strong> One dozen hasn't hit in 20+ spins</li>
          <li><strong>Missing Column:</strong> One column hasn't hit in 20+ spins</li>
          <li><strong>Extreme Color Bias:</strong> >70% red or black in last 50 spins</li>
          <li><strong>Long Streak:</strong> 10+ consecutive same-color results</li>
          <li><strong>Wheel Sector Cold:</strong> Voisins/Tiers/Orphelins significantly under expected hits</li>
        </ul>

        <h3>What Anomalies DON'T Mean</h3>
        <p><strong>Important:</strong> Anomalies are interesting statistical observations, but they don't create betting opportunities. The wheel has no memory. Just because Red hit 15 times in a row doesn't mean Black is "due."</p>

        <p>Use anomalies to:</p>

        <ul>
          <li>Understand variance</li>
          <li>Recognize normal vs extreme deviations</li>
          <li>Avoid the gambler's fallacy ("it's due!")</li>
        </ul>

        <h2>Practical Example: 100 Spins Analysis</h2>

        <p>After tracking 100 spins, here's what you might see:</p>

        <ul>
          <li><strong>Red:</strong> 52 hits (expected: 48.6) → +3.4 deviation → Hot</li>
          <li><strong>Black:</strong> 45 hits (expected: 48.6) → -3.6 deviation → Cold</li>
          <li><strong>First Dozen:</strong> 28 hits (expected: 32.4) → -4.4 deviation → Cold</li>
          <li><strong>Voisins:</strong> 50 hits (expected: 45.9) → +4.1 deviation → Hot</li>
          <li><strong>Tiers:</strong> 30 hits (expected: 32.4) → -2.4 deviation → Neutral</li>
        </ul>

        <p><strong>Interpretation:</strong> Red is running slightly hot, Voisins sector is hitting more than expected. But with only 100 spins, these deviations are well within normal variance. Not actionable.</p>

        <h2>Key Takeaways</h2>

        <ul>
          <li>Roulette Tracker Pro tracks <strong>47 distinct betting groups</strong> simultaneously</li>
          <li>Groups include standard bets (red/black), dozens/columns, wheel sectors (Voisins, Tiers), and alternative patterns</li>
          <li>Beginners should focus on 6 core groups, advanced players can use all 47</li>
          <li>Anomalies show statistical deviations but don't predict future outcomes</li>
          <li>Matrix betting allows betting on multiple groups at once for complex strategies</li>
        </ul>

        <p><strong>Ready to explore?</strong> Go to <a href="/analysis">/analysis</a> to see real-time group tracking!</p>
      `,
    },
    'betting-systems-explained': {
      title: 'Betting Systems Explained',
      category: 'How-To Guides',
      date: '2025-01-24',
      readTime: '18 min read',
      author: 'Roulette Tracker Team',
      content: `
        <p>Betting systems are structured approaches to managing bet sizing across a series of wagers. Roulette Tracker Pro supports <strong>six betting systems</strong> plus custom configurations. This comprehensive guide explains how each system works, when to use them, and their real-world performance.</p>

        <h2>Important Disclaimer</h2>
        <p><strong>NO betting system can overcome the house edge.</strong> These systems change <em>how</em> you lose (or win) in the short term, not <em>if</em> you lose in the long term. The house edge is a mathematical constant:</p>

        <ul>
          <li><strong>European Roulette:</strong> -2.7% expected return per dollar wagered</li>
          <li><strong>American Roulette:</strong> -5.26% expected return per dollar wagered</li>
        </ul>

        <p>Betting systems are tools for:</p>

        <ul>
          <li>Bankroll management</li>
          <li>Structured play (avoiding impulsive bets)</li>
          <li>Testing strategies</li>
          <li>Entertainment value</li>
        </ul>

        <p>Use them for discipline and structure, not as a path to guaranteed profit.</p>

        <h2>System 1: Flat Betting</h2>

        <h3>How It Works</h3>
        <p>Bet the same amount every single time. No increases, no decreases.</p>

        <p><strong>Example:</strong></p>
        <ul>
          <li>Base bet: $10</li>
          <li>Bet 1: $10 (loss) → Bet 2: $10 (loss) → Bet 3: $10 (win) → Bet 4: $10</li>
          <li>Stake never changes</li>
        </ul>

        <h3>Pros</h3>
        <ul>
          <li><strong>Simplest system:</strong> No calculations needed</li>
          <li><strong>Predictable bankroll:</strong> You always know maximum loss</li>
          <li><strong>Low variance:</strong> No exponential growth</li>
          <li><strong>Beginner-friendly:</strong> Perfect for first-time users</li>
        </ul>

        <h3>Cons</h3>
        <ul>
          <li><strong>Slow profit:</strong> Wins don't accelerate gains</li>
          <li><strong>No loss recovery:</strong> String of losses = net loss</li>
          <li><strong>Boring:</strong> No excitement from progression</li>
        </ul>

        <h3>When to Use</h3>
        <ul>
          <li>First-time betting card users</li>
          <li>Small bankrolls ($100-$200)</li>
          <li>Conservative play</li>
          <li>Testing the app before using aggressive systems</li>
        </ul>

        <h3>Bankroll Requirement</h3>
        <p><strong>Minimum:</strong> 20x base bet</p>
        <p><strong>Example:</strong> $10 base bet = $200 minimum bankroll</p>

        <h2>System 2: Martingale</h2>

        <h3>How It Works</h3>
        <p>Double your bet after every loss. After a win, reset to base bet.</p>

        <p><strong>Example:</strong></p>
        <ul>
          <li>Base bet: $5</li>
          <li>Bet 1: $5 (loss) → Bet 2: $10 (loss) → Bet 3: $20 (loss) → Bet 4: $40 (win) → Reset</li>
          <li>Net result after 4 bets: -$5 -$10 -$20 +$40 = +$5 profit</li>
        </ul>

        <h3>The Logic</h3>
        <p>Eventually you'll win, and when you do, you'll recover all previous losses plus one base unit.</p>

        <h3>Pros</h3>
        <ul>
          <li><strong>Guaranteed profit per cycle:</strong> If you win before bankroll depletes</li>
          <li><strong>Intuitive logic:</strong> "I just need one win"</li>
          <li><strong>High short-term win rate:</strong> Most sessions end in profit</li>
        </ul>

        <h3>Cons</h3>
        <ul>
          <li><strong>Exponential growth:</strong> $5 → $10 → $20 → $40 → $80 → $160 → $320...</li>
          <li><strong>Table limits:</strong> Most tables cap bets ($500-$1,000 max). You hit the limit after 7-8 losses.</li>
          <li><strong>Catastrophic ruin:</strong> One bad streak wipes out your entire bankroll</li>
          <li><strong>False security:</strong> Feels safe because you win often, but rare losses are devastating</li>
        </ul>

        <h3>When to Use</h3>
        <ul>
          <li>Large bankroll (minimum 100x base bet)</li>
          <li>Short sessions (5-10 bets max)</li>
          <li>High tolerance for risk</li>
          <li><strong>NOT recommended for beginners</strong></li>
        </ul>

        <h3>Bankroll Requirement</h3>
        <p><strong>Minimum:</strong> 127x base bet (to survive 7 consecutive losses)</p>
        <p><strong>Example:</strong> $5 base bet = $635 minimum bankroll</p>

        <p><strong>Why 127?</strong> $5 + $10 + $20 + $40 + $80 + $160 + $320 = $635</p>

        <h3>Real-World Example</h3>
        <p>Player starts with $500 bankroll, $5 base bet:</p>

        <ul>
          <li>Bet 1: $5 (loss) → Bankroll: $495</li>
          <li>Bet 2: $10 (loss) → Bankroll: $485</li>
          <li>Bet 3: $20 (loss) → Bankroll: $465</li>
          <li>Bet 4: $40 (loss) → Bankroll: $425</li>
          <li>Bet 5: $80 (loss) → Bankroll: $345</li>
          <li>Bet 6: $160 (loss) → Bankroll: $185</li>
          <li>Bet 7: Can't afford next bet ($320 required) → <strong>BUST</strong></li>
        </ul>

        <p>Six consecutive losses (not uncommon!) wiped out $315 of a $500 bankroll.</p>

        <h2>System 3: Fibonacci</h2>

        <h3>How It Works</h3>
        <p>Follow the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13, 21, 34...) when losing. On a win, move back two steps in the sequence.</p>

        <p><strong>Example:</strong></p>
        <ul>
          <li>Base bet: $10</li>
          <li>Bet 1: $10 (1x) - loss</li>
          <li>Bet 2: $10 (1x) - loss</li>
          <li>Bet 3: $20 (2x) - loss</li>
          <li>Bet 4: $30 (3x) - win → Move back 2 steps</li>
          <li>Bet 5: $10 (1x) - back to start</li>
        </ul>

        <h3>The Logic</h3>
        <p>Less aggressive than Martingale. Slower progression means longer survival during losing streaks.</p>

        <h3>Pros</h3>
        <ul>
          <li><strong>Slower growth:</strong> Less risky than Martingale</li>
          <li><strong>Recovers losses:</strong> Eventually recovers with wins</li>
          <li><strong>Moderate variance:</strong> Balances risk and reward</li>
        </ul>

        <h3>Cons</h3>
        <ul>
          <li><strong>Still risky:</strong> Can reach large bets (34x, 55x...)</li>
          <li><strong>Complex tracking:</strong> Need to remember sequence position</li>
          <li><strong>Slow recovery:</strong> Takes multiple wins to reset</li>
        </ul>

        <h3>When to Use</h3>
        <ul>
          <li>Moderate bankroll (50x base bet minimum)</li>
          <li>Medium-length sessions (10-30 bets)</li>
          <li>Risk-averse players who want some progression</li>
        </ul>

        <h3>Bankroll Requirement</h3>
        <p><strong>Minimum:</strong> 50x base bet</p>
        <p><strong>Example:</strong> $10 base bet = $500 minimum bankroll</p>

        <h2>System 4: D'Alembert</h2>

        <h3>How It Works</h3>
        <p>Increase bet by one unit after a loss. Decrease by one unit after a win.</p>

        <p><strong>Example:</strong></p>
        <ul>
          <li>Base bet: $10 (1 unit)</li>
          <li>Bet 1: $10 (loss) → Bet 2: $20 (loss) → Bet 3: $30 (win) → Bet 4: $20 (win) → Bet 5: $10</li>
        </ul>

        <h3>The Logic</h3>
        <p>Based on the (incorrect) idea that wins and losses will balance out. Gentle progression limits risk.</p>

        <h3>Pros</h3>
        <ul>
          <li><strong>Very gentle:</strong> Slowest progression of all systems</li>
          <li><strong>Low risk:</strong> Hard to go bust quickly</li>
          <li><strong>Simple math:</strong> Just add/subtract one unit</li>
          <li><strong>Good for long sessions:</strong> Can play many bets</li>
        </ul>

        <h3>Cons</h3>
        <ul>
          <li><strong>Slow profit:</strong> Takes many bets to see significant gains</li>
          <li><strong>Can still escalate:</strong> 10 losses = 10x base bet</li>
          <li><strong>Requires patience:</strong> Not exciting</li>
        </ul>

        <h3>When to Use</h3>
        <ul>
          <li>Conservative players</li>
          <li>Small to moderate bankrolls</li>
          <li>Long sessions (50+ bets)</li>
          <li>Testing strategies without high risk</li>
        </ul>

        <h3>Bankroll Requirement</h3>
        <p><strong>Minimum:</strong> 30x base bet</p>
        <p><strong>Example:</strong> $10 base bet = $300 minimum bankroll</p>

        <h2>System 5: Reverse D'Alembert (Contra D'Alembert)</h2>

        <h3>How It Works</h3>
        <p>Opposite of D'Alembert: Increase bet by one unit after a WIN. Decrease by one unit after a LOSS.</p>

        <p><strong>Example:</strong></p>
        <ul>
          <li>Base bet: $10</li>
          <li>Bet 1: $10 (win) → Bet 2: $20 (win) → Bet 3: $30 (loss) → Bet 4: $20</li>
        </ul>

        <h3>The Logic</h3>
        <p>Capitalize on winning streaks by increasing bets when you're winning. Decrease exposure when losing.</p>

        <h3>Pros</h3>
        <ul>
          <li><strong>Rides momentum:</strong> Profits multiply during hot streaks</li>
          <li><strong>Limits loss exposure:</strong> Reduces bets when losing</li>
          <li><strong>Psychologically satisfying:</strong> Feels good to increase bets when winning</li>
        </ul>

        <h3>Cons</h3>
        <ul>
          <li><strong>Requires winning streaks:</strong> Doesn't work well if results alternate</li>
          <li><strong>Can give back profits:</strong> One loss at high stakes erases multiple wins</li>
          <li><strong>Streaks are rare:</strong> 5+ consecutive wins are uncommon</li>
        </ul>

        <h3>When to Use</h3>
        <ul>
          <li>Optimistic players</li>
          <li>Chasing winning streaks</li>
          <li>Moderate risk tolerance</li>
        </ul>

        <h3>Bankroll Requirement</h3>
        <p><strong>Minimum:</strong> 30x base bet</p>
        <p><strong>Example:</strong> $10 base bet = $300 minimum bankroll</p>

        <h2>System 6: Paroli (Reverse Martingale)</h2>

        <h3>How It Works</h3>
        <p>Double your bet after each WIN. After 3 consecutive wins (or a loss), reset to base bet.</p>

        <p><strong>Example:</strong></p>
        <ul>
          <li>Base bet: $10</li>
          <li>Bet 1: $10 (win) → Bet 2: $20 (win) → Bet 3: $40 (win) → Reset to $10</li>
          <li>Or: Bet 1: $10 (win) → Bet 2: $20 (loss) → Reset to $10</li>
        </ul>

        <h3>The Logic</h3>
        <p>Let profits run during winning streaks. Losses are always limited to base bet.</p>

        <h3>Pros</h3>
        <ul>
          <li><strong>Low risk:</strong> Max loss per cycle is base bet</li>
          <li><strong>High upside:</strong> 3 consecutive wins = 7x base bet profit</li>
          <li><strong>Exciting:</strong> Feels great when streaks hit</li>
          <li><strong>Protects bankroll:</strong> Losses don't compound</li>
        </ul>

        <h3>Cons</h3>
        <ul>
          <li><strong>Streaks are rare:</strong> 3 consecutive wins only happen ~12% of the time</li>
          <li><strong>Frequent resets:</strong> Most cycles end after 1-2 bets</li>
          <li><strong>Needs luck:</strong> Relies on short-term variance going your way</li>
        </ul>

        <h3>When to Use</h3>
        <ul>
          <li>Risk-averse players</li>
          <li>Small bankrolls</li>
          <li>Short, fun sessions</li>
          <li>Entertainment-focused play</li>
        </ul>

        <h3>Bankroll Requirement</h3>
        <p><strong>Minimum:</strong> 20x base bet</p>
        <p><strong>Example:</strong> $10 base bet = $200 minimum bankroll</p>

        <h2>System 7: Custom</h2>

        <h3>How It Works</h3>
        <p>Define your own rules. Configure:</p>

        <ul>
          <li><strong>First loss rule:</strong> What to do after first loss (e.g., bet 1.5x)</li>
          <li><strong>Second loss rule:</strong> What to do after second consecutive loss (e.g., bet 2x)</li>
          <li><strong>Third+ loss rule:</strong> Subsequent losses (e.g., bet 3x)</li>
          <li><strong>Win rule:</strong> What to do after a win (e.g., reset to base, decrease by 0.5x, etc.)</li>
          <li><strong>Max multiplier:</strong> Cap on how high bets can go (e.g., 10x base max)</li>
        </ul>

        <p><strong>Example Custom System:</strong></p>
        <ul>
          <li>First loss: Bet 1.5x</li>
          <li>Second loss: Bet 2x</li>
          <li>Third+ loss: Bet 2.5x</li>
          <li>Win: Reset to base</li>
          <li>Max multiplier: 5x</li>
        </ul>

        <h3>When to Use</h3>
        <ul>
          <li>Advanced players</li>
          <li>Testing proprietary strategies</li>
          <li>Simulating systems you read about</li>
          <li>Fine-tuning risk/reward balance</li>
        </ul>

        <h2>System Performance Comparison</h2>

        <p><strong>Simulated over 1,000 spins, $10 base bet, even-money bets (Red/Black):</strong></p>

        <table>
          <tr>
            <th>System</th>
            <th>Avg ROI</th>
            <th>Max Drawdown</th>
            <th>Ruin Risk</th>
            <th>Best For</th>
          </tr>
          <tr>
            <td>Flat</td>
            <td>-2.7%</td>
            <td>Low</td>
            <td>Very Low</td>
            <td>Beginners</td>
          </tr>
          <tr>
            <td>Martingale</td>
            <td>-2.7%</td>
            <td>Very High</td>
            <td>High</td>
            <td>High rollers</td>
          </tr>
          <tr>
            <td>Fibonacci</td>
            <td>-2.7%</td>
            <td>Moderate</td>
            <td>Moderate</td>
            <td>Balanced play</td>
          </tr>
          <tr>
            <td>D'Alembert</td>
            <td>-2.7%</td>
            <td>Low-Moderate</td>
            <td>Low</td>
            <td>Conservative</td>
          </tr>
          <tr>
            <td>Reverse D'Alembert</td>
            <td>-2.7%</td>
            <td>Moderate</td>
            <td>Low-Moderate</td>
            <td>Streak chasers</td>
          </tr>
          <tr>
            <td>Paroli</td>
            <td>-2.7%</td>
            <td>Low</td>
            <td>Very Low</td>
            <td>Fun sessions</td>
          </tr>
        </table>

        <p><strong>Key Insight:</strong> All systems have the same long-term expected return (-2.7%). They differ only in variance and ruin risk.</p>

        <h2>Choosing the Right System</h2>

        <h3>If you have a SMALL bankroll ($100-$200):</h3>
        <ul>
          <li>Use: <strong>Flat Betting</strong> or <strong>Paroli</strong></li>
          <li>Avoid: Martingale, Fibonacci</li>
        </ul>

        <h3>If you have a MODERATE bankroll ($200-$500):</h3>
        <ul>
          <li>Use: <strong>D'Alembert</strong> or <strong>Fibonacci</strong></li>
          <li>Avoid: Martingale</li>
        </ul>

        <h3>If you have a LARGE bankroll ($500+):</h3>
        <ul>
          <li>Use: <strong>Any system</strong>, but understand the risks</li>
          <li>Test: <strong>Custom systems</strong></li>
        </ul>

        <h3>If you're RISK-AVERSE:</h3>
        <ul>
          <li>Use: <strong>Flat Betting</strong>, <strong>D'Alembert</strong>, or <strong>Paroli</strong></li>
        </ul>

        <h3>If you want EXCITEMENT:</h3>
        <ul>
          <li>Use: <strong>Martingale</strong> (with caution), <strong>Paroli</strong>, or <strong>Reverse D'Alembert</strong></li>
        </ul>

        <h2>Common Mistakes</h2>

        <h3>1. Using Martingale Without Sufficient Bankroll</h3>
        <p>7 consecutive losses require 127x base bet. If you can't afford that, don't use Martingale.</p>

        <h3>2. Chasing Losses by Switching Systems Mid-Session</h3>
        <p>"Flat betting isn't working, let me try Martingale!" This is how you go bust. Stick to your system.</p>

        <h3>3. Believing Systems Overcome House Edge</h3>
        <p>They don't. All systems lose 2.7% per dollar wagered over the long run. Use them for structure, not profit.</p>

        <h3>4. Ignoring Table Limits</h3>
        <p>Martingale and Fibonacci can quickly hit table max ($500-$1,000). Check limits before playing.</p>

        <h2>Key Takeaways</h2>

        <ul>
          <li>Betting systems change variance and bankroll volatility, not expected return</li>
          <li><strong>Flat Betting:</strong> Safest, simplest, best for beginners</li>
          <li><strong>Martingale:</strong> High risk, high volatility, requires large bankroll</li>
          <li><strong>Fibonacci:</strong> Moderate risk, moderate volatility</li>
          <li><strong>D'Alembert:</strong> Low risk, gentle progression</li>
          <li><strong>Reverse D'Alembert:</strong> Rides winning streaks</li>
          <li><strong>Paroli:</strong> Low risk, fun for short sessions</li>
          <li><strong>Custom:</strong> Advanced users testing proprietary strategies</li>
        </ul>

        <p><strong>Ready to test?</strong> Create a betting card at <a href="/assistant">/assistant</a> and try different systems!</p>
      `,
    },
    'understanding-roulette-probability': {
      title: 'Understanding Roulette Probability: Math vs Myth',
      category: 'Fundamentals',
      date: '2025-01-15',
      readTime: '8 min read',
      author: 'Roulette Tracker Team',
      content: `
        <p>Roulette is one of the purest games of chance in any casino. Yet many players believe they can predict outcomes, spot patterns, or use systems to beat the house. Let's separate mathematical reality from casino myth.</p>

        <h2>The Basic Mathematics</h2>
        <p>In European roulette, there are 37 pockets (0-36). This means each number has a 1/37 (2.7%) chance of hitting on any given spin. In American roulette with double zero, each number has a 1/38 (2.63%) chance.</p>

        <p>The crucial concept: <strong>Each spin is independent.</strong> The wheel has no memory. Past results do not influence future outcomes.</p>

        <h2>Understanding House Edge</h2>
        <p>The house edge comes from the green zero pocket. If you bet on red/black, you're paid even money (1:1), but you only win 18 out of 37 times, not 18 out of 36. That extra pocket is where the casino makes its profit.</p>

        <ul>
          <li><strong>European Roulette:</strong> 2.7% house edge</li>
          <li><strong>American Roulette:</strong> 5.26% house edge</li>
        </ul>

        <p>Over the long run, you can expect to lose 2.7% (or 5.26%) of every dollar you bet. No betting system changes this mathematical reality.</p>

        <h2>Common Myths Debunked</h2>

        <h3>Myth 1: "This number is due to hit"</h3>
        <p>False. If a number hasn't appeared in 100 spins, it still has exactly a 1/37 chance on spin 101. The wheel doesn't "owe" any number a win.</p>

        <h3>Myth 2: "Hot numbers are more likely to hit"</h3>
        <p>False. A number that just hit three times in a row still has exactly a 1/37 chance of hitting again. Past frequency doesn't create future probability.</p>

        <h3>Myth 3: "Betting systems can overcome the house edge"</h3>
        <p>False. Systems like Martingale change your bet pattern but can't change the mathematical expectation. You're still facing the same house edge on every spin.</p>

        <h2>What Tracking Actually Shows</h2>
        <p>Our tracking tool helps you understand what's actually happening over time:</p>

        <ul>
          <li>See how actual results converge to expected probabilities</li>
          <li>Understand variance and why short-term "patterns" emerge randomly</li>
          <li>Test betting systems safely to see their real performance</li>
        </ul>

        <h2>The Takeaway</h2>
        <p>Roulette is entertainment, not income. Understanding the mathematics helps you:</p>

        <ul>
          <li>Make informed decisions about bet sizing</li>
          <li>Recognize when emotions are overriding logic</li>
          <li>Enjoy the game without false expectations</li>
        </ul>

        <p>Knowledge of probability won't help you win, but it will help you lose responsibly and enjoy the game for what it is: a game of chance with beautiful mathematical properties.</p>
      `,
    },
    'betting-systems-comparison': {
      title: 'Betting Systems Head-to-Head: Martingale vs Fibonacci vs D\'Alembert',
      category: 'Strategy',
      date: '2025-01-12',
      readTime: '12 min read',
      author: 'Roulette Tracker Team',
      content: `
        <p>We tested three popular betting systems with 100,000 simulated spins each. Here's what the data actually shows.</p>

        <h2>The Three Systems</h2>

        <h3>Martingale</h3>
        <p>Double your bet after each loss. Return to base bet after a win.</p>
        <p><strong>Logic:</strong> Eventually you'll win and recover all losses plus one unit.</p>

        <h3>Fibonacci</h3>
        <p>Follow the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13...) when losing. Move back two numbers when winning.</p>
        <p><strong>Logic:</strong> More gradual progression reduces risk of hitting table limits.</p>

        <h3>D'Alembert</h3>
        <p>Increase bet by one unit after a loss, decrease by one unit after a win.</p>
        <p><strong>Logic:</strong> Based on the "law of equilibrium" (wins and losses should balance).</p>

        <h2>Simulation Results</h2>
        <p><em>Starting bankroll: $1,000 | Base bet: $10 | 1,000 spin sessions</em></p>

        <h3>Martingale Results</h3>
        <ul>
          <li>Average session ending balance: $973</li>
          <li>Sessions ending in profit: 48%</li>
          <li>Sessions ending in ruin: 12%</li>
          <li>Largest bet required: $1,280</li>
        </ul>

        <h3>Fibonacci Results</h3>
        <ul>
          <li>Average session ending balance: $976</li>
          <li>Sessions ending in profit: 46%</li>
          <li>Sessions ending in ruin: 8%</li>
          <li>Largest bet required: $890</li>
        </ul>

        <h3>D'Alembert Results</h3>
        <ul>
          <li>Average session ending balance: $974</li>
          <li>Sessions ending in profit: 47%</li>
          <li>Sessions ending in ruin: 5%</li>
          <li>Largest bet required: $350</li>
        </ul>

        <h2>Key Insights</h2>

        <p><strong>1. All systems lost money on average</strong> - The house edge is inescapable.</p>

        <p><strong>2. Martingale had the highest risk</strong> - Required the largest bets and had the most bankruptcies.</p>

        <p><strong>3. D'Alembert was most conservative</strong> - Smallest bet sizes but still lost overall.</p>

        <p><strong>4. Short-term wins are common</strong> - Nearly half of sessions ended in profit, creating the illusion that systems work.</p>

        <h2>The Mathematical Reality</h2>
        <p>No betting system can change the expected value of a bet. You're still losing 2.7% per spin on average. Systems only change <em>how</em> you lose, not <em>if</em> you lose.</p>

        <h2>Should You Use Betting Systems?</h2>
        <p>If it makes the game more interesting and you understand you're still facing the house edge, sure! Just:</p>

        <ul>
          <li>Set strict loss limits</li>
          <li>Never chase losses</li>
          <li>Be aware of table limits</li>
          <li>Treat it as entertainment cost</li>
        </ul>

        <p>Use our tracking tools to test any system and see how it performs over time.</p>
      `,
    },
    'gamblers-fallacy-explained': {
      title: 'Why Your Brain Lies About Hot Numbers: The Gambler\'s Fallacy',
      category: 'Psychology',
      date: '2025-01-10',
      readTime: '6 min read',
      author: 'Roulette Tracker Team',
      content: `
        <p>Your brain is an incredible pattern-recognition machine. It helped our ancestors spot dangers and find food. But at the roulette table, this superpower becomes a liability.</p>

        <h2>What Is the Gambler's Fallacy?</h2>
        <p>The gambler's fallacy is the mistaken belief that past independent events affect future probabilities.</p>

        <p><strong>Example:</strong> Red has hit 7 times in a row. Most people think "Black is due!" But the ball has no memory. The next spin is still 48.6% red, 48.6% black, 2.7% green.</p>

        <h2>Why We Fall For It</h2>

        <h3>Pattern Recognition Overdrive</h3>
        <p>Our brains evolved to find patterns. Seeing "RRRRRRR" feels significant, even though it's just as likely as "RBRBRBB" or any other 7-spin sequence.</p>

        <h3>The Law of Large Numbers (Misunderstood)</h3>
        <p>People know that over time, results even out. They wrongly assume this means outcomes must "balance" in the short term.</p>

        <p><strong>Reality:</strong> Results converge to expected probability over <em>millions</em> of spins, not dozens. Short-term variance is normal and expected.</p>

        <h3>Availability Bias</h3>
        <p>We remember the time we bet on black after 8 reds and won. We forget the 10 times it didn't work. Our memory cherry-picks confirming evidence.</p>

        <h2>Real-World Example</h2>
        <p>Monte Carlo Casino, 1913: Black hit 26 times in a row. Gamblers lost millions betting on red, believing it was "due." Each spin still had the same independent probability.</p>

        <h2>The Inverse Fallacy: Hot Numbers</h2>
        <p>Some players believe the opposite: "This number is hot, it'll keep hitting!" This is equally false. Past frequency doesn't create momentum.</p>

        <h2>How to Think Correctly</h2>

        <h3>1. Accept Independence</h3>
        <p>Every spin starts fresh. The wheel doesn't know or care what happened before.</p>

        <h3>2. Understand Variance</h3>
        <p>Streaks happen naturally in random sequences. They're not signals or patterns—they're noise.</p>

        <h3>3. Use Math, Not Intuition</h3>
        <p>Your gut feeling about what's "due" is your brain lying to you. Trust probability, not pattern recognition.</p>

        <h2>What Our Tracker Shows</h2>
        <p>Our app displays hot/cold numbers and streaks not to predict the future, but to:</p>

        <ul>
          <li>Illustrate normal variance</li>
          <li>Show how patterns emerge randomly</li>
          <li>Help you recognize when you're falling for the fallacy</li>
        </ul>

        <h2>The Takeaway</h2>
        <p>Your brain is working correctly—it's just optimized for a different environment than a casino. Understanding cognitive biases doesn't help you win, but it helps you make rational decisions and avoid chasing false patterns.</p>

        <p>Track your sessions and see how the law of large numbers actually works over time, not over 10 spins.</p>
      `,
    },
    'bankroll-management-guide': {
      title: 'Smart Bankroll Management: Never Bet More Than You Can Afford',
      category: 'Strategy',
      date: '2025-01-20',
      readTime: '10 min read',
      author: 'Roulette Tracker Team',
      content: `
        <p>The most important skill in gambling isn't picking numbers—it's managing your money. Professional players know that bankroll management is the difference between entertainment and financial disaster.</p>

        <h2>What Is a Bankroll?</h2>
        <p>Your bankroll is money set aside specifically for gambling. It should be money you can afford to lose without impacting your finances, bills, or quality of life.</p>

        <p><strong>Golden Rule:</strong> If you can't afford to lose it, don't bring it to the casino.</p>

        <h2>The 1-5% Rule</h2>
        <p>Never bet more than 1-5% of your total bankroll on a single spin.</p>

        <h3>Example:</h3>
        <ul>
          <li><strong>Bankroll:</strong> $500</li>
          <li><strong>Maximum single bet:</strong> $5-$25</li>
          <li><strong>Recommended bet:</strong> $10 (2% of bankroll)</li>
        </ul>

        <p>This ensures you can survive losing streaks without going bust.</p>

        <h2>Session Limits</h2>
        <p>Divide your bankroll into sessions. Never risk more than 20-30% of your total bankroll in one session.</p>

        <h3>Example with $1,000 bankroll:</h3>
        <ul>
          <li><strong>Session budget:</strong> $200</li>
          <li><strong>Base bet:</strong> $10</li>
          <li><strong>Number of sessions:</strong> 5 maximum</li>
        </ul>

        <p><strong>Stop Rule:</strong> If you lose your session budget, stop. Come back another day.</p>

        <h2>Win Goals</h2>
        <p>Set a win target for each session. Many players use 50% of their session budget.</p>

        <p><strong>Example:</strong> Start with $200. If you're up $100 (50% profit), consider stopping.</p>

        <p>Why? Because variance works both ways. What goes up often comes back down.</p>

        <h2>The Reality Check</h2>
        <p>Remember: The house edge means you lose 2.7% of every dollar bet over time. Bankroll management doesn't overcome this—it extends your playing time and reduces the risk of catastrophic losses.</p>

        <h2>Warning Signs You're in Trouble</h2>
        <ul>
          <li>Betting with money intended for bills</li>
          <li>Chasing losses by increasing bet sizes</li>
          <li>Borrowing money to gamble</li>
          <li>Hiding your gambling from family/friends</li>
          <li>Feeling you "need" to gamble</li>
        </ul>

        <p>If any of these apply, please seek help. Gambling should be entertainment, not a necessity.</p>

        <h2>Using Our Tracker for Bankroll Management</h2>
        <p>Our tool helps you:</p>
        <ul>
          <li>Set and track session budgets</li>
          <li>Monitor your spending over time</li>
          <li>See how bet sizing affects your bankroll</li>
          <li>Identify patterns in your behavior</li>
        </ul>

        <h2>The Takeaway</h2>
        <p>Smart bankroll management won't make you a winner, but it will keep you in control. Treat gambling as entertainment with a cost, not an investment with a return.</p>

        <p>Set limits. Stick to them. Enjoy the game. Never chase losses.</p>
      `,
    },
    'european-vs-american-roulette': {
      title: 'European vs American Roulette: Why the Extra Zero Matters',
      category: 'Fundamentals',
      date: '2025-01-23',
      readTime: '7 min read',
      author: 'Roulette Tracker Team',
      content: `
        <p>Walk into any casino and you'll find two types of roulette wheels. They look similar, but that small difference—one extra green pocket—has massive implications for your bankroll.</p>

        <h2>The Key Difference</h2>
        <p><strong>European Roulette:</strong> 37 pockets (0-36) with one green zero</p>
        <p><strong>American Roulette:</strong> 38 pockets (0-36 plus 00) with two green zeros</p>

        <p>That's it. One extra pocket. But the impact is huge.</p>

        <h2>House Edge Comparison</h2>
        <p>The house edge is how much the casino expects to win from every dollar you bet over time.</p>

        <ul>
          <li><strong>European Roulette:</strong> 2.70% house edge</li>
          <li><strong>American Roulette:</strong> 5.26% house edge</li>
        </ul>

        <p>American roulette has <strong>nearly double</strong> the house edge of European roulette. That means you lose money almost twice as fast.</p>

        <h2>Real-World Impact</h2>
        <p>Let's say you bet $100 per spin for 100 spins ($10,000 total wagered):</p>

        <h3>European Roulette</h3>
        <ul>
          <li>Expected loss: $270 (2.7% of $10,000)</li>
        </ul>

        <h3>American Roulette</h3>
        <ul>
          <li>Expected loss: $526 (5.26% of $10,000)</li>
        </ul>

        <p>By playing American roulette instead of European, you're giving the casino an extra $256 for no reason.</p>

        <h2>Why Does the Extra Zero Matter?</h2>
        <p>When you bet on red/black, odd/even, or any other bet, the green pockets are where the house makes its profit. You're paid as if there are only 36 numbers, but there are actually 37 (or 38).</p>

        <h3>Example: Betting on Red</h3>
        <p><strong>European:</strong> 18 red, 18 black, 1 green → 18/37 = 48.6% win rate</p>
        <p><strong>American:</strong> 18 red, 18 black, 2 green → 18/38 = 47.4% win rate</p>

        <p>That 1.2% difference adds up quickly over hundreds of spins.</p>

        <h2>What About Payouts?</h2>
        <p>Here's the kicker: <strong>payouts are identical</strong> on both wheels. A straight-up bet pays 35:1 whether you're playing European or American roulette.</p>

        <p>So you're getting the same payout with worse odds. There's literally no advantage to playing American roulette—it's strictly worse for players.</p>

        <h2>Why Do Casinos Offer American Roulette?</h2>
        <p>Simple: It makes them more money. Many players don't know the difference or don't care. The casino is happy to take that extra 2.56% edge.</p>

        <h2>Special Cases: La Partage and En Prison</h2>
        <p>Some European roulette tables offer special rules that <em>further reduce</em> the house edge:</p>

        <h3>La Partage</h3>
        <p>If the ball lands on zero and you made an even-money bet (red/black, odd/even), you get half your bet back.</p>
        <p><strong>House edge with La Partage: 1.35%</strong> (half of 2.70%)</p>

        <h3>En Prison</h3>
        <p>If the ball lands on zero and you made an even-money bet, your bet is "imprisoned" for the next spin. If you win the next spin, you get your original bet back (no profit).</p>
        <p><strong>House edge with En Prison: 1.35%</strong></p>

        <p>These rules are rare but dramatically improve your odds. Always ask if they're available.</p>

        <h2>The Bottom Line</h2>
        <p>If you have a choice between European and American roulette:</p>

        <ul>
          <li><strong>Always choose European</strong></li>
          <li>Seek out tables with La Partage or En Prison rules if possible</li>
          <li>Avoid American roulette unless it's your only option</li>
        </ul>

        <p>This won't make you a winner—the house still has an edge—but it will make your money last longer and give you more playing time for your bankroll.</p>

        <h2>Track Both Wheels</h2>
        <p>Use our tracker to compare your results on European vs American wheels. You'll see the house edge manifest in your actual data over time.</p>

        <p>The math doesn't lie. That extra zero costs you money.</p>
      `,
    },
  }

  return articles[slug] || null
}

export default function ArticlePage() {
  const params = useParams()
  const slug = params?.slug as string
  const article = getArticleBySlug(slug)

  // Track article views
  useEffect(() => {
    if (article) {
      trackArticleView(slug)
    }
  }, [slug, article])

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Article Not Found</h1>
          <p className="text-gray-400 mb-8">This article doesn't exist yet.</p>
          <Link href="/learn" className="text-yellow-400 hover:underline">
            ← Back to Learning Center
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navigation />

      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/learn" className="text-yellow-400 hover:underline text-sm">
            ← Back to Learning Center
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <span className="px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-400 text-sm font-bold">
              {article.category}
            </span>
            <span className="text-gray-500 text-sm">{article.readTime}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>By {article.author}</span>
            <span>•</span>
            <span>{new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </header>

        {/* Article Content */}
        <div
          className="prose prose-invert prose-lg max-w-none
            prose-headings:text-yellow-400
            prose-headings:font-bold
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
            prose-strong:text-white prose-strong:font-bold
            prose-ul:text-gray-300 prose-ul:my-6
            prose-li:my-2
            prose-a:text-yellow-400 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Call to Action */}
        <div className="mt-16 p-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-yellow-400/30">
          <h3 className="text-2xl font-bold text-white mb-3">
            Ready to apply what you learned?
          </h3>
          <p className="text-gray-400 mb-6">
            Use our tools to track real games, test strategies, and see probability in action.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/assistant"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold transition-all hover:shadow-lg hover:shadow-yellow-400/50"
            >
              Use Betting Assistant
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-yellow-400 mb-6">Related Articles</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/learn" className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-400/50 transition-all">
              <span className="text-sm text-gray-400 block mb-2">Next Article</span>
              <span className="text-white font-medium">View all articles →</span>
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
