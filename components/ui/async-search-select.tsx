"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, ChevronDown, Plus, Loader2 } from "lucide-react";

export interface AsyncOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  meta?: Record<string, any>;
}

interface AsyncSearchSelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string | null;
  displayValue?: string;
  disabled?: boolean;
  onSearch: (query: string) => Promise<AsyncOption[]>;
  onChange: (option: AsyncOption | null) => void;
  onCreateOption?: (inputValue: string) => Promise<AsyncOption | void>;
  createLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

export function AsyncSearchSelect({
  label,
  error,
  placeholder = "Search...",
  value,
  displayValue = "",
  disabled = false,
  onSearch,
  onChange,
  onCreateOption,
  createLabel = "Create",
  size = "md",
  className,
}: AsyncSearchSelectProps) {
  const [inputValue, setInputValue] = useState(displayValue);
  const [options, setOptions] = useState<AsyncOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(displayValue);
  }, [displayValue]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setInputValue(displayValue);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [displayValue]);

  const doSearch = useCallback(
    async (query: string) => {
      setIsLoading(true);
      try {
        const results = await onSearch(query);
        setOptions(results);
        setHighlightIdx(0);
      } catch {
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [onSearch]
  );

  const handleFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    inputRef.current?.select();
    doSearch(inputValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 200);
  };

  const handleSelect = (opt: AsyncOption) => {
    onChange(opt);
    setInputValue(opt.label);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setInputValue("");
    setOptions([]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const showCreate =
    onCreateOption &&
    inputValue.trim() !== "" &&
    !options.some((o) => o.label.toLowerCase() === inputValue.trim().toLowerCase());

  const handleCreate = async () => {
    if (!onCreateOption || !inputValue.trim()) return;
    setIsLoading(true);
    try {
      const result = await onCreateOption(inputValue.trim());
      if (result) {
        onChange(result);
        setInputValue(result.label);
      }
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, options.length - 1 + (showCreate ? 1 : 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen) {
        if (showCreate && highlightIdx === options.length) {
          handleCreate();
        } else if (options[highlightIdx]) {
          handleSelect(options[highlightIdx]);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setInputValue(displayValue);
    }
  };

  const inputHeight = size === "sm" ? "h-9" : "h-10";

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-1.5 font-sans w-full text-left relative", className)}>
      {label && (
        <label className="text-[12px] font-semibold text-text-secondary leading-none text-left select-none">
          {label}
        </label>
      )}

      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          value={inputValue}
          onFocus={handleFocus}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            `flex ${inputHeight} w-full rounded-lg border border-border-default bg-bg-surface pl-3 pr-9 py-2 text-sm font-medium text-text-primary transition-all duration-200 outline-none placeholder:text-text-secondary/40 focus-visible:border-2 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand-light/50 disabled:cursor-not-allowed disabled:opacity-50`,
            value && "border-brand/40 bg-brand-light/10",
            error && "border-danger-text focus-visible:border-danger-text focus-visible:ring-2 focus-visible:ring-danger-bg"
          )}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-text-secondary" />}
          {value && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {!value && !isLoading && (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-text-secondary transition-transform duration-200 cursor-pointer",
                isOpen && "rotate-180"
              )}
              onClick={() => !disabled && (isOpen ? setIsOpen(false) : handleFocus())}
            />
          )}
        </div>

        {isOpen && !disabled && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-[#E4E4F0] bg-white shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 py-1">
            {options.length > 0
              ? options.map((opt, idx) => (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "flex w-full items-center justify-between px-3.5 py-2.5 text-sm text-left cursor-pointer outline-none transition-colors",
                      idx === highlightIdx ? "bg-[#EEF2FF] text-[#151328]" : "hover:bg-[#F7F7FB] text-[#151328]",
                      opt.value === value && "font-bold"
                    )}
                  >
                    <div>
                      <span className="font-medium block">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-text-secondary block mt-0.5">{opt.sublabel}</span>
                      )}
                    </div>
                    {opt.badge && (
                      <span className="text-[10px] font-mono text-text-secondary shrink-0 ml-2">{opt.badge}</span>
                    )}
                  </button>
                ))
              : !showCreate && (
                  <div className="px-3.5 py-2.5 text-xs text-text-secondary font-medium">
                    {isLoading ? "Searching..." : "No results found"}
                  </div>
                )}

            {showCreate && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCreate}
                className={cn(
                  "flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-left font-bold text-brand hover:bg-[#F7F7FB] transition-colors cursor-pointer outline-none",
                  options.length > 0 && "border-t border-[#E4E4F0]"
                )}
              >
                <Plus className="h-4 w-4" />
                {createLabel} &ldquo;{inputValue}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <span className="text-[11px] font-medium text-danger-text text-left">{error}</span>
      )}
    </div>
  );
}
