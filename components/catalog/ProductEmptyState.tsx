"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductEmptyStateProps {
  onAddClick: () => void;
}

export function ProductEmptyState({ onAddClick }: ProductEmptyStateProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-[#E4E4F0] text-center select-none font-sans">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-50 border border-brand-light text-brand mb-4">
        <Package className="h-8 w-8 text-[#4338CA]" />
      </div>
      <h3 className="text-base font-extrabold text-[#151328] mb-1">
        {t("catalog.noProductsYet")}
      </h3>
      <p className="text-xs font-semibold text-[#65637D] max-w-[280px] leading-relaxed mb-6">
        {t("catalog.noProductsYetDesc")}
      </p>
      <Button
        onClick={onAddClick}
        variant="cta"
        size="md"
        className="bg-[#FF6B5B] hover:bg-[#E5503F] text-white border-none rounded-lg font-bold px-6 shadow-sm cursor-pointer select-none"
      >
        {t("catalog.addFirstProduct")}
      </Button>
    </div>
  );
}
