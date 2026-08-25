"use client";

import { OTPInput, SlotProps } from "input-otp";

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  error?: boolean;
}

export function OtpInput({ value, onChange, error }: OtpInputProps) {
  return (
    <OTPInput
      maxLength={6}
      value={value}
      onChange={onChange}
      containerClassName="group flex items-center justify-between gap-2 max-w-[340px] mx-auto font-sans"
      render={({ slots }) => (
        <>
          {slots.map((slot, idx) => (
            <Slot key={idx} {...slot} error={error} />
          ))}
        </>
      )}
    />
  );
}

function Slot(props: SlotProps & { error?: boolean }) {
  return (
    <div
      className={`relative h-12 w-12 text-center text-lg font-bold border rounded-lg bg-bg-surface flex items-center justify-center transition-all ${
        props.isActive
          ? "border-2 border-brand ring-4 ring-brand-light/50"
          : props.error
          ? "border-danger-text ring-2 ring-danger-bg"
          : "border-border-default"
      }`}
    >
      {props.char !== null && <span>{props.char}</span>}
      {props.hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-0.5 h-5 bg-brand animate-pulse" />
        </div>
      )}
    </div>
  );
}
