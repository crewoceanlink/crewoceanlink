"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CrewLoginPage() {
  const router = useRouter();
  const [voucherCode, setVoucherCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getOrCreateDeviceId = () => {
    const key = "crew_device_id";
    const existing = window.localStorage.getItem(key);

    if (existing) return existing;

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? `browser-${crypto.randomUUID()}`
        : `browser-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    window.localStorage.setItem(key, id);
    return id;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const code = String(voucherCode || "").trim().toUpperCase();
      const deviceId = getOrCreateDeviceId();

      const res = await fetch("/api/crew/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voucherCode: code,
          deviceId,
          deviceName: navigator?.userAgent || "Crew Device",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      window.localStorage.setItem("crew_session_id", data.session_id);
      window.localStorage.setItem("crew_voucher_code", code);

      router.push(
        `/crew/dashboard?voucher=${encodeURIComponent(code)}&session=${encodeURIComponent(
          data.session_id
        )}`
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="h-screen w-full relative text-white overflow-hidden">
      <img
        src="/msc-ship.jpg"
        className="absolute w-full h-full object-cover"
        alt="msc ship"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/35"></div>

      <div className="absolute top-6 left-7 right-7 flex justify-between items-center z-20">
        <h1 className="text-white text-xl font-medium">
          CrewOceanLink
        </h1>

        <span className="text-white text-xl font-medium">
          Crew Login
        </span>
      </div>

      <div className="relative z-10 flex items-end justify-center min-h-screen pb-4 px-4 pt-20">
        <div
          className="
            w-full h-[calc(100vh-6rem)] mx-auto rounded-3xl
            bg-white/[0.02] backdrop-saturate-150
            backdrop-blur-[4px]
            border border-white/20
            shadow-[0_8px_32px_rgba(0,0,0,0.25)]
            p-4 flex flex-col
          "
        >
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 px-4 py-3">
            <div className="px-4 py-1.5 rounded-full bg-white/30 text-white text-sm inline-block">
              Crew Internet Access
            </div>
          </div>

          <div className="mt-6 px-2">
            <h2 className="text-3xl font-medium text-white">
              Connect now
            </h2>

            <p className="text-white/80 mt-2 text-base leading-relaxed">
              Enter your voucher to get online and check your data balance.
            </p>
          </div>

          <div
            className="
              mt-6
              rounded-2xl
              bg-white/5
              backdrop-blur-[6px]
              border border-white/15
              shadow-inner
              p-4
            "
          >
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Enter voucher code"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
                className="
                  w-full rounded-2xl bg-white/15 text-white
                  placeholder:text-white/60
                  px-4 py-4
                  border border-white/20
                  outline-none
                  text-base
                "
              />

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full rounded-2xl bg-white
                  px-4 py-4 border border-white/20
                  shadow-[0_4px_20px_rgba(0,0,0,0.25)]
                  text-gray-700 font-semibold text-lg
                  disabled:opacity-60
                "
              >
                {loading ? "Connecting..." : "Connect to Internet"}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-2xl bg-red-500/15 border border-red-400/20 px-4 py-3 text-red-100 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="mt-auto pt-4">
            <div className="rounded-2xl bg-white/[0.06] border border-white/15 px-4 py-3 backdrop-blur-sm">
              <div className="text-white text-sm">
                Private crew access
              </div>
              <div className="text-white/70 text-xs mt-1">
                One voucher. One device. Live data tracking.
              </div>
            </div>

            <div className="mt-4 text-center text-white/75 text-xs space-y-1">
              <div>
                Need help?{" "}
                <a
                  href="mailto:info@crewoceanlink.com"
                  className="text-white font-medium"
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
                  className="text-white font-medium"
                >
                  +41 77 280 04 01
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}