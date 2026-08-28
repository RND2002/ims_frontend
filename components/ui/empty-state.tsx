"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl text-center select-none font-sans ${className || ""}`}>
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-50 border border-brand-light text-brand mb-4">
        <Icon className="h-8 w-8 text-[#4338CA]" />
      </div>
      <h3 className="text-base font-extrabold text-[#151328] mb-1">
        {title}
      </h3>
      <p className="text-xs font-semibold text-[#65637D] max-w-[280px] leading-relaxed mb-6">
        {description}
      </p>
      {actionText && onAction && (
        <Button
          onClick={onAction}
          variant="cta"
          size="md"
          className="bg-[#FF6B5B] hover:bg-[#E5503F] text-white border-none rounded-lg font-bold px-6 shadow-sm cursor-pointer select-none"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
