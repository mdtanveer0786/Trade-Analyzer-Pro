import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowRight,
    BarChart3,
    Brain,
    Shield,
    Zap,
    CheckCircle,
    TrendingUp,
    Users,
    Menu,
    X,
    ChevronDown,
    ChevronUp,
    Star,
    MessageCircle,
    Cloud,
    Globe,
    FileText,
    PieChart,
    Target,
    TrendingDown,
    DollarSign,
    HelpCircle,
    Mail,
    Phone,
    MapPin,
    Award,
    Sparkles,
    BadgeCheck,
    Rocket,
    ShieldCheck,
    PlayCircle,
    Clock,
    Download,
    Linkedin,
    Twitter,
    Youtube,
    Instagram
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'

// Animation Variants
const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
}

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
}

const LandingPage = () => {
    const [email, setEmail] = useState('')
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [openFaq, setOpenFaq] = useState(null)
    const [scrolled, setScrolled] = useState(false)
    const [platformStats, setPlatformStats] = useState({ totalUsers: 6000, totalTrades: 160000 })

    // Handle scroll for sticky header effect
    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 50
            if (isScrolled !== scrolled) setScrolled(isScrolled)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })

        // Fetch public stats
        const fetchStats = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
                const response = await axios.get(`${apiUrl}/public/stats`)
                if (response.data.success) {
                    setPlatformStats({
                        totalUsers: Math.max(6000, response.data.data.totalUsers),
                        totalTrades: Math.max(160000, response.data.data.totalTrades)
                    })
                }
            } catch (error) {
                console.error('Failed to fetch public stats:', error)
            }
        }
        fetchStats()

        return () => window.removeEventListener('scroll', handleScroll)
    }, [scrolled])

    // Smooth scroll for anchor links
    const scrollToSection = useCallback((id) => {
        const element = document.getElementById(id)
        if (element) {
            const offset = 80
            const bodyRect = document.body.getBoundingClientRect().top
            const elementRect = element.getBoundingClientRect().top
            const elementPosition = elementRect - bodyRect
            const offsetPosition = elementPosition - offset

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
            setIsMenuOpen(false)
        }
    }, [])

    useEffect(() => {
        const handleAnchorClick = (e) => {
            const target = e.target.closest('a[href^="#"]')
            if (target) {
                const id = target.getAttribute('href').slice(1)
                if (id) {
                    e.preventDefault()
                    scrollToSection(id)
                }
            }
        }

        document.addEventListener('click', handleAnchorClick)
        return () => document.removeEventListener('click', handleAnchorClick)
    }, [scrollToSection])

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = originalStyle
        }
        return () => { document.body.style.overflow = originalStyle }
    }, [isMenuOpen])

    // Toggle FAQ
    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index)
    }

    // Static Data
    const faqs = useMemo(() => [
        {
            question: "Is there a free trial?",
            answer: "Yes! We offer a 14-day free trial with full access to all premium features. No credit card required to start."
        },
        {
            question: "Which Indian brokers do you support?",
            answer: "We support all major Indian brokers including Zerodha, Angel One, Upstox, ICICI Direct, HDFC Securities, Kotak Securities, and more via secure API integration."
        },
        {
            question: "Can I import my existing trade data?",
            answer: "Yes, you can import trade data from Excel/CSV files or directly connect your broker account for automatic sync. Our AI will analyze historical data too."
        },
        {
            question: "Is my trading data secure?",
            answer: "Absolutely. We use bank-level 256-bit encryption, secure AWS servers with regular backups, and never share your trading data with third parties."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept all major payment methods including UPI, Credit/Debit Cards, Net Banking, and digital wallets. All payments are processed securely through Razorpay."
        }
    ], [])

    const features = useMemo(() => [
        {
            icon: <BarChart3 className="w-6 h-6" />,
            title: "Advanced Analytics",
            description: "35+ in-depth performance reports including win rate by strategy, profit factor, and expectancy analysis with visual insights.",
            color: "from-blue-500 to-cyan-500",
            highlight: "Real-time P&L Tracking"
        },
        {
            icon: <Brain className="w-6 h-6" />,
            title: "AI Trade Summariser",
            description: "AI instantly analyzes your trades and spots hidden patterns with performance insights in plain English. Get actionable recommendations.",
            color: "from-purple-500 to-pink-500",
            highlight: "Pattern Recognition"
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "Fast Trade Entry",
            description: "One-click trade entry with broker API integrations and bulk trade syncs. Focus on trading, not data entry. Supports all Indian brokers.",
            color: "from-green-500 to-emerald-500",
            highlight: "API Integration"
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Psychology Tracking",
            description: "Identify patterns in your behavior with emotion tagging and emotional state analysis. Track mood vs performance correlation.",
            color: "from-orange-500 to-red-500",
            highlight: "Emotion Analytics"
        }
    ], [])

    const stats = useMemo(() => [
        {
            value: platformStats.totalTrades >= 1000 ? `${(platformStats.totalTrades / 1000).toFixed(0)}k+` : `${platformStats.totalTrades}+`,
            label: "Trades Analyzed",
            icon: <FileText className="w-5 h-5" />,
            description: "Growing every day"
        },
        {
            value: "2.5x",
            label: "Better Discipline",
            icon: <Target className="w-5 h-5" />,
            description: "Improved trade consistency"
        },
        {
            value: "-63%",
            label: "Fewer Errors",
            icon: <TrendingDown className="w-5 h-5" />,
            description: "Reduced emotional trades"
        },
        {
            value: platformStats.totalUsers >= 1000 ? `${(platformStats.totalUsers / 1000).toFixed(0)}k+` : `${platformStats.totalUsers}+`,
            label: "Active Traders",
            icon: <Users className="w-5 h-5" />,
            description: "Trust our platform"
        }
    ], [platformStats])

    const testimonials = useMemo(() => [
        {
            quote: "I separate strategy issues from execution now. Reviewing trades brought massive clarity. I finally know what to fix.",
            author: "Abhay Sharma",
            role: "Equity Trader • Mumbai",
            rating: 5,
            avatar: "AS"
        },
        {
            quote: "I could literally see my emotional mistakes like fear exits or revenge trades. That one insight changed everything for me.",
            author: "Rajvansh Mehta",
            role: "Derivatives Trader • Delhi",
            rating: 5,
            avatar: "RM"
        },
        {
            quote: "I only trade twice a week, but journaling keeps me consistent. I learn from every mistake and feel much more in control.",
            author: "Abhinav Singh",
            role: "Swing Trader • Bangalore",
            rating: 5,
            avatar: "AS"
        }
    ], [])

    const pricingPlans = useMemo(() => [
        {
            name: "Monthly Plan",
            price: "₹299",
            period: "/month",
            description: "Perfect for trying out advanced features",
            features: [
                { text: "Unlimited trade entries", included: true },
                { text: "Advanced analytics dashboard", included: true },
                { text: "Risk management tools", included: true },
                { text: "Trade screenshots & notes", included: true },
                { text: "Email support", included: true },
                { text: "Priority support", included: false },
                { text: "AI-powered insights", included: false },
                { text: "Custom reports", included: false }
            ],
            cta: "Start Monthly Plan",
            popular: false,
            color: "gray",
            trial: "14-day free trial"
        },
        {
            name: "Annual Plan",
            price: "₹999",
            period: "/year",
            description: "Best value for serious traders",
            savings: "Save ₹2,589 (72% off)",
            monthlyEquivalent: "Just ₹83/month",
            features: [
                { text: "Everything in Monthly Plan", included: true },
                { text: "Priority email & chat support", included: true },
                { text: "Early access to new features", included: true },
                { text: "Advanced AI-powered insights", included: true },
                { text: "Custom report templates", included: true },
                { text: "Broker API priority access", included: true },
                { text: "Weekly performance reviews", included: true },
                { text: "Dedicated account manager", included: true }
            ],
            cta: "Get Annual Plan",
            popular: true,
            color: "premium",
            trial: "14-day free trial + 30-day money back",
            badge: "MOST POPULAR"
        }
    ], [])

    const howItWorks = useMemo(() => [
        {
            step: "01",
            title: "Connect & Import",
            description: "Securely connect your broker account or import existing trades. We support all major Indian brokers with real-time sync.",
            icon: <Cloud className="w-8 h-8" />,
            details: ["Broker API integration", "CSV/Excel import", "Real-time sync"]
        },
        {
            step: "02",
            title: "Analyze & Tag",
            description: "Our AI analyzes every trade automatically. Tag emotions, strategies, and rate execution quality for deeper insights.",
            icon: <Brain className="w-8 h-8" />,
            details: ["AI analysis", "Emotion tagging", "Strategy classification"]
        },
        {
            step: "03",
            title: "Review & Optimize",
            description: "Get actionable insights with detailed reports. Identify patterns, improve strategies, and track performance over time.",
            icon: <TrendingUp className="w-8 h-8" />,
            details: ["Performance reports", "Risk analysis", "Improvement tracking"]
        }
    ], [])

    const trustedBy = useMemo(() => [
        "Zerodha", "Angel One", "Upstox", "Groww", "ICICI Direct", "HDFC Securities"
    ], [])

    const socialLinks = useMemo(() => [
        { icon: <Twitter className="w-5 h-5" />, label: "Twitter" },
        { icon: <Linkedin className="w-5 h-5" />, label: "LinkedIn" },
        { icon: <Youtube className="w-5 h-5" />, label: "YouTube" },
        { icon: <Instagram className="w-5 h-5" />, label: "Instagram" }
    ], [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white overflow-x-hidden">
            {/* Sticky Navigation */}
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? 'bg-gray-950/90 backdrop-blur-xl border-b border-gray-800 shadow-2xl py-3'
                    : 'bg-transparent py-6'
                    }`}
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    TradeAnalyzer
                                </span>
                                <div className="flex items-center space-x-1 -mt-1">
                                    <BadgeCheck className="w-3 h-3 text-green-400" />
                                    <span className="text-[10px] font-bold text-gray-500 tracking-wider">PRO</span>
                                </div>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center space-x-8">
                            {[
                                { name: 'Home', id: 'home' },
                                { name: 'Features', id: 'features' },
                                { name: 'How It Works', id: 'how-it-works' },
                                { name: 'Testimonials', id: 'testimonials' },
                                { name: 'Pricing', id: 'pricing' },
                                { name: 'FAQ', id: 'faq' }
                            ].map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    className="text-gray-400 hover:text-white transition-all duration-300 text-sm font-medium relative group"
                                >
                                    {item.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                                </a>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden lg:flex items-center space-x-6">
                            <Link
                                to="/login"
                                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95"
                            >
                                <span className="flex items-center space-x-2">
                                    <Rocket className="w-4 h-4" />
                                    <span>Start Free Trial</span>
                                </span>
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-white transition-all duration-300"
                            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className="lg:hidden fixed left-4 right-4 top-24 z-50 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
                            >
                                <div className="p-6 space-y-2">
                                    {[
                                        { name: 'Home', id: 'home', icon: <Globe className="w-5 h-5" /> },
                                        { name: 'Features', id: 'features', icon: <Zap className="w-5 h-5" /> },
                                        { name: 'How It Works', id: 'how-it-works', icon: <PlayCircle className="w-5 h-5" /> },
                                        { name: 'Testimonials', id: 'testimonials', icon: <Users className="w-5 h-5" /> },
                                        { name: 'Pricing', id: 'pricing', icon: <DollarSign className="w-5 h-5" /> },
                                        { name: 'FAQ', id: 'faq', icon: <HelpCircle className="w-5 h-5" /> }
                                    ].map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center space-x-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                                        >
                                            <div className="text-blue-400">{item.icon}</div>
                                            <span className="text-lg font-medium">{item.name}</span>
                                        </a>
                                    ))}
                                    <div className="pt-6 mt-4 space-y-4 border-t border-gray-800">
                                        <Link
                                            to="/login"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center justify-center py-4 text-gray-300 hover:text-white font-medium"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            to="/register"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center justify-center space-x-3 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold hover:shadow-lg transition-all duration-300"
                                        >
                                            <Rocket className="w-5 h-5" />
                                            <span>Start Free Trial</span>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </nav>

            {/* Add padding for fixed header */}
            <div className="pt-16"></div>

            {/* Hero Section */}
            <section id="home" className="pt-12 pb-20 lg:pt-20 lg:pb-32 relative overflow-hidden">
                {/* Background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <motion.div
                        variants={fadeInUp}
                        initial="initial"
                        animate="animate"
                        className="text-center max-w-5xl mx-auto"
                    >
                        {/* Trust Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="inline-flex items-center px-4 py-2 rounded-full bg-gray-900/50 backdrop-blur-sm border border-gray-800 mb-8 shadow-xl"
                        >
                            <ShieldCheck className="w-4 h-4 text-green-400 mr-2" />
                            <span className="text-sm font-medium text-gray-400">
                                Trusted by <span className="text-white font-bold">6,000+</span> Indian Traders
                            </span>
                        </motion.div>

                        {/* Main Heading */}
                        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tight">
                            <span className="block text-white">Trade Smarter,</span>
                            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent filter drop-shadow-sm">
                                Not Harder
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                            India's Most Advanced Trading Journal. Track, analyze, and elevate your performance with <span className="text-blue-400">AI-powered</span> intelligent insights.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-5 justify-center mb-20">
                            <Link
                                to="/register"
                                className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)]"
                            >
                                <span>Start 14-Day Free Trial</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                            </Link>
                            <button className="group px-10 py-5 bg-gray-900 border border-gray-800 rounded-2xl font-bold text-lg hover:bg-gray-800 hover:border-gray-700 transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105 active:scale-95 shadow-xl">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                    <PlayCircle className="w-5 h-5 text-blue-400" />
                                </div>
                                <span>Watch Demo</span>
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <motion.div
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-4"
                        >
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    variants={fadeInUp}
                                    whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                    className="bg-gray-900/40 backdrop-blur-md p-8 rounded-3xl border border-gray-800 hover:border-blue-500/50 transition-all duration-300 group relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-all duration-500"></div>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 mb-5 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                                            {stat.icon}
                                        </div>
                                        <div className="text-4xl font-black bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent mb-2">
                                            {stat.value}
                                        </div>
                                        <div className="text-gray-200 font-bold mb-1 tracking-tight">{stat.label}</div>
                                        <div className="text-gray-500 text-sm font-medium">{stat.description}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Trusted By Section */}
            <div className="py-12 bg-gray-900/30 border-y border-gray-800/50 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-transparent to-gray-950 z-10 pointer-events-none"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-gray-500 mb-10 text-xs font-black uppercase tracking-[0.4em]">Integrated with Major Indian Brokers</p>
                    <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-16 lg:gap-24 opacity-40 hover:opacity-100 transition-opacity duration-700">
                        {trustedBy.map((company) => (
                            <div
                                key={company}
                                className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter text-white grayscale hover:grayscale-0 transition-all duration-500 cursor-default"
                            >
                                {company}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <section id="features" className="py-24 relative bg-gray-950">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                            >
                                <Sparkles className="w-4 h-4 text-blue-400 mr-2" />
                                <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">Premium Features</span>
                            </motion.div>
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-8 leading-tight">
                                Everything You Need to
                                <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    Master Your Trading
                                </span>
                            </h2>
                            <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed">
                                Professional-grade tools designed specifically for the Indian stock market ecosystem.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                    className="group relative"
                                >
                                    <div className="bg-gray-900/40 backdrop-blur-md p-8 sm:p-10 rounded-[2.5rem] border border-gray-800 hover:border-blue-500/50 transition-all duration-500 h-full shadow-2xl overflow-hidden">
                                        {/* Accent Background */}
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-bl-full`}></div>

                                        <div className="flex flex-col sm:flex-row items-start gap-8 relative z-10">
                                            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                                                <div className="text-white">
                                                    {feature.icon}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                                    <h3 className="text-2xl sm:text-3xl font-black text-white">{feature.title}</h3>
                                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider group-hover:bg-blue-500/10 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all duration-300">
                                                        {feature.highlight}
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 text-lg leading-relaxed font-medium">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 bg-gray-900/40 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6"
                            >
                                <Rocket className="w-4 h-4 text-indigo-400 mr-2" />
                                <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Workflow</span>
                            </motion.div>
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-8 text-white leading-tight">
                                Simple Three-Step
                                <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                    Path to Mastery
                                </span>
                            </h2>
                            <p className="text-gray-400 text-lg md:text-xl font-medium">
                                A frictionless process designed for high-performance traders
                            </p>
                        </div>

                        <div className="relative">
                            {/* Desktop Connection Line */}
                            <div className="hidden lg:block absolute top-[45%] left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 transform -translate-y-1/2"></div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
                                {howItWorks.map((step, index) => (
                                    <motion.div
                                        key={step.step}
                                        initial={{ opacity: 0, y: 40 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: index * 0.2 }}
                                        viewport={{ once: true }}
                                        className="relative group"
                                    >
                                        <div className="flex flex-col items-center text-center">
                                            {/* Step Circle */}
                                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-gray-950 border-2 border-gray-800 flex items-center justify-center mb-10 group-hover:border-blue-500/50 group-hover:bg-blue-600/10 transition-all duration-500 relative z-20 shadow-2xl">
                                                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-xl">
                                                    {step.step}
                                                </div>
                                                <div className="text-blue-400 group-hover:scale-110 group-hover:text-blue-300 transition-transform duration-500">
                                                    {step.icon}
                                                </div>
                                            </div>

                                            <div className="bg-gray-900/60 backdrop-blur-md p-10 rounded-[2.5rem] border border-gray-800 group-hover:border-blue-500/30 transition-all duration-500 w-full shadow-2xl">
                                                <h3 className="text-2xl sm:text-3xl font-black mb-6 text-white">{step.title}</h3>
                                                <p className="text-gray-400 text-lg leading-relaxed mb-8 font-medium">{step.description}</p>
                                                <ul className="space-y-4 inline-block text-left">
                                                    {step.details.map((detail, i) => (
                                                        <li key={i} className="flex items-center text-gray-400 text-sm font-bold uppercase tracking-wider">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-4 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                                            {detail}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-24 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6"
                            >
                                <Award className="w-4 h-4 text-emerald-400 mr-2" />
                                <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Success Stories</span>
                            </motion.div>
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-8 text-white leading-tight">
                                Trusted by
                                <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                    The Best Traders
                                </span>
                            </h2>
                            <p className="text-gray-400 text-lg md:text-xl font-medium">
                                Join 6,000+ traders already accelerating their edge
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {testimonials.map((testimonial, index) => (
                                <motion.div
                                    key={testimonial.author}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                    className="bg-gray-950 border border-gray-800 p-8 sm:p-10 rounded-[2.5rem] relative group transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                                >
                                    <div className="flex mb-8 gap-1">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                                        ))}
                                    </div>

                                    <p className="text-gray-300 text-lg leading-relaxed mb-10 font-medium italic">"{testimonial.quote}"</p>

                                    <div className="flex items-center pt-8 border-t border-gray-900">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-xl font-black text-emerald-400 mr-5 shadow-inner">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-lg">{testimonial.author}</p>
                                            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-gray-950 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent pointer-events-none"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
                            >
                                <DollarSign className="w-4 h-4 text-purple-400 mr-2" />
                                <span className="text-sm font-bold text-purple-400 uppercase tracking-widest">Best Value</span>
                            </motion.div>
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-8 text-white leading-tight">
                                Simple,
                                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent filter drop-shadow-sm">
                                    Transparent Pricing
                                </span>
                            </h2>
                            <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed">
                                Professional tools at prices that make sense for serious traders
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto items-stretch">
                            {pricingPlans.map((plan, index) => (
                                <motion.div
                                    key={plan.name}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.2 }}
                                    viewport={{ once: true }}
                                    className="relative h-full flex flex-col"
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-2.5 rounded-full text-sm font-black shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center space-x-2 tracking-widest">
                                                <Award className="w-4 h-4" />
                                                <span>{plan.badge}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`bg-gray-900/40 backdrop-blur-xl p-10 sm:p-12 rounded-[3rem] border-2 flex flex-col flex-grow transition-all duration-500 hover:shadow-3xl hover:-translate-y-2 ${plan.popular
                                        ? 'border-purple-500/50 bg-gradient-to-b from-gray-900/60 to-gray-950 shadow-2xl'
                                        : 'border-gray-800'
                                        }`}>
                                        <div className="mb-10 text-center sm:text-left">
                                            <h3 className="text-3xl font-black mb-4 text-white uppercase tracking-tight">{plan.name}</h3>
                                            <p className="text-gray-400 font-medium mb-8 leading-relaxed text-lg">{plan.description}</p>

                                            <div className="flex items-baseline justify-center sm:justify-start mb-4">
                                                <span className="text-6xl sm:text-7xl font-black text-white tracking-tighter">{plan.price}</span>
                                                <span className="text-gray-500 ml-4 text-xl font-bold uppercase tracking-wider">{plan.period}</span>
                                            </div>

                                            {plan.savings && (
                                                <div className="space-y-1">
                                                    <p className="text-emerald-400 font-black text-xl mb-1">{plan.savings}</p>
                                                    {plan.monthlyEquivalent && (
                                                        <p className="text-gray-300 font-bold bg-white/5 inline-block px-4 py-1.5 rounded-full text-sm tracking-wide">{plan.monthlyEquivalent}</p>
                                                    )}
                                                </div>
                                            )}

                                            {plan.trial && (
                                                <div className="mt-6 inline-flex items-center space-x-2 text-blue-400 bg-blue-500/10 px-6 py-2 rounded-2xl border border-blue-500/20 font-bold text-sm">
                                                    <ShieldCheck className="w-4 h-4" />
                                                    <span>{plan.trial}</span>
                                                </div>
                                            )}
                                        </div>

                                        <ul className="space-y-5 mb-12 flex-grow">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center group/item">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-5 flex-shrink-0 transition-colors ${feature.included
                                                        ? (plan.popular ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400')
                                                        : 'bg-gray-800 text-gray-600'
                                                        }`}>
                                                        {feature.included ? (
                                                            <CheckCircle className="w-4 h-4" />
                                                        ) : (
                                                            <X className="w-3 h-3" />
                                                        )}
                                                    </div>
                                                    <span className={`text-lg font-medium transition-colors ${feature.included ? 'text-gray-200' : 'text-gray-600'}`}>{feature.text}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Link
                                            to="/register"
                                            className={`block w-full py-5 rounded-[1.5rem] font-black text-xl text-center transition-all duration-300 shadow-xl ${plan.popular
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]'
                                                : 'bg-gray-800 text-white hover:bg-gray-700'
                                                } hover:scale-[1.03] active:scale-95`}
                                        >
                                            {plan.cta}
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Note */}
                        <div className="text-center mt-16 max-w-2xl mx-auto">
                            <p className="text-gray-400 text-lg font-medium mb-4">
                                Every plan starts with a full-featured <span className="text-white font-bold">14-day free trial</span>.
                            </p>
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.2em] flex flex-wrap justify-center gap-x-8 gap-y-4">
                                <span className="flex items-center"><BadgeCheck className="w-4 h-4 mr-2" /> CANCEL ANYTIME</span>
                                <span className="flex items-center"><BadgeCheck className="w-4 h-4 mr-2" /> SECURE PAYMENTS</span>
                                <span className="flex items-center"><BadgeCheck className="w-4 h-4 mr-2" /> NO HIDDEN FEES</span>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-8 text-white leading-tight">
                                Got Questions?
                                <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                    We've Got Answers
                                </span>
                            </h2>
                            <p className="text-gray-400 text-lg md:text-xl font-medium">
                                Everything you need to know about TradeAnalyzer
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto">
                            {faqs.map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="mb-6"
                                >
                                    <button
                                        onClick={() => toggleFaq(index)}
                                        className={`w-full p-8 rounded-[2rem] border transition-all duration-500 text-left flex justify-between items-center group relative overflow-hidden ${openFaq === index
                                            ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
                                            : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-6 relative z-10">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${openFaq === index ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                                                }`}>
                                                <HelpCircle className="w-6 h-6" />
                                            </div>
                                            <span className={`font-black text-xl sm:text-2xl transition-colors ${openFaq === index ? 'text-white' : 'text-gray-300'
                                                }`}>{faq.question}</span>
                                        </div>
                                        <div className={`relative z-10 p-2 rounded-xl transition-all duration-500 ${openFaq === index ? 'bg-blue-500/20 rotate-180' : 'bg-gray-800'
                                            }`}>
                                            <ChevronDown className={`w-6 h-6 ${openFaq === index ? 'text-blue-400' : 'text-gray-500'}`} />
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {openFaq === index && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-gray-900/60 backdrop-blur-md p-10 rounded-[2rem] border border-blue-500/20 shadow-2xl">
                                                    <p className="text-gray-300 text-xl leading-relaxed font-medium">{faq.answer}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>

                        {/* Contact Support */}
                        <div className="text-center mt-12 md:mt-24 px-4">
                            <p className="text-gray-500 mb-6 md:mb-10 text-base md:text-xl font-bold uppercase tracking-widest">Still have questions?</p>
                            <a
                                href="mailto:support@tradeanalyzer.in"
                                className="inline-flex flex-col sm:flex-row items-center gap-4 md:gap-6 px-6 md:px-10 py-6 md:py-8 bg-gray-900/80 border border-gray-800 rounded-2xl md:rounded-[3rem] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-500 group shadow-2xl w-full sm:w-auto"
                            >
                                <div className="p-4 md:p-5 bg-blue-500/10 rounded-xl md:rounded-2xl group-hover:bg-blue-500/20 transition-all duration-500 shadow-inner">
                                    <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-blue-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="text-center sm:text-left overflow-hidden">
                                    <span className="text-lg md:text-2xl font-black block text-white group-hover:text-blue-400 transition-colors mb-1 truncate">Contact Our Support Team</span>
                                    <span className="text-sm md:text-lg text-gray-500 font-bold uppercase tracking-widest group-hover:text-gray-300 block truncate">support@tradeanalyzer.in</span>
                                </div>
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-24 relative overflow-hidden bg-gray-950">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <div className="max-w-5xl mx-auto bg-gray-900/40 backdrop-blur-2xl p-12 sm:p-20 rounded-[4rem] border border-white/5 shadow-3xl overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                            <div className="inline-flex items-center px-6 py-3 rounded-full bg-blue-500/10 border border-blue-500/20 mb-10 shadow-inner">
                                <Rocket className="w-6 h-6 text-blue-400 mr-3 animate-bounce" />
                                <span className="text-sm font-black text-blue-400 uppercase tracking-[0.3em]">Ready to Scale?</span>
                            </div>

                            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black mb-10 text-white leading-[1.1] tracking-tight">
                                Transform Your
                                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Trading Journey Today
                                </span>
                            </h2>

                            <p className="text-xl sm:text-2xl text-gray-400 mb-14 max-w-3xl mx-auto leading-relaxed font-medium">
                                Join <span className="text-white font-bold">6,000+</span> elite Indian traders who are making data-driven decisions every single day.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                                <Link
                                    to="/register"
                                    className="group w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] font-black text-2xl text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-4 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(37,99,235,0.4)]"
                                >
                                    <span>Get Started Now</span>
                                    <ArrowRight className="w-7 h-7 group-hover:translate-x-3 transition-transform duration-300" />
                                </Link>
                                <button className="w-full sm:w-auto px-12 py-6 bg-gray-950 border-2 border-gray-800 rounded-[2rem] font-black text-2xl text-white hover:border-blue-500 hover:bg-gray-900 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl">
                                    <span className="flex items-center justify-center space-x-4">
                                        <PlayCircle className="w-7 h-7 text-blue-400" />
                                        <span>Watch Demo</span>
                                    </span>
                                </button>
                            </div>

                            <div className="flex flex-wrap justify-center gap-10 text-gray-500 text-sm font-bold uppercase tracking-widest">
                                <div className="flex items-center"><BadgeCheck className="w-5 h-5 mr-3 text-emerald-500" /> NO CREDIT CARD</div>
                                <div className="flex items-center"><BadgeCheck className="w-5 h-5 mr-3 text-emerald-500" /> CANCEL ANYTIME</div>
                                <div className="flex items-center"><BadgeCheck className="w-5 h-5 mr-3 text-emerald-500" /> 24/7 SUPPORT</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-gray-900 bg-gray-950 relative overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-20">
                        {/* Company Info */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center space-x-4 mb-8 group cursor-pointer">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                    <TrendingUp className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <span className="text-3xl font-black text-white tracking-tighter">TradeAnalyzer</span>
                                    <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mt-1">Intelligence for Traders</p>
                                </div>
                            </div>
                            <p className="text-gray-400 text-lg mb-10 max-w-md leading-relaxed font-medium">
                                Empowering Indian traders with bank-grade analytics and AI-powered insights to conquer the markets.
                            </p>
                            <div className="flex gap-4">
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.label}
                                        href="#"
                                        onClick={(e) => e.preventDefault()}
                                        className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 text-gray-400 hover:text-white shadow-xl hover:-translate-y-1"
                                        aria-label={social.label}
                                    >
                                        {social.icon}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Product Links */}
                        <div className="space-y-8">
                            <h4 className="font-black text-white text-xl uppercase tracking-widest">Product</h4>
                            <ul className="space-y-5">
                                {['Features', 'How It Works', 'Pricing', 'Testimonials'].map((item) => (
                                    <li key={item}>
                                        <a
                                            href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                                            className="text-gray-400 hover:text-blue-400 transition-colors text-lg font-medium flex items-center group"
                                        >
                                            <ArrowRight className="w-4 h-4 mr-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Resources */}
                        <div className="space-y-8">
                            <h4 className="font-black text-white text-xl uppercase tracking-widest">Resources</h4>
                            <ul className="space-y-5">
                                {['Blog', 'Help Center', 'API Docs', 'Broker Integrations'].map((item) => (
                                    <li key={item}>
                                        <a href="#" onClick={(e) => e.preventDefault()} className="text-gray-400 hover:text-blue-400 transition-colors text-lg font-medium flex items-center group">
                                            <ArrowRight className="w-4 h-4 mr-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div className="space-y-8">
                            <h4 className="font-black text-white text-xl uppercase tracking-widest">Contact</h4>
                            <ul className="space-y-6">
                                <li className="flex items-center space-x-4 group cursor-pointer">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 text-blue-400 group-hover:text-white transition-all duration-300">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <a href="mailto:support@tradeanalyzer.in" className="text-gray-400 group-hover:text-white font-medium transition-colors">support@tradeanalyzer.in</a>
                                </li>
                                <li className="flex items-center space-x-4 group cursor-pointer">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 text-emerald-400 group-hover:text-white transition-all duration-300">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <span className="text-gray-400 group-hover:text-white font-medium transition-colors">+91 1800-123-4567</span>
                                </li>
                                <li className="flex items-center space-x-4 group cursor-pointer">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500 text-purple-400 group-hover:text-white transition-all duration-300">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <span className="text-gray-400 group-hover:text-white font-medium transition-colors">Mumbai, Maharashtra</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Copyright & Legal */}
                    <div className="pt-12 border-t border-gray-900">
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
                                © 2026 <span className="text-white">TradeAnalyzer</span>. All rights reserved. Built for Indian Traders.
                            </p>
                            <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4 text-xs font-black text-gray-500 uppercase tracking-widest">
                                <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Privacy Policy</a>
                                <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Terms of Service</a>
                                <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Cookie Policy</a>
                                <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Risk Disclosure</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage