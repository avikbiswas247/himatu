"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "Sign in – Nike",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const user = await api.post("/api/users/login", {
        email,
        password,
      });
      localStorage.setItem("user", JSON.stringify(user));
      window.location.href = "/";
    } catch (err: any) {
      setMessage(err.message || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-black min-h-screen">
      <Navbar />

      <section className="py-20 px-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="flex flex-col justify-center lg:pr-12">
              <h2 className="mb-6 text-[40px] font-black uppercase leading-tight">
                Join Nike
              </h2>
              <p className="text-[13px] text-black/60 mb-8">
                Sign in to access your orders, wishlist, and member benefits.
              </p>
              <Link
                href="/register"
                className="text-[11px] font-bold uppercase tracking-widest hover:text-black/60"
              >
                Create an account
                <span className="ml-1 text-[10px]">→</span>
              </Link>
            </div>

            <div className="border border-black p-10 lg:pl-12">
              <h3 className="mb-8 text-[14px] font-bold uppercase tracking-widest">Sign in</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {message && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-red-900">
                    {message}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-black/50">
                Don't have an account?
                <Link
                  href="/register"
                  className="ml-1 hover:text-black"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
