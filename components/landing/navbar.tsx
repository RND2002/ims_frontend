"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Languages, Menu, X } from "lucide-react";

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : "en");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border-default bg-bg-surface/80 backdrop-blur-md font-sans">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 md:px-10">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="#" className="text-3xl font-bold text-brand font-serif">
            Hisaab
          </Link>
          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#"
              className="border-b-2 border-brand pb-1 text-sm font-semibold text-text-primary transition-colors"
            >
              {t("nav.features")}
            </Link>
            <Link
              href="#"
              className="pb-1 text-sm font-medium text-text-secondary hover:text-brand transition-colors"
            >
              {t("nav.pricing")}
            </Link>
            <Link
              href="#"
              className="pb-1 text-sm font-medium text-text-secondary hover:text-brand transition-colors"
            >
              {t("nav.testimonials")}
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default hover:bg-bg-app text-xs font-semibold text-text-primary transition-colors cursor-pointer"
          >
            <Languages className="size-4 text-text-secondary" />
            {language === "en" ? "हिन्दी" : "English"}
          </button>

          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-brand transition-colors"
          >
            {t("nav.login")}
          </Link>

          <Link href="/signup">
            <Button
              variant="default"
              size="lg"
              className="rounded-lg bg-cta hover:bg-cta-dark text-white px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
            >
              {t("nav.cta")}
            </Button>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-text-primary focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-border-default bg-bg-surface px-4 py-4 shadow-md transition-all">
          <div className="flex flex-col gap-4">
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold text-primary"
            >
              {t("nav.features")}
            </Link>
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-text-secondary hover:text-primary"
            >
              {t("nav.pricing")}
            </Link>
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-text-secondary hover:text-primary"
            >
              {t("nav.testimonials")}
            </Link>
            <hr className="border-border-default" />
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 text-left text-sm font-medium text-text-secondary hover:text-primary block"
            >
              {t("nav.login")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
