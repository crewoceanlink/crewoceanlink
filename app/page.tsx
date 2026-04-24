// @ts-nocheck
"use client";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
export default function Home() {
const [rates, setRates] = useState({
  eur: null,
  chf: null,
  eurChange: null,
  chfChange: null,
});
const [timeNow, setTimeNow] = useState(new Date());
const [ships, setShips] = useState([]);
const [timeFilter, setTimeFilter] = useState({
  mode: "current", // current | range | history
  start: "",
  end: "",
  historyCount: 1
});
const currentMonth = new Date().toISOString().slice(0, 7);
const getPreviousMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};

const previousMonth = getPreviousMonth();
const getSelectedCycles = (subscriptionsData, shipId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shipSubs = subscriptionsData
    .filter(s => String(s.ship_id) === String(shipId))
    .map(s => {
      const [sy, sm, sd] = s.start_date.split("-");
      const [ey, em, ed] = s.end_date.split("-");

      const start = new Date(Number(sy), Number(sm) - 1, Number(sd));
      const end = new Date(Number(ey), Number(em) - 1, Number(ed));

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      return {
        ...s,
        start,
        end,
      };
    })
    .sort((a, b) => b.start.getTime() - a.start.getTime());

  if (timeFilter.mode === "current") {
    return shipSubs.filter(s => today >= s.start && today <= s.end);
  }

  if (timeFilter.mode === "history") {
    const currentIndex = shipSubs.findIndex(s => today >= s.start && today <= s.end);

    if (currentIndex === -1) return [];

    if (timeFilter.historyCount === 999) {
      return shipSubs.slice(currentIndex);
    }

    return shipSubs.slice(currentIndex, currentIndex + timeFilter.historyCount);
  }

  if (timeFilter.mode === "range") {
    if (!timeFilter.start || !timeFilter.end) return [];

    const rangeStart = new Date(timeFilter.start);
    const rangeEnd = new Date(timeFilter.end);

    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(0, 0, 0, 0);

    return shipSubs.filter(s => s.start <= rangeEnd && s.end >= rangeStart);
  }

  return [];
};
const handleAddAddon = async () => {
  const ship = ships?.[0] || null;

  if (!ship || !ship.id) {
    alert("Ship ID missing");
    return;
  }

  const gb = Number(prompt("Addon GB (z.B. 50)"));
  const price = Number(prompt("Price EUR (z.B. 100)"));

  if (!gb || !price) return;

  const { error } = await supabase.from("addons").insert([
  {
    ship_id: ship.id,
    gb: gb,
    price_eur: price,
    month: new Date().toISOString().slice(0, 7),
  },
]);

  if (error) {
    console.error(error);
    alert("Error inserting addon");
    return;
  }

  alert("Addon added");
  window.location.reload();
};
const handleAddVoucher = async () => {
  // SAFETY: keine ships geladen → abbrechen
  if (!ships || ships.length === 0) {
    alert("No ship loaded yet");
    return;
  }

  const shipName = prompt("Ship name?");
const ship = ships.find(s => s.name === shipName);

if (!ship) {
  alert("Ship not found");
  return;
}

  // weitere safety checks
  if (!ship.id) {
    alert("Ship ID missing");
    return;
  }

const allowedGbTypes =
  ship.planType === "small"
    ? ["1GB", "5GB"]
    : ["1GB", "5GB", "10GB"];

const gbType = prompt(`GB Type? (${allowedGbTypes.join(", ")})`);
if (!gbType) return;

if (!allowedGbTypes.includes(gbType)) {
  alert(`Invalid GB Type for ${ship.planType}. Allowed: ${allowedGbTypes.join(", ")}`);
  return;
}

  const { error } = await supabase.from("vouchers").insert([
    {
      ship_id: ship.id,
      gb_type: gbType,
amount: amount,
month: new Date().toISOString().slice(0, 7),
    },
  ]);

  if (error) {
  alert(JSON.stringify(error));
  return;
}

  alert("Voucher added");

  // sauberer reload (kein dirty hack)
  window.location.reload();
};

const getTotalGB = (ship) => {
  const addonGB = ship.addons.reduce((sum, a) => sum + a.gb, 0);

  return ship.plan.gb + addonGB + (ship.carryOverGB || 0);
};

const getSubscriptionAndAddonGB = (ship) => {
  const addonGB = ship.addons.reduce((sum, a) => sum + (a.gb || 0), 0);

  return ship.plan.gb + addonGB;
};

const getOperatingCostUSD = (ship) => {
  if (!rates.eur) return "--";

  const subscriptionEUR = ship.plan.priceEUR;

  const addonEUR = ship.addons.reduce((sum, a) => {
    return sum + a.price_eur;
  }, 0);

  const totalEUR = subscriptionEUR + addonEUR;

  const usd = totalEUR / rates.eur;

  return "$" + usd.toFixed(0);
};
const getTotalCostUSD = (ship) => {
  if (!rates.eur) return 0;

  const planEUR = ship.plan.priceEUR;

  const addonEUR = ship.addons.reduce((sum, a) => {
    return sum + a.price_eur;
  }, 0);

  const totalEUR = planEUR + addonEUR;

  return totalEUR / rates.eur;
};
const getHardwareCostUSD = (ship) => {
  if (!rates.eur) return "--";

  const usd = ship.hardwareEUR / rates.eur;

  return "$" + usd.toFixed(0);
};
const getCycleCount = (ship) => {
  if (!ship || !ship.plan || !ship.plan.gb) return 0;

  if (ship.planType === "small") {
    return ship.plan.gb / 50;
  }

  return ship.plan.gb / 500;
};

const getHardwareDepreciationUSD = (ship) => {
  if (!rates.eur) return 0;

  const cycleCount = getCycleCount(ship);
  const monthlyEUR = ship.hardwareEUR / 24;

  return (monthlyEUR * cycleCount) / rates.eur;
};
const getSoldGB = (ship) => {
  if (!ship.vouchers) return 0;

  return (
    (ship.vouchers["1GB"] || 0) * 1 +
    (ship.vouchers["5GB"] || 0) * 5 +
    (ship.vouchers["10GB"] || 0) * 10
  );
};

const getLostGB = (ship) => {
  const paidGB =
    ship.plan.gb +
    ship.addons.reduce((sum, a) => sum + (a.gb || 0), 0);

  const usedGB = Number(ship.usedGB || 0);

  const lostGB = paidGB - usedGB;

  return lostGB > 0 ? Number(lostGB.toFixed(2)) : 0;
};

const getLostRevenueUSD = (ship) => {
  const lostGB = getLostGB(ship);

  if (lostGB <= 0) return 0;

  const soldGB = getSoldGB(ship);
  const revenue = getRevenueUSD(ship);

  if (!soldGB || soldGB <= 0) return 0;
  if (revenue === "--" || revenue <= 0) return 0;

  const avgRevenuePerGB = revenue / soldGB;

  return lostGB * avgRevenuePerGB;
};
const getUsageRate = (ship) => {
  if (!ship.vouchers) return "--";

const soldGB = getSoldGB(ship);

  const totalGB =
  ship.plan.gb +
  ship.addons.reduce((sum, a) => sum + a.gb, 0) +
  (ship.carryOverGB || 0);

  if (totalGB === 0) return "--";

  const usage = (soldGB / totalGB) * 100;

  return usage.toFixed(0) + "%";
};
const getCrewPricesUSD = (ship) => {
  if (ship.planType === "small") {
    return {
      "1GB": 6.5,
      "5GB": 30,
      "10GB": 55,
    };
  }

  return {
    "1GB": 4.9,
    "5GB": 23,
    "10GB": 42,
  };
};

const getYourPricesUSD = (ship) => {
  const crewPrices = getCrewPricesUSD(ship);

  if (ship.model === "M1") {
    return {
      "1GB": crewPrices["1GB"] * 0.75,
      "5GB": crewPrices["5GB"] * 0.75,
      "10GB": crewPrices["10GB"] * 0.75,
    };
  }

  if (ship.model === "M2") {
    return {
      "1GB": crewPrices["1GB"] * 0.80,
      "5GB": crewPrices["5GB"] * 0.80,
      "10GB": crewPrices["10GB"] * 0.80,
    };
  }

  return crewPrices;
};

const getRevenueUSD = (ship) => {
  if (!ship.vouchers) return "--";

  const prices = getYourPricesUSD(ship);

  const revenue =
    (ship.vouchers["1GB"] || 0) * prices["1GB"] +
    (ship.vouchers["5GB"] || 0) * prices["5GB"] +
    (ship.vouchers["10GB"] || 0) * prices["10GB"];

  return revenue;
};
const getNetProfitUSD = (ship) => {
  if (!rates.eur || !ship.vouchers) return "--";

  const revenue = getRevenueUSD(ship);
  const totalCost = getTotalCostUSD(ship);
  const hardwareDepreciation = getHardwareDepreciationUSD(ship);

  return revenue - totalCost - hardwareDepreciation;
};
const getROI = (ship) => {
  if (!rates.eur) return "--";

  const profit = getNetProfitUSD(ship);
  const hardware = ship.hardwareEUR / rates.eur;

  if (hardware === 0) return "--";

  const roi = (profit / hardware) * 100;

  return roi.toFixed(0) + "%";
};
const getBreakEvenGB = (ship) => {
  if (!rates.eur) return "--";

  const operatingCost = getTotalCostUSD(ship);
  const hardwareDepreciation = getHardwareDepreciationUSD(ship);
  const totalCost = operatingCost + hardwareDepreciation;

  const soldGB = getSoldGB(ship);
  const revenue = getRevenueUSD(ship);

  if (soldGB === 0) return "--";

  const avgRevenuePerGB = revenue / soldGB;

  if (avgRevenuePerGB === 0) return "--";

  const breakEvenGB = totalCost / avgRevenuePerGB;

  return breakEvenGB.toFixed(0) + " GB";
};

const getBreakEvenMonths = (ship) => {
  if (!rates.eur || !ship.vouchers) return "--";

  const soldGB = getSoldGB(ship);

  if (soldGB === 0) return "--";

  const breakEvenGB = parseFloat(getBreakEvenGB(ship));

  if (isNaN(breakEvenGB)) return "--";

  const cycles = breakEvenGB / soldGB;

  if (cycles > 60) return ">60 cycles";

  return cycles.toFixed(1) + " cycles";
};

const getProfitStatus = (ship) => {
  if (!rates.eur || !ship.vouchers) return "--";

  const profit = getNetProfitUSD(ship);

  if (profit === "--") return "--";

  if (profit < 0) return "loss";
  if (profit === 0) return "breakeven";
  return "profit";
};
const formatUSD = (value) => {
  if (value === "--") return "--";

  const num = Number(value);

  if (isNaN(num)) return value;

  if (num < 0) return `-$${Math.abs(num).toFixed(0)}`;
  return `$${num.toFixed(0)}`;
};

const STATUS_TIMEOUT_MINUTES = 2;

const isFreshStatus = (lastSeen) => {
  if (!lastSeen) return false;
  return new Date() - new Date(lastSeen) <= STATUS_TIMEOUT_MINUTES * 60 * 1000;
};

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "--";

  const diffSec = Math.floor((new Date() - new Date(lastSeen)) / 1000);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec} sec ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;

  return new Date(lastSeen).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

useEffect(() => {
  fetch("https://open.er-api.com/v6/latest/USD")
    .then((res) => res.json())
    .then((data) => {
      console.log("API RESPONSE:", data);

      if (data && data.rates) {
const eur = Number(data.rates.EUR);
const chf = Number(data.rates.CHF);

// kleine Fake Bewegung
const eurChange = ((Math.random() - 0.5) * 0.5).toFixed(2);
const chfChange = ((Math.random() - 0.5) * 0.5).toFixed(2);

setRates({
  eur,
  chf,
  eurChange,
  chfChange,
});
      }
    })
    .catch((err) => console.error(err));
}, []);
useEffect(() => {
  const interval = setInterval(() => {
    setTimeNow(new Date());
  }, 60000);

  return () => clearInterval(interval);
}, []);

  const loadShips = async () => {
  
    const selectedMonths = [];

console.log("NOW:", new Date().toISOString());
console.log("SELECTED MONTHS:", selectedMonths);

const { data: shipsData, error: shipsError } = await supabase
  .from("ships")
  .select("*");

if (shipsError) {
  console.error(shipsError);
  return;
}

const { data: subscriptionsData, error: subscriptionsError } = await supabase
  .from("subscriptions")
  .select("*");

if (subscriptionsError) {
  console.error(subscriptionsError);
  return;
}

console.log("SUBSCRIPTIONS:", subscriptionsData);

const { data: usageData, error: usageError } = await supabase
  .from("router_usage")
  .select("*");

if (usageError) {
  console.error(usageError);
  return;
}

let routerStatusData = [];

const { data: routerStatusRaw, error: routerStatusError } = await supabase
  .from("router_status")
  .select("*")
  .order("checked_at", { ascending: false });

if (routerStatusError) {
  console.error("router_status load failed:", routerStatusError);
} else {
  routerStatusData = routerStatusRaw || [];
}

// 🔁 AUTO RENEW LOGIK
const today = new Date();

for (const ship of shipsData) {
  const shipSubs = subscriptionsData
    .filter(s => s.ship_id === ship.id)
.sort((a, b) => {
  return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
});

  const lastSub = shipSubs[0];

  if (!lastSub) continue;

  const end = new Date(lastSub.end_date);

  // 👉 Wenn abgelaufen → neue erstellen
  if (
  today > end &&
  !shipSubs.some(s => {
    const start = new Date(s.start_date);
    return start > end;
  })
) {
    const newStart = new Date(end);
    newStart.setDate(newStart.getDate() + 1);

    const newEnd = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + 1);
    newEnd.setDate(newEnd.getDate() - 1);

    console.log("AUTO RENEW for ship:", ship.id);

    await supabase.from("subscriptions").insert([
      {
        ship_id: ship.id,
        gb: lastSub.gb,
        price_eur: lastSub.price_eur,
        start_date: newStart.toISOString().split("T")[0],
        end_date: newEnd.toISOString().split("T")[0],
      },
    ]);
  }
}
  
const { data: addonsData, error: addonsError } = await supabase
  .from("addons")
  .select("*");

  if (addonsError) {
  console.error(addonsError);
  return;
}

const { data: vouchersData, error: vouchersError } = await supabase
  .from("vouchers")
  .select("*");

if (vouchersError) {
  console.error(vouchersError);
  return;
}

console.log("SHIPS:", shipsData);
console.log("VOUCHERS:", vouchersData);

    const mapped = shipsData.map((ship) => {
      let usedGB = 0;

const relevantSubs = getSelectedCycles(subscriptionsData, ship.id);

const shipUsageAll = usageData
  .filter((u) => String(u.ship_id) === String(ship.id))
  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const usageDebug = relevantSubs.map((sub) => {
  const cycleEntries = shipUsageAll.filter((u) => {
    const created = new Date(u.created_at);
    return created >= sub.start && created <= sub.end;
  });

  return {
    shipId: ship.id,
    subStart: sub.start.toISOString(),
    subEnd: sub.end.toISOString(),
    usageCount: cycleEntries.length,
    firstCreatedAt: cycleEntries[0]?.created_at || null,
    lastCreatedAt: cycleEntries[cycleEntries.length - 1]?.created_at || null,
    firstBytes: cycleEntries[0]?.bytes_total || null,
    lastBytes: cycleEntries[cycleEntries.length - 1]?.bytes_total || null,
  };
});

console.log("USED DEBUG:", usageDebug);

const usedBytes = relevantSubs.reduce((sum, sub) => {
  const cycleEntries = shipUsageAll.filter((u) => {
    const created = new Date(u.created_at);
    return created >= sub.start && created <= sub.end;
  });

  if (cycleEntries.length === 0) return sum;

  let cycleUsed = 0;

  for (let i = 1; i < cycleEntries.length; i++) {
    const prev = Number(cycleEntries[i - 1].bytes_total || 0);
    const curr = Number(cycleEntries[i].bytes_total || 0);

    const diff = curr - prev;

    if (diff > 0) {
      cycleUsed += diff;
    }
  }

  return sum + cycleUsed;
}, 0);

usedGB = Number((usedBytes / (1024 * 1024 * 1024)).toFixed(2));

console.log("RELEVANT SUBS:", relevantSubs);

const totalPlanGB = relevantSubs.reduce((sum, s) => sum + (s.gb || 0), 0);
const totalPlanEUR = relevantSubs.reduce((sum, s) => sum + (s.price_eur || 0), 0);

const soldGB = vouchersData
  .filter((v) => {
    if (v.ship_id !== ship.id) return false;

    const created = new Date(v.created_at);
    created.setHours(0, 0, 0, 0);

    return relevantSubs.some((sub) => {
      return created >= sub.start && created <= sub.end;
    });
  })
  .reduce((sum, v) => {
    if (v.gb_type === "1GB") return sum + v.amount * 1;
    if (v.gb_type === "5GB") return sum + v.amount * 5;
    if (v.gb_type === "10GB") return sum + v.amount * 10;
    return sum;
  }, 0);

let carryOverGB = soldGB - usedGB;

if (carryOverGB < 0) carryOverGB = 0;

console.log("GB DEBUG:", {
  ship: ship.name,
  planGB: totalPlanGB,
  carryOverGB,
});

const latestStatus = Array.isArray(routerStatusData)
  ? routerStatusData.find((s) => String(s.ship_id) === "SHIP-001")
  : null;

const lastSeenRouter = latestStatus?.last_seen_router || null;
const lastSeenStarlink = latestStatus?.last_seen_starlink || null;

const routerOnline =
  latestStatus?.router_online === true && isFreshStatus(lastSeenRouter);

const starlinkOnline =
  latestStatus?.starlink_online === true && isFreshStatus(lastSeenStarlink);

  return {
    id: ship.id,
    name: ship.name,
    model: ship.model,
    planType: "small",

plan: {
  name: "Global Priority Mini",
  gb: totalPlanGB,
  priceEUR: totalPlanEUR,
},

carryOverGB: carryOverGB,

addons: addonsData.filter(a => {
  if (a.ship_id !== ship.id) return false;

  const created = new Date(a.created_at);
  created.setHours(0, 0, 0, 0);

  return relevantSubs.some(sub => {
    return created >= sub.start && created <= sub.end;
  });
}),
hardwareEUR: ship.hardware_eur,
vouchers: (() => {
  const shipVouchers = vouchersData.filter(v => {
    if (v.ship_id !== ship.id) return false;

    const created = new Date(v.created_at);
    created.setHours(0, 0, 0, 0);

    return relevantSubs.find(sub => {
  return created >= sub.start && created <= sub.end;
});
  });

  return shipVouchers.reduce((acc, v) => {
    acc[v.gb_type] = (acc[v.gb_type] || 0) + v.amount;
    return acc;
  }, {});
})(),
usedGB: usedGB,
routerOnline,
starlinkOnline,
lastSeenRouter,
lastSeenStarlink
    };
});
    console.log("MAPPED:", mapped);
    setShips(mapped);
  };

  const loadVouchers = async () => {
    const { data, error } = await supabase
      .from("vouchers")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    console.log("VOUCHERS:", data);
};

useEffect(() => {
  loadShips();
  loadVouchers();
}, [timeFilter]);

useEffect(() => {
  const interval = setInterval(() => {
    loadShips();
  }, 30000);

  return () => clearInterval(interval);
}, []);

const getTime = (timeZone) => {
  return timeNow.toLocaleTimeString("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

if (!ships.length) return null;

  return (
    <div className="h-screen w-full relative text-white">

      {/* Hintergrund */}
      <img
        src="/msc-ship.jpg"
        className="absolute w-full h-full object-cover"
        alt="msc ship"
      />

      {/* dunkler Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/10"></div>

      {/* Top Header (FIXED) */}
      <div className="absolute top-10 left-16 right-16 flex justify-between items-center z-20">
        <h1 className="text-white/90 text-4xl font-medium tracking-normal">
          CrewOceanLink
        </h1>

        <span className="text-white/60 text-4xl">
          Admin Dashboard
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-end justify-center min-h-screen pb-6 px-6">

        {/* Grosser Glass Container */}
<div className="
w-[95%] h-[85vh] mx-auto rounded-3xl
bg-white/[0.02] backdrop-saturate-150
backdrop-blur-[4px]
border border-white/20
shadow-[0_8px_32px_rgba(0,0,0,0.25)]
p-10
">

{/* Toolbar */}
<div className="mb-8">
  <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 w-between">

    <div className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-sm">
  + Vessel
</div>

    <div
  onClick={handleAddAddon}
  className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition text-sm cursor-pointer"
>
  + Addon GB
</div>

    <div
  onClick={handleAddVoucher}
  className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition text-sm cursor-pointer"
>
  + Sold GB
</div>

<div className="ml-40 flex items-center gap-6 text-xs text-white/80">

  <div className="flex items-center gap-1">
    <span className="text-white">USD/EUR</span>
    <span className="font-medium text-white">
  {rates.eur ? Number(rates.eur).toFixed(2) : "--"}
</span>

<span
  className={`text-[10px] ${
    rates.eurChange > 0 ? "text-green-400" : "text-red-400"
  }`}
>
  ({rates.eurChange > 0 ? "+" : ""}
  {rates.eurChange}%)
</span>
  </div>

  <div className="flex items-center gap-1">
    <span className="text-white">USD/CHF</span>
    <span className="font-medium text-white">
  {rates.chf ? Number(rates.chf).toFixed(2) : "--"}
</span>

<span
  className={`text-[10px] ${
    rates.chfChange > 0 ? "text-green-400" : "text-red-400"
  }`}
>
  ({rates.chfChange > 0 ? "+" : ""}
  {rates.chfChange}%)
</span>
  </div>

<div className="ml-40 flex items-center gap-3 ml-6 text-white">
  <span>UTC {getTime("UTC")}</span>
  <span>|</span>
  <span>ZRH {getTime("Europe/Zurich")}</span>
  <span>|</span>
  <span>DXB {getTime("Asia/Dubai")}</span>
  <span>|</span>
  <span>BKK {getTime("Asia/Bangkok")}</span>
  <span>|</span>
  <span>BRT {getTime("America/Sao_Paulo")}</span>
  <span>|</span>
  <span>MIA {getTime("America/New_York")}</span>
  <span>|</span>
  <span>LAX {getTime("America/Los_Angeles")}</span>
</div>

</div>

  </div>

{/* Welcome Section */}
<div className="mt-6 mb-10 px-6">
  <h2 className="text-4xl font-medium text-white/90">
    Welcome back Mike
  </h2>

  <p className="text-white/60 mt-2 text-lg">
    It's good to see you again!
  </p>
</div>

{/* Daten Container */}
<div className="
mt-10
h-[57vh]
rounded-2xl
bg-white/5
backdrop-blur-[6px]
border border-white/15
shadow-inner
">
   <div className="p-6 h-full overflow-y-auto">
<div className="flex items-center gap-97 text-white/80 text-sm mb-3 tracking-wide">

  {/* LEFT: Ship Info */}
  <div>
    {ships[0] && (
      <>
        {ships[0].name} | {ships[0].model} | {ships[0].plan.name}
      </>
    )}
  </div>

  {/* RIGHT: FILTER UI */}
<div className="flex items-center gap-2 flex-wrap">
  <span className="text-white/80 text-sm mr-3">Time Period</span>

  {/* MODE SELECT */}
  <select
    value={timeFilter.mode}
    onChange={(e) =>
      setTimeFilter({
        ...timeFilter,
        mode: e.target.value,
      })
    }
    className="bg-white text-black text-xs px-2 py-1 rounded border border-white/20"
  >
    <option value="current">Current Cycle</option>
    <option value="range">Custom Range</option>
    <option value="history">Cycle History</option>
  </select>

  {/* HISTORY SELECT */}
  {timeFilter.mode === "history" && (
    <select
      value={timeFilter.historyCount}
      onChange={(e) =>
        setTimeFilter({
          ...timeFilter,
          historyCount: Number(e.target.value),
        })
      }
      className="bg-white text-black text-xs px-2 py-1 rounded border border-white/20"
    >
      <option value={1}>Last 1 Cycle</option>
      <option value={3}>Last 3 Cycles</option>
      <option value={6}>Last 6 Cycles</option>
      <option value={999}>All Cycles</option>
    </select>
  )}

  {/* DATE RANGE */}
  {timeFilter.mode === "range" && (
    <>
      <input
        type="date"
        value={timeFilter.start || ""}
        onChange={(e) =>
          setTimeFilter({
            ...timeFilter,
            start: e.target.value,
          })
        }
        className="bg-white/10 text-white text-xs px-2 py-1 rounded border border-white/20"
      />
      <input
        type="date"
        value={timeFilter.end || ""}
        onChange={(e) =>
          setTimeFilter({
            ...timeFilter,
            end: e.target.value,
          })
        }
        className="bg-white/10 text-white text-xs px-2 py-1 rounded border border-white/20"
      />
    </>
  )}

  {ships[0] && (
    <>
      <div className="ml-25 flex items-center gap-1.5 text-sm text-white/85 whitespace-nowrap">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            ships[0].routerOnline ? "bg-green-400" : "bg-red-400"
          }`}
        ></span>
        <span>
          Router: {ships[0].routerOnline ? "Online" : "Offline"} • Last seen {formatLastSeen(ships[0].lastSeenRouter)}
        </span>
      </div>

      <div className="ml-3 flex items-center gap-1.5 text-sm text-white/85 whitespace-nowrap">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            ships[0].starlinkOnline ? "bg-green-400" : "bg-red-400"
          }`}
        ></span>
        <span>
          Starlink: {ships[0].starlinkOnline ? "Online" : "Offline"} • Last seen {formatLastSeen(ships[0].lastSeenStarlink)}
        </span>
      </div>
    </>
  )}
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">

  {Array.from({ length: 15 }).map((_, i) => (
    <div
      key={i}
className="rounded-xl bg-white/[0.8] backdrop-blur-lg px-4 py-2 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-center transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:-translate-y-[2px]"
    >
      <div className="text-gray-500 text-sm mb-1">
        {[
          "Subscription + Addon (GB)",
          "Vouchers Sold (GB)",
          "Used Data (GB)",
          "Carry Over (GB)",
          "Lost GB",
          "Revenue ($)",
          "Operating Cost ($)",
          "Hardware Cost ($)",
          "Net Profit ($)",
          "ROI (%)",
          "Usage Rate (%)",
          "Break-even Status",
          "Break-even (GB)",
          "Break-even (Cycles)",
          "Lost Revenue ($)"
        ][i]}
      </div>

      <div
        className={`font-semibold text-lg ${
          i === 8
            ? Number(getNetProfitUSD(ships[0])) < 0
              ? "text-red-500"
              : "text-green-500"
            : i === 9
              ? Number(getROI(ships[0]).replace("%", "")) < 0
                ? "text-red-500"
                : "text-green-500"
              : [4, 6, 7, 14].includes(i)
                ? "text-red-500 font-semibold"
                : i === 11
                  ? "text-white"
                  : "text-gray-500"
        }`}
      >
        {i === 0 && getSubscriptionAndAddonGB(ships[0]) + " GB"}
        {i === 1 && getSoldGB(ships[0]) + " GB"}
        {i === 2 && ships[0].usedGB + " GB"}
        {i === 3 && ships[0].carryOverGB.toFixed(1) + " GB"}
        {i === 4 && getLostGB(ships[0]) + " GB"}
        {i === 5 && formatUSD(getRevenueUSD(ships[0]))}
        {i === 6 && getOperatingCostUSD(ships[0])}
        {i === 7 && getHardwareCostUSD(ships[0])}
        {i === 8 && formatUSD(getNetProfitUSD(ships[0]))}
        {i === 9 && getROI(ships[0])}
        {i === 10 && getUsageRate(ships[0])}
        {i === 12 && getBreakEvenGB(ships[0])}
        {i === 13 && getBreakEvenMonths(ships[0])}
        {i === 14 && formatUSD(getLostRevenueUSD(ships[0]))}
      </div>

      {i === 11 && (() => {
        const status = getProfitStatus(ships[0]);

        if (status === "loss") {
          return (
            <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Not profitable
            </div>
          );
        }

        if (status === "breakeven") {
          return (
            <div className="mt-1 flex items-center gap-1 text-xs text-orange-500">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Break-even
            </div>
          );
        }

        return (
          <div className="mt-1 flex items-center gap-1 text-xs text-green-500">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Profitable
          </div>
        );
      })()}
    </div>
  ))}

</div>
     {/* Divider */}
<div className="my-6 border-t border-white/20"></div>


{/* Ship 2 */}
<div className="text-white/80 text-sm mb-3 tracking-wide">
  MSC MICHELA | M1 | Global Priority Mini
</div>
<div className="grid grid-cols-6 gap-4">

  {Array.from({ length: 12 }).map((_, i) => (
    <div
      key={i}
      className="rounded-xl bg-white/[0.8] backdrop-blur-lg p-3 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col"
    >
      <div className="text-gray-500 text-sm mb-1">
        Label
      </div>

      <div className="text-green-600 font-semibold text-lg">
        --
      </div>
    </div>
  ))}

</div>


{/* Divider */}
<div className="my-6 border-t border-white/20"></div>
     <div className="mt-6">

  <div className="
    rounded-xl 
    bg-white/[0.8] 
    backdrop-blur-lg
    border border-white/20
    p-4
  ">

    <div className="text-gray-500 text-sm mb-1">
      Ship Ranking
    </div>

    <div className="space-y-2">

      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-sm">
          #1 MSC MICHELA | M1 | Global Priority Mini
        </span>
        <span className="text-gray-500 text-sm mb-1 font-medium">
          $0
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-sm">
          #1 MSC MICHELA | M1 | Global Priority Mini
        </span>
        <span className="text-gray-500 text-sm mb-1 font-medium">
          $0
        </span>
      </div>

    </div>

  </div>

</div>
   </div>
</div>

</div>

          {/* leer */}
          <div className="mb-8"></div>

        </div>

      </div>
    </div>
  );
}