"use client";

import { useState } from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { NavBar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { AIAdvantage } from "@/components/landing/ai-advantage";
import { MobilePromo } from "@/components/landing/mobile-promo";
import { SocialProof } from "@/components/landing/social-proof";
import { Footer } from "@/components/landing/footer";
import { SignupModal } from "@/components/landing/signup-modal";

export default function Home() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-bg-app text-text-primary font-sans antialiased">
      {/* Navigation */}
      <NavBar onStartTrial={() => setIsSignupOpen(true)} />

      {/* Main Content Sections */}
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero onStartTrial={() => setIsSignupOpen(true)} />

        {/* Feature Highlights Grid */}
        <Features />

        {/* AI Advantage Section */}
        <AIAdvantage />

        {/* Mobile Promo Section */}
        <MobilePromo />

        {/* Social Proof */}
        <SocialProof />
      </main>

      {/* Footer */}
      <Footer />

      {/* Free Trial Signup Modal Popup */}
      <SignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </div>
  );
}
