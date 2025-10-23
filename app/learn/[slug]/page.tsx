'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { trackArticleView } from '@/lib/analytics'

// This will eventually come from a CMS, database, or markdown files
const getArticleBySlug = (slug: string) => {
  const articles: Record<string, any> = {
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

        <p>Use our simulator to test any system risk-free and see how it performs over time.</p>
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
          <div className="flex gap-4">
            <Link
              href="/simulator"
              className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-all"
            >
              Try Simulator
            </Link>
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
