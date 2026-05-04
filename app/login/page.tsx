"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    setError("Wrong password");
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden text-white">
      <img
        src="/msc-ship.jpg"
        alt="CrewOceanLink"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      <div className="relative z-10 min-h-screen flex flex-col px-5 py-6 sm:px-10 sm:py-8">
        <div className="flex justify-between items-center">
          <div className="text-2xl sm:text-3xl font-medium tracking-tight">
            CrewOceanLink
          </div>

          <div className="text-2xl sm:text-3xl text-white/65 font-medium">
            Login
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          <div className="w-full max-w-md sm:max-w-xl rounded-[1.5rem] sm:rounded-[2rem] border border-white/25 bg-black/20 backdrop-blur-[8px] shadow-[0_8px_40px_rgba(0,0,0,0.35)] px-5 py-7 sm:px-14 sm:py-12">
            <div className="flex justify-center mb-8">
              <svg
                width="72"
                height="72"
                viewBox="0 0 64 64"
                fill="none"
                className="text-white"
              >
                <path
                  d="M18 35L32 28L46 35V47C46 47 40 51 32 51C24 51 18 47 18 47V35Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M24 30V20H40V30"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M28 20V13H36V20"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M16 52C20 49 24 49 28 52C31 54 35 54 38 52C42 49 46 49 50 52"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M29 39H31"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M37 39H39"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-medium">Welcome back</h1>

              <p className="text-white/75 mt-8 text-sm">
                Login to your CrewOceanLink account.
              </p>
            </div>

            <div className="mt-7">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") login();
                }}
                className="
                  w-full rounded-xl border border-white/25
                  bg-black/25 px-5 py-4
                  text-white placeholder:text-white/45
                  outline-none focus:border-white/60
                "
              />

              {error && (
                <div className="mt-3 text-sm text-red-400 text-center">
                  {error}
                </div>
              )}

              <button
                onClick={login}
                disabled={loading}
                className="
                  mt-7 w-full rounded-xl bg-white text-black
                  py-4 font-medium
                  hover:bg-white/90 transition
                  disabled:opacity-60
                "
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="mt-8 flex items-center justify-center gap-2 text-white/60 text-sm">
                <span>◇</span>
                <span>Secure access</span>
              </div>
            </div>
          </div>

          <div className="text-center text-white/65 text-sm leading-relaxed">
            <div>
              Need help?{" "}
              <a
                href="mailto:info@crewoceanlink.com"
                className="underline hover:text-white"
              >
                info@crewoceanlink.com
              </a>
            </div>

            <div>
              WhatsApp:{" "}
              <a
                href="https://wa.me/41772800401"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                +41 77 280 04 01
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}