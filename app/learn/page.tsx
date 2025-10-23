'use client'

import Link from 'next/link'
import Navigation from '@/components/Navigation'

// This will eventually come from a CMS or markdown files
const articles = [
  {
    slug: 'understanding-roulette-probability',
    title: 'Understanding Roulette Probability: Math vs Myth',
    excerpt: 'Learn the real mathematics behind roulette and why the house always has an edge. We break down probability in simple terms.',
    category: 'Fundamentals',
    date: '2025-01-15',
    readTime: '8 min read',
    featured: true,
  },
  {
    slug: 'betting-systems-comparison',
    title: 'Betting Systems Head-to-Head: Martingale vs Fibonacci vs D\'Alembert',
    excerpt: 'We simulated 100,000 spins to test popular betting systems. See which strategies survive longest and why.',
    category: 'Strategy',
    date: '2025-01-12',
    readTime: '12 min read',
    featured: true,
  },
  {
    slug: 'gamblers-fallacy-explained',
    title: 'Why Your Brain Lies About Hot Numbers: The Gambler\'s Fallacy',
    excerpt: 'Discover why we see patterns that don\'t exist and how to think probabilistically instead of emotionally.',
    category: 'Psychology',
    date: '2025-01-10',
    readTime: '6 min read',
    featured: false,
  },
  {
    slug: 'bankroll-management-guide',
    title: 'Smart Bankroll Management: Never Bet More Than You Can Afford',
    excerpt: 'Learn professional bankroll management strategies to protect your funds and play responsibly. Essential reading for serious players.',
    category: 'Strategy',
    date: '2025-01-20',
    readTime: '10 min read',
    featured: false,
  },
  {
    slug: 'european-vs-american-roulette',
    title: 'European vs American Roulette: Why the Extra Zero Matters',
    excerpt: 'That second green pocket nearly doubles the house edge. Discover why you should always choose European roulette when possible.',
    category: 'Fundamentals',
    date: '2025-01-23',
    readTime: '7 min read',
    featured: true,
  },
]

export default function LearnPage() {
  const featuredArticles = articles.filter(a => a.featured)
  const recentArticles = articles

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navigation />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent mb-4">
            Learning Center
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Deep dives into roulette strategy, probability, psychology, and data analysis.
            Learn how to think like a statistician, not a gambler.
          </p>
        </div>

        {/* Categories */}
        <div className="flex gap-3 justify-center mb-12 flex-wrap">
          {['All', 'Fundamentals', 'Strategy', 'Psychology', 'Data Analysis'].map((cat) => (
            <button
              key={cat}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all border border-gray-700 hover:border-yellow-400/50"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
              <span>⭐</span> Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/learn/${article.slug}`}
                  className="group"
                >
                  <article className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-yellow-400/30 hover:border-yellow-400 transition-all hover:shadow-lg hover:shadow-yellow-400/20 h-full">
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-400 text-xs font-bold">
                        {article.category}
                      </span>
                      <span className="text-gray-500 text-sm">{article.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-400 mb-4 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="text-yellow-400 group-hover:translate-x-1 transition-transform">
                        Read more →
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Articles */}
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
            <span>📚</span> All Articles
          </h2>
          <div className="space-y-4">
            {recentArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/learn/${article.slug}`}
                className="group"
              >
                <article className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-yellow-400/50 transition-all hover:bg-gray-800">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-xs font-medium">
                          {article.category}
                        </span>
                        <span className="text-gray-500 text-sm">{article.readTime}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">
                        {article.excerpt}
                      </p>
                      <span className="text-gray-500 text-sm">
                        {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-yellow-400 group-hover:translate-x-1 transition-transform text-2xl">
                      →
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-r from-yellow-400/10 via-yellow-500/10 to-yellow-400/10 rounded-xl p-8 border border-yellow-400/30">
          <h3 className="text-2xl font-bold text-white mb-3">
            Ready to put theory into practice?
          </h3>
          <p className="text-gray-400 mb-6">
            Use our advanced tracking tools to analyze real games and test strategies.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/simulator"
              className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-all border border-gray-700"
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
      </div>
    </div>
  )
}
