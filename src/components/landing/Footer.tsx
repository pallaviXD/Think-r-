import { Link } from 'react-router-dom'
import { Sparkles, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-extrabold text-2xl text-text">
                Thinkr<span className="text-primary">.</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted max-w-sm leading-relaxed">
              "Study smart. Score high."
              <br />
              The private, board-aligned AI study companion for Indian school students in Class 6–10.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-text mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <Link to="/app/how-it-works" className="hover:text-primary transition-colors">
                  Architecture & Privacy
                </Link>
              </li>
            </ul>
          </div>

          {/* App links */}
          <div>
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-text mb-3">
              Study App
            </h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>
                <Link to="/onboarding" className="hover:text-primary transition-colors">
                  Start Free
                </Link>
              </li>
              <li>
                <Link to="/app/home" className="hover:text-primary transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/app/tutor" className="hover:text-primary transition-colors">
                  AI Tutor & Chat
                </Link>
              </li>
              <li>
                <Link to="/app/study" className="hover:text-primary transition-colors">
                  Smart Quizzes
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} Thinkr. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-danger fill-danger" /> for Indian students
          </p>
        </div>
      </div>
    </footer>
  )
}

