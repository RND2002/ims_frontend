"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  register?: any;
}

export function PasswordField({ label, error, register, ...props }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 font-sans">
      <label className="text-[12px] font-semibold text-text-secondary leading-none">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          className={`w-full pl-3 pr-10 py-2.5 text-sm border rounded-lg bg-bg-surface text-slate-950 font-medium outline-none transition-all placeholder:text-text-secondary/50 ${
            error
              ? "border-danger-text focus:border-danger-text focus:ring-2 focus:ring-danger-bg"
              : "border-border-default focus:border-2 focus:border-brand focus:ring-4 focus:ring-brand-light/50"
          }`}
          {...(register || {})}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          {showPassword ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>
      {error && (
        <span className="text-[11px] font-medium text-danger-text">
          {error}
        </span>
      )}
    </div>
  );
}
