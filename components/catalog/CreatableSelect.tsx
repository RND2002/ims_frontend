"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus } from "lucide-react";

export interface CreatableSelectOption {
  value: string;
  label: string;
}

interface CreatableSelectProps {
  label?: string;
  error?: string;
  options: CreatableSelectOption[];
  value?: string | null;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string | null) => void;
  onCreateOption: (value: string) => Promise<string | void>; // returns new option value
  createLabel?: string;
}

export function CreatableSelect({
  label,
  error,
  options,
  value,
  placeholder = "Select...",
  disabled = false,
  onChange,
  onCreateOption,
  createLabel = "Create",
}: CreatableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Find current label to display in the input
  const currentOption = options.find((o) => o.value === value);
  const displayValue = currentOption ? currentOption.label : "";

  // Update local search text when active value changes
  useEffect(() => {
    setSearch(displayValue);
  }, [displayValue]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search to active selection name
        setSearch(displayValue);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [displayValue]);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const showCreateOption =
    search.trim() !== "" &&
    !options.some((o) => o.label.toLowerCase() === search.trim().toLowerCase());

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleCreate = async () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    try {
      const newId = await onCreateOption(trimmed);
      if (newId) {
        onChange(newId);
      }
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to quick create option:", err);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 font-sans w-full text-left relative">
      {label && (
        <label className="text-[12px] font-semibold text-text-secondary leading-none text-left select-none">
          {label}
        </label>
      )}

      <div className="relative w-full">
        <input
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          value={search}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setSearch(""); // Clear search to show all options on focus
            }
          }}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (showCreateOption) {
                handleCreate();
              }
            }
          }}
          className={cn(
            "flex h-10 w-full appearance-none rounded-lg border border-border-default bg-bg-surface pl-3 pr-9 py-2 text-sm font-medium text-text-primary transition-all duration-200 outline-none placeholder:text-text-secondary/40 focus-visible:border-2 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand-light/50 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger-text focus-visible:border-danger-text focus-visible:ring-2 focus-visible:ring-danger-bg"
          )}
        />
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary cursor-pointer"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute left-0 right-0 top-[44px] z-50 rounded-xl border border-[#E4E4F0] bg-white shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "flex w-full items-center px-3.5 py-2.5 text-sm text-left font-medium hover:bg-[#F7F7FB] transition-colors cursor-pointer outline-none",
                    opt.value === value ? "text-brand font-bold bg-brand-light/40" : "text-[#151328]"
                  )}
                >
                  {opt.label}
                </button>
              ))
            ) : (
              !showCreateOption && (
                <div className="px-3.5 py-2.5 text-xs text-text-secondary font-medium">
                  No options found
                </div>
              )
            )}

            {/* Quick Create Option */}
            {showCreateOption && (
              <button
                type="button"
                onClick={handleCreate}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-left font-bold text-brand hover:bg-[#F7F7FB] border-t border-[#E4E4F0] transition-colors cursor-pointer outline-none"
              >
                <Plus className="h-4 w-4" />
                {createLabel} &ldquo;{search}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <span className="text-[11px] font-medium text-danger-text text-left">
          {error}
        </span>
      )}
    </div>
  );
}
