"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  const links = [
    { label: t("footer.privacy"), href: "#" },
    { label: t("footer.terms"), href: "#" },
    { label: t("footer.contact"), href: "#" },
    { label: t("footer.docs"), href: "#" },
  ];

  return (
    <footer className="w-full bg-bg-surface border-t border-border-default py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Left Side */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link href="#" className="text-xl font-bold text-primary">
            Hisaab
          </Link>
          <p className="text-xs text-text-secondary">
            {t("footer.copyright")}
          </p>
        </div>

        {/* Right Side Link List */}
        <div className="flex flex-wrap justify-center gap-6">
          {links.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className="text-xs text-text-secondary hover:text-primary transition-colors underline decoration-border-default hover:decoration-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
