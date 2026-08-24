"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Apple, Play } from "lucide-react";

export function MobilePromo() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:px-10 overflow-hidden">
      <div className="relative bg-bg-surface rounded-3xl border border-border-default p-8 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-light/60 rounded-full blur-3xl"></div>

        {/* Left Column (Content) */}
        <div className="flex flex-col gap-6 z-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            {t("mobile.title")}
          </h2>
          <p className="text-base text-text-secondary leading-relaxed">
            {t("mobile.desc")}
          </p>

          <div className="flex flex-wrap gap-4 mt-2">
            <button className="bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 flex items-center gap-3 hover:bg-bg-app transition-colors shadow-sm cursor-pointer">
              <Apple className="size-6 text-text-primary" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-text-secondary leading-none">
                  {t("mobile.appStoreSub")}
                </span>
                <span className="font-semibold text-xs leading-tight text-text-primary">
                  {t("mobile.appStoreTitle")}
                </span>
              </div>
            </button>
            <button className="bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 flex items-center gap-3 hover:bg-bg-app transition-colors shadow-sm cursor-pointer">
              <Play className="size-5 fill-text-primary text-text-primary ml-0.5" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-text-secondary leading-none">
                  {t("mobile.googlePlaySub")}
                </span>
                <span className="font-semibold text-xs leading-tight text-text-primary">
                  {t("mobile.googlePlayTitle")}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Column (Smartphone Preview) */}
        <div className="flex justify-center relative z-10 pt-8 md:pt-0">
          <img
            alt={t("mobile.imageAlt")}
            className="w-full max-w-[280px] h-auto drop-shadow-2xl translate-y-8 md:translate-y-20 rounded-t-[36px]"
            src="https://lh3.googleusercontent.com/aida/AEtjO1X9CYAUv2zrsotHKAm-JB9YoIcl_td6MQ-NxBhlBglfohXniY0o86ctIkXITcuze1endro31eT9P4j0l1bx7YGRoi_8Fll8HjhwgAXjszSrSBFpABc6Iw77DvDfxM1yqLODznd3jX6DOAAoWWW0Jmx-esI3Kq3A_PA768SNuoAKQxAFkJzjlizbYL-1ni9W0872p8D4R5KNfNVJwUmzSIoeczcj2a__5lf1blSgWpfA2B9Ekray_4TwAhU"
          />
        </div>
      </div>
    </section>
  );
}
