// @ts-nocheck
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CrewDashboardContent() {
  const searchParams = useSearchParams();
    const router = useRouter();

  const voucherCode =
    searchParams.get("voucher") ||
    searchParams.get("voucherCode") ||
    searchParams.get("vouchercode") ||
    searchParams.get("code") ||
    "";

  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState(null);
  const [partnerName, setPartnerName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadVoucher = async () => {
      if (!voucherCode) {
        setError("Missing voucher code");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/crew/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voucherCode }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.message || "Voucher not found");
          setLoading(false);
          return;
        }

        setVoucher(data.voucher);
        setPartnerName(data.voucher?.assigned_to || "your crew partner");
      } catch (err) {
        console.error(err);
        setError("Failed to load voucher");
      }

      setLoading(false);
    };

    loadVoucher();

    const interval = setInterval(() => {
      loadVoucher();
    }, 15000);

    return () => clearInterval(interval);
  }, [voucherCode]);

  const logout = async () => {
    try {
      await fetch("/api/voucher/logout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Dashboard logout cleanup failed:", err);
    }

    window.location.href = "http://10.10.10.1/logout";
  };

  const formatGB = (value) => `${Number(value || 0).toFixed(3)} GB`;

    const getVoucherRecommendation = (type) => {
    const key = String(type || "").toUpperCase();

    if (key === "1GB") return "Good for messaging & light browsing";
    if (key === "5GB") return "Recommended for daily browsing & calls";
    if (key === "10GB") return "Better for streaming & regular use";
    if (key === "20GB") return "Recommended for heavy users & streaming";
    if (key === "50GB") return "Best for long voyages & shared usage";

    return "Recommended for onboard internet access";
  };

  const getVoucherPrice = (type, planType) => {
    const key = String(type || "").toUpperCase();
    const plan = String(planType || "").toLowerCase();

    const prices = {
      small: {
        "1GB": 7,
        "5GB": 34,
        "10GB": 67,
        "20GB": 132,
        "50GB": 330,
      },
      large: {
        "1GB": 5,
        "5GB": 24,
        "10GB": 45,
        "20GB": 85,
        "50GB": 200,
      },
    };

    return prices[plan]?.[key] || 0;
  };

  const voucherOptions = ["1GB", "5GB", "10GB", "20GB", "50GB"];

  const totalGb = Number(voucher?.gb_total || 0);
  const realUsedGb = Number(voucher?.gb_used || 0);

  const displayUsedGb = Math.min(realUsedGb, totalGb);
  const displayRemainingGb = Math.max(0, totalGb - realUsedGb);

  const isVoucherUsed =
    voucher && (realUsedGb >= totalGb || voucher.status === "exhausted");

  const usagePercent =
    totalGb > 0 ? Math.min(100, Math.round((displayUsedGb / totalGb) * 100)) : 0;

  const remainingPercent =
    totalGb > 0 ? Math.max(0, (displayRemainingGb / totalGb) * 100) : 0;

  const isNearLimit = remainingPercent <= 20 && !isVoucherUsed;
  let statusText = "Ready";
  let statusColor = "bg-green-400";
  let barColor = "bg-green-500";

  if (isVoucherUsed) {
    statusText = "Voucher used";
    statusColor = "bg-red-400";
    barColor = "bg-red-500";
  } else if (remainingPercent < 5) {
    statusText = "Critical";
    statusColor = "bg-red-400";
    barColor = "bg-red-500";
  } else if (remainingPercent < 20) {
    statusText = "Low";
    statusColor = "bg-yellow-400";
    barColor = "bg-yellow-500";
  }

  if (loading) return null;

  if (error) {
    return (
      <div className="h-screen w-full bg-black text-white flex items-center justify-center">
        {error}
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative text-white overflow-hidden">
      <img
        src="/msc-ship.jpg"
        className="absolute w-full h-full object-cover"
        alt="msc ship"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/35"></div>

      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-7 sm:right-7 flex justify-between items-center z-20">
        <h1 className="text-white text-base sm:text-xl font-medium">
          CrewOceanLink
        </h1>

        <div className="flex items-center gap-3">
          <span className="text-white text-base sm:text-xl font-medium">
            Crew Dashboard
          </span>

          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-center h-screen pb-3 px-3 pt-16 sm:pb-4 sm:px-4 sm:pt-20">
        <div
          className="
            w-full max-w-5xl h-[calc(100vh-4.75rem)] sm:h-[calc(100vh-6rem)]
            mx-auto rounded-3xl
            bg-white/[0.02] backdrop-saturate-150
            backdrop-blur-[4px]
            border border-white/20
            shadow-[0_8px_32px_rgba(0,0,0,0.25)]
            p-3 sm:p-4 flex flex-col
          "
        >
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 px-3 py-2 sm:px-4 sm:py-2.5 flex justify-center items-center shrink-0">
            <div className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/30 text-white text-xs sm:text-sm">
              Voucher {voucher.voucher_code}
            </div>
          </div>

          <div className="mt-3 sm:mt-4 px-2 shrink-0">
            <h2 className="text-2xl sm:text-3xl font-medium text-white">
              {isVoucherUsed ? "Voucher used" : "You're online"}
            </h2>
            <p className="text-white/80 mt-1 text-sm sm:text-base">
              {isVoucherUsed
                ? "Your data allowance has been fully used."
                : "Track your data usage in real time."}
            </p>
          </div>

          <div
            className="
              mt-3 sm:mt-4 rounded-2xl bg-white/5 backdrop-blur-[6px]
              border border-white/15 shadow-inner p-3 sm:p-4
              flex-1 min-h-0 overflow-y-auto
            "
          >
            <div className="flex items-center justify-between text-xs sm:text-sm mb-2.5">
              <div>
                {voucher.voucher_type} • {voucher.plan_type}
              </div>

              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                <span>{statusText}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.85] px-4 py-2.5 border border-white/20 shadow">
                <div className="text-gray-600 text-sm">Data remaining</div>
                <div className="text-lg sm:text-xl font-semibold text-gray-800">
                  {formatGB(displayRemainingGb)}
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.85] px-4 py-2.5 border border-white/20 shadow">
                <div className="text-gray-600 text-sm">Data used</div>
                <div className="text-lg sm:text-xl font-semibold text-gray-800">
                  {formatGB(displayUsedGb)}
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.85] px-4 py-2.5 border border-white/20 shadow">
                <div className="text-gray-600 text-sm mb-1">Usage</div>
                <div className="text-base sm:text-lg font-semibold text-gray-800 mb-1.5">
                  {usagePercent}%
                </div>

                <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:col-span-3">
                <div className="rounded-xl bg-white/[0.85] px-4 py-2.5 border border-white/20 shadow">
                  <div className="text-gray-600 text-sm">Voucher</div>
                  <div className="text-sm sm:text-base font-semibold text-gray-800">
                    {voucher.voucher_type}
                  </div>
                </div>

                <div className="rounded-xl bg-white/[0.85] px-4 py-2.5 border border-white/20 shadow">
                  <div className="text-gray-600 text-sm">Recommended for</div>
                  <div className="text-sm sm:text-base font-semibold text-gray-800">
                    {getVoucherRecommendation(voucher.voucher_type)}
                  </div>
                </div>
              </div>
            </div>

            {(isNearLimit || isVoucherUsed) && (
              <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 border border-amber-200 shadow">
                <div className="text-amber-900 font-semibold text-sm">
                  {isVoucherUsed ? "Voucher exhausted" : "You are running low on data"}
                </div>
                <div className="text-amber-900/80 text-sm mt-1">
                  {isVoucherUsed
                    ? `Your voucher has no data remaining. Please contact ${partnerName} onboard to purchase a new voucher.`
                    : `Your voucher is above 80% usage. You have ${formatGB(displayRemainingGb)} remaining. Contact ${partnerName} onboard if you need a new voucher soon.`}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl bg-black/25 backdrop-blur-[6px] border border-white/15 px-4 py-4 shadow">
              <div className="text-white text-sm font-medium">
                Choosing the right voucher size
              </div>
              <div className="text-white/65 text-xs mt-0.5">
                Pick the voucher that best fits your needs.
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
                {voucherOptions.map((type) => (
                  <div
                    key={type}
                    className={`rounded-xl border px-3 py-3 min-h-[118px] ${
                      type === "1GB"
                        ? "bg-cyan-500/15 border-cyan-300/25"
                        : type === "5GB"
                          ? "bg-green-500/15 border-green-300/25"
                          : type === "10GB"
                            ? "bg-violet-500/15 border-violet-300/25"
                            : type === "20GB"
                              ? "bg-orange-500/15 border-orange-300/25"
                              : "bg-red-500/15 border-red-300/25"
                    }`}
                  >
                    <div className="text-white text-sm font-semibold">
                      {type}
                    </div>
                    <div className="text-white/75 text-xs mt-2 leading-snug min-h-[46px]">
                      {getVoucherRecommendation(type)}
                    </div>
                    <div className="text-white text-sm font-semibold mt-3">
                      ${getVoucherPrice(type, voucher.plan_type).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-white text-sm font-medium">
                    Need a new voucher?
                  </div>
                  <div className="text-white/65 text-xs mt-0.5">
                    Contact your crew partner onboard to purchase a new voucher.
                  </div>
                </div>

                <div className="text-white/80 text-xs sm:text-sm">
                  Contact {partnerName} onboard for available voucher stock.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 shrink-0">
<div className="rounded-2xl bg-white/[0.06] border border-white/15 px-4 py-2 sm:py-2.5 flex items-center justify-between gap-4">
  <div>
    <div className="text-white text-sm">Private crew access</div>
    <div className="text-white/70 text-xs mt-0.5">
      One voucher. One device. Live data tracking.
    </div>
  </div>

  <a
    href="/terms/crew"
    target="_blank"
    rel="noopener noreferrer"
    className="shrink-0 text-white/90 hover:text-white text-xs sm:text-sm font-medium"
  >
    Crew Terms & Fair Use →
  </a>
</div>

            <div className="mt-2 text-center text-white/75 text-[11px] sm:text-xs space-y-0.5">
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

export default function CrewDashboardPage() {
  return (
    <Suspense fallback={null}>
      <CrewDashboardContent />
    </Suspense>
  );
}