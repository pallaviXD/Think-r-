import { ThemeProvider } from '../components/layout/ThemeProvider'
import {
  Navbar,
  HeroSection,
  HowItWorksSection,
  FeatureGrid,
  MockScreenshots,
  MadeByStudents,
  FAQSection,
  Footer,
} from '../components/landing'

export default function Landing() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-bg text-text flex flex-col selection:bg-primary/20 selection:text-primary">
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <HowItWorksSection />
          <FeatureGrid />
          <MockScreenshots />
          <MadeByStudents />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
