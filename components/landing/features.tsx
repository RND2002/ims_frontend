"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ReceiptText, Package, Landmark } from "lucide-react";

export function Features() {
  const { t } = useLanguage();

  const items = [
    {
      title: t("features.billingTitle"),
      icon: ReceiptText,
      description: t("features.billingDesc"),
    },
    {
      title: t("features.inventoryTitle"),
      icon: Package,
      description: t("features.inventoryDesc"),
    },
    {
      title: t("features.bankingTitle"),
      icon: Landmark,
      description: t("features.bankingDesc"),
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:px-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex flex-col gap-4 rounded-2xl border border-border-default bg-bg-surface p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Icon className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">{item.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
