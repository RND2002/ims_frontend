"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupFormData } from "@/lib/schemas/auth";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useSendOtpMutation, useVerifyOtpMutation, useRegisterUserMutation } from "@/lib/features/auth/authApi";
import { apiSlice } from "@/lib/store/apiSlice";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { OtpInput } from "@/components/auth/OtpInput";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SignupPageContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [sendOtp] = useSendOtpMutation();
  const [verifyOtp] = useVerifyOtpMutation();
  const [registerUser] = useRegisterUserMutation();

  // Steps: 1 = Phone, 2 = OTP, 3 = Details
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Single React Hook Form instance with Zod schema validation
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      phone: "",
      name: "",
      email: "",
      terms: false,
    },
  });

  // Pre-fill phone if coming from URL search parameter (e.g. requires_onboarding redirection)
  const phoneParam = searchParams.get("phone");
  useEffect(() => {
    if (phoneParam) {
      setValue("phone", phoneParam.replace(/[^0-9]/g, "").slice(0, 10));
    }
  }, [phoneParam, setValue]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPhoneValid = await trigger("phone");
    if (isPhoneValid) {
      try {
        const phoneVal = getValues("phone");
        await sendOtp({ phone: "+91" + phoneVal }).unwrap();
        setStep(2);
        setCountdown(30);
        setOtpError(false);
      } catch (err) {
        console.error("Failed to send OTP:", err);
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setOtpError(true); return; }
    try {
      const phoneVal = getValues("phone");
      const res = await verifyOtp({ phone: "+91" + phoneVal, otp }).unwrap();
      if (res.status === "login_success") {
        router.push("/dashboard");
      } else if (res.status === "requires_onboarding") {
        setStep(3);
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      setOtpError(true);
    }
  };

  const handleResendOtp = async () => {
    try {
      const phoneVal = getValues("phone");
      await sendOtp({ phone: "+91" + phoneVal }).unwrap();
      setCountdown(30);
      setOtpError(false);
    } catch (err) {
      console.error("Failed to resend OTP:", err);
    }
  };

  const handleDetailsSubmit = async (data: SignupFormData) => {
    try {
      await registerUser({
        phone: "+91" + data.phone,
        name: data.name,
        email: data.email || null,
      }).unwrap();

      // Clear all stale RTK Query cache from previous user session
      dispatch(apiSlice.util.resetApiState());

      router.push("/dashboard");
    } catch (err) {
      console.error("Signup/Onboarding failed:", err);
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* Decorative Left Panel */}
      <AuthPanel />

      {/* Form Panel */}
      <div className="flex w-full flex-col justify-center bg-bg-surface px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Logo / Mobile brand header */}
          <div className="lg:hidden mb-8">
            <span className="font-serif text-3xl font-extrabold text-brand">
              Hisaab
            </span>
          </div>

          {step === 1 && (
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary font-sans">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-text-secondary font-sans">
                Start managing your shop in minutes — no credit card required.
              </p>

              <form onSubmit={handlePhoneSubmit} noValidate className="mt-8 flex flex-col gap-6 font-sans">
                {error && (
                  <div className="rounded-lg bg-danger-bg p-3 border border-danger-text/20">
                    <p className="text-xs font-semibold text-danger-text">{error}</p>
                  </div>
                )}

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
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-text-secondary font-sans">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-brand hover:text-brand-dark transition-colors"
                >
                  Log in
                </Link>
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary font-sans">
                Verify Mobile Number
              </h1>
              <p className="mt-2 text-sm text-text-secondary font-sans">
                Enter the 6-digit code sent to{" "}
                <span className="font-semibold text-text-primary">+91 {getValues("phone")}</span>.
              </p>

              <form onSubmit={handleOtpSubmit} className="mt-8 flex flex-col gap-6 font-sans">
                {error && (
                  <div className="rounded-lg bg-danger-bg p-3 border border-danger-text/20">
                    <p className="text-xs font-semibold text-danger-text">{error}</p>
                  </div>
                )}

                <OtpInput value={otp} onChange={setOtp} error={otpError} />

                {otpError && (
                  <span className="text-center text-[11px] font-medium text-danger-text -mt-2">
                    Invalid verification code. Please try again.
                  </span>
                )}

                <Button
                  type="submit"
                  disabled={otp.length !== 6 || loading}
                  variant="cta"
                  size="xl"
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </Button>

                <div className="text-center text-sm text-text-secondary mt-2">
                  {countdown > 0 ? (
                    <span>Resend OTP in 00:{countdown < 10 ? `0${countdown}` : countdown}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="font-semibold text-brand hover:text-brand-dark transition-colors cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary font-sans">
                Complete your profile
              </h1>
              <p className="mt-2 text-sm text-text-secondary font-sans">
                Enter your details to finish setting up your Hisaab dashboard.
              </p>

              <form
                onSubmit={handleSubmit(handleDetailsSubmit)}
                noValidate
                className="mt-8 flex flex-col gap-5 font-sans"
              >
                {error && (
                  <div className="rounded-lg bg-danger-bg p-3 border border-danger-text/20">
                    <p className="text-xs font-semibold text-danger-text">{error}</p>
                  </div>
                )}

                {/* Name */}
                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-[12px] font-semibold text-text-secondary leading-none">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="E.g. Rajesh Kumar"
                    {...register("name")}
                    className={errors.name ? "border-danger-text focus-visible:border-danger-text focus-visible:ring-2 focus-visible:ring-danger-bg" : ""}
                  />
                  {errors.name && (
                    <span className="text-[11px] font-medium text-danger-text">
                      {errors.name.message}
                    </span>
                  )}
                </div>

                {/* Email (Optional) */}
                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-[12px] font-semibold text-text-secondary leading-none">
                    Email Address <span className="text-text-secondary/50 font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="rajesh@example.com"
                    {...register("email")}
                    className={errors.email ? "border-danger-text focus-visible:border-danger-text focus-visible:ring-2 focus-visible:ring-danger-bg" : ""}
                  />
                  {errors.email && (
                    <span className="text-[11px] font-medium text-danger-text">
                      {errors.email.message}
                    </span>
                  )}
                </div>


                {/* Terms and Conditions */}
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      {...register("terms")}
                      className="mt-0.5 h-4 w-4 rounded border-border-default text-brand focus:ring-brand"
                    />
                    <label htmlFor="terms" className="text-xs font-semibold text-text-secondary select-none cursor-pointer leading-tight">
                      I agree to Hisaab's{" "}
                      <Link href="#" className="text-brand hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="#" className="text-brand hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  {errors.terms && (
                    <span className="text-[11px] font-medium text-danger-text">
                      {errors.terms.message}
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  variant="cta"
                  size="xl"
                  className="w-full mt-2"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-text-secondary font-sans">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-brand hover:text-brand-dark transition-colors"
                >
                  Log in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-bg-app">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-xs font-semibold text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
