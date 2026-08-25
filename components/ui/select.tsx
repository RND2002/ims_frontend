import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => {
    const selectElement = (
      <div className="relative w-full">
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-lg border border-border-default bg-bg-surface px-3 py-2 pr-9 text-sm font-medium text-text-primary transition-all duration-200 outline-none focus-visible:border-2 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand-light/50 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger-text focus-visible:border-danger-text focus-visible:ring-2 focus-visible:ring-danger-bg",
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron Icon */}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>
    );

    if (label || error) {
      return (
        <div className="flex flex-col gap-1.5 font-sans w-full text-left">
          {label && (
            <label className="text-[12px] font-semibold text-text-secondary leading-none text-left">
              {label}
            </label>
          )}
          {selectElement}
          {error && (
            <span className="text-[11px] font-medium text-danger-text text-left">
              {error}
            </span>
          )}
        </div>
      );
    }

    return selectElement;
  }
);

Select.displayName = "Select";

export { Select };
