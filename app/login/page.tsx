"use client";

import { useState, useTransition, Suspense } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { registerWebsiteStudent } from "./login-actions";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, BookOpen, GraduationCap, AlertCircle } from "lucide-react";

type Tab = "login" | "register";

function AuthForm() {
  const [tab, setTab] = useState<Tab>("login");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState<string | null>(null);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const msg = "Internet connection issue. Please check your network connection.";
      setLoginError(msg);
      toast.error(msg);
      return;
    }

    startTransition(async () => {
      try {
        const res = await signIn("credentials", {
          email: loginEmail.trim(),
          password: loginPassword,
          redirect: false,
        });

        if (res?.error) {
          let errorMsg = "Invalid email or password. Please try again.";
          if (res.error === "CredentialsSignin" || res.status === 401) {
            errorMsg = "Incorrect email or password. Please check your credentials.";
          } else {
            errorMsg = "Login failed. Please check your credentials or try again later.";
          }
          setLoginError(errorMsg);
          toast.error(errorMsg);
        } else if (!res?.ok && res?.status && res.status >= 400) {
          const errorMsg = "Login failed. Please check your credentials or network.";
          setLoginError(errorMsg);
          toast.error(errorMsg);
        } else {
          // Fallback to /dashboard; middleware will redirect website students to /notes
          const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
          window.location.href = callbackUrl || "/dashboard";
        }
      } catch (err: unknown) {
        let errorMsg = "Connection error. Please check your internet connection and try again.";
        if (err instanceof Error && err.message) {
          if (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("offline")) {
            errorMsg = "Internet connection issue. Please check your network connection.";
          }
        }
        setLoginError(errorMsg);
        toast.error(errorMsg);
      }
    });
  }

  function handleGoogleLogin() {
    setLoginError(null);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const msg = "Internet connection issue. Please check your network connection.";
      setLoginError(msg);
      toast.error(msg);
      return;
    }
    startTransition(async () => {
      try {
        const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
        await signIn("google", { callbackUrl: callbackUrl || "/dashboard" });
      } catch (err) {
        const msg = "Google sign-in failed. Please check your internet connection.";
        setLoginError(msg);
        toast.error(msg);
      }
    });
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError(null);

    if (regPassword !== regConfirm) {
      const msg = "Passwords do not match.";
      setRegError(msg);
      toast.error(msg);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const msg = "Internet connection issue. Please check your network connection.";
      setRegError(msg);
      toast.error(msg);
      return;
    }

    startTransition(async () => {
      try {
        const res = await registerWebsiteStudent(regName, regEmail, regPassword);
        if (!res.success) {
          setRegError(res.error);
          toast.error(res.error);
        } else {
          // Sign in after registration
          const signInRes = await signIn("credentials", {
            email: regEmail.trim(),
            password: regPassword,
            redirect: false,
          });
          if (signInRes?.error) {
            toast.error("Registered but couldn't log in. Please use the Login tab.");
            setTab("login");
          } else {
            window.location.href = "/onboarding";
          }
        }
      } catch (err: unknown) {
        let errorMsg = "Registration failed. Please check your connection and try again.";
        if (err instanceof Error && err.message) {
          if (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("offline")) {
            errorMsg = "Internet connection issue. Please check your network connection.";
          }
        }
        setRegError(errorMsg);
        toast.error(errorMsg);
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F0F7FF] via-white to-[#EEF4FF] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo + Heading */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="https://res.cloudinary.com/dggey8rb6/image/upload/v1788157055/evmwj2iaibk9hqqkkpbm.png"
              alt="The Learnex Academy"
              width={56}
              height={56}
              className="rounded-2xl shadow-md"
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">The Learnex Academy</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome to the portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-100 bg-white px-8 py-8 shadow-xl shadow-blue-50">
          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-gray-50 p-1">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  tab === t
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          {/* ── LOGIN TAB ── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm animate-in fade-in-50 duration-200">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                  <div className="flex-1 font-medium">{loginError}</div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                Login
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
              >
                {/* Google G icon */}
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <path d="M43.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11c-.5 2.7-1.9 4.9-4.1 6.4v5.3h6.6c3.9-3.6 6.1-8.9 6.1-15.7z" fill="#4285F4"/>
                  <path d="M24 44c5.4 0 10-1.8 13.3-4.9l-6.6-5.1c-1.8 1.2-4.1 1.9-6.7 1.9-5.2 0-9.6-3.5-11.1-8.2H6v5.3C9.4 39.6 16.2 44 24 44z" fill="#34A853"/>
                  <path d="M12.9 27.7c-.4-1.2-.6-2.4-.6-3.7s.2-2.5.6-3.7V15H6c-1.3 2.6-2 5.5-2 8.5s.7 5.9 2 8.5l6.9-4.3z" fill="#FBBC05"/>
                  <path d="M24 9.5c2.9 0 5.5 1 7.5 2.9l5.6-5.6C33.9 3.6 29.3 1.5 24 1.5 16.2 1.5 9.4 5.9 6 12.5l6.9 5.2c1.5-4.7 5.9-8.2 11.1-8.2z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <p className="mt-2 text-center text-xs text-gray-400">
                Are you a new student?{" "}
                <button type="button" onClick={() => setTab("register")} className="font-medium text-blue-600 hover:underline">
                  Register here
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTER TAB ── */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              {regError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm animate-in fade-in-50 duration-200">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                  <div className="flex-1 font-medium">{regError}</div>
                </div>
              )}

              <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-100">
                <GraduationCap size={20} className="shrink-0" />
                <p><strong>Note:</strong> Registration is only for students seeking access to online notes.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ali Hassan"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                Create Student Account
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <path d="M43.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11c-.5 2.7-1.9 4.9-4.1 6.4v5.3h6.6c3.9-3.6 6.1-8.9 6.1-15.7z" fill="#4285F4"/>
                  <path d="M24 44c5.4 0 10-1.8 13.3-4.9l-6.6-5.1c-1.8 1.2-4.1 1.9-6.7 1.9-5.2 0-9.6-3.5-11.1-8.2H6v5.3C9.4 39.6 16.2 44 24 44z" fill="#34A853"/>
                  <path d="M12.9 27.7c-.4-1.2-.6-2.4-.6-3.7s.2-2.5.6-3.7V15H6c-1.3 2.6-2 5.5-2 8.5s.7 5.9 2 8.5l6.9-4.3z" fill="#FBBC05"/>
                  <path d="M24 9.5c2.9 0 5.5 1 7.5 2.9l5.6-5.6C33.9 3.6 29.3 1.5 24 1.5 16.2 1.5 9.4 5.9 6 12.5l6.9 5.2c1.5-4.7 5.9-8.2 11.1-8.2z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <p className="mt-2 text-center text-xs text-gray-400">
                Already have an account?{" "}
                <button type="button" onClick={() => setTab("login")} className="font-medium text-blue-600 hover:underline">
                  Login
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <BookOpen size={13} />
          For staff and students of The Learnex Academy
        </p>
      </div>
    </div>
  );
}

// Next 16+ requires Suspense for useSearchParams if deployed statically, although
// Next.js client components using window.location.search directly technically don't throw 
// Next errors unless using the useSearchParams hook. Just keeping it simple.
export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}>
      <AuthForm />
    </Suspense>
  );
}