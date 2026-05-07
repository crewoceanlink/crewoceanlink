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
const [priceRules, setPriceRules] = useState([]);
const [partner, setPartner] = useState(null);
const [ship, setShip] = useState(null);
const [currentCycle, setCurrentCycle] = useState({
  start: null,
  end: null,
});

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

const todayProfit = todaySoldVouchers.reduce(
  (sum, v) =>
    sum + ((v.crew_price_usd || 0) - (v.your_revenue_usd || 0)),
  0
);

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

const cycleProfit = cycleSoldVouchers.reduce(
  (sum, v) =>
    sum + ((v.crew_price_usd || 0) - (v.your_revenue_usd || 0)),
  0
);

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
      const res = await fetch("/api/partner/vouchers/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voucher_id: voucher.id,
          assigned_to: assignedTo,
        }),
      });

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
              }
            : v
        )
      );
    } catch (err) {
      console.error("ASSIGN VOUCHER ERROR:", err);
      alert("Assign failed");
    }
  };

useEffect(() => {
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
setShip(data.ship || null);

setCurrentCycle({
  start: data.cycle_start || null,
  end: data.cycle_end || null,
});

setAssignedNames(
    Object.fromEntries(
      data.vouchers.map((v) => [
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
      const res = await fetch("/api/partner/order");
      const data = await res.json();

      if (data.success) {
        setLastOrder(data.last_order);
      }
    } catch (err) {
      console.error("LOAD LAST ORDER ERROR:", err);
    }
  };

  loadVouchers();
  loadLastOrder();
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
                <div className="mt-2 grid grid-cols-2 gap-1 text-sm font-semibold text-gray-800">
{voucherTypes.map((item) => (
  <div key={item.size}>
    {item.size}: {stockCount[item.size] || 0}
  </div>
))}
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
    <div className="rounded-xl bg-white/[0.85] px-4 py-4 border border-white/20 shadow">
      <div className="text-gray-800 font-semibold text-sm">
        No available vouchers
      </div>
      <div className="text-gray-600 text-sm mt-1">
        All vouchers are currently assigned. New vouchers will appear here after an order is fulfilled.
      </div>
    </div>
  ) : (
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
<div>
  <div className="text-gray-800 font-semibold text-sm">
    {voucher.voucher_type} voucher
  </div>
  <div className="text-gray-600 text-xs font-mono">
    {voucher.voucher_code}
  </div>
</div>

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
                          className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
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

            <div className="mt-5 rounded-xl bg-white/[0.85] px-4 py-3 border border-white/20 shadow">
              <h3 className="text-gray-800 text-base font-semibold">
                Order new vouchers
              </h3>

              <div className="mt-3 space-y-2">
                {voucherTypes.map((item) => (
                  <div
                    key={item.size}
                    className="flex items-center justify-between rounded-xl bg-white/70 border border-gray-200 px-3 py-2"
                  >
<div className="flex flex-col">
  <div className="text-gray-800 font-semibold">
    {item.size}
  </div>

  <div className="text-gray-600 text-xs">
    Partner price: $
    {getPriceRule(item.size)?.partner_price_usd?.toFixed(2) || "-"}
  </div>

  <div className="text-[11px] text-gray-500 mt-1">
    Crew sales price: $
    {getPriceRule(item.size)?.crew_price_usd?.toFixed(2) || "-"} · Mandatory
  </div>
</div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.size, -1)}
                        className="h-8 w-8 rounded-full bg-gray-200 text-gray-800 text-lg"
                      >
                        −
                      </button>
                      <div className="w-6 text-center text-gray-800 font-semibold">
                        {quantities[item.size]}
                      </div>
                      <button
                        onClick={() => updateQuantity(item.size, 1)}
                        className="h-8 w-8 rounded-full bg-gray-800 text-white text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-white/70 border border-gray-200 p-3">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">
                    Total payable to CrewOceanLink
                  </span>
                  <span className="text-gray-900 font-semibold text-lg">
                    ${total}
                  </span>
                </div>

                <div className="text-gray-600 text-sm mt-2">
                  Payment methods: Ship MoneyCard or Revolut
                </div>
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

                    const res = await fetch("/api/partner/order", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
body: JSON.stringify({
  items,
  total_amount: total,
}),
                    });

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
<div className="rounded-xl bg-white/[0.85] px-4 py-3 border border-white/20 shadow">
  <div className="text-gray-800 font-semibold">Last order</div>

  <div className="text-gray-600 text-sm mt-2">
    {lastOrder && Array.isArray(lastOrder.order_data) ? (
      <>
        {lastOrder.order_data.map((item, idx) => (
          <div key={idx}>
            {item.quantity}x {item.size}GB
          </div>
        ))}

        <div className="mt-1">
          Status:{" "}
          {lastOrder.payment_status === "paid"
            ? "Paid"
            : "Payment pending"}
        </div>
      </>
    ) : (
      <div>No orders yet</div>
    )}
  </div>
</div>

              <div className="rounded-xl bg-white/[0.85] px-4 py-3 border border-white/20 shadow">
                <div className="text-gray-800 font-semibold">Payment info</div>
                <div className="text-gray-600 text-sm mt-2">
                  <div>Outstanding: $56</div>
                  <div>Ship MoneyCard or Revolut</div>
                  <div className="mt-1">Delivery after payment confirmation</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 shrink-0">
            <div className="rounded-2xl bg-white/[0.06] border border-white/15 px-4 py-2 sm:py-2.5">
              <div className="text-white text-sm">Partner sales access</div>
              <div className="text-white/70 text-xs mt-0.5">
                Manage voucher stock. Track sales. Order new vouchers.
              </div>
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