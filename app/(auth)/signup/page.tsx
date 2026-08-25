"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupFormData } from "@/lib/schemas/auth";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { signupUser, loginUser } from "@/lib/features/auth/authSlice";
import { createNewStore } from "@/lib/features/stores/storesSlice";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { OtpInput } from "@/components/auth/OtpInput";
import { PasswordField } from "@/components/auth/PasswordField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/app/api/endpoints";

export default function SignupPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  // Steps: 1 = Phone, 2 = OTP, 3 = Details, 4 = Store creation
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Step 4 Store Setup local states
  const [storeName, setStoreName] = useState("");
  const [businessType, setBusinessType] = useState("Retail");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [gstinError, setGstinError] = useState<string | null>(null);

  // Single React Hook Form instance with Zod schema validation
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      phone: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate only the phone field using Zod
    const isPhoneValid = await trigger("phone");
    if (isPhoneValid) {
      setStep(2);
      setCountdown(30);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError(true);
      return;
    }
    setStep(3);
  };

  const handleDetailsSubmit = async (data: SignupFormData) => {
    try {
      // Step 1: Sign up User
      const signupRes = await dispatch(
        signupUser({
          name: data.name,
          phone: "+91" + data.phone,
          email: data.email || null,
          password: data.password,
        })
      ).unwrap();

      if (signupRes) {
        // Step 2: Auto Login on successful signup to acquire token
        await dispatch(
          loginUser({
            phone: "+91" + data.phone,
            password: data.password,
          })
        ).unwrap();
        
        // Advance to Store Setup step
        setStep(4);
      }
    } catch (err) {
      console.error("Signup/Onboarding failed:", err);
    }
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || gstinError) return;
    try {
      await dispatch(
        createNewStore({
          name: storeName,
          business_type: businessType,
          address: address || undefined,
          gstin: gstin || undefined,
        })
      ).unwrap();
      
      router.push("/dashboard");
    } catch (err) {
      console.error("Store creation failed during signup onboarding:", err);
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

                {/* <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-default" />
                  </div>
                  <span className="relative bg-bg-surface px-3 text-xs text-text-secondary uppercase tracking-wider font-semibold">
                    or
                  </span>
                </div> */}

                {/* <button
                  type="button"
                  className="w-full py-2.5 text-sm font-semibold border border-border-default rounded-lg text-text-primary bg-transparent hover:bg-bg-app transition-colors cursor-pointer"
                >
                  Continue with Email
                </button> */}
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
                <OtpInput value={otp} onChange={setOtp} error={otpError} />

                {otpError && (
                  <span className="text-center text-[11px] font-medium text-danger-text -mt-2">
                    Invalid verification code. Please try again.
                  </span>
                )}

                <Button
                  type="submit"
                  disabled={otp.length !== 6}
                  variant="cta"
                  size="xl"
                  className="w-full"
                >
                  Verify &amp; Continue
                </Button>

                <div className="text-center text-sm text-text-secondary mt-2">
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

                {/* Password */}
                <PasswordField
                  label="Password"
                  placeholder="Min 6 characters"
                  error={errors.password?.message}
                  register={register("password")}
                />

                {/* Confirm Password */}
                <PasswordField
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  error={errors.confirmPassword?.message}
                  register={register("confirmPassword")}
                />

                {/* Terms and Conditions */}
                <div className="flex items-start gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
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

          {step === 4 && (
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary font-sans">
                Setup your store
              </h1>
              <p className="mt-2 text-sm text-text-secondary font-sans">
                Create your first store workspace. You are just one step away from success!
              </p>

              <form onSubmit={handleStoreSubmit} noValidate className="mt-8 flex flex-col gap-5 font-sans">
                {/* Store Name */}
                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-[12px] font-semibold text-text-secondary leading-none">
                    Shop/Store Name
                  </label>
                  <Input
                    type="text"
                    placeholder="E.g. Rajesh Kirana Store"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                    className={!storeName.trim() ? "border-danger-text" : ""}
                  />
                </div>

                {/* Business Type */}
                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-[12px] font-semibold text-text-secondary leading-none">
                    Business Type
                  </label>
                  <Input
                    type="text"
                    placeholder="E.g. Retail, Grocery, Electronics"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                  />
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-[12px] font-semibold text-text-secondary leading-none">
                    Shop Address <span className="text-text-secondary/50 font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="E.g. Ground Floor, Sector 15, Noida"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* GSTIN */}
                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-[12px] font-semibold text-text-secondary leading-none">
                    GSTIN <span className="text-text-secondary/50 font-normal">(Optional, 15 chars)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="E.g. 07AAAAA1111A1Z1"
                    value={gstin}
                    maxLength={15}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGstin(val);
                      if (val && val.length !== 15) {
                        setGstinError("GSTIN must be exactly 15 characters");
                      } else {
                        setGstinError(null);
                      }
                    }}
                    className={gstinError ? "border-danger-text focus-visible:border-danger-text focus-visible:ring-2 focus-visible:ring-danger-bg" : ""}
                  />
                  {gstinError && (
                    <span className="text-[11px] font-medium text-danger-text">
                      {gstinError}
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !storeName.trim() || !!gstinError}
                  variant="cta"
                  size="xl"
                  className="w-full mt-2"
                >
                  {loading ? "Creating Store..." : "Create Store & Finish"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
