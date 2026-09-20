"use client";

import type { SubmitEvent } from "react";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ParallaxLayer from "@/components/ParallaxLayer";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import {
  resetPassword,
  signInWithGoogle,
  signInWithEmail,
  signUpNewUser,
} from "@/actions/auth";

type AuthMode = "login" | "signup" | "forgot";

function getAuthMode(value: string | null): AuthMode {
  return value === "signup" || value === "forgot" || value === "login"
    ? value
    : "login";
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialMode = getAuthMode(searchParams.get("mode"));
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [prevModeParam, setPrevModeParam] = useState(searchParams.get("mode"));
  const currentModeParam = searchParams.get("mode");
  if (currentModeParam !== prevModeParam) {
    setPrevModeParam(currentModeParam);
    setMode(getAuthMode(currentModeParam));
  }

  const nextParam = searchParams.get("next");
  const nextPath =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/apply";

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(nextPath);
    });
  }, [router, nextPath]);

  useEffect(() => {
    const resetLoadingState = () => setIsLoading(false);

    window.addEventListener("pageshow", resetLoadingState);
    return () => window.removeEventListener("pageshow", resetLoadingState);
  }, []);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setStatusMessage(null);
    setErrors({});
    const nextQuery = nextParam ? `&next=${encodeURIComponent(nextParam)}` : "";
    if (newMode === "forgot") {
      router.replace(`/auth?mode=forgot${nextQuery}`, { scroll: false });
    } else {
      router.replace(`/auth?mode=${newMode}${nextQuery}`, { scroll: false });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (mode === "forgot") {
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (!password) {
      newErrors.password = "Please enter your password.";
    } else if (mode === "signup" && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }

    if (mode === "signup") {
      if (!fullName.trim()) {
        newErrors.fullName = "Please enter your full name.";
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
      if (!termsAgreed) {
        newErrors.termsAgreed = "You must accept the terms and privacy policy.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const result = await signInWithEmail(email, password);
      setIsLoading(false);
      if (result.success) {
        router.push(nextPath);
        return;
      }
      setStatusMessage({ type: "error", text: result.error });
    } catch {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: "An error occurred while signing in.",
      });
    }
  };

  const handleSignUp = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const result = await signUpNewUser(
        fullName,
        email,
        password,
        confirmPassword,
        termsAgreed,
      );
      setIsLoading(false);
      setStatusMessage(result.success
        ? { type: "success", text: "Check your email to confirm your account." }
        : { type: "error", text: result.error });
    } catch {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: "An error occurred while creating your account.",
      });
    }
  };

  const handleForgotPassword = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const result = await resetPassword(email);
      setIsLoading(false);
      setStatusMessage(result.success
        ? { type: "success", text: "A reset link has been sent." }
        : { type: "error", text: result.error });
    } catch {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: "Failed to send reset link.",
      });
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    if (provider !== "google") return;

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const result = await signInWithGoogle(nextPath);
      if (result.success) {
        window.location.assign(result.url);
        return;
      }
      setIsLoading(false);
      setStatusMessage({ type: "error", text: result.error });
    } catch {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: "Unable to sign in with Google.",
      });
    }
  };

  return (
    <main className="relative flex flex-col min-h-screen">
      <Link href="/">
        <button
          type="button"
          className="
            fixed top-4 right-4 z-50
            rounded-full
            bg-button
            px-6 py-2
            font-outfit
            text-base text-white
            shadow-[0_0_20px_rgba(130,104,180,0.45)]
            transition-all duration-150
            md:px-8 md:py-3 md:text-lg
            hover:bg-[#8268B4]
            cursor-pointer
            hover:scale-105
          "
        >
          Return to Home
        </button>
      </Link>

      <div className="pointer-events-none absolute inset-0 [overflow-x:clip]" aria-hidden="true">
        <ParallaxLayer
          speed={0.25}
          className="
            absolute
            right-[-1rem]
            top-10
            w-44
            rotate-12
            md:right-6
            md:top-14
            md:w-72
            lg:right-12
            lg:top-16
            lg:w-80
            constellation-glow
            select-none
            opacity-80
            planet-float
          "
        >
          <img src="/Constellation.png" alt="" className="h-full w-full" />
        </ParallaxLayer>

        <ParallaxLayer
          speed={0.15}
          className="
            absolute
            top-[-80px]
            left-1/2
            w-[850px]
            -translate-x-1/2
            opacity-25
            blur-[1px]
            cloud-drift
            select-none
          "
        >
          <img src="/Cloud1.webp" alt="" className="h-full w-full" />
        </ParallaxLayer>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-3 group transition-transform hover:scale-[1.02]"
            >
              <img
                src="/favicon.ico"
                alt="Hack the Skies Logo"
                className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(193,185,242,0.5)]"
              />
              <span className="font-outfit text-3xl font-bold text-primary drop-shadow-[0_0_12px_rgba(193,185,242,0.6)]">
                Hack the Skies
              </span>
            </Link>
          </div>

          <div className="rounded-3xl bg-[#171329]/90 border border-primary/25 p-6 sm:p-8 shadow-[0_0_50px_rgba(107,87,155,0.25)] backdrop-blur-xl">
            {mode === "forgot" ? (
              <div className="mb-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="inline-flex items-center gap-1.5 text-primary/80 hover:text-primary font-outfit text-sm cursor-pointer transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Sign In
                </button>
                <span className="font-outfit text-xs text-primary/50 uppercase tracking-wider">
                  Password Recovery
                </span>
              </div>
            ) : (
              <div className="mb-6">
                <h1 className="font-outfit text-2xl font-bold text-primary drop-shadow-[0_0_10px_rgba(193,185,242,0.4)]">
                  {mode === "login" ? "Sign In" : "Sign Up"}
                </h1>
              </div>
            )}

            {mode !== "forgot" && (
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={isLoading}
                  className="
                    w-full
                    flex items-center justify-center gap-3
                    py-2.5 px-4
                    rounded-xl
                    bg-[#221c38]/80 hover:bg-[#2b2447]
                    border border-primary/30 hover:border-primary/60
                    text-primary hover:text-white
                    font-outfit text-sm sm:text-base font-medium
                    shadow-sm
                    transition-all duration-150
                    cursor-pointer
                  "
                >
                  <GoogleIcon className="w-5 h-5 flex-shrink-0" />
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center py-2">
                  <div className="w-full border-t border-primary/20" />
                  <span className="absolute px-3 bg-[#171329] text-xs font-outfit text-primary/60 uppercase tracking-wider">
                    or continue with email
                  </span>
                </div>
              </div>
            )}

            {statusMessage && (
              <div
                className={`mb-5 p-3.5 rounded-xl border text-sm font-outfit leading-relaxed ${
                  statusMessage.type === "success"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : statusMessage.type === "info"
                    ? "bg-purple-950/40 border-primary/40 text-primary"
                    : "bg-red-950/40 border-red-500/40 text-red-300"
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            {mode === "login" && (
              <form onSubmit={handleSignIn} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block text-primary font-outfit text-sm font-medium mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="signin-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`
                      w-full
                      px-4 py-3
                      border
                      ${errors.email ? "border-red-400" : "border-primary/40"}
                      rounded-xl
                      bg-[#221c38]/90
                      text-white
                      placeholder:text-primary/40
                      font-outfit text-base
                      focus:outline-none
                      focus:ring-2
                      ${errors.email ? "focus:ring-red-400" : "focus:ring-primary"}
                      transition-all
                    `}
                  />
                  {errors.email && (
                    <p className="text-red-400 font-outfit text-xs mt-1.5">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="signin-password"
                      className="block text-primary font-outfit text-sm font-medium"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-primary/70 hover:text-primary font-outfit text-xs hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="signin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`
                        w-full
                        px-4 py-3 pr-11
                        border
                        ${errors.password ? "border-red-400" : "border-primary/40"}
                        rounded-xl
                        bg-[#221c38]/90
                        text-white
                        placeholder:text-primary/40
                        font-outfit text-base
                        focus:outline-none
                        focus:ring-2
                        ${
                          errors.password
                            ? "focus:ring-red-400"
                            : "focus:ring-primary"
                        }
                        transition-all
                      `}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary cursor-pointer p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 font-outfit text-xs mt-1.5">
                      {errors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    w-full
                    mt-2
                    rounded-xl
                    bg-button
                    py-3.5 px-6
                    font-outfit font-semibold
                    text-base text-white
                    shadow-[0_0_20px_rgba(130,104,180,0.45)]
                    transition-all duration-150
                    hover:bg-[#8268B4]
                    hover:scale-[1.02]
                    active:scale-[0.98]
                    cursor-pointer
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            )}

            {mode === "signup" && (
              <form onSubmit={handleSignUp} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-primary font-outfit text-sm font-medium mb-1.5"
                  >
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className={`
                      w-full
                      px-4 py-3
                      border
                      ${errors.fullName ? "border-red-400" : "border-primary/40"}
                      rounded-xl
                      bg-[#221c38]/90
                      text-white
                      placeholder:text-primary/40
                      font-outfit text-base
                      focus:outline-none
                      focus:ring-2
                      ${errors.fullName ? "focus:ring-red-400" : "focus:ring-primary"}
                      transition-all
                    `}
                  />
                  {errors.fullName && (
                    <p className="text-red-400 font-outfit text-xs mt-1.5">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-primary font-outfit text-sm font-medium mb-1.5"
                  >
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`
                      w-full
                      px-4 py-3
                      border
                      ${errors.email ? "border-red-400" : "border-primary/40"}
                      rounded-xl
                      bg-[#221c38]/90
                      text-white
                      placeholder:text-primary/40
                      font-outfit text-base
                      focus:outline-none
                      focus:ring-2
                      ${errors.email ? "focus:ring-red-400" : "focus:ring-primary"}
                      transition-all
                    `}
                  />
                  {errors.email && (
                    <p className="text-red-400 font-outfit text-xs mt-1.5">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-primary font-outfit text-sm font-medium mb-1.5"
                  >
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      name="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className={`
                        w-full
                        px-4 py-3 pr-11
                        border
                        ${errors.password ? "border-red-400" : "border-primary/40"}
                        rounded-xl
                        bg-[#221c38]/90
                        text-white
                        placeholder:text-primary/40
                        font-outfit text-base
                        focus:outline-none
                        focus:ring-2
                        ${
                          errors.password
                            ? "focus:ring-red-400"
                            : "focus:ring-primary"
                        }
                        transition-all
                      `}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary cursor-pointer p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 font-outfit text-xs mt-1.5">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-primary font-outfit text-sm font-medium mb-1.5"
                  >
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className={`
                        w-full
                        px-4 py-3 pr-11
                        border
                        ${
                          errors.confirmPassword
                            ? "border-red-400"
                            : "border-primary/40"
                        }
                        rounded-xl
                        bg-[#221c38]/90
                        text-white
                        placeholder:text-primary/40
                        font-outfit text-base
                        focus:outline-none
                        focus:ring-2
                        ${
                          errors.confirmPassword
                            ? "focus:ring-red-400"
                            : "focus:ring-primary"
                        }
                        transition-all
                      `}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary cursor-pointer p-1"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 font-outfit text-xs mt-1.5">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded accent-button cursor-pointer flex-shrink-0"
                    />
                    <span className="text-primary/80 font-outfit text-xs leading-relaxed">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary underline hover:text-white"
                        target="_blank"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-primary underline hover:text-white"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.termsAgreed && (
                    <p className="text-red-400 font-outfit text-xs mt-1.5">
                      {errors.termsAgreed}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    w-full
                    mt-2
                    rounded-xl
                    bg-button
                    py-3.5 px-6
                    font-outfit font-semibold
                    text-base text-white
                    shadow-[0_0_20px_rgba(130,104,180,0.45)]
                    transition-all duration-150
                    hover:bg-[#8268B4]
                    hover:scale-[1.02]
                    active:scale-[0.98]
                    cursor-pointer
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>
              </form>
            )}

            {mode === "forgot" && (
              <form
                onSubmit={handleForgotPassword}
                noValidate
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-primary font-outfit text-sm font-medium mb-1.5"
                  >
                    Account Email Address
                  </label>
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`
                      w-full
                      px-4 py-3
                      border
                      ${errors.email ? "border-red-400" : "border-primary/40"}
                      rounded-xl
                      bg-[#221c38]/90
                      text-white
                      placeholder:text-primary/40
                      font-outfit text-base
                      focus:outline-none
                      focus:ring-2
                      ${errors.email ? "focus:ring-red-400" : "focus:ring-primary"}
                      transition-all
                    `}
                  />
                  {errors.email && (
                    <p className="text-red-400 font-outfit text-xs mt-1.5">
                      {errors.email}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    w-full
                    mt-2
                    rounded-xl
                    bg-button
                    py-3.5 px-6
                    font-outfit font-semibold
                    text-base text-white
                    shadow-[0_0_20px_rgba(130,104,180,0.45)]
                    transition-all duration-150
                    hover:bg-[#8268B4]
                    hover:scale-[1.02]
                    active:scale-[0.98]
                    cursor-pointer
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  {isLoading ? "Sending link..." : "Send Reset Link"}
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-primary/15 text-center font-outfit text-sm text-primary/70">
              {mode === "login" && (
                <p>
                  Don&apos;t have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Sign up now
                  </button>
                </p>
              )}
              {mode === "signup" && (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              )}
              {mode === "forgot" && (
                <p>
                  Remembered your password?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function Auth() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#141123]">
          <div className="font-outfit text-2xl text-primary animate-pulse">
            Loading Hack the Skies Auth...
          </div>
        </main>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
