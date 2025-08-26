'use client';

import { useState } from 'react';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { formatDate } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  category: 'investment' | 'market' | 'property' | 'technology' | 'community' | 'remittance';
  tags: string[];
  publishedAt: string;
  readTime: number;
  image: string;
  featured: boolean;
  views: number;
}

// Mock blog data
const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Rise of Tokenized Real Estate in Africa: A Complete Guide',
    excerpt: 'Discover how blockchain technology is revolutionizing real estate investment across Africa, making property ownership accessible to everyone.',
    content: 'Full article content here...',
    author: {
      name: 'Dr. Sarah Johnson',
      avatar: '/images/author-1.jpg',
      role: 'Real Estate Economist'
    },
    category: 'investment',
    tags: ['Tokenization', 'Blockchain', 'Africa', 'Real Estate'],
    publishedAt: '2024-03-15',
    readTime: 8,
    image: '/images/blog/tokenized-real-estate.jpg',
    featured: true,
    views: 1247
  },
  {
    id: '2',
    title: 'Top 5 Emerging Markets in African Real Estate for 2024',
    excerpt: 'Explore the most promising real estate markets across Africa, from Lagos to Nairobi, and understand what makes them attractive investment destinations.',
    content: 'Full article content here...',
    author: {
      name: 'Michael Chen',
      avatar: '/images/author-2.jpg',
      role: 'Market Analyst'
    },
    category: 'market',
    tags: ['Emerging Markets', 'Investment', 'Africa', '2024'],
    publishedAt: '2024-03-12',
    readTime: 6,
    image: '/images/blog/emerging-markets.jpg',
    featured: true,
    views: 892
  },
  {
    id: '3',
    title: 'How Diaspora Remittances Are Transforming African Property Markets',
    excerpt: 'Learn how African diaspora communities are using remittances to invest in real estate back home, creating new opportunities for property developers.',
    content: 'Full article content here...',
    author: {
      name: 'Aisha Okeowo',
      avatar: '/images/author-3.jpg',
      role: 'Remittance Specialist'
    },
    category: 'remittance',
    tags: ['Diaspora', 'Remittances', 'Investment', 'Africa'],
    publishedAt: '2024-03-10',
    readTime: 7,
    image: '/images/blog/diaspora-remittances.jpg',
    featured: false,
    views: 654
  },
  {
    id: '4',
    title: 'Community Investment Pools: The Future of African Real Estate',
    excerpt: 'Discover how community investment pools are democratizing real estate investment and creating wealth for local communities across Africa.',
    content: 'Full article content here...',
    author: {
      name: 'David Mwangi',
      avatar: '/images/author-4.jpg',
      role: 'Community Development Expert'
    },
    category: 'community',
    tags: ['Community', 'Investment Pools', 'Democratization', 'Wealth Creation'],
    publishedAt: '2024-03-08',
    readTime: 5,
    image: '/images/blog/community-pools.jpg',
    featured: false,
    views: 543
  },
  {
    id: '5',
    title: 'Agricultural Investment Opportunities in Sub-Saharan Africa',
    excerpt: 'Explore the untapped potential of agricultural real estate investments in Africa and how they\'re providing sustainable returns for investors.',
    content: 'Full article content here...',
    author: {
      name: 'Dr. Kwame Asante',
      avatar: '/images/author-5.jpg',
      role: 'Agricultural Economist'
    },
    category: 'property',
    tags: ['Agriculture', 'Sub-Saharan Africa', 'Sustainable Investment', 'Food Security'],
    publishedAt: '2024-03-05',
    readTime: 9,
    image: '/images/blog/agricultural-investment.jpg',
    featured: false,
    views: 432
  },
  {
    id: '6',
    title: 'The Impact of Technology on African Real Estate Development',
    excerpt: 'From smart cities to digital property management, discover how technology is reshaping the African real estate landscape.',
    content: 'Full article content here...',
    author: {
      name: 'Tech Expert',
      avatar: '/images/author-6.jpg',
      role: 'Technology Consultant'
    },
    category: 'technology',
    tags: ['Technology', 'Smart Cities', 'Digital Transformation', 'Innovation'],
    publishedAt: '2024-03-02',
    readTime: 6,
    image: '/images/blog/tech-impact.jpg',
    featured: false,
    views: 321
  }
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Posts', icon: '📰' },
    { id: 'investment', label: 'Investment', icon: '💰' },
    { id: 'market', label: 'Market Trends', icon: '📊' },
    { id: 'property', label: 'Property', icon: '🏠' },
    { id: 'technology', label: 'Technology', icon: '💻' },
    { id: 'community', label: 'Community', icon: '👥' },
    { id: 'remittance', label: 'Remittance', icon: '💱' }
  ];

  const filteredPosts = mockBlogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = mockBlogPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'investment':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'market':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'property':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'technology':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'community':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'remittance':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-black particles">
      {/* Navigation */}
      <nav className="fixed w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center animate-glow">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-white">Homebaise</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/properties" className="text-gray-300 hover:text-white">Properties</Link>
              <Link href="/portfolio" className="text-gray-300 hover:text-white">Portfolio</Link>
              <Link href="/analytics" className="text-gray-300 hover:text-white">Analytics</Link>
              <Link href="/blog" className="text-emerald-400 font-medium">Blog</Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">Homebaise Blog</h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Insights, trends, and expert analysis on African real estate investment, 
                tokenization, and the future of property ownership
              </p>
            </div>

            {/* Search and Filters */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <MagneticEffect>
                  <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                    Subscribe to Newsletter
                  </button>
                </MagneticEffect>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">Featured Articles</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {featuredPosts.map((post) => (
                    <MagneticEffect key={post.id}>
                      <Link href={`/blog/${post.id}`}>
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover-lift group">
                          <div className="h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                            <span className="text-4xl">📰</span>
                          </div>
                          <div className="p-6">
                            <div className="flex items-center space-x-2 mb-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getCategoryColor(post.category)}`}>
                                {post.category}
                              </span>
                              <span className="text-gray-400 text-sm">•</span>
                              <span className="text-gray-400 text-sm">{post.readTime} min read</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-gray-300 mb-4 line-clamp-3">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                                  <span className="text-sm">👤</span>
                                </div>
                                <div>
                                  <div className="text-white text-sm font-medium">{post.author.name}</div>
                                  <div className="text-gray-400 text-xs">{post.author.role}</div>
                                </div>
                              </div>
                              <div className="text-gray-400 text-sm">
                                {formatDate(post.publishedAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </MagneticEffect>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Posts */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {selectedCategory === 'all' ? 'All Articles' : `${categories.find(c => c.id === selectedCategory)?.label}`}
              </h2>
              
              {regularPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularPosts.map((post) => (
                    <MagneticEffect key={post.id}>
                      <Link href={`/blog/${post.id}`}>
                        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover-lift group">
                          <div className="h-40 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                            <span className="text-3xl">📰</span>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getCategoryColor(post.category)}`}>
                                {post.category}
                              </span>
                              <span className="text-gray-400 text-xs">•</span>
                              <span className="text-gray-400 text-xs">{post.readTime} min</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                                  <span className="text-xs">👤</span>
                                </div>
                                <span className="text-white text-xs">{post.author.name}</span>
                              </div>
                              <span className="text-gray-400 text-xs">
                                {formatDate(post.publishedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </MagneticEffect>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
                  <p className="text-gray-400">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </div>

            {/* Newsletter Signup */}
            <div className="mt-16 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Stay Updated</h3>
                <p className="text-gray-300 mb-6">
                  Get the latest insights on African real estate investment delivered to your inbox
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <MagneticEffect>
                    <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                      Subscribe
                    </button>
                  </MagneticEffect>
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 