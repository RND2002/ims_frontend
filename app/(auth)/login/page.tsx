"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/lib/schemas/auth";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { loginUser } from "@/lib/features/auth/authSlice";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { OtpInput } from "@/components/auth/OtpInput";
import { PasswordField } from "@/components/auth/PasswordField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  // Steps: 1 = Phone, 2 = OTP + Password
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [rememberDevice, setRememberDevice] = useState(false);

  // React Hook Form for full login validation
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  // Countdown timer for OTP
  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate phone input using Zod before advancing
    const isPhoneValid = await trigger("phone");
    if (isPhoneValid) {
      setStep(2);
      setCountdown(30);
    }
  };

  const handleLoginSubmit = async (data: LoginFormData) => {
    if (otp.length !== 6) {
      setOtpError(true);
      return;
    }

    try {
      await dispatch(
        loginUser({
          phone: "+91" + data.phone,
          password: data.password,
        })
      ).unwrap();

      router.push("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-bg-app p-4">
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="rounded-2xl bg-bg-surface p-8 shadow-[0_8px_30px_rgb(21,19,40,0.04)] border border-border-default">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <span className="font-serif text-3xl font-extrabold text-brand tracking-tight">
              Hisaab
            </span>
          </div>

          {step === 1 && (
            <div>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
                  Welcome back
                </h1>
                <p className="mt-1.5 text-sm text-text-secondary font-sans">
                  Log in to your shop dashboard.
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} noValidate className="mt-8 flex flex-col gap-6 font-sans">
                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-[12px] font-semibold text-text-secondary leading-none">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-secondary">
                      +91
                    </span>
                    <Input
                      type="tel"
                      placeholder="98765 43210"
                      {...register("phone", {
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                        }
                      })}
                      className={`pl-12 ${errors.phone ? "border-danger-text focus-visible:border-danger-text focus-visible:ring-2 focus-visible:ring-danger-bg" : ""}`}
                    />
                  </div>
                  {errors.phone && (
                    <span className="text-[11px] font-medium text-danger-text">
                      {errors.phone.message}
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="cta"
                  size="xl"
                  className="w-full"
                >
                  Send OTP
                </Button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
                  Verify &amp; Enter Password
                </h1>
                <p className="mt-1.5 text-sm text-text-secondary font-sans">
                  Enter OTP sent to <span className="font-semibold text-text-primary">+91 {getValues("phone")}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit(handleLoginSubmit)} noValidate className="flex flex-col gap-5 font-sans">
                {error && (
                  <div className="rounded-lg bg-danger-bg p-3 border border-danger-text/20">
                    <p className="text-xs font-semibold text-danger-text">{error}</p>
                  </div>
                )}

                {/* OTP Input */}
                <div className="flex flex-col gap-2">
                  <OtpInput value={otp} onChange={setOtp} error={otpError} />
                  {otpError && (
                    <span className="text-center text-[11px] font-medium text-danger-text">
                      Invalid verification code.
                    </span>
                  )}
                </div>

                <div className="text-center text-xs text-text-secondary -mt-1">
                  {countdown > 0 ? (
                    <span>Resend OTP in 00:{countdown < 10 ? `0${countdown}` : countdown}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCountdown(30)}
                      className="font-semibold text-brand hover:text-brand-dark transition-colors cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Password field */}
                <PasswordField
                  label="Account Password"
                  placeholder="Enter password"
                  error={errors.password?.message}
                  register={register("password")}
                />

                {/* Remember me checkbox */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="h-4 w-4 rounded border-border-default text-brand focus:ring-brand"
                  />
                  <label htmlFor="remember" className="text-xs font-semibold text-text-secondary select-none cursor-pointer">
                    Remember this device
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={otp.length !== 6 || loading}
                  variant="cta"
                  size="xl"
                  className="w-full mt-2"
                >
                  {loading ? "Logging In..." : "Log In"}
                </Button>
              </form>
            </div>
          )}

          <div className="mt-6 text-center">
            <button className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors cursor-pointer">
              Having trouble? Contact support
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary font-sans">
          New to Hisaab?{" "}
          <Link
            href="/signup"
            className="font-semibold text-brand hover:text-brand-dark transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
