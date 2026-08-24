"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Store, ShoppingBag, ShoppingBasket, Warehouse, Utensils } from "lucide-react";

export function SocialProof() {
  const { t } = useLanguage();

  const storeTypes = [
    { name: t("social.retail"), icon: Store },
    { name: t("social.supermarket"), icon: ShoppingBag },
    { name: t("social.grocery"), icon: ShoppingBasket },
    { name: t("social.boutique"), icon: Warehouse },
    { name: t("social.restaurant"), icon: Utensils },
  ];

  return (
    <section className="w-full bg-bg-surface border-t border-border-default py-12 text-center">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <p className="text-sm font-semibold tracking-wider text-text-secondary uppercase">
          {t("social.title")}
        </p>
        <div className="flex justify-center gap-12 mt-8 opacity-60 grayscale flex-wrap items-center">
          {storeTypes.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <Icon className="size-8 text-text-primary" />
                <span className="text-[11px] text-text-secondary font-medium tracking-wide">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
