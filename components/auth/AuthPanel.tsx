"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export function AuthPanel() {
  const { t } = useLanguage();

  return (
    <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#181535] to-[#4338CA] p-12 text-white lg:flex">
      {/* Decorative blurred background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-brand-light/10 blur-3xl" />
      </div>

      {/* Brand Header */}
      <div className="relative z-10 flex items-center gap-2">
        <span className="font-serif text-3xl font-extrabold tracking-tight text-white">
          Hisaab
        </span>
      </div>

      {/* Marketing / Decorative Illustration */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center">
        {/* Modern styled storefront SVG */}
        <div className="mb-8 flex h-64 w-64 items-center justify-center rounded-3xl bg-white/5 shadow-2xl backdrop-blur-md border border-white/10 p-6 animate-pulse duration-[6s]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-full w-full text-white"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Store roof/canopy */}
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
            <path d="M19 12h-2" />
            <path d="M7 12H5" />
            {/* Upward trend line representing growth */}
            <path
              d="M6 18l4-4 3 3 5-5"
              className="text-[#FF6B5B]"
              strokeWidth="2"
            />
            <path d="M14 12h4v4" className="text-[#FF6B5B]" strokeWidth="2" />
          </svg>
        </div>

        <h2 className="text-center font-serif text-3xl font-bold tracking-tight leading-snug max-w-md">
          Smart Billing &amp; Inventory for Modern Retailers
        </h2>
        <p className="mt-3 text-center text-sm text-text-on-dark-muted max-w-sm">
          Keep track of sales, control stock levels, detect mismatches automatically, and secure payments in real time.
        </p>
      </div>

      {/* Trust Badge Footer */}
      <div className="relative z-10 flex items-center gap-3 bg-white/5 rounded-2xl border border-white/10 px-5 py-4 backdrop-blur-sm self-start">
        <svg
          className="h-5 w-5 text-[#FF6B5B]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        {/* <span className="text-xs text-text-on-dark-muted font-medium">
          Bank-grade encryption. Your retail data is secure with us.
        </span> */}
      </div>
    </div>
  );
}
