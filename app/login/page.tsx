"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    // fetch session to get role, then redirect
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;

    if (role === "admin") router.push("/");
    else if (role === "teacher") router.push("/");
    else if (role === "student") router.push("/");
    else router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(210_60%_97%)] px-4 py-10 sm:px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-md sm:p-8"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold">
            KG
          </div>
          <h1 className="text-lg font-semibold sm:text-xl">Kashmir Grammar School</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <Button type="submit" disabled={loading} className="mt-6 w-full">
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  );
}