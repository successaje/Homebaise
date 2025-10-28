'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  category: string;
  tags: string[];
  publishedAt: string;
  readTime: string;
  image: string;
  featured: boolean;
  views: number;
  likes: number;
  comments: number;
}

// Mock blog posts data
const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Future of African Real Estate: Tokenization Revolution',
    excerpt: 'Discover how blockchain technology is transforming African real estate investment and creating new opportunities for global investors.',
    content: `
      <p class="mb-6 text-gray-300 leading-relaxed">
        Africa's real estate market is on the cusp of a revolutionary transformation. With the advent of blockchain technology and tokenization, 
        the barriers to entry for real estate investment are being dismantled, creating unprecedented opportunities for both local and international investors.
      </p>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">The Tokenization Revolution</h2>
      <p class="mb-6 text-gray-300 leading-relaxed">
        Tokenization is the process of converting real estate assets into digital tokens that can be traded on blockchain platforms. 
        This innovation is particularly significant for Africa, where traditional real estate investment has been limited by high capital requirements, 
        lack of transparency, and complex regulatory environments.
      </p>

      <p class="mb-6 text-gray-300 leading-relaxed">
        By breaking down large properties into smaller, tradeable tokens, investors can now participate in premium real estate markets 
        with investments as small as $10. This democratization of real estate investment is opening up new possibilities for wealth creation 
        across the continent.
      </p>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">Benefits for African Markets</h2>
      <p class="mb-6 text-gray-300 leading-relaxed">
        The benefits of real estate tokenization in Africa are manifold. First, it provides much-needed liquidity to a traditionally illiquid market. 
        Investors can now buy and sell their stakes in properties without the lengthy and expensive process of traditional real estate transactions.
      </p>

      <p class="mb-6 text-gray-300 leading-relaxed">
        Second, tokenization brings transparency to a market that has historically suffered from opacity. All transactions are recorded on the blockchain, 
        providing an immutable and transparent record of ownership and transfers. This transparency builds trust and attracts more investment.
      </p>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">Economic Impact</h2>
      <p class="mb-6 text-gray-300 leading-relaxed">
        The economic impact of real estate tokenization in Africa could be transformative. By making real estate investment more accessible, 
        we can unlock trillions of dollars in trapped capital and create new opportunities for economic growth.
      </p>

      <p class="mb-6 text-gray-300 leading-relaxed">
        Local communities benefit from increased investment in their areas, leading to improved infrastructure, job creation, and economic development. 
        International investors gain access to high-growth markets with strong demographic trends and urbanization rates.
      </p>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">Challenges and Solutions</h2>
      <p class="mb-6 text-gray-300 leading-relaxed">
        Despite the immense potential, there are challenges to overcome. Regulatory frameworks need to be developed to govern tokenized real estate, 
        and infrastructure must be built to support these new investment vehicles.
      </p>

      <p class="mb-6 text-gray-300 leading-relaxed">
        However, these challenges are not insurmountable. With the right approach and collaboration between governments, regulators, and industry participants, 
        Africa can become a global leader in real estate tokenization.
      </p>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">Looking Ahead</h2>
      <p class="mb-6 text-gray-300 leading-relaxed">
        The future of African real estate is bright. As tokenization becomes more widespread, we can expect to see increased investment flows, 
        improved market efficiency, and greater economic prosperity across the continent.
      </p>

      <p class="mb-6 text-gray-300 leading-relaxed">
        The revolution has begun, and Africa is positioned to be at the forefront of this transformation. 
        The opportunities are limitless for those who are ready to embrace this new paradigm of real estate investment.
      </p>
    `,
    author: {
      name: 'Dr. Sarah Johnson',
      avatar: '/images/authors/sarah-johnson.jpg',
      role: 'Real Estate Economist'
    },
    category: 'Market Analysis',
    tags: ['Tokenization', 'Blockchain', 'Real Estate', 'Africa', 'Investment'],
    publishedAt: '2024-01-15',
    readTime: '8 min read',
    image: '/images/blog/african-real-estate-tokenization.jpg',
    featured: true,
    views: 15420,
    likes: 892,
    comments: 156
  },
  {
    id: '2',
    title: 'Agricultural Real Estate: The Hidden Gem of African Investment',
    excerpt: 'Explore the untapped potential of agricultural real estate investments in Africa and how they\'re providing sustainable returns for investors.',
    content: `
      <p class="mb-6 text-gray-300 leading-relaxed">
        While urban real estate often dominates investment discussions, agricultural real estate in Africa represents one of the most promising 
        and overlooked investment opportunities. With vast arable land, favorable climate conditions, and growing global demand for food, 
        African agricultural real estate is poised for significant growth.
      </p>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">The Agricultural Advantage</h2>
      <p class="mb-6 text-gray-300 leading-relaxed">
        Africa possesses 60% of the world's uncultivated arable land, making it the last frontier for agricultural development. 
        This vast resource, combined with a young and growing population, creates unique opportunities for agricultural real estate investment.
      </p>

      <p class="mb-6 text-gray-300 leading-relaxed">
        Unlike traditional real estate, agricultural properties generate income through multiple revenue streams: crop production, 
        livestock farming, and land appreciation. This diversification makes agricultural real estate particularly attractive for risk-averse investors.
      </p>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">Sustainable Investment</h2>
      <p class="mb-6 text-gray-300 leading-relaxed">
        Agricultural real estate investment aligns with global trends toward sustainability and responsible investing. 
        Many agricultural projects incorporate sustainable farming practices, renewable energy, and community development initiatives.
      </p>

      <p class="mb-6 text-gray-300 leading-relaxed">
        Investors can feel good about their investments while earning competitive returns, creating a win-win scenario for both 
        financial and social impact objectives.
      </p>
    `,
    author: {
      name: 'Michael Chen',
      avatar: '/images/authors/michael-chen.jpg',
      role: 'Agricultural Investment Specialist'
    },
    category: 'Investment Guide',
    tags: ['Agriculture', 'Sustainability', 'Investment', 'Africa', 'Real Estate'],
    publishedAt: '2024-01-10',
    readTime: '6 min read',
    image: '/images/blog/agricultural-investment.jpg',
    featured: true,
    views: 12340,
    likes: 756,
    comments: 98
  },
  {
    id: '3',
    title: 'Community Investment Pools: Building Wealth Together',
    excerpt: 'Learn how community investment pools are democratizing real estate investment and creating shared prosperity across Africa.',
    content: `
      <p class="mb-6 text-gray-300 leading-relaxed">
        Community investment pools represent a revolutionary approach to real estate investment that combines the power of collective action 
        with the benefits of professional management. These pools allow individuals to pool their resources and invest in larger, 
        more profitable real estate projects than they could access individually.
      </p>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">The Power of Collective Investment</h2>
      <p class="mb-6 text-gray-300 leading-relaxed">
        By pooling resources, community members can access investment opportunities that would otherwise be out of reach. 
        This democratization of investment opportunities is particularly important in Africa, where many people have limited access to capital markets.
      </p>

      <p class="mb-6 text-gray-300 leading-relaxed">
        Community investment pools also provide professional management and due diligence, reducing the risk for individual investors 
        while maximizing returns through economies of scale.
      </p>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">Social Impact</h2>
      <p class="mb-6 text-gray-300 leading-relaxed">
        Beyond financial returns, community investment pools create positive social impact by investing in projects that benefit the entire community. 
        This includes affordable housing, educational facilities, healthcare centers, and renewable energy projects.
      </p>
    `,
    author: {
      name: 'Aisha Bello',
      avatar: '/images/authors/aisha-bello.jpg',
      role: 'Community Development Expert'
    },
    category: 'Community',
    tags: ['Community Investment', 'Social Impact', 'Real Estate', 'Africa'],
    publishedAt: '2024-01-08',
    readTime: '5 min read',
    image: '/images/blog/community-investment.jpg',
    featured: false,
    views: 9870,
    likes: 543,
    comments: 87
  }
];

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [liked, setLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    const postId = params.id as string;
    const foundPost = blogPosts.find(p => p.id === postId);
    
    if (foundPost) {
      setPost(foundPost);
      // Find related posts (same category or tags)
      const related = blogPosts
        .filter(p => p.id !== postId && (p.category === foundPost.category || p.tags.some(tag => foundPost.tags.includes(tag))))
        .slice(0, 3);
      setRelatedPosts(related);
    } else {
      router.push('/blog');
    }
  }, [params.id, router]);

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
    }
    setShowShareMenu(false);
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

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
              <Link href="/agriculture" className="text-gray-300 hover:text-white">Agriculture</Link>
              <Link href="/community" className="text-gray-300 hover:text-white">Community</Link>
              <Link href="/market" className="text-gray-300 hover:text-white">Market</Link>
              <Link href="/blog" className="text-emerald-400 font-medium">Blog</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            {/* Breadcrumb */}
            <div className="mb-8">
              <nav className="flex items-center space-x-2 text-sm text-gray-400">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>→</span>
                <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
                <span>→</span>
                <span className="text-white">{post.title}</span>
              </nav>
            </div>

            {/* Article Header */}
            <div className="mb-12">
              <div className="mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {post.category}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {post.title}
              </h1>
              
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                {post.excerpt}
              </p>

              {/* Article Meta */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                      <span className="text-sm">👤</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{post.author.name}</div>
                      <div className="text-gray-400 text-sm">{post.author.role}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>{formatDate(post.publishedAt)}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                  <span>•</span>
                  <span>{post.views.toLocaleString()} views</span>
                </div>
              </div>

              {/* Article Image */}
              <div className="w-full h-64 md:h-96 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mb-8">
                <span className="text-6xl">📰</span>
              </div>
            </div>

            {/* Article Content */}
            <div className="prose prose-invert max-w-none mb-12">
              <div 
                className="text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* Tags */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Article Actions */}
            <div className="flex items-center justify-between mb-12 p-6 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center space-x-4">
                <MagneticEffect>
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      liked 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span>{liked ? '❤️' : '🤍'}</span>
                    <span>{liked ? post.likes + 1 : post.likes}</span>
                  </button>
                </MagneticEffect>
                
                <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-all">
                  <span>💬</span>
                  <span>{post.comments}</span>
                </button>
              </div>

              <div className="relative">
                <MagneticEffect>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                  >
                    <span>📤</span>
                    <span>Share</span>
                  </button>
                </MagneticEffect>

                {showShareMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-2 z-10">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      🐦 Twitter
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      💼 LinkedIn
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      📘 Facebook
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      📋 Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <MagneticEffect key={relatedPost.id}>
                      <Link href={`/blog/${relatedPost.id}`}>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover-lift">
                          <div className="w-full h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mb-4">
                            <span className="text-3xl">📰</span>
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                            {relatedPost.title}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {relatedPost.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatDate(relatedPost.publishedAt)}</span>
                            <span>{relatedPost.readTime}</span>
                          </div>
                        </div>
                      </Link>
                    </MagneticEffect>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter Signup */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Stay Updated</h2>
              <p className="text-gray-400 mb-6">
                Get the latest insights on African real estate investment delivered to your inbox
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <MagneticEffect>
                  <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                    Subscribe
                  </button>
                </MagneticEffect>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 