import Link from 'next/link';

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
    type: 'Residential'
  },
  {
    id: 2,
    name: 'Coffee Plantation Estate',
    location: 'Mount Kenya, Kenya',
    price: '180,000',
    yield: '12%',
    funded: '45%',
    type: 'Agricultural'
  },
  {
    id: 3,
    name: 'Urban Development Complex',
    location: 'Lagos, Nigeria',
    price: '320,000',
    yield: '9.2%',
    funded: '92%',
    type: 'Commercial'
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
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-white">Homebaise</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#properties" className="text-gray-300 hover:text-white transition-colors">
                Properties
              </Link>
              <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                How It Works
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-gray-300 hover:text-white transition-colors">
                Sign In
              </button>
              <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Status Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                Live on Hedera Mainnet
              </div>
              
              {/* Main Headline */}
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight">
                Tokenizing
                <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
                  African Real Estate
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
                Own, invest, and build wealth in Africa&apos;s most promising properties through blockchain technology. 
                Start with as little as $100.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <button className="group relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-full font-semibold text-lg overflow-hidden">
                  <span className="relative z-10">Explore Properties</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <button className="border border-white/20 bg-white/5 text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-white/10 transition-all">
                  Watch Demo
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                    <div className="text-xs text-gray-500">{stat.sublabel}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Why Choose Homebaise?
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                We&apos;re building the future of African real estate investment on Hedera&apos;s secure, 
                fast, and sustainable network.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="group">
                  <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 h-full">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Properties Section */}
        <section id="properties" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Featured Properties
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Explore our curated selection of tokenized properties across Africa
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <div key={property.id} className="group">
                  <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/30 transition-all duration-500">
                    {/* Property Image Placeholder */}
                    <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10"></div>
                      <span className="text-6xl">🏠</span>
                      <div className="absolute top-4 right-4 bg-emerald-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-emerald-400 font-medium">
                        {property.type}
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <h3 className="text-xl font-bold text-white mb-2">{property.name}</h3>
                      <p className="text-emerald-400 mb-6 flex items-center">
                        <span className="mr-2">📍</span>
                        {property.location}
                      </p>
                      
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
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-1000" 
                            style={{ width: property.funded }}
                          ></div>
                        </div>
                      </div>

                      <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button className="border border-white/20 bg-white/5 text-white px-8 py-4 rounded-full font-medium hover:bg-white/10 transition-all duration-300">
                View All Properties
              </button>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                How It Works
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Get started with Homebaise in just a few simple steps
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="relative">
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 to-blue-500 -translate-x-1/2"></div>
                
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
                  <div key={index} className="relative mb-16 lg:mb-24">
                    <div className="lg:flex items-center">
                      <div className={`lg:w-1/2 ${index % 2 === 0 ? 'lg:pr-16' : 'lg:pl-16 lg:order-last'}`}>
                        <div className="group">
                          <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all duration-500">
                            <div className="flex items-center mb-6">
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-2xl flex items-center justify-center mr-6">
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
                      
                      <div className="hidden lg:block absolute left-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold text-xl flex items-center justify-center -translate-x-1/2 shadow-lg">
                        {item.step}
                      </div>
                      
                      <div className={`lg:w-1/2 ${index % 2 === 0 ? 'lg:pl-16' : 'lg:pr-16'}`}>
                        <div className="h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center text-gray-500 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10"></div>
                          <div className="text-center">
                            <div className="text-6xl mb-4">📱</div>
                            <p className="text-sm">Step {item.step} Interface</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Ready to Invest in Africa&apos;s Future?
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Join the revolution of borderless real estate investment powered by Hedera Hashgraph.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-full font-semibold text-lg overflow-hidden">
                <span className="relative z-10">Get Started Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              <button className="border border-white/20 bg-white/5 text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-white/10 transition-all">
                Schedule a Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
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
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                    aria-label={social}
                  >
                    <span className="text-xl">
                      {social === 'twitter' ? '𝕏' : social === 'discord' ? '💬' : social === 'telegram' ? '📨' : '💻'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
            
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
              <div key={index}>
                <h3 className="text-lg font-semibold text-white mb-6">{column.title}</h3>
                <ul className="space-y-3">
                  {column.links.map((link, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
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
        </div>
      </footer>
    </div>
  );
}
