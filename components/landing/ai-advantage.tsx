"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CheckCircle2 } from "lucide-react";

export function AIAdvantage() {
  const { t } = useLanguage();

  // Load points array dynamically or fallback safely
  const points = t("aiAdvantage.points") || [];

  return (
    <section className="w-full bg-brand-light py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Column (Text & Bullets) */}
        <div className="flex flex-col gap-6 order-2 lg:order-1">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            {t("aiAdvantage.title")}
          </h2>
          <p className="text-base text-text-secondary">
            {t("aiAdvantage.desc")}
          </p>

          <ul className="flex flex-col gap-6 mt-2">
            {Array.isArray(points) &&
              points.map((pt: any, idx: number) => (
                <li key={idx} className="flex gap-4 items-start">
                  <CheckCircle2 className="size-5 text-success-text shrink-0 mt-1" />
                  <div>
                    <h4 className="text-base font-semibold text-text-primary">
                      {pt.title}
                    </h4>
                    <p className="text-sm text-text-secondary mt-1">
                      {pt.desc}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        </div>

        {/* Right Column (Insights Image Mockup) */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <img
            alt={t("aiAdvantage.imageAlt")}
            className="w-full max-w-[488px] rounded-xl shadow-md border border-border-default/20 bg-bg-surface"
            src="https://lh3.googleusercontent.com/aida/AEtjO1UxFy2seGmrUgeMKTiSoPYxbk927BYTCIWlAd22JVd9BFREJaK2UP6hnBiAvL-hDcltz6PHrVEK0RhbMLohiQS2O54oG56LCx9-Aslqz0m_LJNSTgPgEB16STaXHAewdLltkNPslmrxY48eo_9sSnrNUtTkWD7WcufyPtGiv9T6I39qygTJgnwUlgUrcraOEz2dVKVs7BkjN8g-PSn1PowYZTlxocpz7tZVby5FtGKUVNVUfcm4_T2Gs_A"
          />
        </div>
      </div>
    </section>
  );
}
