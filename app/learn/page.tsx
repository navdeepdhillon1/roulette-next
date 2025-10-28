'use client'

import React from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

// This will eventually come from a CMS or markdown files
const articles = [
  // How-To Guides - Phase 1
  {
    slug: 'getting-started-basic-tracker',
    title: 'Getting Started with Basic Tracker',
    excerpt: 'Your first steps with Roulette Tracker Pro. Learn how to add spins, understand statistics, and track your sessions.',
    category: 'How-To Guides',
    date: '2025-01-24',
    readTime: '7 min read',
    featured: true,
  },
  {
    slug: 'your-first-betting-card',
    title: 'Your First Betting Card',
    excerpt: 'Step-by-step guide to creating and using betting cards. Learn how to set targets, follow suggestions, and improve discipline.',
    category: 'How-To Guides',
    date: '2025-01-24',
    readTime: '10 min read',
    featured: true,
  },
  {
    slug: 'understanding-47-groups',
    title: 'Understanding the 47 Betting Groups',
    excerpt: 'Complete breakdown of all 47 betting groups: table-based, wheel-based, and alternative patterns. Learn which groups to track.',
    category: 'How-To Guides',
    date: '2025-01-24',
    readTime: '15 min read',
    featured: true,
  },
  {
    slug: 'betting-systems-explained',
    title: 'Betting Systems Explained',
    excerpt: 'Deep dive into Flat, Martingale, Fibonacci, D\'Alembert, and Custom systems. Understand progression rules and risk management.',
    category: 'How-To Guides',
    date: '2025-01-24',
    readTime: '18 min read',
    featured: false,
  },
  // Existing Articles
  {
    slug: 'understanding-roulette-probability',
    title: 'Understanding Roulette Probability: Math vs Myth',
    excerpt: 'Learn the real mathematics behind roulette and why the house always has an edge. We break down probability in simple terms.',
    category: 'Fundamentals',
    date: '2025-01-15',
    readTime: '8 min read',
    featured: false,
  },
  {
    slug: 'betting-systems-comparison',
    title: 'Betting Systems Head-to-Head: Martingale vs Fibonacci vs D\'Alembert',
    excerpt: 'We simulated 100,000 spins to test popular betting systems. See which strategies survive longest and why.',
    category: 'Strategy',
    date: '2025-01-12',
    readTime: '12 min read',
    featured: false,
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
    featured: false,
  },
]

export default function LearnPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All')
  const [searchQuery, setSearchQuery] = React.useState<string>('')

  const featuredArticles = articles.filter(a => a.featured)

  // Filter by category first
  let filteredArticles = selectedCategory === 'All'
    ? articles
    : articles.filter(a => a.category === selectedCategory)

  // Then filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filteredArticles = filteredArticles.filter(a =>
      a.title.toLowerCase().includes(query) ||
      a.excerpt.toLowerCase().includes(query) ||
      a.category.toLowerCase().includes(query)
    )
  }

  const categories = ['All', 'How-To Guides', 'Fundamentals', 'Strategy', 'Psychology', 'Data Analysis']

  // Get article count for each category
  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return articles.length
    return articles.filter(a => a.category === cat).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navigation />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent mb-4">
            Learning Center
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Deep dives into roulette strategy, probability, psychology, and data analysis.
            Learn how to think like a statistician, not a gambler.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles by title, topic, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-3 pl-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-all"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-3 justify-center mb-12 flex-wrap">
          {categories.map((cat) => {
            const count = getCategoryCount(cat)
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat)
                  setSearchQuery('') // Clear search when switching categories
                }}
                className={`px-4 py-2 rounded-lg transition-all border flex items-center gap-2 ${
                  selectedCategory === cat
                    ? 'bg-yellow-400 text-black border-yellow-400 font-bold'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700 hover:border-yellow-400/50'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedCategory === cat
                    ? 'bg-black/20 text-black'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Featured Articles - Only show when not searching */}
        {!searchQuery && featuredArticles.length > 0 && (
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              <span>📚</span> {searchQuery ? 'Search Results' : (selectedCategory === 'All' ? 'All Articles' : `${selectedCategory} Articles`)}
            </h2>
            {(searchQuery || selectedCategory !== 'All') && (
              <span className="text-gray-400 text-sm">
                {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} found
              </span>
            )}
          </div>
          {filteredArticles.length > 0 ? (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
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
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">
                {searchQuery
                  ? `No articles found for "${searchQuery}"`
                  : `No articles found in this category yet.`
                }
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                }}
                className="text-yellow-400 hover:underline"
              >
                {searchQuery ? 'Clear search' : 'View all articles'}
              </button>
            </div>
          )}
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
