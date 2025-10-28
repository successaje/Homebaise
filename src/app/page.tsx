import Link from 'next/link';
import Image from 'next/image';
import ScrollAnimations from '@/components/ScrollAnimations';
import MagneticEffect from '@/components/MagneticEffect';

const features = [
  {
    title: 'Fractional Ownership',
    description: 'Own premium African real estate with investments starting from $100.',
    icon: '🏠',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Hedera Security',
    description: 'Built on Hedera for lightning-fast, secure transactions with minimal fees.',
    icon: '⚡',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    title: 'Passive Income',
    description: 'Earn regular rental yields and property appreciation automatically.',
    icon: '💰',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Global Access',
    description: 'Invest in African real estate from anywhere in the world.',
    icon: '🌍',
    gradient: 'from-orange-500 to-red-500'
  }
];

const properties = [
  {
    id: 1,
    name: 'Luxury Beachfront Villa',
    location: 'Dakar, Senegal',
    price: '250,000',
    yield: '8.5%',
    funded: '75%',
    type: 'Residential',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600&fit=crop&q=80'
  },
  {
    id: 2,
    name: 'Coffee Plantation Estate',
    location: 'Mount Kenya, Kenya',
    price: '180,000',
    yield: '12%',
    funded: '45%',
    type: 'Agricultural',
    image: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=800&h=600&fit=crop&q=80'
  },
  {
    id: 3,
    name: 'Urban Development Complex',
    location: 'Lagos, Nigeria',
    price: '320,000',
    yield: '9.2%',
    funded: '92%',
    type: 'Commercial',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&q=80'
  }
];

const stats = [
  { value: '50+', label: 'Properties', sublabel: 'Tokenized' },
  { value: '$10M+', label: 'Total Value', sublabel: 'Under Management' },
  { value: '8.5%', label: 'Average Yield', sublabel: 'Annual Returns' },
  { value: '1.2K+', label: 'Investors', sublabel: 'Global Community' }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black particles">
      {/* Navigation */}
      <nav className="fixed w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-50 animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <MagneticEffect className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center animate-glow">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-white">Homebaise</span>
            </MagneticEffect>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/properties" className="text-gray-300 hover:text-white transition-colors hover-scale">
                Properties
              </Link>
              <Link href="/marketplace" className="text-emerald-400 hover:text-emerald-300 transition-colors hover-scale">
                🔥 Trade
              </Link>
              <Link href="/list-property" className="text-gray-300 hover:text-white transition-colors hover-scale">
                List Property
              </Link>
              <Link href="/agriculture" className="text-gray-300 hover:text-white transition-colors hover-scale">
                Agriculture
              </Link>
              <Link href="/community" className="text-gray-300 hover:text-white transition-colors hover-scale">
                Community
              </Link>
              <Link href="/market" className="text-gray-300 hover:text-white transition-colors hover-scale">
                Market
              </Link>
              <Link href="/yield" className="text-gray-300 hover:text-white transition-colors hover-scale">
                Yield
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <button className="text-gray-300 hover:text-white transition-colors hover-scale">
                  Sign In
                </button>
              </Link>
              <Link href="/auth">
                <MagneticEffect>
                  <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all animate-gradient-x">
                    Get Started
                  </button>
                </MagneticEffect>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse-slow"></div>
          
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-emerald-500/10 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-teal-500/10 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-40 left-20 w-12 h-12 bg-blue-500/10 rounded-full animate-float-delayed-2"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Status Badge */}
              <ScrollAnimations animationType="fade-in-down" delay={200}>
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8 animate-glow">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                  Live on Hedera Testnet
                </div>
              </ScrollAnimations>
              
              {/* Main Headline */}
              <ScrollAnimations animationType="fade-in-up" delay={400}>
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight">
                  Tokenizing
                  <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">
                    African Real Estate
                  </span>
                </h1>
              </ScrollAnimations>
              
              {/* Subtitle */}
              <ScrollAnimations animationType="fade-in-up" delay={600}>
                <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
                  Own, invest, and build wealth in Africa&apos;s most promising properties through blockchain technology. 
                  Start with as little as $100.
                </p>
              </ScrollAnimations>
              
              {/* CTA Buttons */}
              <ScrollAnimations animationType="fade-in-up" delay={800}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                  <Link href="/auth">
                    <MagneticEffect>
                      <button className="group relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-full font-semibold text-lg overflow-hidden hover-lift">
                        <span className="relative z-10">Explore Properties</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </button>
                    </MagneticEffect>
                  </Link>
                  <MagneticEffect>
                    <button className="border border-white/20 bg-white/5 text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-white/10 transition-all hover-lift">
                      Watch Demo
                    </button>
                  </MagneticEffect>
                </div>
              </ScrollAnimations>
              
              {/* Stats */}
              <ScrollAnimations animationType="scale-in" delay={1000}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center group">
                      <div className="text-4xl md:text-5xl font-bold text-white mb-2 animate-heartbeat group-hover:animate-tada">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                      <div className="text-xs text-gray-500">{stat.sublabel}</div>
                    </div>
                  ))}
                </div>
              </ScrollAnimations>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimations animationType="fade-in-up">
              <div className="text-center mb-20">
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                  Why Choose Homebaise?
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                  We&apos;re building the future of African real estate investment on Hedera&apos;s secure, 
                  fast, and sustainable network.
                </p>
              </div>
            </ScrollAnimations>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <ScrollAnimations key={index} animationType="fade-in-up" delay={index * 200}>
                  <div className="group">
                    <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 h-full hover-lift">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300 animate-morph`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </ScrollAnimations>
              ))}
            </div>
          </div>
        </section>

        {/* Properties Section */}
        <section id="properties" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimations animationType="fade-in-up">
              <div className="text-center mb-20">
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                  Featured Properties
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                  Explore our curated selection of tokenized properties across Africa
                </p>
              </div>
            </ScrollAnimations>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property, index) => (
                <ScrollAnimations key={property.id} animationType="fade-in-up" delay={index * 200}>
                  <div className="group">
                    <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/30 transition-all duration-500 hover-lift">
                      {/* Property Image */}
                      <div className="h-48 relative overflow-hidden">
                        <Image 
                          src={property.image} 
                          alt={property.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-medium shadow-lg">
                          {property.type}
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-white font-bold text-lg drop-shadow-lg">{property.name}</h3>
                          <p className="text-emerald-300 text-sm flex items-center mt-1">
                            <span className="mr-1">📍</span>
                            {property.location}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-8 pt-4">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Total Value</p>
                            <p className="text-lg font-semibold text-white">${property.price}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Annual Yield</p>
                            <p className="text-lg font-semibold text-emerald-400">{property.yield}</p>
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Funded</span>
                            <span className="text-white font-medium">{property.funded}</span>
                          </div>
                          <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-1000 animate-gradient-x" 
                              style={{ width: property.funded }}
                            ></div>
                          </div>
                        </div>

                        <MagneticEffect>
                          <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                            View Details
                          </button>
                        </MagneticEffect>
                      </div>
                    </div>
                  </div>
                </ScrollAnimations>
              ))}
            </div>

            <ScrollAnimations animationType="fade-in-up" delay={600}>
              <div className="text-center mt-12">
                <MagneticEffect>
                  <button className="border border-white/20 bg-white/5 text-white px-8 py-4 rounded-full font-medium hover:bg-white/10 transition-all duration-300 hover-lift">
                    View All Properties
                  </button>
                </MagneticEffect>
              </div>
            </ScrollAnimations>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimations animationType="fade-in-up">
              <div className="text-center mb-20">
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                  How It Works
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                  Get started with Homebaise in just a few simple steps
                </p>
              </div>
            </ScrollAnimations>

            <div className="max-w-5xl mx-auto">
              <div className="relative">
                {/* Timeline line */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 to-blue-500 -translate-x-1/2 animate-pulse-slow"></div>
                
                {[
                  {
                    step: '1',
                    title: 'Create Account',
                    description: 'Sign up and complete your profile in minutes. No lengthy paperwork required.',
                    icon: '👤',
                    details: 'KYC verification takes less than 5 minutes'
                  },
                  {
                    step: '2',
                    title: 'Fund Your Wallet',
                    description: 'Deposit HBAR or stablecoins into your secure Hedera wallet.',
                    icon: '💳',
                    details: 'Multiple payment methods accepted'
                  },
                  {
                    step: '3',
                    title: 'Browse & Invest',
                    description: 'Explore properties, review details, and invest with as little as $100.',
                    icon: '🏠',
                    details: 'Real-time property analytics'
                  },
                  {
                    step: '4',
                    title: 'Earn & Trade',
                    description: 'Receive rental yields and trade your property tokens on our marketplace.',
                    icon: '📈',
                    details: 'Automated yield distribution'
                  }
                ].map((item, index) => (
                  <ScrollAnimations key={index} animationType="fade-in-up" delay={index * 300}>
                    <div className="relative mb-16 lg:mb-24">
                      <div className="lg:flex items-center">
                        <div className={`lg:w-1/2 ${index % 2 === 0 ? 'lg:pr-16' : 'lg:pl-16 lg:order-last'}`}>
                          <div className="group">
                            <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 hover-lift">
                              <div className="flex items-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-2xl flex items-center justify-center mr-6 animate-morph">
                                  {item.icon}
                                </div>
                                <div>
                                  <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                                  <p className="text-emerald-400 text-sm">{item.details}</p>
                                </div>
                              </div>
                              <p className="text-gray-300 leading-relaxed">{item.description}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Step number - properly centered */}
                        <div className="hidden lg:flex absolute left-1/2 top-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold text-xl items-center justify-center -translate-x-1/2 -translate-y-1/2 shadow-lg animate-glow z-10">
                          {item.step}
                        </div>
                        
                        <div className={`lg:w-1/2 ${index % 2 === 0 ? 'lg:pl-16' : 'lg:pr-16'}`}>
                          <div className="h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center text-gray-500 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 animate-pulse-slow"></div>
                            <div className="text-center">
                              <div className="text-6xl mb-4 animate-bounce-slow">📱</div>
                              <p className="text-sm">Step {item.step} Interface</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollAnimations>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollAnimations animationType="fade-in-up">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Ready to Invest in Africa&apos;s Future?
              </h2>
              <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                Join the revolution of borderless real estate investment powered by Hedera Hashgraph.
              </p>
            </ScrollAnimations>
            <ScrollAnimations animationType="fade-in-up" delay={300}>
              <div className="flex flex-col sm:flex-row gap-4">
                <MagneticEffect>
                  <Link href="/properties" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                    Browse Properties
                  </Link>
                </MagneticEffect>
                <MagneticEffect>
                  <Link href="/auth" className="border border-white/20 bg-white/5 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 hover-lift">
                    Get Started
                  </Link>
                </MagneticEffect>
              </div>
            </ScrollAnimations>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <ScrollAnimations animationType="fade-in-left">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center animate-glow">
                    <span className="text-white font-bold text-sm">H</span>
                  </div>
                  <span className="text-xl font-bold text-white">Homebaise</span>
                </div>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Tokenizing African real estate on Hedera for global investors. 
                  Building the future of property investment.
                </p>
                <div className="flex space-x-4">
                  {['twitter', 'discord', 'telegram', 'github'].map((social) => (
                    <a 
                      key={social} 
                      href="#" 
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500/20 transition-colors hover-scale"
                      aria-label={social}
                    >
                      <span className="text-xl">
                        {social === 'twitter' ? '𝕏' : social === 'discord' ? '💬' : social === 'telegram' ? '📨' : '💻'}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </ScrollAnimations>
            
            {[
              {
                title: 'Platform',
                links: ['Properties', 'How It Works', 'Pricing', 'Security']
              },
              {
                title: 'Company',
                links: ['About Us', 'Careers', 'Blog', 'Press']
              },
              {
                title: 'Support',
                links: ['Help Center', 'Contact', 'Documentation', 'Status']
              }
            ].map((column, index) => (
              <ScrollAnimations key={index} animationType="fade-in-up" delay={index * 200}>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-6">{column.title}</h3>
                  <ul className="space-y-3">
                    {column.links.map((link, i) => (
                      <li key={i}>
                        <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors hover-scale">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollAnimations>
            ))}
          </div>
          
          <ScrollAnimations animationType="fade-in-up" delay={600}>
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Homebaise. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <span className="text-sm text-gray-500">
                  Built on <span className="text-emerald-400 font-medium">Hedera</span>
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Powered by</span>
                  <span className="text-sm font-medium text-white">HTS</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-sm font-medium text-white">HCS</span>
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </footer>
    </div>
  );
}

