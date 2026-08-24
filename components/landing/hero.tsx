"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Play } from "lucide-react";

export function Hero({ onStartTrial }: { onStartTrial: () => void }) {
  const { t } = useLanguage();

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:px-10 lg:py-32 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Column */}
        <div className="flex flex-col gap-6 z-10 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-tight">
            {t("hero.title")}
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto lg:mx-0">
            {t("hero.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-2">
            <Button
              variant="default"
              size="lg"
              onClick={onStartTrial}
              className="bg-cta hover:bg-cta-dark text-white rounded-lg px-6 py-6 text-base font-semibold transition-all w-full sm:w-auto"
            >
              {t("hero.ctaPrimary")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-brand text-brand hover:bg-brand-light rounded-lg px-6 py-6 text-base font-semibold transition-all w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Play className="size-4 fill-brand text-brand" />
              {t("hero.ctaSecondary")}
            </Button>
          </div>
        </div>

        {/* Right Column (Image and background details) */}
        <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center">
          {/* Radial blur gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-light/40 to-secondary/35 rounded-full blur-3xl transform scale-75"></div>
          {/* Dashboard mockup image */}
          <img
            alt={t("hero.imageAlt")}
            className="relative z-10 w-[95%] sm:w-[85%] lg:w-[120%] max-w-none h-auto rounded-xl shadow-level-2 border border-border-default/30 transform lg:translate-x-12 -rotate-1 hover:rotate-0 transition-transform duration-700 ease-out"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDi9IVrF2GxIWSTGBqCRthOPQLte47BukRroUh9oHg46uqpUOR3Z3GTVkVWWAQ0YUhY42kNYMlXWXaHjrRs4Sqd0gv5YOmD4JzJyN-u8c4PTGPLgapyw2vRYhCt8Fz8jUO4Mpy2GAdL1PZ7Rirzh-Bm7hKol3HWHKSGQNV4EhyX6XfPa4eEaefcg575Hi4vhVP9QH-5ld3RRQd8rTtyyvLxHSjXXHxXVqNuiltrdnfXF9uiDemZzmBo"
          />
        </div>
      </div>
    </section>
  );
}
