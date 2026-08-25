"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ExpensesPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-5 font-sans min-h-[60vh] items-center justify-center text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-extrabold text-[#151328] mb-2">
          {t("sidebar.nav.expenses")}
        </h1>
        <p className="text-xs font-semibold text-[#65637D] leading-relaxed">
          Track utility bills, staff wages, shop rent, and other operational expenses. Feature coming soon!
        </p>
      </div>
    </div>
  );
}
