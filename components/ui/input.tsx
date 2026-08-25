import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    const inputElement = (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-border-default bg-bg-surface px-3 py-2 text-sm text-slate-955 font-medium transition-all duration-200 outline-none placeholder:text-text-secondary/40 focus-visible:border-2 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand-light/50 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-danger-text focus-visible:border-danger-text focus-visible:ring-2 focus-visible:ring-danger-bg",
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (label || error) {
      return (
        <div className="flex flex-col gap-1.5 font-sans w-full text-left">
          {label && (
            <label className="text-[12px] font-semibold text-text-secondary leading-none text-left">
              {label}
            </label>
          )}
          {inputElement}
          {error && (
            <span className="text-[11px] font-medium text-danger-text text-left">
              {error}
            </span>
          )}
        </div>
      );
    }

    return inputElement;
  }
);

Input.displayName = "Input";

export { Input };
