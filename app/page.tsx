"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hooks";
import { authApi } from "@/lib/features/auth/authApi";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { NavBar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { AIAdvantage } from "@/components/landing/ai-advantage";
import { MobilePromo } from "@/components/landing/mobile-promo";
import { SocialProof } from "@/components/landing/social-proof";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const silentCheck = async () => {
      try {
        const result = await dispatch(authApi.endpoints.refreshSession.initiate()).unwrap();
        if (result && result.access_token) {
          router.replace("/dashboard");
        }
      } catch {
        // Not authenticated, do nothing (stay on landing page)
      }
    };
    silentCheck();
  }, [dispatch, router]);

  return (
    <div className="flex flex-col min-h-screen bg-bg-app text-text-primary font-sans antialiased">
      {/* Navigation */}
      <NavBar />

      {/* Main Content Sections */}
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />

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
    </div>
  );
}
