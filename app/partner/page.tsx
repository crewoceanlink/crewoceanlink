// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";

const voucherTypes = [
  { size: "1GB" },
  { size: "5GB" },
  { size: "10GB" },
  { size: "20GB" },
  { size: "50GB" },
];

const dashboardResources = [
  {
    title: "Crew Guide",
    file: "https://crewoceanlink.com/resources/guides/crew-internet-guide.png",
  },
  {
    title: "Partner Guide",
    file: "https://crewoceanlink.com/resources/guides/crew-partner-dashboard-guide.png",
  },
  {
    title: "System Setup",
    file: "https://crewoceanlink.com/resources/guides/system-setup-guide.png",
  },
  {
    title: "Dish Mount",
    file: "https://crewoceanlink.com/resources/guides/satellite-dish-mount-guide.png",
  },
{
  title: "Plug & Play",
  file: "https://crewoceanlink.com/resources/marketing/plug-and-play-system.png",
},
];

const DEFAULT_USD_PER_EUR = 1 / 0.85;

const getVoucherGb = (voucher) => {
  const type = String(voucher.voucher_type || "").toUpperCase();

  if (type === "1GB") return 1;
  if (type === "5GB") return 5;
  if (type === "10GB") return 10;
  if (type === "20GB") return 20;
  if (type === "50GB") return 50;

  return Number(voucher.gb_total || 0);
};

const getPartnerNetProfitForVouchers = (vouchers, ship, usdPerEur) => {
  if (!ship || !Array.isArray(vouchers) || vouchers.length === 0) return 0;

  const model = String(ship.model || "").toUpperCase();

  const revenue = vouchers.reduce(
    (sum, voucher) => sum + Number(voucher.crew_price_usd || 0),
    0
  );

  const soldGB = vouchers.reduce(
    (sum, voucher) => sum + getVoucherGb(voucher),
    0
  );

  const planGB = Number(ship.plan_gb || 0);
  const planPriceEUR = Number(ship.plan_price_eur || 0);
  const hardwareEUR = Number(ship.hardware_eur || 0);

let remainingGB = soldGB;
let operatingCostUSD = 0;

const subscriptionCostUSD =
  Number(planPriceEUR || 0) * usdPerEur;

const subscriptionCostPerGB =
  planGB > 0 ? subscriptionCostUSD / planGB : 0;

const subscriptionUsedGB = Math.min(
  remainingGB,
  planGB
);

operatingCostUSD +=
  subscriptionUsedGB * subscriptionCostPerGB;

remainingGB -= subscriptionUsedGB;

const sortedAddons = [...(ship.addons || [])].sort((a, b) => {
  return (
    new Date(a.created_at).getTime() -
    new Date(b.created_at).getTime()
  );
});

for (const addon of sortedAddons) {
  if (remainingGB <= 0) break;

  const addonGB = Number(addon.gb || 0);

  const addonCostUSD =
    Number(addon.price_eur || 0) * usdPerEur;

  const addonCostPerGB =
    addonGB > 0 ? addonCostUSD / addonGB : 0;

  const addonUsedGB = Math.min(
    remainingGB,
    addonGB
  );

  operatingCostUSD +=
    addonUsedGB * addonCostPerGB;

  remainingGB -= addonUsedGB;
}

const cycleCount = planGB >= 500 ? planGB / 500 : planGB / 50;

const hardwareDepreciationUSD =
  model === "M1" || !usdPerEur
    ? 0
    : ((hardwareEUR / 24) * cycleCount) * usdPerEur;

const proportionalHardwareCostUSD =
  planGB > 0
    ? hardwareDepreciationUSD *
      (Math.min(soldGB, planGB) / planGB)
    : 0;

  const totalProfit =
    revenue - operatingCostUSD - proportionalHardwareCostUSD;

  if (model === "M1") return totalProfit * 0.5;
  if (model === "M2") return totalProfit * 0.3;

  return totalProfit;
};

const activeVouchers = [
  {
    code: "HXB940J6",
    size: "20GB",
    used: 18.2,
    total: 20,
    status: "Near limit",
    assignedTo: "Juan Engine",
  },
  {
    code: "JXEH4L1H",
    size: "5GB",
    used: 2.3,
    total: 5,
    status: "Active",
    assignedTo: "Ahmed Deck",
  },
  {
    code: "KLM882QZ",
    size: "10GB",
    used: 8.6,
    total: 10,
    status: "Near limit",
    assignedTo: "",
  },
];

export default function PartnerDashboardPage() {
  const [quantities, setQuantities] = useState<Record<string, number>>({
    "1GB": 0,
    "5GB": 0,
    "10GB": 0,
    "20GB": 0,
    "50GB": 0,
  });

  const [assignedNames, setAssignedNames] = useState<Record<string, string>>(
    Object.fromEntries(activeVouchers.map((v) => [v.code, v.assignedTo]))
  );

const [realVouchers, setRealVouchers] = useState([]);
const [lastOrder, setLastOrder] = useState(null);
const [outstandingAmount, setOutstandingAmount] = useState(0);
const [directSalesCredit, setDirectSalesCredit] = useState(0);
const [priceRules, setPriceRules] = useState([]);
const [partner, setPartner] = useState(null);
const [ship, setShip] = useState(null);
const [currentCycle, setCurrentCycle] = useState({
  start: null,
  end: null,
});

const [usdPerEur, setUsdPerEur] = useState(DEFAULT_USD_PER_EUR);

useEffect(() => {
  fetch("https://open.er-api.com/v6/latest/USD")
    .then((res) => res.json())
    .then((data) => {
      const eur = Number(data?.rates?.EUR);

      if (!isNaN(eur) && eur > 0) {
        setUsdPerEur(1 / eur);
      }
    })
    .catch((err) => {
      console.error("PARTNER FX LOAD ERROR:", err);
    });
}, []);

// 🔹 AVAILABLE = noch nicht verkauft (kein assigned_to)
const availableVouchers = realVouchers.filter(
  (v) => !v.assigned_to || v.assigned_to === ""
);

// 🔹 ACTIVE = bereits verkauft / zugewiesen
const activeSoldVouchers = realVouchers.filter(
  (v) => v.assigned_to && v.assigned_to !== ""
);

const nearLimitVouchers = activeSoldVouchers.filter((voucher) => {
  const used = Number(voucher.gb_used || 0);
  const totalGb = Number(voucher.gb_total || 0);

  if (totalGb <= 0) return false;

  return (used / totalGb) * 100 >= 80;
});

// 🔹 STOCK COUNT (für Anzeige oben)
const stockCount = {
  "1GB": availableVouchers.filter(v => v.voucher_type === "1GB").length,
  "5GB": availableVouchers.filter(v => v.voucher_type === "5GB").length,
  "10GB": availableVouchers.filter(v => v.voucher_type === "10GB").length,
  "20GB": availableVouchers.filter(v => v.voucher_type === "20GB").length,
  "50GB": availableVouchers.filter(v => v.voucher_type === "50GB").length,
};

const getPriceRule = (size: string) => {
  return priceRules.find((rule) => rule.voucher_type === size);
};

const today = new Date().toISOString().slice(0, 10);

const todaySoldVouchers = realVouchers.filter((v) => {
  if (!v.assigned_to) return false;
  if (!v.assigned_at) return false;

  return v.assigned_at.startsWith(today);
});

const todaySoldCount = todaySoldVouchers.length;

const todayRevenue = todaySoldVouchers.reduce(
  (sum, v) => sum + (v.crew_price_usd || 0),
  0
);

const todayProfit = getPartnerNetProfitForVouchers(todaySoldVouchers, ship, usdPerEur);

const cycleSoldVouchers = realVouchers.filter((v) => {
  if (!v.assigned_to) return false;
  if (!v.assigned_at) return false;
  if (!currentCycle.start) return false;
  if (!currentCycle.end) return false;

  const assignedDate = new Date(v.assigned_at);
  const cycleStart = new Date(currentCycle.start);
  const cycleEnd = new Date(currentCycle.end);

  return assignedDate >= cycleStart && assignedDate <= cycleEnd;
});

const cycleSoldCount = cycleSoldVouchers.length;

const cycleRevenue = cycleSoldVouchers.reduce(
  (sum, v) => sum + (v.crew_price_usd || 0),
  0
);

const cycleProfit = getPartnerNetProfitForVouchers(cycleSoldVouchers, ship, usdPerEur);

const total = useMemo(() => {
  return voucherTypes.reduce((sum, item) => {
    const rule = getPriceRule(item.size);
    const price = Number(rule?.partner_price_usd || 0);

    return sum + price * (quantities[item.size] || 0);
  }, 0);
}, [quantities, priceRules]);

  const updateQuantity = (size: string, change: number) => {
    setQuantities((prev) => ({
      ...prev,
      [size]: Math.max(0, (prev[size] || 0) + change),
    }));
  };

  const updateAssignedName = (code: string, value: string) => {
    setAssignedNames((prev) => ({
      ...prev,
      [code]: value,
    }));
  };

  const saveAssignedName = async (voucher, value: string) => {
    const assignedTo = value.trim();

    if (!assignedTo) return;

    try {
const partnerIdFromUrl = new URLSearchParams(window.location.search).get("partnerId");

      const res = await fetch(
        partnerIdFromUrl
          ? `/api/partner/vouchers/assign?partnerId=${encodeURIComponent(partnerIdFromUrl)}`
          : "/api/partner/vouchers/assign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            voucher_id: voucher.id,
            assigned_to: assignedTo,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Assign failed");
        return;
      }

      setAssignedNames((prev) => ({
        ...prev,
        [voucher.voucher_code]: assignedTo,
      }));

setRealVouchers((prev) =>
  prev.map((v) =>
    v.id === voucher.id
      ? {
          ...v,
          assigned_to: assignedTo,
          assigned_at: new Date().toISOString(),
        }
      : v
  )
);

await loadPartnerDashboardData();
    } catch (err) {
      console.error("ASSIGN VOUCHER ERROR:", err);
      alert("Assign failed");
    }
  };

const loadPartnerDashboardData = async () => {
  const loadVouchers = async () => {
    try {
      const partnerIdFromUrl = new URLSearchParams(window.location.search).get("partnerId");

      const res = await fetch(
        partnerIdFromUrl
          ? `/api/partner/vouchers?partnerId=${encodeURIComponent(partnerIdFromUrl)}`
          : "/api/partner/vouchers"
      );

      const data = await res.json();

      if (data.success) {
        console.log("PARTNER VOUCHERS FROM API:", data.vouchers);

        setRealVouchers(data.vouchers || []);
        setPriceRules(data.price_rules || []);
        setPartner(data.partner || null);
        console.log("PARTNER SHIP DATA:", data.ship);
        setShip(data.ship || null);

        setCurrentCycle({
          start: data.cycle_start || null,
          end: data.cycle_end || null,
        });

        setAssignedNames(
          Object.fromEntries(
            (data.vouchers || []).map((v) => [
              v.voucher_code,
              v.assigned_to || "",
            ])
          )
        );
      }
    } catch (err) {
      console.error("LOAD PARTNER VOUCHERS ERROR:", err);
    }
  };

  const loadLastOrder = async () => {
    try {
      const partnerIdFromUrl = new URLSearchParams(window.location.search).get("partnerId");

      const res = await fetch(
        partnerIdFromUrl
          ? `/api/partner/order?partnerId=${encodeURIComponent(partnerIdFromUrl)}`
          : "/api/partner/order"
      );

      const data = await res.json();

      if (data.success) {
        setLastOrder(data.last_order);
        setOutstandingAmount(Number(data.outstanding_amount || 0));
        setDirectSalesCredit(Number(data.direct_sales_credit || 0));
      }
    } catch (err) {
      console.error("LOAD LAST ORDER ERROR:", err);
    }
  };

  await loadVouchers();
  await loadLastOrder();
};

useEffect(() => {
  loadPartnerDashboardData();

  const interval = setInterval(() => {
    loadPartnerDashboardData();
  }, 15000);

  return () => clearInterval(interval);
}, []);

  return (
    <div className="min-h-screen w-full relative text-white overflow-hidden">
      <img
        src="/msc-ship.jpg"
        className="absolute w-full h-full object-cover"
        alt="msc ship"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/40" />

      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-7 sm:right-7 flex justify-between items-center z-20">
        <h1 className="text-white text-base sm:text-xl font-medium">
          CrewOceanLink
        </h1>

        <div className="flex items-center gap-3">
          <span className="text-white text-base sm:text-xl font-medium">
            Crew Partner Dashboard
          </span>

          <button
            type="button"
            onClick={async () => {
              await fetch("/api/partner/logout", {
                method: "POST",
              });

              window.location.href = "/login";
            }}
            className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-white hover:bg-white/15"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-center min-h-screen pb-3 px-3 pt-16 sm:pb-4 sm:px-4 sm:pt-20">
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
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 px-3 py-2 sm:px-4 sm:py-2.5 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs sm:text-sm">
<div>
  {ship
    ? `${ship.name} | ${ship.model} | ${
        Number(ship.plan_gb) >= 500
          ? "Global Priority 500GB"
          : "Global Priority 50GB"
      }`
    : "Loading ship..."}
</div>

<div className="text-white/75">
  Partner: {partner ? partner.name : "Loading partner..."}
</div>
<div className="text-white/75">
  Cycle:{" "}
  {currentCycle.start && currentCycle.end
    ? `${new Date(currentCycle.start).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })} – ${new Date(currentCycle.end).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })}`
    : "—"}
</div>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 px-2 shrink-0">
            <h2 className="text-2xl sm:text-3xl font-medium text-white">
              Welcome back
            </h2>
            <p className="text-white/80 mt-1 text-sm sm:text-base">
              Manage your voucher stock, sales and new orders.
            </p>
          </div>

          <div
            className="
              mt-3 sm:mt-4 rounded-2xl bg-white/5 backdrop-blur-[6px]
              border border-white/15 shadow-inner p-3 sm:p-4
              flex-1 min-h-0 overflow-y-auto
            "
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.85] px-4 py-3 border border-white/20 shadow">
                <div className="text-gray-600 text-sm">Voucher stock</div>
<div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm font-semibold text-gray-800">
  <div>1GB: {stockCount["1GB"] || 0}</div>
  <div>10GB: {stockCount["10GB"] || 0}</div>

  <div>5GB: {stockCount["5GB"] || 0}</div>
  <div>20GB: {stockCount["20GB"] || 0}</div>

  <div></div>
  <div>50GB: {stockCount["50GB"] || 0}</div>
</div>
              </div>

              <div className="rounded-xl bg-white/[0.85] px-4 py-3 border border-white/20 shadow">
                <div className="text-gray-600 text-sm">Today</div>
<div className="text-xl font-semibold text-gray-800 mt-1">
  {todaySoldCount} sold
</div>
<div className="text-sm text-gray-600 mt-1">
  Revenue ${Number(todayRevenue || 0).toFixed(2)} | Profit ${Number(todayProfit || 0).toFixed(2)}
</div>
              </div>

              <div className="rounded-xl bg-white/[0.85] px-4 py-3 border border-white/20 shadow">
                <div className="text-gray-600 text-sm">Current cycle</div>
<div className="text-xl font-semibold text-gray-800 mt-1">
  {cycleSoldCount} sold
</div>
<div className="text-sm text-gray-600 mt-1">
  Revenue ${Number(cycleRevenue || 0).toFixed(2)} | Profit ${Number(cycleProfit || 0).toFixed(2)}
</div>
              </div>

              <div className="md:col-span-3 rounded-xl bg-amber-100/90 px-4 py-3 border border-amber-200 shadow">
                <div className="text-amber-900 text-sm font-semibold">
                  Attention
                </div>
<div className="text-amber-900/80 text-sm mt-1">
  {nearLimitVouchers.length > 0 ? (
    <>
      {nearLimitVouchers.length} voucher
      {nearLimitVouchers.length === 1 ? " is" : "s are"} above 80% usage.
      Good opportunity to offer a new voucher personally.
    </>
  ) : (
    <>No attention items at the moment.</>
  )}
</div>
              </div>
            </div>

<div className="mt-5">
  <h3 className="text-white text-base sm:text-lg font-medium mb-3">
    Available vouchers (ready to sell)
  </h3>

  {availableVouchers.length === 0 ? (
    <div className="rounded-xl bg-amber-50 px-4 py-4 border border-amber-200 shadow">
      <div className="text-amber-900 font-semibold text-sm">
        No sellable vouchers available
      </div>
      <div className="text-amber-900/80 text-sm mt-1">
        No unassigned vouchers are currently available. Maintaining a small onboard stock is recommended to continue voucher sales without delay.
      </div>
    </div>
  ) : (
    <>
      {availableVouchers.length < 3 && (
        <div className="rounded-xl bg-amber-50 px-4 py-4 border border-amber-200 shadow mb-2">
          <div className="text-amber-900 font-semibold text-sm">
            Low voucher stock
          </div>
          <div className="text-amber-900/80 text-sm mt-1">
            Your available voucher inventory is running low. Maintaining a small onboard stock is recommended.
          </div>
        </div>
      )}

      <div className="space-y-2">
        {availableVouchers.map((voucher) => (
          <div
            key={voucher.id}
            className="rounded-xl bg-green-50 px-4 py-3 border border-green-200 shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-green-800 font-semibold text-sm">
                  {voucher.voucher_type} voucher
                </div>
                <div className="text-green-700 text-xs font-mono">
                  {voucher.voucher_code}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  type="text"
                  defaultValue=""
                  placeholder="Customer name"
                  onBlur={(e) => saveAssignedName(voucher, e.target.value)}
                  className="
                    w-full sm:w-[180px] rounded-lg border border-green-200
                    bg-white px-3 py-1.5 text-xs text-gray-800
                    placeholder:text-gray-400 outline-none
                    focus:border-green-500
                  "
                />

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(voucher.voucher_code);
                    alert("Voucher code copied");
                  }}
                  className="px-3 py-1.5 text-xs bg-green-700 text-white rounded-lg"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )}
</div>

            <div className="mt-5">
              <h3 className="text-white text-base sm:text-lg font-medium mb-3">
                Active vouchers
              </h3>

              <div className="space-y-2">
                {activeSoldVouchers.map((voucher) => {
const percent = Math.round(
  ((voucher.gb_used || 0) / (voucher.gb_total || 1)) * 100
);
                  const isNearLimit = percent >= 80;

                  return (
                    <div
                      key={voucher.voucher_code}
                      className="rounded-xl bg-white/[0.85] px-4 py-3 border border-white/20 shadow"
                    >
                      <div className="flex items-center justify-between gap-3">
<a
  href={`/crew/dashboard?voucherCode=${encodeURIComponent(voucher.voucher_code)}`}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-3 hover:underline"
>
  <span className="text-gray-800 font-semibold text-sm">
    {voucher.voucher_type} voucher
  </span>

  <span className="text-gray-800 font-semibold text-sm font-mono">
    {voucher.voucher_code}
  </span>
</a>

                        <div className="flex-1 max-w-[220px]">
                          <input
                            type="text"
                            value={assignedNames[voucher.voucher_code] || ""}
onChange={(e) =>
  updateAssignedName(voucher.voucher_code, e.target.value)
}
onBlur={(e) => saveAssignedName(voucher, e.target.value)}
                            placeholder="Assign name"
                            className="
                              w-full rounded-lg border border-gray-200
                              bg-white/75 px-3 py-1.5 text-xs text-gray-800
                              placeholder:text-gray-400 outline-none
                              focus:border-gray-400
                            "
                          />
                        </div>

                        <div
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap ${
                            isNearLimit
                              ? "bg-amber-100 text-amber-800"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {voucher.status}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-sm text-gray-600">
                          <span>
                            {voucher.gb_used} / {voucher.gb_total} GB
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-300 overflow-hidden">
                          <div
                            className={`h-full ${
                              isNearLimit ? "bg-amber-500" : "bg-green-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-white/[0.9] px-4 py-4 sm:px-5 sm:py-5 border border-white/20 shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold shrink-0">
                  $
                </div>

                <div>
                  <h3 className="text-gray-900 text-xl font-bold leading-tight">
                    Order new vouchers
                  </h3>
                  <div className="text-gray-600 text-sm mt-1">
                    Choose voucher size and quantity. Crew sales price is mandatory.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gray-100/80 border border-gray-200 overflow-hidden">
                <div className="hidden md:grid grid-cols-[1.2fr_1.35fr_1.85fr_1fr] gap-4 px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <div>Voucher size</div>
                  <div>Partner price</div>
                  <div>Crew sales price</div>
                  <div className="text-center">Quantity</div>
                </div>

                <div className="space-y-2 p-1.5 sm:p-2">
                  {voucherTypes.map((item) => {
                    const rule = getPriceRule(item.size);
                    const partnerPrice = rule?.partner_price_usd?.toFixed(2) || "-";
                    const crewPrice = rule?.crew_price_usd?.toFixed(2) || "-";

                    return (
                      <div
                        key={item.size}
                        className="grid grid-cols-[1fr_auto] md:grid-cols-[1.2fr_1.35fr_1.85fr_1fr] gap-3 md:gap-4 items-center rounded-xl bg-white/90 border border-gray-200 px-3 py-3 sm:px-4 sm:py-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
<div className="h-9 w-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path d="M12 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-3.89-3.39a1 1 0 1 0 1.41 1.41 3.5 3.5 0 0 1 4.95 0 1 1 0 1 0 1.41-1.41 5.5 5.5 0 0 0-7.77 0Zm-3.18-3.18a1 1 0 1 0 1.41 1.41 8 8 0 0 1 11.32 0 1 1 0 1 0 1.41-1.41 10 10 0 0 0-14.14 0Z" />
  </svg>
</div>

                          <div className="text-gray-900 font-bold text-2xl md:text-xl">
                            {item.size}
                          </div>
                        </div>

                        <div>
                          <div className="md:hidden text-[11px] uppercase font-bold text-gray-400 mb-0.5">
                            Partner price
                          </div>
                          <div className="text-gray-900 font-bold text-xl md:text-lg">
                            ${partnerPrice}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Partner cost
                          </div>
                        </div>

                        <div>
                          <div className="md:hidden text-[11px] uppercase font-bold text-gray-400 mb-0.5">
                            Crew sales price
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div>
                              <div className="text-gray-900 font-bold text-xl md:text-lg">
                                ${crewPrice}
                              </div>
                              <div className="text-gray-500 text-xs">
                                Mandatory resale price
                              </div>
                            </div>

                            <div className="rounded-full bg-red-600 text-white px-3 py-1 text-xs font-bold whitespace-nowrap w-fit">
                              MANDATORY
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-start md:justify-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.size, -1)}
                            className="h-9 w-9 rounded-full bg-gray-100 text-gray-800 text-lg border border-gray-200"
                          >
                            −
                          </button>
                          <div className="w-7 text-center text-gray-900 font-bold">
                            {quantities[item.size]}
                          </div>
                          <button
                            onClick={() => updateQuantity(item.size, 1)}
                            className="h-9 w-9 rounded-full bg-gray-900 text-white text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 p-4">
                <div className="flex justify-between gap-3 items-center">
                  <span className="text-gray-800 font-medium">
                    Total payable to CrewOceanLink
                  </span>
<span className="text-gray-900 font-bold text-2xl">
  ${Math.max(0, Number(total || 0) - Number(directSalesCredit || 0)).toFixed(2)}
</span>
                </div>

<div className="text-gray-600 text-sm mt-2">
  Payment methods: Ship MoneyCard or Revolut
</div>

{Number(directSalesCredit || lastOrder?.credit_applied_usd || 0) >= 0.01 && (
  <div className="text-green-700 text-xs mt-1 font-semibold">
    Direct sales credit applied: -${Number(directSalesCredit || 0).toFixed(2)}
  </div>
)}
              </div>

              <button
                onClick={async () => {
                  try {
const items = voucherTypes
  .map((v) => {
    const rule = getPriceRule(v.size);

    return {
      size: v.size.replace("GB", ""),
      quantity: quantities[v.size],
      price: Number(rule?.partner_price_usd || 0),
    };
  })
  .filter((v) => v.quantity > 0);

                    if (items.length === 0) {
                      alert("Please select at least one voucher");
                      return;
                    }

                    const partnerIdFromUrl = new URLSearchParams(window.location.search).get("partnerId");

const res = await fetch(
  partnerIdFromUrl
    ? `/api/partner/order?partnerId=${encodeURIComponent(partnerIdFromUrl)}`
    : "/api/partner/order",
  {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
body: JSON.stringify({
  items,
  total_amount: total,
    }),
  }
);

                    const data = await res.json();

if (data.success) {
  alert("Order submitted successfully");
  setQuantities({
    "1GB": 0,
    "5GB": 0,
    "10GB": 0,
    "20GB": 0,
    "50GB": 0,
  });

  await loadPartnerDashboardData();
} else {
                      alert(data.message || "Order failed");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Order failed");
                  }
                }}
                className="mt-4 w-full rounded-xl bg-gray-900 text-white py-3 font-medium"
              >
                Submit order
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-2">
<div className="rounded-2xl bg-white/[0.9] px-4 py-4 border border-white/20 shadow">
  <div className="flex items-start justify-between gap-3">
    <div>
      <div className="text-gray-900 font-bold text-lg">
        Last order
      </div>

      <div className="text-gray-600 text-xs mt-1">
        Latest submitted voucher order.
      </div>
    </div>

    <div
      className={`rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${
        lastOrder?.payment_status === "paid"
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {lastOrder?.payment_status === "paid"
        ? "PAID"
        : "PAYMENT PENDING"}
    </div>
  </div>

  {Number(directSalesCredit || lastOrder?.credit_applied_usd || 0) >= 0.01 && (
    <div className="mt-4 rounded-xl bg-green-50 border border-green-100 p-3">
      <div className="text-green-700 text-xs font-bold uppercase">
        Direct Sales Credit
      </div>

      <div className="mt-1 text-green-900 font-bold text-xl">
        ${Number(directSalesCredit || lastOrder?.credit_applied_usd || 0).toFixed(2)}
      </div>

      <div className="text-green-800/80 text-xs mt-1">
{Number(directSalesCredit || 0) > 0
  ? "Credit from direct crew sales handled by CrewOceanLink. This amount will be deducted from your next voucher order."
  : "Credit from direct crew sales was applied to this voucher order."}
      </div>
    </div>
  )}

  {lastOrder && Array.isArray(lastOrder.order_data) ? (
    <>
      <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-3">
        <div className="text-gray-500 text-xs uppercase font-bold tracking-wide mb-2">
          Order summary
        </div>

        <div className="space-y-2">
          {lastOrder.order_data.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path d="M12 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-3.89-3.39a1 1 0 1 0 1.41 1.41 3.5 3.5 0 0 1 4.95 0 1 1 0 1 0 1.41-1.41 5.5 5.5 0 0 0-7.77 0Zm-3.18-3.18a1 1 0 1 0 1.41 1.41 8 8 0 0 1 11.32 0 1 1 0 1 0 1.41-1.41 10 10 0 0 0-14.14 0Z" />
                  </svg>
                </div>

                <div>
                  <div className="text-gray-900 font-semibold">
                    {item.quantity}x {item.size}GB
                  </div>

                  <div className="text-gray-500 text-xs">
                    Voucher package
                  </div>
                </div>
              </div>

              <div className="text-right">
<div className="text-gray-900 font-bold">
  $
  {(
    Number(item.price || 0) *
    Number(item.quantity || 0)
  ).toFixed(2)}
</div>

<div className="text-gray-500 text-xs">
  Original
</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-green-50 border border-green-100 p-3">
          <div className="text-green-700 text-xs font-bold uppercase">
            Payment
          </div>

          <div className="mt-1 text-green-900 font-semibold">
            {lastOrder.payment_status === "paid"
              ? "Confirmed"
              : "Awaiting payment"}
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
          <div className="text-blue-700 text-xs font-bold uppercase">
            Delivery
          </div>

          <div className="mt-1 text-blue-900 font-semibold">
            {lastOrder.payment_status === "paid"
              ? "Vouchers delivered"
              : "Waiting for payment"}
          </div>
        </div>
      </div>
    </>
  ) : (
    <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4">
      <div className="text-gray-900 font-semibold">
        No orders yet
      </div>

      <div className="text-gray-500 text-sm mt-1">
        Your latest voucher order will appear here.
      </div>
    </div>
  )}
</div>

              <div className="rounded-2xl bg-white/[0.9] px-4 py-4 border border-white/20 shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-gray-900 font-bold text-lg">
                      Payment info
                    </div>
                    <div className="text-gray-600 text-xs mt-1">
                      Pay outstanding partner orders.
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-gray-500 text-xs">
                      Outstanding
                    </div>
<div className="text-gray-900 font-bold text-xl">
  ${Math.max(0, Number(outstandingAmount || 0) - Number(directSalesCredit || 0)).toFixed(2)}
</div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-3">
                  <div className="text-gray-800 font-semibold text-sm">
                    Revolut
                  </div>

                  <div className="text-gray-600 text-xs mt-1">
                    Fastest payment method. Amount must be entered manually.
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <a
                      href="https://revolut.me/mikepc5i5"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-xl bg-gray-900 text-white text-center py-2 text-sm font-semibold"
                    >
                      Pay with Revolut
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("@mike4pc515");
                        alert("Revolut tag copied");
                      }}
                      className="rounded-xl bg-white border border-gray-200 text-gray-800 px-3 py-2 text-sm font-semibold"
                    >
                      Copy Revtag
                    </button>
                  </div>

                  <div className="mt-2 text-gray-500 text-xs">
                    Revtag: @mike4pc515
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <div className="text-gray-800 font-semibold text-sm">
                    ShipMoneyCard
                  </div>

                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-gray-500 text-xs">
                          Recipient Last Name
                        </div>
                        <div className="text-gray-900 font-semibold">
                          Panser
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("Panser");
                          alert("Recipient last name copied");
                        }}
                        className="rounded-lg bg-white border border-amber-200 text-gray-800 px-3 py-1.5 text-xs font-semibold"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-gray-500 text-xs">
                          Customer ID
                        </div>
                        <div className="text-gray-900 font-semibold">
                          0023287868
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("0023287868");
                          alert("Customer ID copied");
                        }}
                        className="rounded-lg bg-white border border-amber-200 text-gray-800 px-3 py-1.5 text-xs font-semibold"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-white/70 border border-gray-200 p-3">
                  <div className="text-gray-500 text-xs">
                    Payment reference
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="text-gray-900 text-sm font-semibold">
                      {partner?.name || "Partner"} · {ship?.name || "Ship"}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${partner?.name || "Partner"} · ${ship?.name || "Ship"}`
                        );
                        alert("Payment reference copied");
                      }}
                      className="rounded-lg bg-white border border-gray-200 text-gray-800 px-3 py-1.5 text-xs font-semibold"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-gray-600 text-xs">
                  Vouchers are delivered after payment confirmation.
                </div>
              </div>
            </div>
          </div>

                    <div className="mt-5 rounded-2xl bg-white/[0.06] border border-white/15 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-white text-sm font-medium">
                  Resources & Guides
                </div>

                <div className="text-white/70 text-xs mt-0.5">
                  Helpful setup guides and onboard instructions.
                </div>
              </div>

              <a
                href="/partner/resources"
                className="text-white/90 hover:text-white text-xs sm:text-sm font-medium shrink-0"
              >
                View all →
              </a>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {dashboardResources.map((resource) => (
                <a
                  key={resource.title}
                  href={resource.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 px-3 py-2.5 transition"
                >
                  <div className="text-white text-xs sm:text-sm font-medium">
                    {resource.title}
                  </div>

                  <div className="text-white/55 text-[11px] mt-0.5">
                    Open guide
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="pt-2 shrink-0">
          
<div className="rounded-2xl bg-white/[0.06] border border-white/15 px-4 py-2 sm:py-2.5 flex items-center justify-between gap-4">
  <div>
    <div className="text-white text-sm">Partner sales access</div>
    <div className="text-white/70 text-xs mt-0.5">
      Manage voucher stock. Track sales. Order new vouchers.
    </div>
  </div>

  <a
    href="/terms/partner"
    target="_blank"
    rel="noopener noreferrer"
    className="shrink-0 text-white/90 hover:text-white text-xs sm:text-sm font-medium"
  >
    Partner Terms & Fair Use →
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