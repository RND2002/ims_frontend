"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface ProductEmptyStateProps {
  onAddClick: () => void;
}

export function ProductEmptyState({ onAddClick }: ProductEmptyStateProps) {
  const { t } = useLanguage();

  return (
    <EmptyState
      icon={Package}
      title={t("catalog.noProductsYet")}
      description={t("catalog.noProductsYetDesc")}
      actionText={t("catalog.addFirstProduct")}
      onAction={onAddClick}
      className="border border-[#E4E4F0]"
    />
  );
}
