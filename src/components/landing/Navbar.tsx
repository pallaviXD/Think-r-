import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sparkles } from 'lucide-react'
import { ThemeToggle } from '../layout/ThemeToggle'
import { Button } from '../ui/button'
import { useAppStore } from '../../store/appStore'
import { db } from '../../lib/db'
import { seedDemoData } from '../../data/demo'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const setDemoMode = useAppStore((s) => s.setDemoMode)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleDemoClick = async () => {
    setDemoMode(true)
    await seedDemoData(db)
    navigate('/app/home')
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface/80 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-extrabold text-2xl tracking-tight text-text">
            Thinkr<span className="text-primary">.</span>
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
          <a href="#how-it-works" className="hover:text-primary transition-colors">
            How it works
          </a>
          <a href="#features" className="hover:text-primary transition-colors">
            Features
          </a>
          <a href="#faq" className="hover:text-primary transition-colors">
            FAQ
          </a>
          <button
            onClick={handleDemoClick}
            className="hover:text-primary transition-colors font-medium cursor-pointer"
          >
            Try Demo
          </button>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link to="/onboarding">
            <Button size="sm" className="font-semibold shadow-sm">
              Start free
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-text hover:bg-elevated transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface border-b border-border px-6 py-5 flex flex-col gap-4 shadow-lg overflow-hidden"
          >
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-text font-medium py-1"
            >
              How it works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-text font-medium py-1"
            >
              Features
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-text font-medium py-1"
            >
              FAQ
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleDemoClick()
              }}
              className="text-left text-text font-medium py-1 text-primary cursor-pointer"
            >
              Try Demo
            </button>
            <div className="pt-2">
              <Link to="/onboarding" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Start free</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

