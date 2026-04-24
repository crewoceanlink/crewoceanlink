"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CrewDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const voucherCode = searchParams.get("voucher") || "";

  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState(null);
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
      } catch (err) {
        console.error(err);
        setError("Failed to load voucher");
      }

      setLoading(false);
    };

    loadVoucher();
  }, [voucherCode]);

  const formatGB = (value) => `${Number(value || 0).toFixed(2)} GB`;

  const usagePercent =
    voucher && Number(voucher.gb_total) > 0
      ? Math.min(
          100,
          Math.round(
            (Number(voucher.gb_used || 0) / Number(voucher.gb_total || 1)) * 100
          )
        )
      : 0;

  const remainingPercent =
    voucher && Number(voucher.gb_total) > 0
      ? (Number(voucher.gb_remaining || 0) / Number(voucher.gb_total || 1)) * 100
      : 0;

  let statusText = "Ready";
  let statusColor = "bg-green-400";
  let barColor = "bg-green-500";

  if (remainingPercent <= 0) {
    statusText = "Exhausted";
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

      <div className="absolute top-6 left-7 right-7 flex justify-between items-center z-20">
        <h1 className="text-white text-xl font-medium">CrewOceanLink</h1>
        <span className="text-white text-xl font-medium">Crew Dashboard</span>
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
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 px-4 py-2.5 flex justify-between items-center shrink-0">
            <div className="px-4 py-1.5 rounded-full bg-white/30 text-white text-sm">
              Voucher {voucher.voucher_code}
            </div>

            <button
              onClick={() => router.push("/crew")}
              className="px-4 py-1.5 rounded-full bg-white/20 text-white text-sm"
            >
              Back
            </button>
          </div>

          <div className="mt-4 px-2 shrink-0">
            <h2 className="text-3xl font-medium text-white">You're online</h2>
            <p className="text-white/80 mt-1 text-base">
              Track your data usage in real time.
            </p>
          </div>

          <div
            className="
              mt-4 rounded-2xl bg-white/5 backdrop-blur-[6px]
              border border-white/15 shadow-inner p-4
              flex-1 min-h-0 overflow-hidden
            "
          >
            <div className="flex items-center justify-between text-sm mb-2.5">
              <div>{voucher.voucher_type} • {voucher.plan_type}</div>

              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                <span>{statusText}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="rounded-xl bg-white/[0.85] px-4 py-2.5 border border-white/20 shadow">
                <div className="text-gray-600 text-sm">Data remaining</div>
                <div className="text-xl font-semibold text-gray-800">
                  {formatGB(voucher.gb_remaining)}
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.85] px-4 py-2.5 border border-white/20 shadow">
                <div className="text-gray-600 text-sm">Data used</div>
                <div className="text-xl font-semibold text-gray-800">
                  {formatGB(voucher.gb_used)}
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.85] px-4 py-2.5 border border-white/20 shadow">
                <div className="text-gray-600 text-sm mb-1">Usage</div>
                <div className="text-lg font-semibold text-gray-800 mb-1.5">
                  {usagePercent}%
                </div>

                <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/[0.85] px-4 py-2.5 border border-white/20 shadow">
                  <div className="text-gray-600 text-sm">Voucher</div>
                  <div className="text-base font-semibold text-gray-800">
                    {voucher.voucher_type}
                  </div>
                </div>

                <div className="rounded-xl bg-white/[0.85] px-4 py-2.5 border border-white/20 shadow">
                  <div className="text-gray-600 text-sm">Plan</div>
                  <div className="text-base font-semibold text-gray-800">
                    {voucher.plan_type}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2.5 shrink-0">
            <div className="rounded-2xl bg-white/[0.06] border border-white/15 px-4 py-2.5">
              <div className="text-white text-sm">Private crew access</div>
              <div className="text-white/70 text-xs mt-0.5">
                One voucher. One device. Live data tracking.
              </div>
            </div>

            <div className="mt-2.5 text-center text-white/75 text-xs space-y-0.5">
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