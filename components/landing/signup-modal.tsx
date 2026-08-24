"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { X, CheckCircle } from "lucide-react";

type SignupModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    shopName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t("signup.errorRequired");
    if (!formData.shopName.trim()) newErrors.shopName = t("signup.errorRequired");
    if (!formData.email.trim()) newErrors.email = t("signup.errorRequired");
    if (!formData.password.trim()) newErrors.password = t("signup.errorRequired");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API registration delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ name: "", shopName: "", email: "", password: "" });
        onClose();
      }, 3000);
    }, 1500);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay backdrop: #151328 at 50% opacity */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#151328]/50 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Modal Surface: bg-surface (#FFFFFF), rounded 12px, shadow 0 8px 24px */}
      <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-xl bg-bg-surface p-6 shadow-[0_8px_24px_rgba(21,19,40,0.08)] transition-all animate-in fade-in zoom-in-95 duration-200 font-sans">
        
        {/* Success State */}
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="size-16 text-success-text mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-text-primary">
              {t("signup.successTitle")}
            </h3>
            <p className="mt-2 text-sm text-text-secondary max-w-xs">
              {t("signup.successDesc")}
            </p>
          </div>
        ) : (
          /* Form Content */
          <div>
            {/* Modal Header: text-primary, bottom border border-default */}
            <div className="flex items-center justify-between border-b border-border-default pb-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  {t("signup.title")}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {t("signup.subtitle")}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary leading-none">
                  {t("signup.nameLabel")}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder={t("signup.namePlaceholder")}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-bg-surface text-text-primary outline-none transition-all placeholder:text-text-secondary/60 ${
                    errors.name
                      ? "border-danger-text focus:border-danger-text focus:ring-2 focus:ring-danger-bg"
                      : "border-border-default focus:border-2 focus:border-brand focus:ring-4 focus:ring-brand-light/50"
                  }`}
                />
                {errors.name && (
                  <span className="text-[11px] font-medium text-danger-text">
                    {errors.name}
                  </span>
                )}
              </div>

              {/* Shop Name Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary leading-none">
                  {t("signup.shopLabel")}
                </label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => handleChange("shopName", e.target.value)}
                  placeholder={t("signup.shopPlaceholder")}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-bg-surface text-text-primary outline-none transition-all placeholder:text-text-secondary/60 ${
                    errors.shopName
                      ? "border-danger-text focus:border-danger-text focus:ring-2 focus:ring-danger-bg"
                      : "border-border-default focus:border-2 focus:border-brand focus:ring-4 focus:ring-brand-light/50"
                  }`}
                />
                {errors.shopName && (
                  <span className="text-[11px] font-medium text-danger-text">
                    {errors.shopName}
                  </span>
                )}
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary leading-none">
                  {t("signup.emailLabel")}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder={t("signup.emailPlaceholder")}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-bg-surface text-text-primary outline-none transition-all placeholder:text-text-secondary/60 ${
                    errors.email
                      ? "border-danger-text focus:border-danger-text focus:ring-2 focus:ring-danger-bg"
                      : "border-border-default focus:border-2 focus:border-brand focus:ring-4 focus:ring-brand-light/50"
                  }`}
                />
                {errors.email && (
                  <span className="text-[11px] font-medium text-danger-text">
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary leading-none">
                  {t("signup.passwordLabel")}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={t("signup.passwordPlaceholder")}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-bg-surface text-text-primary outline-none transition-all placeholder:text-text-secondary/60 ${
                    errors.password
                      ? "border-danger-text focus:border-danger-text focus:ring-2 focus:ring-danger-bg"
                      : "border-border-default focus:border-2 focus:border-brand focus:ring-4 focus:ring-brand-light/50"
                  }`}
                />
                {errors.password && (
                  <span className="text-[11px] font-medium text-danger-text">
                    {errors.password}
                  </span>
                )}
              </div>

              {/* Disabled Field Demonstration (Referral code) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary leading-none">
                  Referral/Promo Code (Optional)
                </label>
                <input
                  type="text"
                  value="FREE-TRIAL-50"
                  disabled
                  className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-app text-text-on-dark-muted cursor-not-allowed select-none"
                />
              </div>

              {/* Modal Buttons (Footer actions) */}
              <div className="flex items-center justify-end gap-3 border-t border-border-default pt-4 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium border border-border-default rounded-lg text-text-secondary bg-transparent hover:bg-bg-app transition-colors cursor-pointer"
                >
                  {t("signup.cancel")}
                </button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-cta hover:bg-cta-dark text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : t("signup.submit")}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
